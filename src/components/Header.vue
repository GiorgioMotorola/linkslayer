<template>
  <header ref="headerEl" :class="{ 'darkened-header': isDarkened }">

    <div class="encounter-wrapper" :class="{ 'encounter-active': !!encounter }">
      <div class="encounter-wrapper-inner">
    <transition name="encounter-fade" mode="out-in">
      <div v-if="encounter" class="encounter-dashboard">
        <div v-if="encounter.type === 'combat'">
          <div class="attack-line" v-html="typedLine"></div>

          <div v-if="confusedAction.length > 0 && confusedTurnsLeft > 0" class="confused-notice">
            <i class="ra ra-cycle"></i> <strong>{{ confusedActionLabel }}</strong> locked ({{ confusedTurnsLeft }} turn{{ confusedTurnsLeft === 1 ? '' : 's' }} remaining)
          </div>

          <!-- Action queue row — click a slot to pick an action -->
          <div v-if="props.enemyNextAction !== 'victory'" class="action-queue-row">
            <Teleport to="body">
              <Transition name="slot-menu-fade">
                <div v-if="openSlotIdx !== null" class="slot-action-menu" :style="popupStyle" @click.stop>
                  <button
                    v-for="act in menuActions"
                    :key="act.action"
                    class="slot-action-item"
                    :class="{
                      'slot-action-confused': act.confused,
                      'slot-action-wind-up': act.action === 'defend' && isWindUp,
                    }"
                    :disabled="act.disabled"
                    @click="selectAction(act.action)"
                  >
                    <span class="slot-action-icon" v-html="act.icon"></span>
                    <span class="slot-action-text">
                      <span class="slot-action-label">{{ act.label }}</span>
                      <span class="slot-action-hint">{{ act.hint }}</span>
                    </span>
                  </button>
                </div>
              </Transition>
            </Teleport>

            <div class="action-slots" ref="actionSlotsEl">
              <div
                v-for="i in props.maxActionsPerTurn"
                :key="i"
                class="action-slot"
                :class="{
                  'action-slot-filled': lockedActions[i-1],
                  'action-slot-empty': !lockedActions[i-1],
                  'action-slot-open': openSlotIdx === i-1,
                }"
                @click="onSlotClick(i-1)"
              >
                <span v-if="lockedActions[i-1]" v-html="actionSlotLabel(lockedActions[i-1].action) + ' ✕'"></span>
                <span v-else class="slot-empty-indicator">+ Action</span>
              </div>
            </div>
            <button
              class="btn-confirm-turn"
              :disabled="combatLocked || lockedActions.length === 0"
              @click="confirmTurn"
            >
              Go
            </button>
          </div>

          <Transition name="no-target-fade">
            <div v-if="noTargetNotice" class="no-target-notice">Select an enemy first</div>
          </Transition>

          <div v-if="props.enemyNextAction === 'victory'" class="victory-panel">
            <div v-if="props.victoryLoot" class="victory-loot">
              Loot: <span v-html="props.victoryLoot"></span>
            </div>
            <div class="dialogue-options">
              <button @click="emit('close')">▸ Continue Your Journey</button>
            </div>
          </div>
        </div>

        <div class="npc" v-else-if="encounter.type === 'npc'">
          <div class="npc-name">{{ encounter.npc.name }}</div>
          <div class="dialogue-wrap">
            <div class="dialogue-wrap-inner">
              <transition name="dialogue-fade" mode="out-in">
                <div :key="currentDialogueNodeId" class="dialogue-body">
                  <div class="npc-greeting" v-html="typedGreeting"></div>
                  <div v-if="currentDialogue && currentDialogue.options" class="dialogue-options">
                    <button
                      v-for="(option, index) in currentDialogue.options"
                      :key="index"
                      @click="emit('option-chosen', option)"
                    >
                      ▸ {{ option.text }}
                    </button>
                  </div>
                  <div v-else class="dialogue-options">
                    <button @click="emit('close')">▸ Continue</button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <div class="lore" v-else-if="encounter.type === 'lore'">
          <div class="lore-name">{{ encounter.lore.name || 'Discovery' }}</div>
          <div class="dialogue-wrap">
            <div class="dialogue-wrap-inner">
              <transition name="dialogue-fade" mode="out-in">
                <div :key="currentDialogueNodeId" class="dialogue-body">
                  <div class="lore-greeting" v-html="typedGreeting"></div>
                  <div v-if="currentDialogue && currentDialogue.options" class="dialogue-options">
                    <button
                      v-for="(option, index) in currentDialogue.options"
                      :key="index"
                      @click="emit('option-chosen', option)"
                    >
                      ▸ {{ option.text }}
                    </button>
                  </div>
                  <div v-else class="dialogue-options">
                    <button @click="emit('close')">▸ Continue</button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <div v-else>
          <p><i class="ra ra-aware"></i> Unknown encounter type.</p>
          <button @click="emit('close')">Continue</button>
        </div>
      </div>
    </transition>
      </div>
    </div>

    <div class="player-stats-container">
      <div class="header-main-row">
        <div class="header-stats-section">
          <div v-if="props.dogName" class="header-dog-btn dog-desktop" @click="petDog" :title="'Pet ' + props.dogName">
            <span>🐶</span>
            <div v-if="headerHeartCount > 0" class="dog-hearts">
              <span v-for="i in headerHeartCount" :key="i" class="dog-heart">❤️</span>
            </div>
            <div v-if="dogPlusOneVisible" class="dog-plus-one">+2</div>
          </div>
          <div class="all-stats-row-box" :class="containerAnimClass">
            <div class="stat-tile">
              <span class="st-icon">♥</span>
              <span class="st-val"><span :class="hpAnimClass">{{ playerHP }}</span><span class="st-max">/{{ effectiveMaxHP }}</span></span>
            </div>

            <div class="stat-tile">
              <span class="st-icon"><i class="ra ra-sword"></i></span>
              <span class="st-val" :class="weaponAnimClass">+{{ weaponBonus }}</span>
            </div>

            <div class="stat-tile">
              <span class="st-icon">⛨</span>
              <span class="st-val" :class="defenseAnimClass">+{{ shieldBonus }}</span>
            </div>

            <div class="stat-tile stat-tile-special">
              <span class="st-tier">T{{ props.specialTier ?? 1 }}</span>
              <span class="st-icon">✦</span>
              <span class="st-val" :class="specialAnimClass">{{ specialUsesLeft }}</span>
            </div>

            <div class="stat-tile">
              <span class="st-icon">◉</span>
              <span class="st-val" :class="goldAnimClass">{{ playerGold }}</span>
            </div>

            <div class="stat-tile">
              <span class="st-icon">&#9874;</span>
              <span class="st-val">{{ scrapMetal ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div class="header-right-section">
          <div class="status-btn-wrapper">
            <button class="status-btn" @click="showStatusPopup = !showStatusPopup">Status</button>
            <div v-if="showStatusPopup" class="status-popup">
              <div class="status-popup-title">Active Effects</div>
              <div v-for="entry in activeStatuses" :key="entry.label" class="status-popup-item">
                <div class="status-popup-item-label" v-html="entry.label"></div>
                <div class="status-popup-item-desc">{{ entry.desc }}</div>
              </div>
              <div v-if="activeStatuses.length === 0" class="status-popup-item status-popup-empty">No active effects</div>
            </div>
          </div>
          <div v-if="props.dogName" class="header-dog-btn dog-mobile" @click="petDog" :title="'Pet ' + props.dogName">
            <span>🐶</span>
            <div v-if="headerHeartCount > 0" class="dog-hearts">
              <span v-for="i in headerHeartCount" :key="i" class="dog-heart">❤️</span>
            </div>
            <div v-if="dogPlusOneVisible" class="dog-plus-one">+2</div>
          </div>
          <button @click="emit('open-hub')" class="inventory-button">Inventory</button>
        </div>
      </div>

      <div class="game-log">
        <div v-show="logOpen" class="log-body">
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
        </div>

        <div class="log-btns">
          <button class="tips-button" @click="logOpen = !logOpen">
            {{ logOpen ? 'Hide Log' : 'Show Log' }}
          </button>
          <template v-if="logOpen">
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
          </template>
          <button class="tips-button" @click="openModal">How To Play</button>
          <TipsModal v-if="isModalOpen" @close="closeModal" />
          <div class="hbb-auth">
            <template v-if="authUser">
              <span class="hbb-username">{{ userLabel }}</span>
              <span class="hbb-sep">·</span>
              <button class="hbb-link" @click="handleSignOutAuth">Sign out</button>
            </template>
            <template v-else>
              <button class="hbb-link" @click="toggleForm('signin')">Sign in</button>
              <span class="hbb-sep">·</span>
              <button class="hbb-link" @click="toggleForm('signup')">Sign up</button>
            </template>
            <div v-if="showForm" class="hbb-dropdown">
              <div class="hbb-dropdown-title">{{ showForm === 'signup' ? 'Create Account' : 'Sign In' }}</div>
              <input v-model="authEmail" type="email" placeholder="Email" class="hbb-input" @keyup.enter="submitAuth" />
              <input v-model="authPassword" type="password" placeholder="Password" class="hbb-input" @keyup.enter="submitAuth" />
              <div v-if="authError" class="hbb-error">{{ authError }}</div>
              <div v-if="authSuccess" class="hbb-success">{{ authSuccess }}</div>
              <button class="hbb-submit" @click="submitAuth" :disabled="authLoading">
                {{ authLoading ? '...' : showForm === 'signup' ? 'Create Account' : 'Sign In' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="dice-roll-fade">
        <div
          v-if="lastDiceRoll"
          class="dice-roll-display"
          :class="lastDiceRoll.isRolling ? 'dice-rolling' : (lastDiceRoll.didHit ? 'dice-hit' : 'dice-miss')"
          :style="diceRollBadgeStyle"
        >
          <div class="dice-number">{{ lastDiceRoll.roll }}</div>
          <div class="dice-label" v-if="!lastDiceRoll.isRolling">need {{ lastDiceRoll.threshold }}+</div>
          <transition name="dice-bonus-pop">
            <div class="dice-bonus" v-if="lastDiceRoll.isBonusing">+{{ lastDiceRoll.bonus }}</div>
          </transition>
        </div>
      </transition>
    </Teleport>
  </header>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import TipsModal from "./TipsModal.vue";
import "./styles/headerStyles.css";
import { shopItems } from "@/utils/shopItems";
import { getWeapon } from "@/utils/weapons";


import { useAuth } from "@/composables/useAuth";

const props = defineProps({
  start: String,
  targets: String,
  clicks: Number,
  daysCount: { type: Number, default: 1 },
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
  enemyTurnKey: Number,
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
  lastDiceRoll: {
    type: Object,
    default: null,
  },
  lastDamageDealt: {
    type: Number,
    default: null,
  },
  lastDamageTaken: {
    type: Number,
    default: null,
  },
  specialTier: {
    type: Number,
    default: 1,
  },
  playerGoal: {
    type: String,
    default: "",
  },
  enemyStatusEffects: {
    type: Array,
    default: () => [],
  },
  confusedAction: {
    type: Array,
    default: () => [],
  },
  confusedTurnsLeft: {
    type: Number,
    default: 0,
  },
  counterResult: {
    type: String,
    default: null,
  },
  autoSaveFeedback: {
    type: Boolean,
    default: false,
  },
  dogName: {
    type: String,
    default: "",
  },
  isBlurred: { type: Boolean, default: false },
  isPlayerPoisoned: { type: Boolean, default: false },
  isCloakActive: { type: Boolean, default: false },
  healthRegenActive: { type: Boolean, default: false },
  encounterBeaconActive: { type: Boolean, default: false },
  wardingShieldHitsRemaining: { type: Number, default: 0 },
  isEnemyVenomed: { type: Boolean, default: false },
  isEnemyBleeding: { type: Boolean, default: false },
  weaponAugment:  { type: String, default: "" },
  defenseAugment: { type: String, default: "" },
  bountyScrollActive: { type: Boolean, default: false },
  luckyFleeActive: { type: Boolean, default: false },
  hasStick: { type: Boolean, default: false },
  hasCoolerStick: { type: Boolean, default: false },
  hasEvenCoolerStick: { type: Boolean, default: false },
  scrapMetal: { type: Number, default: 0 },
  enrageCharges: { type: Number, default: 0 },
  victoryLoot: { type: String, default: "" },
  equippedWeaponId: { type: String, default: null },
  enemyIntents: { type: Array, default: () => [] },
  maxActionsPerTurn: { type: Number, default: 1 },
  combatInventory: { type: Object, default: () => ({}) },
  serratedDaggerActive: { type: Boolean, default: false },
  playerSelectedTarget: { type: Boolean, default: false },
});

const emit = defineEmits([
  "action",
  "confirm-turn",
  "defend",
  "flee",
  "special",
  "close",
  "option-chosen",
  "log-line",
  "show-tips",
  "use-compass",
  "open-hub",
  "switch-target",
]);

const { user: authUser, signIn, signUp, signOut } = useAuth();


const enemyThumbnailUrl = ref(null);
watch(() => props.formattedTitle, async (title) => {
  if (!title) return;
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const data = await res.json();
    enemyThumbnailUrl.value = data.thumbnail?.source ?? null;
  } catch {
    enemyThumbnailUrl.value = null;
  }
}, { immediate: true });

const showForm = ref(null);
const authEmail = ref("");
const authPassword = ref("");
const authError = ref("");
const authLoading = ref(false);
const authSuccess = ref("");

const userLabel = computed(() => authUser.value?.email?.split("@")[0] ?? "");

function toggleForm(mode) {
  showForm.value = showForm.value === mode ? null : mode;
  authEmail.value = "";
  authPassword.value = "";
  authError.value = "";
  authSuccess.value = "";
}

async function submitAuth() {
  if (!authEmail.value || !authPassword.value) {
    authError.value = "Email and password required.";
    return;
  }
  authLoading.value = true;
  authError.value = "";
  authSuccess.value = "";
  try {
    if (showForm.value === "signup") {
      const data = await signUp(authEmail.value, authPassword.value);
      if (data.session) { showForm.value = null; }
      else { authSuccess.value = "Check your email to confirm."; }
    } else {
      await signIn(authEmail.value, authPassword.value);
      showForm.value = null;
    }
  } catch (err) {
    authError.value = err.message ?? "Something went wrong.";
  } finally {
    authLoading.value = false;
  }
}

async function handleSignOutAuth() {
  await signOut();
}

const showStatusPopup = ref(false);

function closeStatusPopupOnOutsideClick(e) {
  if (!e.target.closest('.status-btn-wrapper')) {
    showStatusPopup.value = false;
  }
}


const AUGMENT_LABELS = {
  bleedEdge:    "Serrated Edge",
  venomCoat:    "Venom Coat",
  thunderstrike:"Thunderstrike Rune",
  emberTemper:  "Ember Temper",
  cursedRune:   "Cursed Rune",
  soulShard:    "Soul Shard",
  thornplate:   "Thornplate",
  stoneskin:    "Stoneskin",
  bloodpactRune:"Bloodpact Rune",
  ironWill:     "Iron Will",
  wardensWard:  "Warden's Ward",
  frostbound:   "Frostbound",
};

const augmentItemDesc = Object.fromEntries(
  shopItems.filter(i => i.details && i.description).map(i => [
    i.details,
    i.description.replace(/\s*Install at the Forge\.?/i, "").trim(),
  ])
);

function s(label, desc) { return { label, desc }; }

const activeStatuses = computed(() => {
  const list = [];
  const effects = props.enemyStatusEffects ?? [];

  // Player passives
  if (props.hasEvenCoolerStick) list.push(s("Even Cooler Stick", "+5 bonus to every dice roll."));
  else if (props.hasCoolerStick) list.push(s("Cooler Stick", "+2 bonus to every dice roll."));
  else if (props.hasStick) list.push(s("A Cool Stick", "Provides a small weapon bonus."));

  // Augments
  if (props.weaponAugment) list.push(s(
    `<i class="ra ra-sword"></i> ${AUGMENT_LABELS[props.weaponAugment] ?? props.weaponAugment}`,
    augmentItemDesc[props.weaponAugment] ?? "Weapon augment equipped."
  ));
  if (props.defenseAugment) list.push(s(
    `<i class="ra ra-shield"></i> ${AUGMENT_LABELS[props.defenseAugment] ?? props.defenseAugment}`,
    augmentItemDesc[props.defenseAugment] ?? "Defense augment equipped."
  ));
  if (props.equippedWeaponId) {
    const wep = getWeapon(props.equippedWeaponId);
    if (wep) list.push(s(`<i class="ra ra-sword"></i> ${wep.name}`, wep.description));
  }

  // Player status
  if (props.isBlurred)       list.push(s('<i class="ra ra-beer"></i> Drunk',    "Vision is blurred. Effects wear off over time."));
  if (props.isPlayerPoisoned) list.push(s('<i class="ra ra-venomous-snake"></i> Poisoned', "Taking 3 poison damage per turn until cured."));
  if (props.isCloakActive)   list.push(s('<i class="ra ra-angel-wings"></i> Cloaked',  "Invisible — enemies less likely to engage."));
  if (props.healthRegenActive) list.push(s('<i class="ra ra-leaf"></i> Regenerating', "Herbal Poultice active — restoring 1 HP per click."));
  if (props.wardingShieldHitsRemaining > 0) list.push(s(
    `<i class="ra ra-shield"></i> Warding Shield`,
    `Absorbs the next ${props.wardingShieldHitsRemaining} hit${props.wardingShieldHitsRemaining === 1 ? "" : "s"}.`
  ));
  if (props.bountyScrollActive) list.push(s('<i class="ra ra-scroll-unfurled"></i> Bounty Scroll', "Next combat victory drops double loot."));
  if (props.luckyFleeActive)    list.push(s('<i class="ra ra-clover"></i> Lucky Coin',    "Guaranteed successful flee ready."));
  if (props.encounterBeaconActive) list.push(s('<i class="ra ra-lantern-flame"></i> Encounter Beacon', "Next encounter will be a friendly NPC."));

  // Enemy conditions
  if (props.isEnemyVenomed)  list.push(s('<i class="ra ra-skull"></i> Venom Vial',     "Enemy is poisoned — taking damage each turn."));
  if (props.isEnemyBleeding) list.push(s('<i class="ra ra-dripping-blade"></i> Enemy Bleeding', "Enemy taking 2 bleed damage per turn."));
  if (effects.some(e => e.type === "fire"))   list.push(s('<i class="ra ra-fire"></i> Enemy on Fire',    "Enemy burning — 5 damage per turn."));
  if (effects.some(e => e.type === "weaken")) list.push(s('<i class="ra ra-aura"></i> Enemy Weakened',   "Enemy is weakened — dealing reduced damage."));
  if (effects.some(e => e.type === "chill"))  list.push(s('<i class="ra ra-snowflake"></i> Enemy Chilled',    "Enemy is chilled — reduced damage next hit."));

  return list;
});

const headerHeartCount = ref(0);
let headerHeartTimer = null;

function petDog() {
  headerHeartCount.value = 3;
  clearTimeout(headerHeartTimer);
  headerHeartTimer = setTimeout(() => { headerHeartCount.value = 0; }, 1500);
}

const dogPlusOneVisible = ref(false);
let dogPlusOneTimer = null;

watch(() => props.lastDamageDealt, (newVal) => {
  if (newVal !== null && newVal !== undefined && newVal > 0 && props.dogName) {
    dogPlusOneVisible.value = false;
    nextTick(() => {
      dogPlusOneVisible.value = true;
      clearTimeout(dogPlusOneTimer);
      dogPlusOneTimer = setTimeout(() => { dogPlusOneVisible.value = false; }, 1400);
    });
  }
});

const headerEl = ref(null);
const headerHeight = ref(300);
let headerResizeObserver = null;

onMounted(() => {
  if (headerEl.value) {
    headerHeight.value = headerEl.value.offsetHeight;
    headerResizeObserver = new ResizeObserver(() => {
      headerHeight.value = headerEl.value?.offsetHeight ?? 300;
    });
    headerResizeObserver.observe(headerEl.value);
  }
  document.addEventListener('click', closeStatusPopupOnOutsideClick);
  document.addEventListener('click', closeSlotMenuOnOutsideClick);
});

onUnmounted(() => {
  headerResizeObserver?.disconnect();
  document.removeEventListener('click', closeStatusPopupOnOutsideClick);
  document.removeEventListener('click', closeSlotMenuOnOutsideClick);
  if (playerHpAnimInterval) clearInterval(playerHpAnimInterval);
  if (enemyHpAnimInterval) clearInterval(enemyHpAnimInterval);
});

const displayedPlayerHP = ref(props.playerHP);
const displayedEnemyHP = ref(props.enemyHP ?? 0);
const isPlayerHpAnimating = ref(false);
const isEnemyHpAnimating = ref(false);
let playerHpAnimInterval = null;
let enemyHpAnimInterval = null;

watch(() => props.playerHP, (newVal, oldVal) => {
  if (newVal >= (oldVal ?? newVal) || !props.encounter || props.encounter.type !== "combat") {
    if (playerHpAnimInterval) { clearInterval(playerHpAnimInterval); playerHpAnimInterval = null; }
    isPlayerHpAnimating.value = false;
    displayedPlayerHP.value = newVal;
  }
});

watch(() => props.enemyHP, (newVal, oldVal) => {
  if ((newVal ?? 0) >= (oldVal ?? 0) || !props.encounter || props.encounter.type !== "combat") {
    if (enemyHpAnimInterval) { clearInterval(enemyHpAnimInterval); enemyHpAnimInterval = null; }
    isEnemyHpAnimating.value = false;
    displayedEnemyHP.value = newVal ?? 0;
  }
});

watch(() => props.lastDamageDealt, (newVal) => {
  if (newVal !== null && newVal !== undefined && newVal > 0) {
    if (enemyHpAnimInterval) clearInterval(enemyHpAnimInterval);
    const target = Math.max(props.enemyHP ?? 0, 0);
    displayedEnemyHP.value = target + newVal;
    isEnemyHpAnimating.value = true;
    enemyHpAnimInterval = setInterval(() => {
      if (displayedEnemyHP.value > target) {
        displayedEnemyHP.value--;
      } else {
        displayedEnemyHP.value = target;
        clearInterval(enemyHpAnimInterval);
        enemyHpAnimInterval = null;
        isEnemyHpAnimating.value = false;
      }
    }, 100);
  }
});

watch(() => props.lastDamageTaken, (newVal) => {
  if (newVal !== null && newVal !== undefined && newVal > 0) {
    if (playerHpAnimInterval) clearInterval(playerHpAnimInterval);
    const target = Math.max(props.playerHP, 0);
    displayedPlayerHP.value = target + newVal;
    isPlayerHpAnimating.value = true;
    playerHpAnimInterval = setInterval(() => {
      if (displayedPlayerHP.value > target) {
        displayedPlayerHP.value--;
      } else {
        displayedPlayerHP.value = target;
        clearInterval(playerHpAnimInterval);
        playerHpAnimInterval = null;
        isPlayerHpAnimating.value = false;
      }
    }, 100);
  }
});

const diceRollBadgeStyle = computed(() => ({
  bottom: `${headerHeight.value + 8 + 62}px`,
}));


const combatLocked = computed(() =>
  !!props.lastDiceRoll || props.lastDamageDealt !== null || props.lastDamageTaken !== null || props.enemyNextAction === "victory" || props.enemyNextAction === "fled"
);

const fleeQueued = computed(() => lockedActions.value.some(a => a.action === 'flee'));
const nonFleeQueued = computed(() => lockedActions.value.some(a => a.action !== 'flee'));
const braceQueued = computed(() => lockedActions.value.some(a => a.action === 'defend'));
const nonBraceQueued = computed(() => lockedActions.value.some(a => a.action !== 'defend'));
const smokeBombQueued = computed(() => lockedActions.value.some(a => a.action === 'use_item:smokeBomb'));
const nonSmokeBombQueued = computed(() => lockedActions.value.some(a => a.action !== 'use_item:smokeBomb'));
const specialQueued = computed(() => lockedActions.value.some(a => a.action === 'special'));
const exploitAlreadyQueued = computed(() => {
  const currentTarget = props.encounter?.targetIndex ?? 0;
  return lockedActions.value.some(a => a.action === 'exploit' && a.targetIndex === currentTarget);
});

const COUNTERABLE_LABELS = { steal: "Steal", enrage: "Enrage", confuse: "Confuse", summon: "Heal" };

const defendButtonLabel = computed(() => {
  const label = COUNTERABLE_LABELS[props.enemyNextAction];
  return label ? `Defend ${label}` : "Defend";
});

const enrageButtonLabel = computed(() => {
  const weapon = props.equippedWeaponId ? getWeapon(props.equippedWeaponId) : null;
  return weapon?.enrageLabel ?? weapon?.label ?? "Enrage";
});

const isWindUp = computed(() => {
  const threshold = Math.max(10, Math.floor((props.effectiveMaxHP ?? 50) * 0.15));
  // Sum damage from all attacking enemies (multi-enemy aware)
  const intents = props.enemyIntents;
  const totalIncoming = intents.length > 0
    ? intents.reduce((sum, intent) => {
        if (intent && (intent.action === "attack" || intent.action === "attack_power")) {
          return sum + (intent.damage ?? 0);
        }
        return sum;
      }, 0)
    : ((props.enemyNextAction === "attack" || props.enemyNextAction === "attack_power") ? (props.nextEnemyAttack ?? 0) : 0);
  return totalIncoming >= threshold;
});

const showExploit = computed(() =>
  props.enemyNextAction === "defend" || props.enemyNextAction === "trip"
);



const confusedActionLabel = computed(() => {
  const labels = { attack_steady: "Steady", attack_power: "Power", attack_enraged: "Enraged", defend: "Defend", special: props.playerClass?.special ?? "Special", flee: "Flee" };
  return props.confusedAction.map(a => labels[a] ?? a).join(" & ");
});

const activeAction = ref("");
const lockedActions = ref([]);
const noTargetNotice = ref(false);
let noTargetTimer = null;
const typedLine = ref("");
const typedGreeting = ref("");
let typeInterval = null;
const currentDialogueNodeId = ref(null);
const expanded = ref(false);
const visibleLogCount = ref(Math.min(props.gameLog?.length ?? 0, 3));
const newLineIds = ref([]);
const containerAnimClass = ref("");

const displayedLog = computed(() => {
  return expanded.value ? props.gameLog : props.gameLog.slice(-3);
});

const visibleLog = computed(() => {
  return displayedLog.value.slice(-visibleLogCount.value);
});

const logOpen = ref(false);
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
  const tier = props.specialTier ?? 1;
  const tierData = props.playerClass?.specialTiers?.[tier - 1];
  return tierData?.name ?? props.playerClass?.special ?? "Special";
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
  (newEncounter, oldEncounter) => {
    if (!newEncounter) {
      typedLine.value = "";
      typedGreeting.value = "";
      clearInterval(typeInterval);
      currentDialogueNodeId.value = null;
      return;
    }

    // Skip re-firing the combat message when just switching targets within the same group
    if (
      newEncounter?.type === "combat" &&
      oldEncounter?.type === "combat" &&
      newEncounter?.enemies != null &&
      newEncounter.enemies === oldEncounter?.enemies
    ) {
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
        fullText = `<i class="ra ra-skull"></i> <strong>BOSS ENCOUNTER:</strong> ${
          newEncounter.enemy.name ?? "Unknown Boss"
        }.<br><br>${
          newEncounter.enemy.message || "Prepare for the fight of your life."
        }`;
      } else if (newEncounter.enemy?.isMiniBoss) {
        fullText = `<i class="ra ra-explosion"></i> You've been attacked by the mini-boss <strong>${
          newEncounter.enemy.name ?? "Unknown Mini-Boss"
        }</strong> from <strong>${
          props.formattedTitle ?? "an unknown location"
        }</strong>. (HP: ${newEncounter.enemy.currentHP}) What do you do?`;
      } else {
        const _groupSize = newEncounter.enemies?.length ?? 1;
        const _enemyName = newEncounter.enemy.name ?? "Unknown Enemy";
        const _enemyLabel = _groupSize > 1 ? `${_enemyName}s` : _enemyName;
        let baseCombatMessage = `<i class="ra ra-plain-dagger"></i> You've been attacked by <strong>${
          props.formattedTitle ?? "an unknown location"
        }</strong> ${_enemyLabel}. (HP: ${newEncounter.enemy.currentHP}) What do you do?`;

        if (newEncounter.enemy?.message) {
          fullText = `${baseCombatMessage}<br><br>${newEncounter.enemy.message}`;
        } else {
          fullText = baseCombatMessage;
        }
      }
    } else {
      fullText = '<i class="ra ra-aware"></i> Unknown encounter type.';
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
  (newEncounter, oldEncounter) => {
    if (!newEncounter) {
      typedLine.value = "";
      typedGreeting.value = "";
      clearInterval(typeInterval);
      return;
    }

    // Skip re-firing the combat message when just switching targets within the same group
    if (
      newEncounter?.type === "combat" &&
      oldEncounter?.type === "combat" &&
      newEncounter?.enemies != null &&
      newEncounter.enemies === oldEncounter?.enemies
    ) {
      return;
    }

    let fullText = "";
    if (newEncounter.type === "npc" || newEncounter.type === "lore") {
      fullText = currentDialogue.value?.text || "";
    } else if (newEncounter.type === "combat") {
      if (newEncounter.enemy?.isBoss) {
        fullText = `<i class="ra ra-skull"></i> <strong>BOSS ENCOUNTER:</strong> ${
          newEncounter.enemy.name
        }.<br><br>${newEncounter.enemy.message || "Roll for damage."}`;
      } else if (newEncounter.enemy?.message) {
        fullText = newEncounter.enemy.message;
      } else {
        const _gs = newEncounter.enemies?.length ?? 1;
        const _en = newEncounter.enemy.name ?? "";
        const _el = _gs > 1 ? `${_en}s` : _en;
        fullText = `<i class="ra ra-plain-dagger"></i> You've been attacked by <strong>${props.formattedTitle}</strong> ${_el}. (HP: ${newEncounter.enemy.currentHP}) What do you do?`;
      }
    } else {
      fullText = '<i class="ra ra-aware"></i> Unknown encounter type.';
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

watch(() => props.encounter, () => {
  lockedActions.value = [];
});

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
  async (newLength) => {
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

  // Always queue — confirm button fires the turn
  if (lockedActions.value.length < props.maxActionsPerTurn) {
    const targetIndex = props.encounter?.targetIndex ?? 0;
    lockedActions.value = [...lockedActions.value, { action, targetIndex }];
  }
  setTimeout(() => { activeAction.value = ""; }, 300);
}

function confirmTurn() {
  if (lockedActions.value.length === 0) return;
  const toSubmit = [...lockedActions.value];
  lockedActions.value = [];
  emit("confirm-turn", toSubmit);
}

function actionSlotLabel(action) {
  const labels = {
    attack_steady: '<i class="ra ra-sword"></i> Steady',
    attack_power: '<i class="ra ra-explosion"></i> Power',
    attack_enraged: '<i class="ra ra-fire"></i> Enrage',
    special: "✦ Special",
    defend: '<i class="ra ra-shield"></i> Defend',
    exploit: '<i class="ra ra-lightning-bolt"></i> Exploit',
    flee: "↩ Flee",
    'use_item:sharedSufferingAmulet': '<i class="ra ra-broken-heart"></i> Amulet',
    'use_item:flashPowder': '<i class="ra ra-aura"></i> Flash',
    'use_item:venomVial': '<i class="ra ra-venomous-snake"></i> Venom',
    'use_item:serratedDagger': '<i class="ra ra-plain-dagger"></i> Dagger',
    'use_item:wardingShield': '<i class="ra ra-shield"></i> Ward Shield',
    'use_item:smokeBomb': '<i class="ra ra-poison-cloud"></i> Smoke',
  };
  return labels[action] ?? action;
}

// ── Action slot popup ─────────────────────────────────────────────────────
const openSlotIdx = ref(null);
const actionSlotsEl = ref(null);
const isBossEncounter = computed(() => props.encounter?.enemy?.isBoss === true);

const popupStyle = computed(() => {
  if (!actionSlotsEl.value || openSlotIdx.value === null) return {};
  const rect = actionSlotsEl.value.getBoundingClientRect();
  return {
    bottom: (window.innerHeight - rect.top + 8) + 'px',
    left: rect.left + 'px',
  };
});

const menuActions = computed(() => {
  const ca = props.confusedAction ?? [];
  return [
    {
      action: 'attack_steady',
      icon: '<i class="ra ra-sword"></i>',
      label: 'Steady',
      hint: '1× dmg',
      confused: ca.includes('attack_steady'),
      disabled: combatLocked.value || ca.includes('attack_steady') || fleeQueued.value || braceQueued.value || smokeBombQueued.value,
    },
    {
      action: 'attack_power',
      icon: '<i class="ra ra-explosion"></i>',
      label: 'Power',
      hint: '50% · 1.5×',
      confused: ca.includes('attack_power'),
      disabled: combatLocked.value || ca.includes('attack_power') || fleeQueued.value || braceQueued.value || smokeBombQueued.value,
    },
    {
      action: 'attack_enraged',
      icon: '<i class="ra ra-fire"></i>',
      label: enrageButtonLabel.value,
      hint: props.enrageCharges < 3 ? `${props.enrageCharges}/3` : '2× dmg',
      confused: ca.includes('attack_enraged'),
      disabled: combatLocked.value || ca.includes('attack_enraged') || props.enrageCharges < 3 || lockedActions.value.some(a => a.action === 'attack_enraged') || fleeQueued.value || braceQueued.value || smokeBombQueued.value,
    },
    {
      action: 'special',
      icon: '✦',
      label: playerSpecialAbilityName.value,
      hint: `${props.specialUsesLeft} left`,
      confused: ca.includes('special'),
      disabled: combatLocked.value || ca.includes('special') || fleeQueued.value || braceQueued.value || specialQueued.value || smokeBombQueued.value,
    },
    ...(showExploit.value ? [{
      action: 'exploit',
      icon: '<i class="ra ra-lightning-bolt"></i>',
      label: 'Exploit',
      hint: '1.5× · no guard',
      confused: false,
      disabled: combatLocked.value || fleeQueued.value || braceQueued.value || exploitAlreadyQueued.value || smokeBombQueued.value,
    }] : []),
    {
      action: 'defend',
      icon: '<i class="ra ra-shield"></i>',
      label: isWindUp.value ? 'BRACE!' : defendButtonLabel.value,
      hint: isWindUp.value ? 'Block it' : 'Half dmg',
      confused: ca.includes('defend'),
      disabled: combatLocked.value || ca.includes('defend') || nonBraceQueued.value || braceQueued.value || smokeBombQueued.value,
    },
    {
      action: 'flee',
      icon: '↩',
      label: 'Flee',
      hint: 'Roll to escape',
      confused: ca.includes('flee'),
      disabled: combatLocked.value || ca.includes('flee') || nonFleeQueued.value || smokeBombQueued.value,
    },
    // ── Combat items from inventory ──────────────────────────────────────
    ...(props.combatInventory.sharedSufferingAmulets > 0 ? [{
      action: 'use_item:sharedSufferingAmulet',
      icon: '<i class="ra ra-broken-heart"></i>',
      label: 'Shared Suffering',
      hint: `50 dmg · -25 HP  ×${props.combatInventory.sharedSufferingAmulets}`,
      confused: false,
      disabled: combatLocked.value || smokeBombQueued.value,
    }] : []),
    ...(props.combatInventory.flashPowders > 0 ? [{
      action: 'use_item:flashPowder',
      icon: '<i class="ra ra-aura"></i>',
      label: 'Flash Powder',
      hint: `Stun enemy  ×${props.combatInventory.flashPowders}`,
      confused: false,
      disabled: combatLocked.value || isBossEncounter.value || smokeBombQueued.value,
    }] : []),
    ...(props.combatInventory.venomVials > 0 ? [{
      action: 'use_item:venomVial',
      icon: '<i class="ra ra-venomous-snake"></i>',
      label: 'Venom Vial',
      hint: `Poison enemy  ×${props.combatInventory.venomVials}`,
      confused: false,
      disabled: combatLocked.value || smokeBombQueued.value,
    }] : []),
    ...(props.combatInventory.serratedDaggers > 0 ? [{
      action: 'use_item:serratedDagger',
      icon: '<i class="ra ra-plain-dagger"></i>',
      label: 'Serrated Dagger',
      hint: `Bleed effect  ×${props.combatInventory.serratedDaggers}`,
      confused: false,
      disabled: combatLocked.value || props.serratedDaggerActive || smokeBombQueued.value,
    }] : []),
    ...(props.combatInventory.wardingShields > 0 ? [{
      action: 'use_item:wardingShield',
      icon: '<i class="ra ra-shield"></i>',
      label: 'Warding Shield',
      hint: props.wardingShieldHitsRemaining > 0
        ? `Active · ${props.wardingShieldHitsRemaining} hits left`
        : `Half dmg · 3 hits  ×${props.combatInventory.wardingShields}`,
      confused: false,
      disabled: combatLocked.value || props.wardingShieldHitsRemaining > 0 || smokeBombQueued.value,
    }] : []),
    ...(props.combatInventory.smokeBombs > 0 ? [{
      action: 'use_item:smokeBomb',
      icon: '<i class="ra ra-poison-cloud"></i>',
      label: 'Smoke Bomb',
      hint: `Escape combat  ×${props.combatInventory.smokeBombs}`,
      confused: false,
      disabled: combatLocked.value || isBossEncounter.value || nonSmokeBombQueued.value,
    }] : []),
  ];
});

function onSlotClick(idx) {
  if (lockedActions.value[idx]) {
    lockedActions.value.splice(idx, 1);
    if (openSlotIdx.value === idx) openSlotIdx.value = null;
  } else {
    openSlotIdx.value = openSlotIdx.value === idx ? null : idx;
  }
}

function selectAction(action) {
  if (!props.playerSelectedTarget && action !== 'flee') {
    openSlotIdx.value = null;
    noTargetNotice.value = true;
    clearTimeout(noTargetTimer);
    noTargetTimer = setTimeout(() => { noTargetNotice.value = false; }, 2200);
    return;
  }
  handleAction(action);
  openSlotIdx.value = null;
}

function closeSlotMenuOnOutsideClick(e) {
  if (!e.target.closest('.action-slots') && !e.target.closest('.slot-action-menu')) {
    openSlotIdx.value = null;
  }
}




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
  font-family: "Roboto", sans-serif;
  font-optical-sizing: auto;
}
</style>
