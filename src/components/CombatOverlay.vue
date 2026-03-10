<template>
  <Transition name="combat-overlay">
    <div v-if="inEncounter" class="combat-backdrop" aria-hidden="true">
      <div class="scanlines"></div>
    </div>
  </Transition>
  <Transition name="combat-overlay">
    <div v-if="inEncounter" class="combat-overlay" aria-hidden="true">
      <div class="co-player-wrap" :class="{ 'img-flash--taken': flashType === 'taken' }">
        <img :src="playerImage" class="co-player" alt="" />
      </div>
      <div class="co-enemy-wrap" :class="{ 'img-flash--dealt': flashType === 'dealt' }">
        <img
          :src="thumbnailUrl ?? enemyPlaceholder"
          class="co-enemy"
          alt=""
          @error="thumbnailUrl = null"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const knightImg       = new URL("../assets/knight-img.jpg",        import.meta.url).href;
const paladinImg      = new URL("../assets/paladin-img.jpg",       import.meta.url).href;
const wizardImg       = new URL("../assets/wizard-img.jpg",        import.meta.url).href;
const rogueImg        = new URL("../assets/rogue-img.png",         import.meta.url).href;
const mundaneImg      = new URL("../assets/mundane-img.jpg",       import.meta.url).href;
const enemyPlaceholder = new URL("../assets/enemy-placeholder.png", import.meta.url).href;

const props = defineProps({
  inEncounter: Boolean,
  playerClass: Object,
  articleTitle: String,
  lastDamageDealt: { type: Number, default: null },
  lastDamageTaken: { type: Number, default: null },
});

const flashType = ref(null);
let flashTimer = null;

function triggerFlash(type) {
  flashType.value = type;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashType.value = null; }, 1400);
}

watch(() => props.lastDamageTaken, (val) => { if (val) triggerFlash("taken"); });
watch(() => props.lastDamageDealt, (val) => { if (val) triggerFlash("dealt"); });

const classImageMap = {
  Fighter: knightImg,
  Paladin: paladinImg,
  Wizard:  wizardImg,
  Rogue:   rogueImg,
  Mundane: mundaneImg,
};

const playerImage = computed(
  () => classImageMap[props.playerClass?.name] ?? knightImg
);

const thumbnailUrl = ref(null);

watch(
  () => props.articleTitle,
  async (title) => {
    if (!title) return;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      const data = await res.json();
      thumbnailUrl.value = data.thumbnail?.source ?? null;
    } catch {
      thumbnailUrl.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.12) 3px,
    #18272a 7px
  );
  animation: scanline-scroll 1s linear infinite;
  pointer-events: none;
}

@keyframes scanline-scroll {
  from { background-position: 0 0; }
  to   { background-position: 0 40px; }
}

.img-flash--taken,
.img-flash--dealt {
  animation: img-hit-pulse 1.4s ease-out forwards;
}

@keyframes img-hit-pulse {
  0%   { transform: scale(1);    box-shadow: 0 0 8px  4px  rgba(180, 20, 20, 0.6); }
  15%  { transform: scale(1.06); box-shadow: 0 0 24px 12px rgba(220, 0,  0,  0.95); }
  30%  { transform: scale(0.98); box-shadow: 0 0 18px 8px  rgba(200, 30, 10, 0.8); }
  50%  { transform: scale(1.03); box-shadow: 0 0 20px 10px rgba(160, 0,  0,  0.65); }
  70%  { transform: scale(1);    box-shadow: 0 0 14px 6px  rgba(140, 0,  0,  0.4); }
  100% { transform: scale(1);    box-shadow: 0 0 0px  0px  rgba(100, 0,  0,  0); }
}

.combat-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  background-color: #020202ec;
  z-index: 94;
  pointer-events: none;
}

.combat-overlay {
  position: fixed;
  bottom: clamp(260px, 60vh, 500px);
  left: 0;
  right: 0;
  height: clamp(160px, 28vh, 320px);
  pointer-events: none;
  z-index: 95;
  overflow: hidden;
}


.co-player-wrap {
  position: absolute;
  left: 25%;
  bottom: 0;
    border-radius: 50%;
  border: 5px solid rgb(4, 183, 238);
  overflow: hidden;
}

.co-enemy-wrap {
  position: absolute;
  right: 26%;
  bottom: 0;
  border-radius: 50%;
  border: 5px solid rgb(202, 17, 17);
  overflow: hidden;
}

.co-player {
  height: clamp(200px, 18vh, 220px);
  width: auto;
  object-fit: contain;
  opacity: 0.92;
  filter: drop-shadow(2px 0px 12px rgba(0, 0, 0, 0.7));
  border-radius: 50%;
}

.co-enemy {
  height: clamp(200px, 18vh, 200px);
  width: clamp(200px, 18vh, 200px);
  object-fit: cover;
  opacity: 0.88;
  filter: grayscale(100%) drop-shadow(-2px 0px 12px rgba(0, 0, 0, 0.7));
  border-radius: 50%;
}

@media screen and (max-width: 600px) {
  .combat-overlay { bottom: clamp(320px, 62vh, 600px); }
  .co-player-wrap { left: 5%; }
  .co-enemy-wrap  { right: 5%; }
  .co-player { height: clamp(70px, 20vh, 120px); }
  .co-enemy  { height: clamp(70px, 20vh, 120px); width: clamp(70px, 20vh, 120px); }
}

.combat-overlay-enter-active {
  animation: combat-slam 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.combat-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.combat-overlay-leave-to { opacity: 0; }

@keyframes combat-slam {
  0%   { opacity: 0; transform: scaleY(0) scaleX(1.1); }
  60%  { opacity: 1; transform: scaleY(1.06) scaleX(0.98); }
  80%  { transform: scaleY(0.97) scaleX(1.01); }
  100% { opacity: 1; transform: scaleY(1) scaleX(1); }
}

</style>
