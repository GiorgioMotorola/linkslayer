<template>
  <div class="rest-overlay">
    <div class="rest-modal">
      <h2>What a beautiful spot to rest for the day</h2>
      <p>Take a rest?</p>
      <button @click="$emit('rest', 'short')" :disabled="shortRestsUsed >= 4">
        Short Rest (+5 HP)
      </button>
      <button @click="$emit('rest', 'long')" :disabled="longRestsUsed >= 2">
        Long Rest (+10 HP)
      </button>
      <button @click="$emit('rest', 'continue')">Continue On (0 HP)</button>
    </div>
  </div>
</template>

<script setup>
defineProps(["shortRestsUsed", "longRestsUsed"]);
defineEmits(["rest"]);
</script>

<style scoped>
.rest-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 10, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.rest-modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
  z-index: 1000;
}

@keyframes pop-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
