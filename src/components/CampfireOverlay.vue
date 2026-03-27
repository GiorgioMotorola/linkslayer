<template>
  <div class="campfire-overlay">
    <div class="campfire-glow"></div>
    <div class="campfire-glow-inner"></div>

    <div class="campfire-card">
      <div class="campfire-name">{{ reward.name }}</div>
      <div class="campfire-fire"><i class="ra ra-fire ra-2x"></i></div>
      <p class="campfire-tagline">Sit at the fire for a minute.</p>
      <button
        v-if="rested"
        class="campfire-continue-btn"
        @click="$emit('done', reward)"
      >
        Rise and continue
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

defineProps({
  reward: { type: Object, required: true },
});

defineEmits(["done"]);

const rested = ref(false);
let timer = null;

onMounted(() => {
  timer = setTimeout(() => {
    rested.value = true;
  }, 60000);
});

onUnmounted(() => {
  clearTimeout(timer);
});
</script>

<style scoped>
@import "./styles/campfireOverlayStyles.css";
</style>
