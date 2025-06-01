<template>
  <div>
    <Header
  :start="chain[currentTargetIndex]"
  :targets="chain[currentTargetIndex + 1]"
  :clicks="clickCount"
  :path="path"
/>

    <p>Time: {{ formattedTimer }}</p>

    <VictoryModal
      v-if="isGameComplete"
      :clicks="clickCount"
      :path="path"
      :timer="formattedTimer"
      :targets="chain"
    />

    <ArticleViewer
      :articleTitle="current"
      @link-clicked="handleClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { getTodayChain } from '@/utils/dailyPair';
import ArticleViewer from '@/components/ArticleViewer.vue';
import Header from '@/components/Header.vue';
import VictoryModal from '@/components/VictoryModal.vue';

const chain = getTodayChain();
const currentTargetIndex = ref(0);

const current = ref(chain[0]);
const clickCount = ref(0);
const path = ref([current.value]);

const timer = ref(0);
let timerInterval;

const formattedTimer = computed(() => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const isGameComplete = computed(() => current.value === chain[chain.length - 1]);

function handleClick(title) {
  current.value = title;
  clickCount.value++;
  path.value.push(title);

  if (title === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
  }

  if (title === chain[chain.length - 1]) {
    clearInterval(timerInterval);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timerInterval);
});
</script>

