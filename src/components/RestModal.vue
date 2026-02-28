<template>
  <div class="rest-overlay" :class="shouldShowLongRest ? 'overlay-night' : 'overlay-campfire'" v-if="props.showRestModal">
    <div class="rest-modal" :class="shouldShowLongRest ? 'modal-night' : 'modal-campfire'">

      <div class="rest-icon">{{ shouldShowLongRest ? '🌙' : '🔥' }}</div>
      <div class="rest-modal-phrase">{{ currentRestPhrase }}</div>

      <div v-if="shouldShowLongRest" class="danger-warning">
        ⚠️ The wilderness grows uneasy. Whatever you choose here, enemies will grow stronger.
      </div>

      <div class="rest-options">
        <button
          v-if="shouldShowShortRest"
          @click="handleRestChoice('short')"
          :disabled="props.shortRestsUsed >= 4"
        >
          Short Rest (+20 HP)
        </button>
        <button
          v-if="shouldShowShortRest && props.specialTier < 3"
          @click="handleOffer"
          :disabled="hasOfferedThisRest || props.playerGold < props.nextOfferingCost"
          class="offering-button"
        >
          <span class="offering-main">🙏 Offer {{ props.nextOfferingCost }}g to the Gods — upgrade your Special</span>
          <span class="offering-sub">
            Offering bowl:
            <span
              v-for="i in 3"
              :key="i"
              class="pot-dot"
              :class="{ filled: i <= props.offeringPot }"
            >{{ i <= props.offeringPot ? '●' : '○' }}</span>
            {{ props.offeringPot }}/3
            <span v-if="props.specialTier === 1"> — Tier 1 → 2</span>
            <span v-if="props.specialTier === 2"> — Tier 2 → 3</span>
          </span>
        </button>
        <button v-if="shouldShowLongRest" @click="handleRestChoice('long')">
          Long Rest (Restores HP to full, +1 class ability)
        </button>
        <button
          @click="handleAssemble('weapon')"
          :disabled="(props.weaponPieces || 0) < 2"
        >
          Assemble Weapon Upgrade (You have {{ props.weaponPieces || 0 }}. You
          need at least 2 pieces to upgrade.)
        </button>
        <button
          @click="handleAssemble('defense')"
          :disabled="(props.defensePieces || 0) < 2"
        >
          Assemble Defense Upgrade (You have {{ props.defensePieces || 0 }}. You
          need at least 2 pieces to upgrade.)
        </button>
        <button @click="handleRestChoice('continue')">Continue Journey</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, computed } from "vue";
import { getRandomRestPhrase } from "../utils/restPhrases.js";

const props = defineProps({
  showRestModal: Boolean,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  weaponPieces: { type: Number, default: 0 },
  defensePieces: { type: Number, default: 0 },
  restModalCount: Number,
  specialTier: { type: Number, default: 1 },
  offeringPot: { type: Number, default: 0 },
  playerGold: { type: Number, default: 0 },
  nextOfferingCost: { type: Number, default: 10 },
});

const currentRestPhrase = ref("");
const hasOfferedThisRest = ref(false);

watch(
  () => props.showRestModal,
  (newValue) => {
    if (newValue) {
      currentRestPhrase.value = getRandomRestPhrase();
      hasOfferedThisRest.value = false;
    }
  },
  { immediate: true }
);

const emit = defineEmits(["rest", "assemble-upgrade", "offer"]);

const handleRestChoice = (choice) => {
  emit("rest", choice);
};

const handleAssemble = (type) => {
  emit("assemble-upgrade", type);
};

const handleOffer = () => {
  hasOfferedThisRest.value = true;
  emit("offer");
};

const shouldShowLongRest = computed(() => {
  return props.restModalCount % 2 === 0;
});

const shouldShowShortRest = computed(() => {
  return props.restModalCount % 2 !== 0;
});
</script>

<style scoped>
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

/* ── Shared overlay ─────────────────────────────────────── */
.rest-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  animation: fade-in-overlay 1.25s ease-out forwards;
}

@keyframes fade-in-overlay {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Campfire overlay ───────────────────────────────────── */
.overlay-campfire {
  background: linear-gradient(
    to bottom,
    rgba(18, 8, 2, 0.93),
    rgba(38, 18, 6, 0.9),
    rgba(22, 10, 3, 0.78)
  );
}

/* ── Night sky overlay ──────────────────────────────────── */
.overlay-night {
  background:
    radial-gradient(ellipse at 20% 15%, rgba(255,255,200,0.07) 1px, transparent 1px),
    radial-gradient(ellipse at 55% 8%,  rgba(255,255,200,0.06) 1px, transparent 1px),
    radial-gradient(ellipse at 78% 20%, rgba(255,255,200,0.05) 1px, transparent 1px),
    radial-gradient(ellipse at 35% 30%, rgba(255,255,200,0.04) 1px, transparent 1px),
    radial-gradient(ellipse at 88% 12%, rgba(255,255,200,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(4,6,22,0.96), rgba(8,12,38,0.93), rgba(6,9,28,0.82));
}

/* ── Shared modal card ──────────────────────────────────── */
.rest-modal {
  padding: 2rem;
  border-radius: 12px;
  text-align: start;
  max-width: 700px;
  width: 90%;
  animation: pop-in 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

@keyframes pop-in {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

/* ── Campfire modal ─────────────────────────────────────── */
.modal-campfire {
  background: rgba(28, 12, 4, 0.88);
  border: 1px solid rgba(200, 95, 18, 0.55);
  box-shadow: 0 0 35px rgba(200, 95, 18, 0.18), 0 8px 28px rgba(0,0,0,0.65);
}

.modal-campfire .rest-modal-phrase {
  border-bottom-color: rgba(200, 95, 18, 0.4);
}

.modal-campfire button {
  border-color: rgba(170, 80, 15, 0.5);
  background: rgba(38, 16, 4, 0.65);
  color: #e8c890;
}

.modal-campfire button:hover:not(:disabled) {
  background: rgba(180, 85, 15, 0.22);
  border-color: rgba(230, 130, 35, 0.75);
  color: #f5d898;
  opacity: 1;
}

/* ── Night sky modal ────────────────────────────────────── */
.modal-night {
  background: rgba(6, 10, 32, 0.9);
  border: 1px solid rgba(80, 105, 210, 0.5);
  box-shadow: 0 0 45px rgba(55, 80, 190, 0.18), 0 8px 28px rgba(0,0,0,0.75);
}

.modal-night .rest-modal-phrase {
  border-bottom-color: rgba(80, 105, 210, 0.4);
}

.modal-night button {
  border-color: rgba(70, 95, 190, 0.45);
  background: rgba(10, 15, 45, 0.65);
  color: #b0c4f0;
}

.modal-night button:hover:not(:disabled) {
  background: rgba(60, 85, 190, 0.22);
  border-color: rgba(110, 140, 230, 0.7);
  color: #ccdaff;
  opacity: 1;
}

/* ── Rest icon ──────────────────────────────────────────── */
.rest-icon {
  font-size: 38px;
  text-align: center;
}

@keyframes flicker {
  0%,100% { transform: scale(1)    rotate(-1deg); filter: drop-shadow(0 0 6px rgba(255,140,20,0.7)); }
  25%     { transform: scale(1.08) rotate(2deg);  filter: drop-shadow(0 0 12px rgba(255,160,30,0.9)); }
  50%     { transform: scale(0.95) rotate(-1deg); filter: drop-shadow(0 0 4px rgba(220,100,10,0.6)); }
  75%     { transform: scale(1.05) rotate(1deg);  filter: drop-shadow(0 0 10px rgba(255,150,25,0.8)); }
}

.modal-campfire .rest-icon {
  animation: flicker 2.2s ease-in-out infinite;
}

@keyframes moon-float {
  0%,100% { transform: translateY(0);    filter: drop-shadow(0 0 8px rgba(140,165,255,0.65)); }
  50%     { transform: translateY(-5px); filter: drop-shadow(0 0 14px rgba(160,185,255,0.85)); }
}

.modal-night .rest-icon {
  animation: moon-float 3.5s ease-in-out infinite;
}

/* ── Shared phrase / text ───────────────────────────────── */
.rest-modal-phrase {
  text-align: center;
  font-size: 18px;
  color: rgb(214, 215, 216);
  border-bottom: 1px solid rgba(150, 150, 150, 0.35);
  padding-bottom: 1.2rem;
}

/* ── Shared button base ─────────────────────────────────── */
button {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  text-align: start;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  position: relative;
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.4);
}

button:disabled::after {
  content: '🚫';
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1em;
  opacity: 0.7;
}

button:disabled:hover {
  cursor: not-allowed;
  opacity: 0.35;
}

/* ── Offering button ────────────────────────────────────── */
.offering-button {
  gap: 0.3rem;
}

.offering-main {
  font-weight: 500;
}

.offering-sub {
  font-size: 0.85em;
  opacity: 0.75;
  letter-spacing: 0.02em;
}

.pot-dot {
  margin: 0 1px;
}

.pot-dot.filled {
  opacity: 1;
}

/* ── Danger warning ─────────────────────────────────────── */
.danger-warning {
  color: #e08050;
  font-size: 15px;
  border: 1px solid #7a3a1a;
  border-radius: 6px;
  padding: 0.5rem 0.8rem;
  background: rgba(100, 40, 10, 0.25);
}

/* ── Layout ─────────────────────────────────────────────── */
.rest-options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
}

/* ── Mobile ─────────────────────────────────────────────── */
@media screen and (max-width: 600px) {
  .rest-overlay {
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 0.75rem 0.5rem;
    box-sizing: border-box;
  }

  .rest-modal {
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
    gap: 0.6rem;
  }

  .rest-icon {
    font-size: 28px;
  }

  .rest-modal-phrase {
    font-size: 15px;
    padding-bottom: 0.8rem;
  }

  button {
    font-size: 13px;
    padding: 0.6rem 0.8rem;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .rest-options {
    gap: 1.2rem;
    margin-bottom: 0.5rem;
  }
}
</style>
