<template>
  <Header
    :start="chain[currentTargetIndex]"
    :targets="chain[currentTargetIndex + 1]"
    :clicks="clickCount"
    :path="path"
    :playerClass="playerClass"
    :specialUsesLeft="specialUsesLeft"
    :playerHP="playerHP"
    :maxHP="playerClass?.maxHP ?? 0"
    :gameLog="gameLog"
    :encounter="encounter"
    :enemyHP="enemyHP"
    :nextEnemyAttack="nextEnemyAttack"
    :enemyNextAction="enemyNextAction"
    :message="encounterMessage"
    @action="handleCombatActionWrapper"
    @option-chosen="handleEncounterOption"
    @close="handleCloseEncounter"
    :playerName="playerName"
    @log-line="log"
    :shieldBonus="shieldBonus"
    :weaponBonus="weaponBonus"
    :longRestsUsed="longRestsUsed"
    :isDarkened="bossOverlay"
    :shortRestsUsed="shortRestsUsed"
  />

  <div class="main-content-wrapper">
    <ClassSelect
      v-if="!playerClass"
      @select="handleClassSelection"
      :articleTitle="current"
      :start="chain[0]"
      :targets="chain[currentTargetIndex + 1]"
      :formattedStart="formattedStart"
      :formattedTitle="formattedTitle"
      :fullChain="chain"
    />
    <div>
      <VictoryModal
        v-if="isGameComplete"
        :clicks="clickCount"
        :path="path"
        :timer="formattedTimer"
        :targets="chain"
        :shortcutsUsed="shortcutsUsedCount"
        :combatEncountersFought="combatEncountersFought"
        :playerHP="playerHP"
        :weaponBonus="weaponBonus"
        :specialsUsed="totalSpecialsUsed"
        :longRestsUsed="longRestsUsed"
        :shortRestsUsed="shortRestsUsed"
        @close="resetGame"
        :gameLog="gameLog"
      />

      <DefeatModal
        v-if="defeated"
        :clicks="clickCount"
        :path="path"
        :timer="formattedTimer"
        :targets="chain"
        :shortcutsUsed="shortcutsUsedCount"
        :combatEncountersFought="combatEncountersFought"
        :playerHP="playerHP"
        :weaponBonus="weaponBonus"
        :specialsUsed="totalSpecialsUsed"
        :longRestsUsed="longRestsUsed"
        :shortRestsUsed="shortRestsUsed"
        @close="resetGame"
        :gameLog="gameLog"
      />

      <ArticleViewer
        :articleTitle="current"
        :start="chain[0]"
        :targets="chain[currentTargetIndex + 1]"
        :inEncounter="inEncounter"
        @link-clicked="handleClick"
        :path="path"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :isBlurred="blurClicksLeft > 0"
      />

      <RestModal
        v-show="showRestModal"
        :shortRestsUsed="shortRestsUsed"
        @rest="handleRest"
        :longRestsUsed="longRestsUsed"
      />
    </div>
  </div>

  <div class="dim-overlay" :class="{ 'active-overlay': bossOverlay }"></div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { getRandomChain } from "@/utils/randomPair";
import ArticleViewer from "@/components/ArticleViewer.vue";
import Header from "@/components/Header.vue";
import VictoryModal from "@/components/VictoryModal.vue";
import { rollEncounter } from "@/utils/encounterGenerator";
import ClassSelect from "@/components/ClassSelect.vue";
import { classes } from "@/utils/classes";
import { generateEnemy } from "@/utils/encounterGenerator";
import friendlyEncounters from "@/assets/data/friendlyEncounters.json";
import loreEncounters from "@/assets/data/loreEncounters.json";
import DefeatModal from "@/components/DefeatModal.vue";
import { getRandomBoss, isBoss } from "@/utils/bossGenerator";
import RestModal from "@/components/RestModal.vue";
import { handleCombatAction } from "@/utils/combat";

const chain = getRandomChain();
const current = ref(chain[0]);

const formattedStart = computed(() => chain[0]?.replaceAll("_", " ") ?? "");
const formattedTitle = computed(
  () => current.value?.replaceAll("_", " ") ?? ""
);

const defeated = ref(false);
const currentTargetIndex = ref(0);
const clickCount = ref(0);
const shortcutsUsedCount = ref(0);
const combatEncountersFought = ref(0);
const totalSpecialsUsed = ref(0);
const path = ref([current.value]);
const encounter = ref(null);
const playerHP = ref(0);
const enemyHP = ref(25);
const nextEnemyAttack = ref(null);
const enemyNextAction = ref("attack");
const specialUsesLeft = ref(5);
const playerClass = ref(null);
const gameLog = ref([]);
const encounterMessage = ref("");
const playerName = ref("");
const DEFAULT_ENEMY_HP = 25;
const weaponBonus = ref(0);
const shieldBonus = ref(0);
const enemyStatusEffects = ref([]);
const enemyIsStunned = ref(false);
const seenLoreEncounters = ref([]);
const seenNPCEncounters = ref([]);
const currentEnemy = ref(null);
const selectedBossType = ref("");
const bossSpawned = ref(false);
const bossDefeated = ref(false);
const shortRestsUsed = ref(0);
const showRestModal = ref(false);
const longRestsUsed = ref(0);
const hasReachedFinalArticle = ref(false);
const bossOverlay = ref(false);
const blurClicksLeft = ref(0);

const inEncounter = computed(() => {
  const e = encounter.value;
  if (!e || typeof e !== "object") return false;

  if (e.type === "combat") {
    return e.enemy && typeof e.enemy === "object";
  }

  if (e.type === "npc") {
    return (
      e.npc &&
      typeof e.npc.name === "string" &&
      typeof e.npc.greeting === "string"
    );
  }

  if (e.type === "lore") {
    return e.lore && typeof e.lore.text === "string";
  }

  return false;
});

watch(encounter, (newVal) => {
  console.log("[watch:encounter] changed to:", JSON.stringify(newVal, null, 2));
});

watch(playerHP, (newVal) => {
  if (playerClass.value && newVal <= 0 && !defeated.value) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated.`
    );
    defeated.value = true;
    clearInterval(timerInterval);
    encounter.value = null;
  }
});

watch(clickCount, (newClicks) => {
  console.log("clickCount changed:", newClicks);
  if (newClicks > 0 && newClicks % 11 === 0) {
    console.log("Showing rest modal");
    showRestModal.value = true;
  }
  if (blurClicksLeft.value > 0) {
    blurClicksLeft.value--;
    log(
      `🍺 You are still drunk. ${blurClicksLeft.value} clicks left til you sober up.`
    );
  }
});

const timer = ref(0);
let timerInterval;

const formattedTimer = computed(() => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
});

const isGameComplete = computed(() => {
  return current.value === chain[2] && bossDefeated.value;
});

function handleClick(title) {
  console.log("--- handleClick START ---");
  console.log("Clicked title:", title);
  console.log("chain[0]:", chain[0]);
  console.log("chain[1]:", chain[1]);
  console.log("chain[2]:", chain[2]);
  console.log(
    "currentTargetIndex before click logic:",
    currentTargetIndex.value
  );
  console.log("bossSpawned.value before:", bossSpawned.value);
  console.log("bossDefeated.value before:", bossDefeated.value);

  if (inEncounter.value) {
    console.log("In encounter, returning early.");
    return;
  }

  log(`📍 ARTICLE: ${title}`);

  const finalTarget = chain[2];
  const secondTarget = chain[1];

  current.value = title;
  clickCount.value++;
  path.value.push(title);

  if (title === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
    console.log(
      "Successfully advanced to next target. currentTargetIndex now:",
      currentTargetIndex.value
    );
  } else {
    console.log(
      "Clicked an article not on the direct sequential path. currentTargetIndex not incremented."
    );
  }

  if (
    title === finalTarget &&
    currentTargetIndex.value === 2 &&
    !bossSpawned.value &&
    !bossDefeated.value
  ) {
    console.log(
      "CONDITION MET FOR BOSS SPAWN: Clicked Final Target AND currentTargetIndex is 2. Preventing Rest Modal."
    );
    showRestModal.value = false;
    bossOverlay.value = true;
    const boss = getRandomBoss();
    selectedBossType.value = boss.type;

    encounter.value = {
      type: "combat",
      enemy: boss,
    };
    enemyHP.value = boss.hp;
    encounterMessage.value = `💀 A terrifying ${boss.name} rises to defend ${formattedTitle.value}. Time to roll some true damage.`;

    nextEnemyAttack.value =
      Math.floor(Math.random() * (boss.maxDamage - boss.minDamage + 1)) +
      boss.minDamage;
    enemyNextAction.value = "attack";

    bossSpawned.value = true;
    combatEncountersFought.value++;

    console.log(
      "BOSS SPAWNED. Returning early from handleClick to start combat."
    );
    return;
  }

  if (clickCount.value > 0 && clickCount.value % 11 === 0) {
    console.log(
      "Showing rest modal due to click count, preventing other encounters."
    );
    showRestModal.value = true;
    return;
  }
  if (title !== finalTarget && Math.random() < 0.4) {
    console.log("Rolling for regular encounter...");
    const roll = rollEncounter();
    let fullEncounter = null;

    if (roll.type === "npc") {
      const availableNPCs = friendlyEncounters.filter(
        (npc) => !seenNPCEncounters.value.includes(npc.id)
      );
      if (availableNPCs.length === 0) {
        console.warn("All NPCs seen, skipping NPC encounter.");
        return;
      }
      const npc =
        availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
      seenNPCEncounters.value.push(npc.id);
      fullEncounter = { type: "npc", npc };
      log(`${npc.greeting}`);
    } else if (roll.type === "lore") {
      const availableLore = loreEncounters.filter(
        (lore) => !seenLoreEncounters.value.includes(lore.id)
      );
      if (availableLore.length === 0) {
        console.warn("All lore seen, skipping lore encounter.");
        return;
      }
      const lore =
        availableLore[Math.floor(Math.random() * availableLore.length)];
      seenLoreEncounters.value.push(lore.id);
      fullEncounter = { type: "lore", lore };
      log(`${lore.text}`);
    } else if (roll.type === "combat") {
      const enemy = generateEnemy();
      enemyHP.value = enemy.currentHP;
      currentEnemy.value = enemy;
      if (!enemy) {
        console.warn("Could not generate enemy, skipping combat encounter.");
        return;
      }
      fullEncounter = { type: "combat", enemy };
      combatEncountersFought.value++;
      nextTick(() => {
        logEnemyAction();
      });
      nextEnemyAttack.value =
        Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
        enemy.minDamage;
      enemyNextAction.value = "attack";
    }

    if (fullEncounter) {
      encounter.value = fullEncounter;
      if (fullEncounter.type === "combat") {
        logEnemyAction();
      }
      console.log(
        "Regular encounter triggered. Returning early from handleClick to start encounter."
      );
      return;
    }
  }
  if (title === finalTarget && bossDefeated.value) {
    console.log(
      "Game complete condition met (Article C reached and boss defeated). Clearing timer."
    );
    clearInterval(timerInterval);
  }

  console.log("--- handleClick END ---");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleRest(choice) {
  console.log("Rest choice:", choice);

  if (choice === "short" && shortRestsUsed.value < 4) {
    playerHP.value += 5;
    shortRestsUsed.value++;
  } else if (choice === "long" && longRestsUsed.value < 2) {
    playerHP.value += 10;
    longRestsUsed.value++;
  } else if (choice === "continue") {
    playerHP.value = Math.max((playerHP.value += 0), 0);
  }

  showRestModal.value = false;
}

function handleCombatActionWrapper(playerAction) {
  handleCombatAction({
    player: {
      playerHP,
      playerClass,
      specialUsesLeft,
      weaponBonus,
      shieldBonus,
      playerName,
      action: playerAction,
    },
    enemy: {
      enemyHP,
      encounter,
      nextEnemyAttack,
      enemyNextAction,
      enemyStatusEffects,
      enemyIsStunned,
    },
    state: {
      log,
      formattedTitle: formattedTitle.value,
      DEFAULT_ENEMY_HP,
      isBoss,
    },
    utils: {
      clearTimer: () => clearInterval(timerInterval),
      setDefeated: () => (defeated.value = true),
      handleLootDrop,
      markBossDefeated,
      gotoEnemyTurn,
    },
  });
}

function gotoEnemyTurn() {
  enemyStatusEffects.value = enemyStatusEffects.value.filter((effect) => {
    if (effect.type === "bleed") {
      enemyHP.value -= effect.damage;
      log(
        `🩸 ${formattedTitle.value} is bleeding. ${formattedTitle.value} takes ${effect.damage} additional damage.`
      );
    }

    effect.duration -= 1;
    return effect.duration > 0;
  });

  if (enemyHP.value <= 0) {
    log(`💀 ${playerName.value} defeated ${formattedTitle.value}`);
    encounter.value = null;
    handleLootDrop();
    return;
  }

  if (enemyIsStunned.value) {
    log(`💤 ${formattedTitle.value} is stunned and skips their turn.`);
    enemyNextAction.value = null;
    enemyIsStunned.value = false;
    return;
  }

  const tripChance = 0.1;
  const rand = Math.random();

  if (rand < tripChance) {
    enemyNextAction.value = "trip";
    nextEnemyAttack.value = null;
  } else {
    const action = decideEnemyAction();
    enemyNextAction.value = action;

    if (action === "attack") {
      const currentEnemyData = encounter.value?.enemy;

      if (currentEnemyData) {
        nextEnemyAttack.value =
          Math.floor(
            Math.random() *
              (currentEnemyData.maxDamage - currentEnemyData.minDamage + 1)
          ) + currentEnemyData.minDamage;
      } else {
        console.warn(
          "Enemy data not found for attack. Defaulting to 1-3 damage."
        );
        nextEnemyAttack.value = Math.floor(Math.random() * 3) + 1;
      }
    } else {
      nextEnemyAttack.value = null;
    }
  }
  logEnemyAction();
}

let logId = 0;

function log(message) {
  logId++;
  gameLog.value.push({
    id: logId,
    text: `[${formattedTimer.value}] ${message}`,
  });
}

function decideEnemyAction() {
  if (
    !isBoss(encounter.value?.enemy) &&
    enemyHP.value <= 5 &&
    Math.random() < 0.02
  ) {
    return "flee";
  }
  if (Math.random() < 0.2) return "defend";
  return "attack";
}

function logEnemyAction() {
  let message = "";
  switch (enemyNextAction.value) {
    case "attack":
      message = `🗡️ Enemy is now attacking for ${nextEnemyAttack.value} damage.`;
      break;
    case "defend":
      message = "🛡️ Enemy is defending your next attack.";
      break;
    case "flee":
      message = "🏃 Enemy is about to flee.";
      break;
    case "trip":
      message = "🤾 Enemy tripped. You get a free attack.";
      break;
    default:
      message = "";
  }
  if (message) log(message);
}

function handleCloseEncounter() {
  encounter.value = null;

  if (bossDefeated.value) {
    current.value = chain[chain.length - 1];
  }

  const lastTitle = path.value[path.value.length - 1];
  if (lastTitle === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
  }

  if (lastTitle === chain[chain.length - 1]) {
    clearInterval(timerInterval);
  }
}

function handleClassSelection({ classKey, name }) {
  playerClass.value = classes[classKey];
  playerHP.value = playerClass.value.maxHP;
  playerName.value = name;
  if (playerClass.value.startingWeaponBonus) {
    weaponBonus.value += playerClass.value.startingWeaponBonus;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingWeaponBonus} starting Weapon Damage.`
    );
  }
  if (playerClass.value.startingSpecialUses) {
    specialUsesLeft.value += playerClass.value.startingSpecialUses;
    log(
      `🎁 <span class="player-name">${playerName.value}</span> starts with +${playerClass.value.startingSpecialUses} Class Ability charges.`
    );
  }
  if (playerClass.value.startingShieldBonus) {
    shieldBonus.value += playerClass.value.startingShieldBonus;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingShieldBonus} starting Defense Bonus.`
    );
  }
  log(`Player name: ${playerName.value}`);
  log(`Class selected: ${playerClass.value.name}`);
}

function handleEncounterOption(option) {
  console.log("[handleEncounterOption] option:", option);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (option.responseText) {
    log(`You select: ${option.text}`);
    log(option.responseText);
    encounterMessage.value = option.responseText;
  }

  if (option.result === "combat") {
    encounter.value = {
      type: "combat",
      enemy: generateEnemy(),
    };
    nextEnemyAttack.value = Math.floor(Math.random() * 3) + 1;
    enemyNextAction.value = "attack";
    const enemy = generateEnemy();
    if (!enemy) {
      console.warn("Could not generate enemy from option, skipping combat.");
      encounter.value = null;
      return;
    }
    encounter.value = { type: "combat", enemy: enemy };
    enemyHP.value = enemy.currentHP;
    nextEnemyAttack.value =
      Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
      enemy.minDamage;
    combatEncountersFought.value++;
    log(`⚔️ Your choice has resulted in combat.`);
    return;
  }

  if (option.result === "item") {
    if (option.details === "health") {
      playerHP.value = Math.min(playerHP.value + 5, 200);
      log(
        `🎲 <span class="player-name">${playerName.value}</span> has gained +5 HP.`
      );
    }

    if (option.details === "weapon") {
      log(
        `🎲 <span class="player-name">${playerName.value}</span> found a weapon upgrade. Next attack does double damage.`
      );
    }
    if (option.details === "beer") {
      const duration = option.amount || 4;
      blurClicksLeft.value += duration;
      log(
        `🍺 <span class="player-name">${playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks.`
      );
    }
  }

  if (option.result === "route" && option.details === "compass") {
    if (currentTargetIndex.value < 1) {
      current.value = chain[1];
      path.value.push(chain[1]);
      clickCount.value++;
      log(
        `🧭 The compass guides you directly to ${chain[1].replaceAll(
          "_",
          " "
        )}!`
      );
      currentTargetIndex.value = Math.max(currentTargetIndex.value, 1);
    } else {
      log(`🧭 The compass points to a familiar place. It offers no new path.`);
    }
    encounter.value = null;
    bossOverlay.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (option.result === "damage") {
    playerHP.value = Math.max(playerHP.value - 5, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 5 damage.`
    );
  }

  if (option.result === "damage-minor") {
    playerHP.value = Math.max(playerHP.value - 1, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 1 damage.`
    );
  }

  if (option.result === "damage-major") {
    playerHP.value = Math.max(playerHP.value - 50, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 50 damage.`
    );
  }

  if (option.details === "weapon") {
    weaponBonus.value += 1;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> received a weapon upgrade! Weapon damage +1 (Base Damage Total: +${weaponBonus.value})`
    );
  }

  if (option.result === "special" && option.details === "recover") {
    const amount = option.amount || 1;
    specialUsesLeft.value += amount;
    log(
      `🎲 <span class="player-name">${
        playerName.value
      }</span> regained ${amount} special move${amount > 1 ? "s" : ""}!`
    );
  }

  if (option.result === "shortcut-damage") {
    const damageTaken = 10;
    const clicksReduced = 10;

    playerHP.value = Math.max(playerHP.value - damageTaken, 0);
    clickCount.value = Math.max(0, clickCount.value - clicksReduced);
    shortcutsUsedCount.value++;

    log(
      `🎲 <span class="player-name">${playerName.value}</span> took ${damageTaken} damage for taking the shortcut, but saved ${clicksReduced} clicks.`
    );
  }

  if (option.result === "shortcut" && option.details === "clicks") {
    const amount = option.amount || 1;
    clickCount.value = Math.max(0, clickCount.value - amount);
    shortcutsUsedCount.value++;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> discovered a shortcut! Click count reduced by ${amount}.`
    );
  }

  if (option.result === "route" && option.details === "compass") {
    if (currentTargetIndex.value < 1) {
      current.value = chain[1];
      path.value.push(chain[1]);
      clickCount.value++;
      log(
        `🧭 The compass glows, guiding you directly to ${chain[1].replaceAll(
          "_",
          " "
        )}!`
      );
      currentTargetIndex.value = Math.max(currentTargetIndex.value, 1);
      log(`✨ You feel a step closer to your goal.`);
    } else {
      log(
        `🧭 The compass seems to point to a place you've already been, or are already near. It offers no new path.`
      );
    }
    encounter.value = null;
    bossOverlay.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (option.details === "shield") {
    shieldBonus.value += 1;
    log(
      `🛡️ <span class="player-name">${playerName.value}</span> has increased their Defense by +1 (Base Defense Total: +${shieldBonus.value})`
    );
  }

  if (option.routeTitle) {
    log(`📚 You choose: ${option.text}`);
    current.value = option.routeTitle;
    path.value.push(option.routeTitle);
    clickCount.value++;

    bossOverlay.value = false;
    encounter.value = null;

    if (option.routeTitle === chain[currentTargetIndex.value + 1]) {
      currentTargetIndex.value++;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  encounter.value = null;
  bossOverlay.value = false;
}

function handleLootDrop() {
  const lootChance = Math.random();
  if (lootChance > 0.7) {
    console.log(lootChance);
    log(`❌ Enemy has no loot to drop.`);
    return;
  }

  const lootOptions = ["health", "weapon", "special", "shield"];
  const selectedLoot =
    lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    case "health": {
      const amount = 10;
      playerHP.value = Math.min(
        playerHP.value + amount,
        playerClass.value.maxHP
      );
      log(
        `🍎 <span class="player-name">${playerName.value}</span> loots +${amount} HP.`
      );
      break;
    }

    case "weapon": {
      weaponBonus.value += 2;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> loots a sharper weapon. Weapon damage +2 (Base Damage Total: +${weaponBonus.value})`
      );
      break;
    }

    case "special": {
      specialUsesLeft.value += 2;
      log(
        `🎁 <span class="player-name">${playerName.value}</span> regains +2 Class Ability charges. (Total: ${specialUsesLeft.value})`
      );
      break;
    }

    case "shield":
      {
        shieldBonus.value += 2;
        log(
          `🛡️<span class="player-name">${playerName.value}</span> loots stronger Chainmail. Defense +2 (Base Defense Total: +${shieldBonus.value})`
        );
      }
      break;
  }
}

function markBossDefeated() {
  bossDefeated.value = true;
  current.value = chain[chain.length - 1];
  clearInterval(timerInterval);
  bossOverlay.value = false;
}

function resetGame() {
  clearInterval(timerInterval);
  const newChain = getRandomChain();
  chain.splice(0, chain.length, ...newChain);
  current.value = chain[0];
  weaponBonus.value = 0;
  shieldBonus.value = 0;
  currentTargetIndex.value = 0;
  clickCount.value = 0;
  shortcutsUsedCount.value = 0;
  combatEncountersFought.value = 0;
  totalSpecialsUsed.value = 0;
  path.value = [current.value];
  encounter.value = null;
  playerHP.value = 0;
  enemyHP.value = DEFAULT_ENEMY_HP;
  nextEnemyAttack.value = null;
  enemyNextAction.value = "attack";
  specialUsesLeft.value = 5;
  playerClass.value = null;
  playerHP.value = -1;
  gameLog.value = [];
  encounterMessage.value = "";
  playerName.value = "";
  weaponBonus.value = 0;
  enemyStatusEffects.value = [];
  enemyIsStunned.value = false;
  seenLoreEncounters.value = [];
  seenNPCEncounters.value = [];
  currentEnemy.value = null;
  selectedBossType.value = "";
  bossSpawned.value = false;
  bossDefeated.value = false;
  shortRestsUsed.value = 0;
  showRestModal.value = false;
  longRestsUsed.value = 0;
  hasReachedFinalArticle.value = false;
  bossOverlay.value = false;
  defeated.value = false;
  blurClicksLeft.value = 0;
  timer.value = 0;
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timerInterval);
});
</script>

<style scoped>
.timer {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.player-name {
  color: rgb(160, 178, 226);
  text-transform: uppercase;
}

.dim-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  pointer-events: none;
  transition: background-color 1.5s ease-in-out;
  z-index: 99;
}

.dim-overlay.active-overlay {
  background-color: rgba(0, 0, 0, 0.6);
  pointer-events: auto;
}

@media screen and (max-width: 600px) {
  .timer {
    font-size: 13px;
    margin-top: 0.1rem;
  }
}
</style>
