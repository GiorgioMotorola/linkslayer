<!-- components/DefeatModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="defeat-text">You Died 💀</div>
      <div class="stats">
        <div>Total Clicks: {{ clicks }}</div>
        <div>Time: {{ timer }}</div>
      </div>
      <div class="results-grid">
        <div class="results-path" v-for="step in formattedPath" :key="step">
          {{ step }}
        </div>
      </div>
      <button @click="share">Share</button>
      <button @click="reloadPage">Play Again</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps(["clicks", "path", "timer"]);

const formattedPath = computed(() =>
  props.path.map((step) => step.replaceAll("_", " "))
);

function share() {
  const colorPath = props.path.map(() => "☠️").join("");
  const text =
    `💀 Deathlog 💀\n` +
    `Clicks: ${props.clicks}\n` +
    `Time: ${props.timer}\n` +
    `Path: ${colorPath}\n` +
    `https://scenicroute.mweatherford.rocks`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Death log copied to clipboard!");
    });
  } else {
    alert("Clipboard not supported.");
  }
}

function reloadPage() {
  window.location.reload();
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-start; /* align to top instead of center */
  justify-content: center;
  padding-top: 0vh; /* add some space from top, vh means viewport height */
  z-index: 1000;
}


.modal-content {
  background: #1a1a1a;
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  animation: pop-in 0.3s ease;
}

.defeat-text {
  font-size: 28px;
  margin-bottom: 1rem;
  color: #ff4d4d;
}

.stats {
  font-size: 16px;
  margin-bottom: 1rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.results-path {
  font-size: 12px;
  background: #333;
  padding: 0.4rem;
  border-radius: 4px;
  text-align: center;
}

button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  font-size: 14px;
  border: none;
  background: #d9534f;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

button:hover {
  background: #c9302c;
}
</style>
