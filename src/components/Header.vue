<template>
  <header>
    <div class="path"><span style="font-weight: 500; color: #0645ad;">{{ formattedStart }}</span> → {{ formattedTarget }}</div>
    <div class="clicks">Clicks: {{ clicks }}</div>
    <div class="current-path">{{ formattedPath }}</div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  start: String,
  targets: String,
  clicks: Number,
  path: Array,
});


const formattedStart = computed(() =>
  props.start?.toString().replaceAll('_', ' ') ?? ''
);

const formattedTarget = computed(() =>
  props.targets?.toString().replaceAll('_', ' ') ?? ''
);

const formattedPath = computed(() =>
  (props.path || []).map(step => step.replaceAll('_', ' ')).join(' → ')
);
</script>

<style>
.path {
  font-size: 35px;
  text-align: center;
  margin-bottom: 2rem;
}

.clicks {
  font-size: 20px;
}

.current-path {
  margin-top: 1rem;
  font-style: italic;
  font-size: 16px;
  color: #555;
  text-align: center;
}
</style>
