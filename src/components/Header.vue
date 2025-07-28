<template>
  <header :class="{ 'darkened-header': isDarkened }">
    <transition name="encounter-fade" mode="out-in">
      <div v-if="encounter" class="encounter-dashboard">
        <div v-if="encounter.type === 'combat'">
          <div class="oh-no">{{ formattedTitle }} &#x2694;</div>
          <div class="attack-line" v-html="typedLine"></div>
          <div class="btn-group">
            <button
              :class="{ 'btn-anim-attack': activeAction === 'attack' }"
              @click="handleAction('attack')"
            >
              > Attack
            </button>

            <button
              :class="{ 'btn-anim-defend': activeAction === 'defend' }"
              @click="handleAction('defend')"
            >
              > Defend
            </button>

            <button
              :class="{ 'btn-anim-flee': activeAction === 'flee' }"
              @click="handleAction('flee')"
            >
              > Flee
            </button>

            <button
              :class="{ 'btn-anim-special': activeAction === 'special' }"
              @click="handleAction('special')"
            >
              > {{ playerSpecialAbilityName }}
            </button>
          </div>
          <div class="enemy">
            💀 (HP:
            {{ enemyHP }})
          </div>
        </div>

        <div class="npc" v-else-if="encounter.type === 'npc'">
          <div class="npc-name">{{ encounter.npc.name }} &#x1F5E8;</div>
          <div class="npc-greeting" v-html="typedGreeting"></div>
          <div v-if="currentDialogue && currentDialogue.options">
            <button
              v-for="(option, index) in currentDialogue.options"
              :key="index"
              @click="emit('option-chosen', option)"
            >
              > {{ option.text }}
            </button>
          </div>
          <div v-else>
            <button @click="emit('close')">> Continue</button>
          </div>
        </div>

        <div class="lore" v-else-if="encounter.type === 'lore'">
          <div class="lore-name">Discovery ⚲</div>
          <div class="lore-greeting" v-html="typedGreeting"></div>
          <div v-if="currentDialogue && currentDialogue.options">
            <button
              v-for="(option, index) in currentDialogue.options"
              :key="index"
              @click="emit('option-chosen', option)"
            >
              > {{ option.text }}
            </button>
          </div>
          <div v-else>
            <button @click="emit('close')">> Continue</button>
          </div>
        </div>

        <div v-else>
          <p>⚠️ Unknown encounter type.</p>
          <button @click="emit('close')">Continue</button>
        </div>
      </div>
    </transition>

    <div class="player-stats-container">
      <div class="player-header">
        <div class="player-name-line">
          {{ props.playerName || "Unnamed" }}
          <span style="font-weight: 400; color: #02204d"
            >({{ playerClass?.name || `none` }})</span
          >
        </div>

        <button @click="emit('open-inventory-modal')" class="inventory-button">
          View Backpack
        </button>
      </div>

      <div class="all-stats-row-box">
        <div class="stat-column-hp">
          <div class="stat-label">HP</div>
          <div class="stat-value">
            <span :class="hpAnimClass">{{ playerHP }}</span
            >/<span :class="maxHpAnimClass">{{ effectiveMaxHP }}</span>
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Weapon</div>
          <div class="stat-value" :class="weaponAnimClass">
            +{{ weaponBonus }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Defense</div>
          <div class="stat-value" :class="defenseAnimClass">
            +{{ shieldBonus }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">{{ playerSpecialAbilityName }}</div>
          <div class="stat-value" :class="specialAnimClass">
            {{ specialUsesLeft }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Short Rest</div>
          <div class="stat-value" :class="shortRestAnimClass">
            {{ 4 - shortRestsUsedCount }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Long Rest</div>
          <div class="stat-value" :class="longRestAnimClass">
            {{ 2 - longRestsUsedCount }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Gold</div>
          <div class="stat-value" :class="goldAnimClass">{{ playerGold }}</div>
        </div>

        <div class="stat-column-clicks">
          <div class="stat-label">Clicks</div>
          <div class="stat-value" :class="clicksAnimClass">{{ clicks }}</div>
        </div>
      </div>
      <div class="game-log">
        <div class="log"></div>
        <div
          v-for="(entry, index) in visibleLog"
          :key="entry.id"
          :class="[
            'log-entry',
            {
              'latest-log': entry === visibleLog[visibleLog.length - 1],
              'animate-log': newLineIds.includes(entry.id),
            },
          ]"
          v-html="entry.id + '. ' + entry.text"
          :style="
            newLineIds.includes(entry.id)
              ? { animationDelay: `${Math.max(index, 1) * 0.3}s` }
              : {}
          "
        />

        <div class="log-btns">
          <button
            v-if="props.gameLog.length > 5"
            @click="expanded = !expanded"
            class="tips-button"
          >
            {{ expanded ? "Show Less" : "Show More" }}
          </button>
          <button class="tips-button" @click="copyLogToClipboard">
            Copy Log
          </button>
          <button class="tips-button" @click="openModal">Game Tips</button>
          <TipsModal v-if="isModalOpen" @close="closeModal" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import TipsModal from "./TipsModal.vue";
import './styles/headerStyles.css'; 

const props = defineProps({
  start: String,
  targets: String,
  clicks: Number,
  path: Array,
  playerClass: Object,
  specialUsesLeft: Number,
  playerHP: Number,
  maxHP: Number,
  gameLog: Array,
  encounter: Object,
  enemyHP: Number,
  nextEnemyAttack: Number,
  enemyNextAction: String,
  message: String,
  playerName: String,
  weaponBonus: Number,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  formattedTitle: String,
  shieldBonus: Number,
  playerGold: Number,
  hasCompass: Number,
  gameChain: Array,
  isDarkened: {
    type: Boolean,
    default: false,
  },
  compassCount: {
    type: Number,
    required: true,
  },
  effectiveMaxHP: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits([
  "action",
  "defend",
  "flee",
  "special",
  "close",
  "option-chosen",
  "log-line",
  "show-tips",
  "use-compass",
  "open-inventory-modal",
]);

const activeAction = ref("");
const typedLine = ref("");
const typedGreeting = ref("");
let typeInterval = null;
const currentDialogueNodeId = ref(null);
const expanded = ref(false);
const visibleLogCount = ref(Math.min(props.gameLog?.length ?? 0, 5));
const newLineIds = ref([]);

const displayedLog = computed(() => {
  return expanded.value ? props.gameLog : props.gameLog.slice(-5);
});

const visibleLog = computed(() => {
  return displayedLog.value.slice(-visibleLogCount.value);
});

const isModalOpen = ref(false);

const openModal = () => {
  isModalOpen.value = true;
  emit("show-tips");
};

const closeModal = () => {
  isModalOpen.value = false;
};

const currentDialogue = computed(() => {
  if (!props.encounter) return null;

  if (props.encounter.type === "npc" && props.encounter.npc.dialogueNodes) {
    const nodeId = currentDialogueNodeId.value || "start";
    return props.encounter.npc.dialogueNodes[nodeId];
  }
  if (props.encounter.type === "lore" && props.encounter.lore.dialogueNodes) {
    const nodeId = currentDialogueNodeId.value || "start";
    console.log(
      "Header: Lore Encounter - currentDialogue computed. Node ID:",
      nodeId
    );
    console.log(
      "Header: currentDialogue.value (Lore):",
      props.encounter.lore.dialogueNodes[nodeId]
    );
    return props.encounter.lore.dialogueNodes[nodeId];
  }
  if (props.encounter.type === "npc") {
    return {
      text: props.encounter.npc.greeting,
      options: props.encounter.npc.options,
    };
  }
  if (props.encounter.type === "lore") {
    return {
      text: props.encounter.lore.text,
      options: props.encounter.lore.options,
    };
  }
  return null;
});

const longRestsUsedCount = computed(() => props.longRestsUsed ?? 0);

const shortRestsUsedCount = computed(() => props.shortRestsUsed ?? 0);

const playerSpecialAbilityName = computed(() => {
  return props.playerClass?.special || "Special";
});

const hpAnimClass = ref("");
const weaponAnimClass = ref("");
const defenseAnimClass = ref("");
const clicksAnimClass = ref("");
const goldAnimClass = ref("");
const specialAnimClass = ref("");
const shortRestAnimClass = ref("");
const longRestAnimClass = ref("");
const maxHpAnimClass = ref("");

let hpTimeout = null;
let weaponTimeout = null;
let defenseTimeout = null;
let clicksTimeout = null;
let goldTimeout = null;
let specialTimeout = null;
let shortRestTimeout = null;
let longRestTimeout = null;
let maxHpTimeout = null;

function triggerAnim(refVar, className, duration = 700) {
  let currentTimeoutRef;
  if (refVar === hpAnimClass) currentTimeoutRef = hpTimeout;
  else if (refVar === weaponAnimClass) currentTimeoutRef = weaponTimeout;
  else if (refVar === defenseAnimClass) currentTimeoutRef = defenseTimeout;
  else if (refVar === clicksAnimClass) currentTimeoutRef = clicksTimeout;
  else if (refVar === goldAnimClass) currentTimeoutRef = goldTimeout;
  else if (refVar === specialAnimClass) currentTimeoutRef = specialTimeout;
  else if (refVar === shortRestAnimClass) currentTimeoutRef = shortRestTimeout;
  else if (refVar === longRestAnimClass) currentTimeoutRef = longRestTimeout;
  else if (refVar === maxHpAnimClass) currentTimeoutRef = maxHpTimeout;

  if (currentTimeoutRef) {
    clearTimeout(currentTimeoutRef);
  }

  refVar.value = "";

  void refVar.value;
  nextTick(() => {
    refVar.value = className;

    const newTimeout = setTimeout(() => {
      refVar.value = "";
    }, duration);

    if (refVar === hpAnimClass) hpTimeout = newTimeout;
    else if (refVar === weaponAnimClass) weaponTimeout = newTimeout;
    else if (refVar === defenseAnimClass) defenseTimeout = newTimeout;
    else if (refVar === clicksAnimClass) clicksTimeout = newTimeout;
    else if (refVar === goldAnimClass) goldTimeout = newTimeout;
    else if (refVar === specialAnimClass) specialTimeout = newTimeout;
    else if (refVar === shortRestAnimClass) shortRestTimeout = newTimeout;
    else if (refVar === longRestAnimClass) longRestTimeout = newTimeout;
    else if (refVar === maxHpAnimClass) maxHpTimeout = newTimeout;
  });
}

watch(
  () => props.playerHP,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      if (newVal > oldVal) {
        triggerAnim(hpAnimClass, "hp-gain");
      } else {
        triggerAnim(hpAnimClass, "hp-loss");
      }
    }
  }
);

watch(
  () => props.encounter,
  (newEncounter) => {
    if (!newEncounter) {
      typedLine.value = "";
      typedGreeting.value = "";
      clearInterval(typeInterval);
      currentDialogueNodeId.value = null;
      return;
    }

    let fullText = "";

    if (newEncounter.type === "npc" && newEncounter.npc) {
      currentDialogueNodeId.value = newEncounter.npc.currentNodeId || "start";
      fullText = currentDialogue.value?.text || newEncounter.npc.greeting || "";
    } else if (newEncounter.type === "lore" && newEncounter.lore) {
      currentDialogueNodeId.value = newEncounter.lore.currentNodeId || "start";
      fullText = currentDialogue.value?.text || newEncounter.lore.text || "";
    } else if (newEncounter.type === "combat") {
      console.log("--- Combat Encounter Debug ---");
      console.log("props.formattedTitle:", props.formattedTitle);
      console.log("newEncounter.enemy:", newEncounter.enemy);
      console.log("newEncounter.enemy?.name:", newEncounter.enemy?.name);
      console.log("newEncounter.enemy?.isBoss:", newEncounter.enemy?.isBoss);
      console.log(
        "newEncounter.enemy?.isMiniBoss:",
        newEncounter.enemy?.isMiniBoss
      );
      console.log("----------------------------");

      if (newEncounter.enemy?.isBoss) {
        fullText = `💀 <strong>BOSS ENCOUNTER:</strong> ${
          newEncounter.enemy.name ?? "Unknown Boss"
        }!<br><br>${
          newEncounter.enemy.message || "Prepare for the fight of your life."
        }`;
      } else if (newEncounter.enemy?.isMiniBoss) {
        fullText = `💥 You've been attacked by the mini-boss <strong>${
          newEncounter.enemy.name ?? "Unknown Mini-Boss"
        }</strong> from <strong>${
          props.formattedTitle ?? "an unknown location"
        }</strong>! (HP: ${newEncounter.enemy.currentHP}) What do you do?`;
      } else {
        let baseCombatMessage = `🗡️ You've been attacked by <strong>${
          props.formattedTitle ?? "an unknown location"
        }</strong> ${newEncounter.enemy.name ?? "Unknown Enemy"}. (HP: ${
          newEncounter.enemy.currentHP
        }) What do you do?`;

        if (newEncounter.enemy?.message) {
          fullText = `${baseCombatMessage}<br><br>${newEncounter.enemy.message}`;
        } else {
          fullText = baseCombatMessage;
        }
      }
    } else {
      fullText = "⚠️ Unknown encounter type.";
    }

    startTyping(fullText, newEncounter.type);

    if (newEncounter.type === "npc" || newEncounter.type === "lore") {
      if (currentDialogue.value?.text) {
        typedGreeting.value = "";
        startTyping(currentDialogue.value.text, newEncounter.type);
      }

      if (
        !newEncounter.npc?.currentNodeId &&
        !newEncounter.lore?.currentNodeId
      ) {
        currentDialogueNodeId.value = "start";
      }
    } else {
      currentDialogueNodeId.value = null;
    }
  },
  { immediate: true, deep: true }
);

watch(currentDialogueNodeId, (newNodeId) => {
  if (newNodeId && currentDialogue.value) {
    startTyping(currentDialogue.value.text, props.encounter.type);
  }
});

watch(
  () => props.weaponBonus,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(weaponAnimClass, "stat-flash");
    }
  }
);

watch(
  () => props.shieldBonus,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(defenseAnimClass, "stat-flash");
    }
  }
);

watch(
  () => props.clicks,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(clicksAnimClass, "stat-bounce");
    }
  }
);

watch(
  () => props.playerGold,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      if (newVal > oldVal) {
        triggerAnim(goldAnimClass, "gold-gain");
      } else {
        triggerAnim(goldAnimClass, "gold-loss");
      }
    }
  }
);

watch(
  () => props.specialUsesLeft,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      if (newVal > oldVal) {
        triggerAnim(specialAnimClass, "stat-gain");
      } else {
        triggerAnim(specialAnimClass, "stat-loss");
      }
    }
  }
);

watch(shortRestsUsedCount, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    if (newVal > oldVal) {
      triggerAnim(shortRestAnimClass, "stat-loss");
    } else {
      triggerAnim(shortRestAnimClass, "stat-gain");
    }
  }
});

watch(longRestsUsedCount, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    if (newVal > oldVal) {
      triggerAnim(longRestAnimClass, "stat-loss");
    } else {
      triggerAnim(longRestAnimClass, "stat-gain");
    }
  }
});

watch(
  () => props.encounter,
  (newEncounter) => {
    if (!newEncounter) {
      typedLine.value = "";
      typedGreeting.value = "";
      clearInterval(typeInterval);
      return;
    }

    let fullText = "";
    if (newEncounter.type === "npc" || newEncounter.type === "lore") {
      fullText = currentDialogue.value?.text || "";
    } else if (newEncounter.type === "combat") {
      if (newEncounter.enemy?.isBoss) {
        fullText = `💀 <strong>BOSS ENCOUNTER:</strong> ${
          newEncounter.enemy.name
        }!<br><br>${
          newEncounter.enemy.message || "Prepare for the fight of your life."
        }`;
      } else if (newEncounter.enemy?.message) {
        fullText = newEncounter.enemy.message;
      } else {
        fullText = `🗡️ You've been attacked by <strong>${
          props.formattedTitle
        }</strong> ${newEncounter.enemy.name ?? ""}. (HP: ${
          newEncounter.enemy.currentHP
        }) What do you do?`;
      }
    } else {
      fullText = "⚠️ Unknown encounter type.";
    }

    startTyping(fullText, newEncounter.type);

    if (newEncounter.type === "npc" || newEncounter.type === "lore") {
      if (
        !newEncounter.npc?.currentNodeId &&
        !newEncounter.lore?.currentNodeId
      ) {
        currentDialogueNodeId.value = "start";
      }
    } else {
      currentDialogueNodeId.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => props.effectiveMaxHP,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(maxHpAnimClass, "stat-gain");
    }
  }
);

function startTyping(fullText, type = "combat") {
  clearInterval(typeInterval);
  typedGreeting.value = "";
  let index = 0;

  typeInterval = setInterval(() => {
    if (type === "combat") {
      typedLine.value += fullText.charAt(index);
    } else {
      typedGreeting.value += fullText.charAt(index);
    }

    index++;
    if (index >= fullText.length) clearInterval(typeInterval);
  }, 10);
}
watch(
  () => props.gameLog.length,
  async (newLength, oldLength) => {
    const diff = newLength - visibleLogCount.value;

    if (diff > 0) {
      const newEntries = props.gameLog.slice(-diff);
      newLineIds.value = newEntries.map((e) => e.id);

      let revealIndex = 0;
      const interval = setInterval(() => {
        if (revealIndex >= diff) {
          clearInterval(interval);
          newLineIds.value = [];
        } else {
          visibleLogCount.value++;
          revealIndex++;
        }
      }, 350);
    } else {
      visibleLogCount.value = newLength;
      newLineIds.value = [];
    }

    await nextTick();
  },
  { immediate: true }
);

function handleAction(action) {
  activeAction.value = action;
  emit("action", action);

  setTimeout(() => {
    activeAction.value = "";
  }, 300);
}

const formattedTitle = computed(() =>
  (props.path?.[props.path.length - 1] ?? "").replaceAll("_", " ")
);

function copyLogToClipboard() {
  const rawLog = props.gameLog
    .map((entry) => entry.text.replace(/<[^>]*>/g, ""))
    .join("\n");

  navigator.clipboard
    .writeText(rawLog)
    .then(() => alert("Log copied to clipboard"))
    .catch((err) => console.error("Failed to copy log:", err));
}
</script>

<style>
body {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

@import './styles/CombatAnimations.css'; 
</style>