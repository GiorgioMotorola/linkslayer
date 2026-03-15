import { ref } from "vue";
import { supabase } from "@/lib/supabase.js";
import { generateTerrain } from "@/utils/terrainGenerator.js";
import { computeYield } from "@/utils/buildingDefs.js";

export function useSettlement() {
  const settlement = ref(null);
  const isLoadingSettlement = ref(false);

  async function createSettlement({ userId, townName, playerName, wikiTitle, signInEmail }) {
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
      .select("id, owner_id, town_name, lord_history, wiki_title")
      .eq("wiki_title", wikiTitle)
      .single();
    if (error) return null;
    return data;
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
  };
}
