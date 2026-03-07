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
@import "./styles/weatherOverlayStyles.css";
</style>
