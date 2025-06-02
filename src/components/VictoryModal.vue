<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="nice-dude">Nice, Dude &#128512;</div>
      <div class="total-clicks">Total Clicks: {{ clicks }}</div>
      <div class="timer">Time: {{ timer }}</div>
      <div class="results-grid">
        <div class="results-path" v-for="step in formattedPath" :key="step">
          {{ step }}
        </div>
      </div>
      <button @click="share">Share</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['clicks', 'path', 'timer', 'targets']);
const formattedPath = computed(() =>
  props.path.map(step => step.replaceAll('_', ' '))
);

const share = () => {
  const colorPath = props.path.map(step =>
    props.targets.includes(step) ? '🟩' : '🟫'
  ).join('');

  const text = `Scenic Route: A Wiki Journey\n` +
               `Clicks: ${props.clicks}\n` +
               `Time: ${props.timer}\n` +
               `Path: ${colorPath}\n` +
               `https://scenicroute.mweatherford.rocks`;

  if (navigator.share) {
    navigator.share({ text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Result copied to clipboard!');
    });
  }
};

</script>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.results-path {
  font-size: 12px;
  background: #f0f0f0;
  padding: 0.4rem;
  border-radius: 4px;
  text-align: center;
}

button {
  margin: 1rem 0;
  padding: 0.6rem 1.2rem;
  font-size: 16px;
  border: none;
  background: #4caf50;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

.nice-dude {
  font-size: 30px;
  margin-bottom: 2rem;
}

.total-clicks {
font-size: 17px;
}

.timer {
  font-size: 15px;
}

button:hover {
  background: #45a047;
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
