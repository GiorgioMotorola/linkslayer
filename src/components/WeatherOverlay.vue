<template>
  <div v-if="weather === 'clear'" class="butterflies" aria-hidden="true">
    <div v-for="i in 3" :key="i" class="butterfly"><div class="inner">🦋</div></div>
  </div>
  <div v-else-if="weather === 'snow'" class="snowflakes" aria-hidden="true">
    <div v-for="i in 12" :key="i" class="snowflake"><div class="inner">❅</div></div>
  </div>
  <div v-else-if="weather === 'rain'" class="raindrops" aria-hidden="true">
    <div v-for="i in 16" :key="i" class="raindrop"><div class="inner">|</div></div>
  </div>
  <div v-else-if="weather === 'leaves'" class="leaffall" aria-hidden="true">
    <div v-for="i in 10" :key="i" class="leaf"><div class="inner">🍂</div></div>
  </div>
  <div v-else-if="weather === 'blossom'" class="blossomfall" aria-hidden="true">
    <div v-for="i in 10" :key="i" class="blossom"><div class="inner">🌸</div></div>
  </div>
</template>

<script setup>
defineProps({
  weather: { type: String, default: 'clear' },
});
</script>

<style scoped>
/* ── BUTTERFLIES (clear) ───────────────────────── */
@keyframes butterfly-cross {
  0%   { transform: translateX(-60px); }
  100% { transform: translateX(calc(100vw + 60px)); }
}
@keyframes butterfly-flutter {
  0%, 100% { transform: translateY(0); }
  25%       { transform: translateY(-14px); }
  75%       { transform: translateY(8px); }
}

.butterfly {
  position: fixed;
  left: 0;
  z-index: 50;
  user-select: none;
  pointer-events: none;
  animation: butterfly-cross ease-in-out infinite;
}
.butterfly .inner {
  animation: butterfly-flutter ease-in-out infinite;
  font-size: 1.1em;
  opacity: 0.8;
}

.butterfly:nth-child(1) { top: 8%; animation-duration: 40s; animation-delay:  0s; } .butterfly:nth-child(1) .inner { animation-duration: 1.4s; }
.butterfly:nth-child(2) { top: 10%; animation-duration: 55s; animation-delay: 11s; } .butterfly:nth-child(2) .inner { animation-duration: 1.1s; }
.butterfly:nth-child(3) { top: 12%; animation-duration: 45s; animation-delay:  6s; } .butterfly:nth-child(3) .inner { animation-duration: 1.6s; }

/* ── SNOW ─────────────────────────────────────── */
@keyframes snowflakes-fall {
  0%   { transform: translateY(0); }
  100% { transform: translateY(110vh); }
}
@keyframes snowflakes-shake {
  0%, 100% { transform: translateX(0); }
  50%       { transform: translateX(80px); }
}

.snowflake {
  position: fixed;
  top: -10%;
  z-index: 50;
  user-select: none;
  pointer-events: none;
  animation: snowflakes-shake 3s ease-in-out infinite;
}
.snowflake .inner {
  animation: snowflakes-fall 10s linear infinite;
  color: #fff;
  font-size: 1em;
  text-shadow: 0 0 5px #000;
}

.snowflake:nth-child(1)  { left:  1%; animation-delay:   0s; } .snowflake:nth-child(1)  .inner { animation-delay:   0s; }
.snowflake:nth-child(2)  { left: 10%; animation-delay:   1s; } .snowflake:nth-child(2)  .inner { animation-delay:   1s; }
.snowflake:nth-child(3)  { left: 20%; animation-delay: 0.5s; } .snowflake:nth-child(3)  .inner { animation-delay:   6s; }
.snowflake:nth-child(4)  { left: 30%; animation-delay:   2s; } .snowflake:nth-child(4)  .inner { animation-delay:   4s; }
.snowflake:nth-child(5)  { left: 40%; animation-delay:   2s; } .snowflake:nth-child(5)  .inner { animation-delay:   2s; }
.snowflake:nth-child(6)  { left: 50%; animation-delay:   3s; } .snowflake:nth-child(6)  .inner { animation-delay:   8s; }
.snowflake:nth-child(7)  { left: 60%; animation-delay:   2s; } .snowflake:nth-child(7)  .inner { animation-delay: 2.5s; }
.snowflake:nth-child(8)  { left: 70%; animation-delay:   1s; } .snowflake:nth-child(8)  .inner { animation-delay:   1s; }
.snowflake:nth-child(9)  { left: 80%; animation-delay:   0s; } .snowflake:nth-child(9)  .inner { animation-delay:   0s; }
.snowflake:nth-child(10) { left: 90%; animation-delay: 1.5s; } .snowflake:nth-child(10) .inner { animation-delay:   3s; }
.snowflake:nth-child(11) { left: 25%; animation-delay:   0s; } .snowflake:nth-child(11) .inner { animation-delay:   4s; }
.snowflake:nth-child(12) { left: 65%; animation-delay: 2.5s; } .snowflake:nth-child(12) .inner { animation-delay: 2.5s; }

/* ── RAIN ─────────────────────────────────────── */
@keyframes rain-fall {
  0%   { transform: translateY(0); }
  100% { transform: translateY(110vh); }
}
@keyframes rain-shake {
  0%, 100% { transform: translateX(0); }
  50%       { transform: translateX(12px); }
}

.raindrop {
  position: fixed;
  top: -10%;
  z-index: 50;
  user-select: none;
  pointer-events: none;
  animation: rain-shake 1.5s ease-in-out infinite;
}
.raindrop .inner {
  animation: rain-fall 1.8s linear infinite;
  color: rgba(130, 170, 230, 0.75);
  font-size: 1.4em;
  font-family: Arial, sans-serif;
  text-shadow: 0 0 3px rgba(100, 150, 220, 0.5);
  font-weight: 100;
  letter-spacing: 0;
}

.raindrop:nth-child(1)  { left:  3%; animation-delay:   0s; } .raindrop:nth-child(1)  .inner { animation-delay:   0s; }
.raindrop:nth-child(2)  { left:  9%; animation-delay: 0.3s; } .raindrop:nth-child(2)  .inner { animation-delay: 0.5s; }
.raindrop:nth-child(3)  { left: 16%; animation-delay: 0.8s; } .raindrop:nth-child(3)  .inner { animation-delay: 1.2s; }
.raindrop:nth-child(4)  { left: 23%; animation-delay: 0.2s; } .raindrop:nth-child(4)  .inner { animation-delay: 0.4s; }
.raindrop:nth-child(5)  { left: 31%; animation-delay: 1.1s; } .raindrop:nth-child(5)  .inner { animation-delay: 0.8s; }
.raindrop:nth-child(6)  { left: 38%; animation-delay: 0.5s; } .raindrop:nth-child(6)  .inner { animation-delay: 1.5s; }
.raindrop:nth-child(7)  { left: 45%; animation-delay: 0.9s; } .raindrop:nth-child(7)  .inner { animation-delay: 0.2s; }
.raindrop:nth-child(8)  { left: 52%; animation-delay:   0s; } .raindrop:nth-child(8)  .inner { animation-delay: 1.0s; }
.raindrop:nth-child(9)  { left: 59%; animation-delay: 0.7s; } .raindrop:nth-child(9)  .inner { animation-delay: 0.6s; }
.raindrop:nth-child(10) { left: 67%; animation-delay: 0.4s; } .raindrop:nth-child(10) .inner { animation-delay: 1.3s; }
.raindrop:nth-child(11) { left: 74%; animation-delay: 1.3s; } .raindrop:nth-child(11) .inner { animation-delay: 0.1s; }
.raindrop:nth-child(12) { left: 81%; animation-delay: 0.6s; } .raindrop:nth-child(12) .inner { animation-delay: 0.9s; }
.raindrop:nth-child(13) { left: 87%; animation-delay:   0s; } .raindrop:nth-child(13) .inner { animation-delay: 1.7s; }
.raindrop:nth-child(14) { left: 93%; animation-delay: 1.0s; } .raindrop:nth-child(14) .inner { animation-delay: 0.3s; }
.raindrop:nth-child(15) { left: 13%; animation-delay: 0.2s; } .raindrop:nth-child(15) .inner { animation-delay: 1.1s; }
.raindrop:nth-child(16) { left: 56%; animation-delay: 0.8s; } .raindrop:nth-child(16) .inner { animation-delay: 0.7s; }

/* ── LEAVES ───────────────────────────────────── */
@keyframes leaves-fall {
  0%   { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(110vh) rotate(360deg); }
}
@keyframes leaves-shake {
  0%, 100% { transform: translateX(0); }
  33%       { transform: translateX(120px); }
  66%       { transform: translateX(-40px); }
}

.leaf {
  position: fixed;
  top: -10%;
  z-index: 50;
  user-select: none;
  pointer-events: none;
  animation: leaves-shake 5s ease-in-out infinite;
}
.leaf .inner {
  animation: leaves-fall 9s linear infinite;
  font-size: 1.3em;
  opacity: 0.85;
}

.leaf:nth-child(1)  { left:  5%; animation-delay:   0s; } .leaf:nth-child(1)  .inner { animation-delay:   0s; }
.leaf:nth-child(2)  { left: 14%; animation-delay: 1.5s; } .leaf:nth-child(2)  .inner { animation-delay: 2.0s; }
.leaf:nth-child(3)  { left: 24%; animation-delay: 0.5s; } .leaf:nth-child(3)  .inner { animation-delay: 5.0s; }
.leaf:nth-child(4)  { left: 35%; animation-delay: 3.0s; } .leaf:nth-child(4)  .inner { animation-delay: 3.5s; }
.leaf:nth-child(5)  { left: 47%; animation-delay: 1.0s; } .leaf:nth-child(5)  .inner { animation-delay: 7.0s; }
.leaf:nth-child(6)  { left: 57%; animation-delay: 2.5s; } .leaf:nth-child(6)  .inner { animation-delay: 1.5s; }
.leaf:nth-child(7)  { left: 68%; animation-delay: 0.8s; } .leaf:nth-child(7)  .inner { animation-delay: 4.0s; }
.leaf:nth-child(8)  { left: 77%; animation-delay: 2.0s; } .leaf:nth-child(8)  .inner { animation-delay: 2.5s; }
.leaf:nth-child(9)  { left: 86%; animation-delay: 0.3s; } .leaf:nth-child(9)  .inner { animation-delay: 6.5s; }
.leaf:nth-child(10) { left: 95%; animation-delay: 1.8s; } .leaf:nth-child(10) .inner { animation-delay: 3.0s; }

/* ── CHERRY BLOSSOMS ──────────────────────────── */
@keyframes blossom-fall {
  0%   { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(110vh) rotate(270deg); }
}
@keyframes blossom-drift {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(60px); }
  75%       { transform: translateX(-30px); }
}

.blossom {
  position: fixed;
  top: -10%;
  z-index: 50;
  user-select: none;
  pointer-events: none;
  animation: blossom-drift 6s ease-in-out infinite;
}
.blossom .inner {
  animation: blossom-fall 11s linear infinite;
  font-size: 1.1em;
  opacity: 0.9;
}

.blossom:nth-child(1)  { left:  4%; animation-delay:   0s; } .blossom:nth-child(1)  .inner { animation-delay:   0s; }
.blossom:nth-child(2)  { left: 13%; animation-delay: 2.0s; } .blossom:nth-child(2)  .inner { animation-delay: 3.0s; }
.blossom:nth-child(3)  { left: 26%; animation-delay: 0.5s; } .blossom:nth-child(3)  .inner { animation-delay: 6.0s; }
.blossom:nth-child(4)  { left: 38%; animation-delay: 3.5s; } .blossom:nth-child(4)  .inner { animation-delay: 1.5s; }
.blossom:nth-child(5)  { left: 50%; animation-delay: 1.0s; } .blossom:nth-child(5)  .inner { animation-delay: 8.0s; }
.blossom:nth-child(6)  { left: 61%; animation-delay: 2.5s; } .blossom:nth-child(6)  .inner { animation-delay: 4.5s; }
.blossom:nth-child(7)  { left: 72%; animation-delay: 0.8s; } .blossom:nth-child(7)  .inner { animation-delay: 2.0s; }
.blossom:nth-child(8)  { left: 81%; animation-delay: 4.0s; } .blossom:nth-child(8)  .inner { animation-delay: 5.5s; }
.blossom:nth-child(9)  { left: 89%; animation-delay: 1.5s; } .blossom:nth-child(9)  .inner { animation-delay: 7.0s; }
.blossom:nth-child(10) { left: 96%; animation-delay: 3.0s; } .blossom:nth-child(10) .inner { animation-delay: 1.0s; }
</style>
