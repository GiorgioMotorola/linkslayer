<template>
  <ClassSelect v-if="!playerClass" @select="handleClassSelection" />
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

    <ArticleViewer
      :articleTitle="current"
      :start="chain[0]"
      :targets="chain[chain.length - 1]"
      @link-clicked="handleClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
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

const chain = getTodayChain();
const currentTargetIndex = ref(0);
const current = ref(chain[0]);
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

const isGameComplete = computed(
  () => current.value === chain[chain.length - 1]
);

function handleClick(title) {
  console.log(
    "[handleClick] inEncounter:",
    inEncounter.value,
    "clicked title:",
    title
  );
  if (inEncounter.value) return;
  log(`📍 ARTICLE: ${title}`);

  current.value = title;
  clickCount.value++;
  path.value.push(title);

  const isFinalArticle = title === chain[chain.length - 1];

  if (!isFinalArticle && clickCount.value % 2 === 0) {
    const chance = Math.random();
    if (chance < 0.5) {
      const roll = rollEncounter();
      let fullEncounter = null;

      if (roll.type === "npc") {
        const npc =
          friendlyEncounters[
            Math.floor(Math.random() * friendlyEncounters.length)
          ];
        if (!npc) {
          console.warn("No NPC available for encounter");
          return;
        }
        fullEncounter = { type: "npc", npc };
        encounterMessage.value = npc.greeting;
        log(`${npc.greeting}`);
      } else if (roll.type === "lore") {
        const lore =
          loreEncounters[Math.floor(Math.random() * loreEncounters.length)];
        if (!lore) {
          console.warn("No lore available for encounter");
          return;
        }
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
    clearInterval(timerInterval);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

const formattedTitle = computed(
  () => current.value?.replaceAll("_", " ") ?? ""
);
function handleCombatAction(playerAction) {
  const enemyAction = enemyNextAction.value;
  const enemyDamage = nextEnemyAttack.value ?? 1;

  let playerDamage = 0;
  let enemyTakesDamage = 0;

  // Handle player special first
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
      encounter.value = null;
      handleLootDrop();
      return;
    }

    gotoEnemyTurn();
    return;
  }

  // Handle enemy TRIP action
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
      // log(`<span class="player-name">${playerName.value}</span>'s weapons base damage is now +${weaponBonus.value} damage.`);
    }

    enemyHP.value -= damage;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> strikes the fallen ${formattedTitle.value} for ${damage} damage.`
    );

    if (enemyHP.value <= 0) {
      log(`${playerName.value} defeated ${formattedTitle.value}`);
      handleLootDrop();
      encounter.value = null;
      return;
    }

    gotoEnemyTurn();
    return;
  }

  // Enemy attack logic
  if (enemyAction === "attack") {
    log(`${formattedTitle.value} used: ${enemyAction}`);

    if (playerAction === "attack") {
      playerDamage = enemyDamage;

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
        // log(`<span class="player-name">${playerName.value}</span>'s weapons base damage is now +${weaponBonus.value} damage.`);
      }

      enemyTakesDamage = randomDamage;

      log(
        `🗡️ <span class="player-name">${playerName.value}</span> and ${formattedTitle.value} clash. <span class="player-name">${playerName.value}</span> takes ${playerDamage} damage. ${formattedTitle.value} takes ${enemyTakesDamage} damage.`
      );
    }

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
  }

  // Enemy defend logic
  else if (enemyAction === "defend") {
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
  }

  // Enemy flee logic
  else if (enemyAction === "flee") {
    log(`${playerName.value} fled`);
    encounter.value = null;
    return;
  }

  // Damage resolution
  playerHP.value -= playerDamage;
  enemyHP.value -= enemyTakesDamage;

  if (playerHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated!`
    );
    encounter.value = null;
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
    nextEnemyAttack.value =
      action === "attack" ? Math.floor(Math.random() * 3) + 1 : null;
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
  if (enemyHP.value <= 5 && Math.random() < 0.02) return "flee";
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
  console.log("[handleCloseEncounter] clearing encounter");
  encounter.value = null;

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

    if (option.details === 'weapon') {
      log(`🎲 <span class="player-name">${playerName.value}</span> found a weapon upgrade! Next attack does double damage!`);
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
