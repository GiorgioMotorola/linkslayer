<template>
  <ClassSelect
    v-if="!playerClass"
    @select="handleClassSelection"
    :articleTitle="current"
    :start="chain[0]"
    :targets="chain[chain.length - 1]"
    :formattedStart="formattedStart"
    :formattedTitle="formattedTitle"
  />
  <div>
    <Header
      :start="chain[currentTargetIndex]"
      :targets="chain[currentTargetIndex + 1]"
      :clicks="clickCount"
      :path="path"
      :playerClass="playerClass"
      :specialUsesLeft="specialUsesLeft"
      :playerHP="playerHP"
      :maxHP="playerClass?.maxHP ?? 50"
      :gameLog="gameLog"
      :encounter="encounter"
      :enemyHP="enemyHP"
      :nextEnemyAttack="nextEnemyAttack"
      :enemyNextAction="enemyNextAction"
      :message="''"
      @action="handleCombatAction"
      @option-chosen="handleEncounterOption"
      @close="handleCloseEncounter"
      :playerName="playerName"
      @log-line="log"
      :weaponBonus="weaponBonus"
    />

    <div class="timer">{{ formattedTimer }}</div>

    <VictoryModal
      v-if="isGameComplete"
      :clicks="clickCount"
      :path="path"
      :timer="formattedTimer"
      :targets="chain"
    />

    <DefeatModal
      v-if="defeated"
      :clicks="clickCount"
      :path="path"
      :timer="formattedTimer"
    />

    <ArticleViewer
      :articleTitle="current"
      :start="chain[0]"
      :targets="chain[chain.length - 1]"
      @link-clicked="handleClick"
    />
  </div>
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
import { getTodayChain } from "@/utils/dailyPair";
import ArticleViewer from "@/components/ArticleViewer.vue";
import Header from "@/components/Header.vue";
import VictoryModal from "@/components/VictoryModal.vue";
import { rollEncounter } from "@/utils/encounterGenerator";
import ClassSelect from "@/components/ClassSelect.vue";
import { classes } from "@/utils/classes";
import { generateEnemy } from "@/utils/encounterGenerator";
import friendlyEncounters from "@/assets/data/friendlyEncounters.json";
import loreEncounters from "@/assets/data/loreEncounters.json";
import { STATUS_EFFECTS } from "@/utils/statusEffects";
import DefeatModal from "@/components/DefeatModal.vue";

const chain = getTodayChain();
const current = ref(chain[0]);

const formattedStart = computed(() => chain[0]?.replaceAll("_", " ") ?? "");
const formattedTitle = computed(
  () => current.value?.replaceAll("_", " ") ?? ""
);

const isGameOver = computed(() => playerHP.value <= 0);
const defeated = ref(false);
const currentTargetIndex = ref(0);
const clickCount = ref(0);
const path = ref([current.value]);
const encounter = ref(null);
const playerHP = ref(50);
const enemyHP = ref(25);
const nextEnemyAttack = ref(null);
const enemyDefending = ref(false);
const enemyNextAction = ref("attack");
const specialUsesLeft = ref(5);
const playerClass = ref(null);
const gameLog = ref([]);
const encounterMessage = ref("");
const playerName = ref("");
const DEFAULT_ENEMY_HP = 25;
const weaponBonus = ref(0);
const enemyTripped = ref(false);
const enemyStatusEffects = ref([]);
const enemyIsStunned = ref(false);
const seenLoreEncounters = ref([]);
const seenNPCEncounters = ref([]);
const BOSS_TYPES = ["Dragon", "Lich", "Vampire", "Giant", "Kraken", "Elder Brain", "Barbed Devil", "Flameskull", "Illithid", "Werewolf", "Banshee"];
const bossDefeated = ref(false);
const bossSpawned = ref(false);
const bossName = computed(() => {
  const suffix = selectedBossType.value;
  return `${suffix}`;
});
const BOSS_HP = 50;
const selectedBossType = ref("");

const inEncounter = computed(() => {
  const e = encounter.value;
  if (!e || typeof e !== "object") return false;

  if (e.type === "combat") {
    return typeof e.enemy === "string" && e.enemy.length > 0;
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
  if (newVal <= 0 && !defeated.value) {
    log(`💀 <span class="player-name">${playerName.value}</span> was defeated!`);
    defeated.value = true;
    clearInterval(timerInterval);
    encounter.value = null;
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
  return current.value === chain[chain.length - 1] && bossDefeated.value;
});

function handleClick(title) {
  console.log(
    "[handleClick] inEncounter:",
    inEncounter.value,
    "clicked title:",
    title
  );
  if (inEncounter.value) return;
  log(`📍 ARTICLE: ${title}`);

  const isFinalArticle = title === chain[chain.length - 1];
  current.value = title;
  clickCount.value++;
  path.value.push(title);

if (!isFinalArticle && clickCount.value % 2 === 0) {
  const chance = Math.random();
  if (chance < 0.5) {
    const roll = rollEncounter();
    let fullEncounter = null;

    if (roll.type === "npc") {
      const availableNPCs = friendlyEncounters.filter(
        (npc) => !seenNPCEncounters.value.includes(npc.id)
      );

      if (availableNPCs.length === 0) {
        console.warn("All NPCs seen");
        return;
      }

      const npc =
        availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
      seenNPCEncounters.value.push(npc.id);

      fullEncounter = { type: "npc", npc };
      encounterMessage.value = npc.greeting;
      log(`${npc.greeting}`);
    } else if (roll.type === "lore") {
      const availableLore = loreEncounters.filter(
        (lore) => !seenLoreEncounters.value.includes(lore.id)
      );

      if (availableLore.length === 0) {
        console.warn("All lore seen");
        return;
      }

      const lore =
        availableLore[Math.floor(Math.random() * availableLore.length)];
      seenLoreEncounters.value.push(lore.id);

      fullEncounter = { type: "lore", lore };
      encounterMessage.value = lore.text;
      log(`${lore.text}`);
    } else if (roll.type === "combat") {
      const enemy = generateEnemy();
      if (!enemy) return;
      enemyHP.value = DEFAULT_ENEMY_HP;
      fullEncounter = { type: "combat", enemy };
      encounterMessage.value = `You've been ambushed by a ${enemy}!`;

      nextEnemyAttack.value = Math.floor(Math.random() * 3) + 1;
      enemyNextAction.value = "attack";
    }

    if (fullEncounter) {
      encounter.value = fullEncounter;
      return;
    }
  }
}


  if (title === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
  }

  if (isFinalArticle) {
    if (!bossSpawned.value && !bossDefeated.value) {
      // Choose random boss type
      selectedBossType.value =
        BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];

      // Spawn boss
      encounter.value = {
        type: "combat",
        enemy: bossName.value,
      };
      enemyHP.value = BOSS_HP;
      encounterMessage.value = `💀 A terrifying ${bossName.value} rises to defend ${formattedTitle}. Time to roll some true damage.`;

      nextEnemyAttack.value = Math.floor(Math.random() * 10) + 12;
      enemyNextAction.value = "attack";

      bossSpawned.value = true;
      return; // Prevent immediate win
    }

    if (bossDefeated.value) {
      clearInterval(timerInterval);
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleCombatAction(playerAction) {
  const enemyAction = enemyNextAction.value;
  const enemyDamage = nextEnemyAttack.value ?? 1;

  let playerDamage = 0;
  let enemyTakesDamage = 0;

  // Always calculate player attack damage if player chose attack
  if (playerAction === "attack") {
    let randomDamage = Math.floor(Math.random() * 5) + 2;

    if (playerClass.value.name === "Fighter") randomDamage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      randomDamage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike`
      );
    }

    if (weaponBonus.value > 0) {
      randomDamage += weaponBonus.value;
    }

    enemyTakesDamage = randomDamage;
  }

  if (playerAction === "special") {
    if (specialUsesLeft.value <= 0) {
      log(
        `❌ <span class="player-name">${playerName.value}</span> is out of Special Moves.`
      );
      return;
    }

    specialUsesLeft.value--;
    const cls = playerClass.value.name;

    if (cls === "Fighter") {
      enemyTakesDamage = 8;
      log(
        `⚔️ <span class="player-name">${playerName.value}</span> unleashes Power Strike! 8 damage dealt to ${formattedTitle.value}`
      );
      encounterMessage.value = `⚔️ <span class="player-name">${playerName.value}</span> unleashes Power Strike! 8 damage dealt to ${formattedTitle.value}`;
      enemyHP.value -= enemyTakesDamage;
    } else if (playerClass.value.name === "Wizard") {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        playerHP.value
      );
      const {
        enemyHP: newEnemyHP,
        playerHP: newPlayerHP,
        wizardDamage,
        stunned,
      } = effect;

      enemyHP.value = newEnemyHP;
      playerHP.value = newPlayerHP;

      log(
        `🔥 <span class="player-name">${
          playerName.value
        }</span> casts Fireball at ${
          formattedTitle.value
        }. ${wizardDamage} damage dealt.${
          stunned ? " The enemy is stunned!" : ""
        }`
      );
      encounterMessage.value = `🔥 <span class="player-name">${
        playerName.value
      }</span> casts Fireball at ${
        formattedTitle.value
      }. ${wizardDamage} damage dealt.${
        stunned ? " The enemy is stunned!" : ""
      }`;

      if (stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = null;
      }
    } else if (playerClass.value.name === "Rogue") {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        DEFAULT_ENEMY_HP
      );
      const { enemyHP: newEnemyHP, rogueDamage } = effect;

      enemyHP.value = newEnemyHP;

      log(
        `🗡️ <span class="player-name">${playerName.value}</span> executes Backstab. It hits for ${rogueDamage} to ${formattedTitle.value}.`
      );
      encounterMessage.value = `🗡️ <span class="player-name">${playerName.value}</span> executes Backstab. It hits for ${rogueDamage} to ${formattedTitle.value}.`;
    } else if (playerClass.value.specialEffect) {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        playerHP.value,
        playerClass.value.maxHP
      );

      if (typeof effect === "object" && effect !== null) {
        enemyHP.value = effect.enemyHP;
        playerHP.value = effect.playerHP;
      }

      log(
        `❗ <span class="player-name">${playerName.value}</span> uses ${playerClass.value.special}!`
      );
    }

    if (enemyHP.value <= 0) {
      log(
        `💀 <span class="player-name">${playerName.value}</span> has defeated ${formattedTitle.value}`
      );
      if (encounter.value?.enemy === bossName.value) {
        markBossDefeated();
      }

      encounter.value = null;
      handleLootDrop();
      return;
    }

    nextTick(() => {
      current.value = current.value + "";
    });

    gotoEnemyTurn();
    return;
  }

  if (enemyAction === "trip") {
    log(
      `🤾 ${formattedTitle.value} trips and falls! <span class="player-name">${playerName.value}</span> gets a free hit!`
    );

    let damage = Math.floor(Math.random() * 5) + 4;

    if (playerClass.value.name === "Fighter") damage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      damage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike on the downed enemy!`
      );
    }

    if (weaponBonus.value > 0) {
      damage += weaponBonus.value;
    }

    enemyHP.value -= damage;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> strikes the fallen ${formattedTitle.value} for ${damage} damage.`
    );

    if (enemyHP.value <= 0) {
      log(`${playerName.value} defeated ${formattedTitle.value}`);
      if (encounter.value?.enemy === bossName.value) {
        markBossDefeated();
      }

      encounter.value = null;
      handleLootDrop();
      return;
    }

    gotoEnemyTurn();
    return;
  }

  if (enemyAction === "attack") {
    log(`${formattedTitle.value} used: ${enemyAction}`);

    playerDamage = enemyDamage;

    const bleedChance = 0.1;
    const stunChance = 0.1;

    if (Math.random() < bleedChance) {
      enemyStatusEffects.value.push({ type: "bleed", duration: 3, damage: 1 });
      log(`🩸 ${formattedTitle.value} starts bleeding!`);
    }

    if (Math.random() < stunChance) {
      enemyStatusEffects.value.push({ type: "stun", duration: 1 });
      enemyIsStunned.value = true;
      enemyNextAction.value = null;
      log(`💤 ${formattedTitle.value} is stunned and misses their next turn!`);
    } else if (playerAction === "defend") {
      let reducedDamage = Math.max(1, Math.floor((Math.random() * 4 + 1) / 2));
      playerDamage = reducedDamage;
      log(
        `🛡️ <span class="player-name">${playerName.value}</span> blocks. ${formattedTitle.value} hits for ${playerDamage}`
      );
    } else if (playerAction === "flee") {
      if (encounter.value?.enemy === bossName.value) {
        log(
          `❌ You cannot flee from ${bossName.value}. This battle must be fought to the death!`
        );
        return;
      }

      const success = Math.random() > 0.4;
      if (success) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully.`
        );
        encounter.value = null;
        return;
      } else {
        playerDamage = enemyDamage;
        log(
          `❌ <span class="player-name">${playerName.value}</span> failed to flee and took ${playerDamage} damage!`
        );
      }
    }
  } else if (enemyAction === "defend") {
    log(
      `<span class="player-name">${playerName.value}</span> used: ${playerAction}`
    );

    if (playerAction === "attack") {
      let reducedDamage = Math.max(1, Math.floor((Math.random() * 4 + 1) / 2));
      if (playerClass.value.name === "Fighter") reducedDamage += 1;
      enemyTakesDamage = reducedDamage;
      log(
        `🛡️ ${formattedTitle.value} blocked. <span class="player-name">${playerName.value}</span> only dealt ${enemyTakesDamage}`
      );
    } else if (playerAction === "defend") {
      log("🛡️ Both of you blocked. Nothing happens.");
    } else if (playerAction === "flee") {
      const success = Math.random() > 0.4;
      if (success) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully!`
        );
        encounter.value = null;
        return;
      } else {
        log(
          `❌ <span class="player-name">${playerName.value}</span> failed to flee, but the enemy was just defending. No damage taken`
        );
        return;
      }
    }
  } else if (enemyAction === "flee") {
    log(`${playerName.value} fled`);
    encounter.value = null;
    return;
  }

  if (playerAction === "attack" && enemyTakesDamage > 0) {
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> hits ${formattedTitle.value} for ${enemyTakesDamage} damage.`
    );
  }

  playerHP.value -= playerDamage;
  enemyHP.value -= enemyTakesDamage;

  if (playerHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated!`
    );
    encounter.value = null;
    clearInterval(timerInterval);
    defeated.value = true;
    return;
  }

  if (enemyHP.value <= 0) {
    log(`${playerName.value} defeated ${formattedTitle.value}`);
    encounter.value = null;
    handleLootDrop();
    return;
  }

  gotoEnemyTurn();
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
      // Check if it's a boss and assign stronger attack
      const isBoss = encounter.value?.enemy === bossName.value;
      nextEnemyAttack.value = isBoss
        ? Math.floor(Math.random() * 6) + 3
        : Math.floor(Math.random() * 3) + 1;
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
    encounter.value?.enemy !== bossName.value &&
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
      message = `🗡️ Enemy is attacking for ${nextEnemyAttack.value} damage.`;
      break;
    case "defend":
      message = "🛡️ Enemy is holding up their shield.";
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
    enemyHP.value = 25;
    nextEnemyAttack.value = Math.floor(Math.random() * 3) + 1;
    enemyNextAction.value = "attack";
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
        `🎲 <span class="player-name">${playerName.value}</span> found a weapon upgrade! Next attack does double damage!`
      );
    }
  }

  if (option.result === "damage") {
    playerHP.value = Math.max(playerHP.value - 5, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 5 damage!`
    );
  }

  if (option.result === "damage-minor") {
    playerHP.value = Math.max(playerHP.value - 1, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 1 damage!`
    );
  }

    if (option.result === "damage-major") {
    playerHP.value = Math.max(playerHP.value - 50, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 50 damage!`
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

  if (option.result === "shortcut" && option.details === "clicks") {
    const amount = option.amount || 1;
    clickCount.value = Math.max(0, clickCount.value - amount);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> discovered a shortcut! Click count reduced by ${amount}.`
    );
  }

if (option.routeTitle) {
  log(`📚 You choose: ${option.text}`);
  current.value = option.routeTitle;
  path.value.push(option.routeTitle);
  clickCount.value++;

  encounter.value = null;

  if (option.routeTitle === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  return;
}

  encounter.value = null;
}

function handleLootDrop() {
  const lootChance = Math.random();
  if (lootChance > 0.5) {
    log(`❌ Enemy has no loot to drop.`);
    return;
  }

  const lootOptions = ["health", "weapon", "special"];
  const selectedLoot =
    lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    case "health": {
      const amount = 5;
      playerHP.value = Math.min(
        playerHP.value + amount,
        playerClass.value.maxHP
      );
      log(
        `🍎 <span class="player-name">${playerName.value}</span> loots +${amount} HP!`
      );
      break;
    }

    case "weapon": {
      weaponBonus.value += 1;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> loots a sharper weapon! Weapon damage +1 (Base Damage Total: +${weaponBonus.value})`
      );
      break;
    }

    case "special": {
      specialUsesLeft.value += 1;
      log(
        `🎁 <span class="player-name">${playerName.value}</span> regains a special move! (Total: ${specialUsesLeft.value})`
      );
      break;
    }
  }
}

function markBossDefeated() {
  bossDefeated.value = true;
  current.value = chain[chain.length - 1];
  clearInterval(timerInterval);
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

@media screen and (max-width: 600px) {
  .timer {
    font-size: 13px;
    margin-top: 0.1rem;
  }
}
</style>
