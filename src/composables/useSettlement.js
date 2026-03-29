import { ref } from "vue";
import { supabase } from "@/lib/supabase.js";
import { generateTerrain } from "@/utils/terrainGenerator.js";
import { computeYield } from "@/utils/buildingDefs.js";
import { assignSettlementBossKey } from "@/utils/settlementBossGenerator.js";

// Brewery state is embedded inside the buildings JSONB array as a hidden sentinel
// so it persists without needing a separate DB column.
const BREWERY_KEY = "__brewery__";

export function getBreweryStateFromBuildings(buildings) {
  if (!buildings) return null;
  const entry = buildings.find(b => b.type === BREWERY_KEY);
  return entry?.breweryData ?? null;
}

export function useSettlement() {
  const settlement = ref(null);
  const isLoadingSettlement = ref(false);

  async function createSettlement({ userId, townName, playerName, wikiTitle, signInEmail, continent }) {
    const terrain = generateTerrain();
    const lordEntry = {
      playerName: playerName ?? townName,
      signInEmail: signInEmail ?? null,
      startDay: 1,
      endDay: null,
      endReason: null,
    };
    const { data, error } = await supabase
      .from("settlements")
      .insert({
        owner_id: userId,
        wiki_title: wikiTitle,
        town_name: townName,
        terrain,
        buildings: [],
        lord_history: [lordEntry],
        pending_gold: 0,
        pending_scrap: 0,
        pending_health_potions: 0,
        click_count_at_last_visit: 0,
        continent: continent ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    settlement.value = data;
    return data.id;
  }

  async function loadSettlement(settlementId) {
    isLoadingSettlement.value = true;
    const { data, error } = await supabase
      .from("settlements")
      .select("*")
      .eq("id", settlementId)
      .single();
    isLoadingSettlement.value = false;
    if (error) return null;
    settlement.value = data;
    return data;
  }

  async function saveTerrain(settlementId, terrain) {
    const { error } = await supabase
      .from("settlements")
      .update({ terrain, updated_at: new Date().toISOString() })
      .eq("id", settlementId);
    if (error) console.error("Failed to save terrain:", error);
  }

  async function saveBuildings(settlementId, buildings) {
    const { error } = await supabase
      .from("settlements")
      .update({ buildings, updated_at: new Date().toISOString() })
      .eq("id", settlementId);
    if (error) console.error("Failed to save buildings:", error);
  }

  /**
   * Accumulates pending resources on the settlement record based on
   * how many clicks have happened since the last visit.
   */
  async function accumulatePending(settlementId, buildings, terrain, clicksSince) {
    if (!clicksSince || clicksSince <= 0) return;
    const { gold, scrap, healthPotions } = computeYield(buildings, terrain, clicksSince);

    // Fetch current pending values first to avoid race conditions
    const { data: current } = await supabase
      .from("settlements")
      .select("pending_gold, pending_scrap, pending_health_potions")
      .eq("id", settlementId)
      .single();

    if (!current) return;

    await supabase
      .from("settlements")
      .update({
        pending_gold: (current.pending_gold ?? 0) + gold,
        pending_scrap: (current.pending_scrap ?? 0) + scrap,
        pending_health_potions: (current.pending_health_potions ?? 0) + healthPotions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settlementId);
  }

  /**
   * Collect all pending resources, reset counters, return amounts to add to player.
   */
  async function collectResources(settlementId, clickCount) {
    const { data, error } = await supabase
      .from("settlements")
      .select("pending_gold, pending_scrap, pending_health_potions")
      .eq("id", settlementId)
      .single();

    if (error || !data) return { gold: 0, scrap: 0, healthPotions: 0 };

    const collected = {
      gold: data.pending_gold ?? 0,
      scrap: data.pending_scrap ?? 0,
      healthPotions: data.pending_health_potions ?? 0,
    };

    await supabase
      .from("settlements")
      .update({
        pending_gold: 0,
        pending_scrap: 0,
        pending_health_potions: 0,
        click_count_at_last_visit: clickCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settlementId);

    if (settlement.value) {
      settlement.value = {
        ...settlement.value,
        pending_gold: 0,
        pending_scrap: 0,
        pending_health_potions: 0,
        click_count_at_last_visit: clickCount,
      };
    }

    return collected;
  }

  async function addLordHistoryEntry(settlementId, entry) {
    const { data } = await supabase
      .from("settlements")
      .select("lord_history")
      .eq("id", settlementId)
      .single();

    const history = data?.lord_history ?? [];
    history.push(entry);

    await supabase
      .from("settlements")
      .update({ lord_history: history, updated_at: new Date().toISOString() })
      .eq("id", settlementId);

    if (settlement.value) {
      settlement.value = { ...settlement.value, lord_history: history };
    }
  }

  async function loadSettlementFull(id) {
    const { data, error } = await supabase
      .from("settlements")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }

  async function getSettlementByWikiTitle(wikiTitle) {
    const { data, error } = await supabase
      .from("settlements")
      .select("id, owner_id, town_name, lord_history, wiki_title, abandoned, guardian_boss")
      .eq("wiki_title", wikiTitle)
      .single();
    if (error) return null;
    return data;
  }

  async function addSettlementHistoryEvent(settlementId, event) {
    const { data } = await supabase
      .from("settlements")
      .select("lord_history")
      .eq("id", settlementId)
      .single();

    const history = data?.lord_history ?? [];
    history.push(event);

    await supabase
      .from("settlements")
      .update({ lord_history: history, updated_at: new Date().toISOString() })
      .eq("id", settlementId);

    if (settlement.value) {
      settlement.value = { ...settlement.value, lord_history: history };
    }
  }

  /**
   * Mark a settlement as abandoned when its owner dies or wins.
   * Assigns a guardian boss, closes the current lord entry, and records history events.
   */
  async function markAbandoned(settlementId, buildings, day) {
    const bossKey = assignSettlementBossKey(buildings);

    const { data } = await supabase
      .from("settlements")
      .select("lord_history")
      .eq("id", settlementId)
      .single();

    const history = data?.lord_history ?? [];

    // Close out the current lord entry
    const lastEntry = history[history.length - 1];
    if (lastEntry && lastEntry.endDay == null) {
      lastEntry.endDay = day;
      lastEntry.endReason = "abandoned";
    }

    history.push({ type: "abandoned", day });
    history.push({ type: "terrorized", bossKey, day });

    await supabase
      .from("settlements")
      .update({
        abandoned: true,
        guardian_boss: bossKey,
        lord_history: history,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settlementId);

    if (settlement.value) {
      settlement.value = { ...settlement.value, abandoned: true, guardian_boss: bossKey, lord_history: history };
    }
  }

  /**
   * Mark the settlement owned by a given userId as abandoned.
   * Used as a fallback in handleRestart when settlementId ref may be stale/null.
   */
  async function markAbandonedByOwner(ownerId, day) {
    const { data } = await supabase
      .from("settlements")
      .select("id, buildings")
      .eq("owner_id", ownerId)
      .eq("abandoned", false)
      .single();
    if (!data) return;
    await markAbandoned(data.id, data.buildings ?? [], day);
  }

  /**
   * Claim an abandoned settlement after defeating the guardian boss.
   * Transfers ownership, clears abandoned flag, and records history events.
   */
  // ── Town meta (dead names + town log) stored as sentinels in buildings ──
  function getTownMetaFromBuildings(buildings) {
    const deadNames = (buildings ?? []).find(b => b.type === "__residents__")?.deadNames ?? [];
    const townLog   = (buildings ?? []).find(b => b.type === "__townlog__")?.townLog ?? {};
    return { deadNames, townLog };
  }

  async function saveTownMeta(sId, { deadNames, townLog }) {
    const current  = settlement.value?.buildings ?? [];
    const filtered = current.filter(b => b.type !== "__residents__" && b.type !== "__townlog__");
    const updated  = [
      ...filtered,
      { type: "__residents__", cellIndex: -3, deadNames },
      { type: "__townlog__",   cellIndex: -4, townLog   },
    ];
    await saveBuildings(sId, updated);
    if (settlement.value) {
      settlement.value = { ...settlement.value, buildings: updated };
    }
  }

  async function saveBreweryState(sId, breweryState) {
    // Embed brewery state as a hidden sentinel at the end of the buildings array.
    // This avoids needing a separate brewery_state DB column.
    const current = settlement.value?.buildings ?? [];
    const filtered = current.filter(b => b.type !== BREWERY_KEY);
    const updated = [...filtered, { type: BREWERY_KEY, cellIndex: -1, breweryData: breweryState }];
    await saveBuildings(sId, updated);
    if (settlement.value) {
      settlement.value = { ...settlement.value, buildings: updated };
    }
  }

  async function claimSettlement(settlementId, newOwnerId, playerName, signInEmail, day) {
    const { data } = await supabase
      .from("settlements")
      .select("lord_history")
      .eq("id", settlementId)
      .single();

    const history = data?.lord_history ?? [];
    history.push({ type: "claimed", playerName, day });

    const newLordEntry = {
      playerName: playerName ?? "Unknown",
      signInEmail: signInEmail ?? null,
      startDay: day,
      endDay: null,
      endReason: null,
    };
    history.push(newLordEntry);

    await supabase
      .from("settlements")
      .update({
        owner_id: newOwnerId,
        abandoned: false,
        guardian_boss: null,
        lord_history: history,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settlementId);

    if (settlement.value) {
      settlement.value = {
        ...settlement.value,
        owner_id: newOwnerId,
        abandoned: false,
        guardian_boss: null,
        lord_history: history,
      };
    }
  }

  return {
    settlement,
    isLoadingSettlement,
    createSettlement,
    loadSettlement,
    loadSettlementFull,
    saveBuildings,
    saveTerrain,
    accumulatePending,
    collectResources,
    addLordHistoryEntry,
    getSettlementByWikiTitle,
    addSettlementHistoryEvent,
    markAbandoned,
    markAbandonedByOwner,
    claimSettlement,
    saveBreweryState,
    saveTownMeta,
    getTownMetaFromBuildings,
  };
}
