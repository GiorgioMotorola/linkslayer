<template>
  <div class="quest-overlay">
    <div class="transition-fade" :class="{ active: isTransitioning }"></div>
    <div class="quest-modal">

      <div class="quest-header">
        <div class="quest-icon" v-html="props.quest.icon"></div>
        <div class="quest-title">{{ props.quest.name }}</div>
      </div>

      <div class="quest-scene">{{ currentStep.scene }}</div>

      <div class="quest-choices">
        <button
          v-for="(choice, i) in currentStep.choices"
          :key="i"
          class="quest-choice-btn"
          @click="choose(choice)"
        >
          ▸ {{ choice.text }}
        </button>

        <button class="quest-leave-btn" @click="$emit('leave')">
          ← Turn back
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  quest:     { type: Object, required: true },
  startStep: { type: Number, default: 0 },
});

const emit = defineEmits(["start-combat", "complete", "leave"]);

const isTransitioning = ref(false);
const currentStep = ref(props.quest.steps[props.startStep]);

watch(() => props.startStep, (s) => {
  currentStep.value = props.quest.steps[s];
});

async function choose(choice) {
  if (choice.next === "combat") {
    emit("start-combat", props.quest.combatType);
    return;
  }
  if (choice.next === "complete") {
    emit("complete");
    return;
  }
  if (choice.next === -1) {
    emit("leave");
    return;
  }
  isTransitioning.value = true;
  await new Promise(r => setTimeout(r, 300));
  currentStep.value = props.quest.steps[choice.next];
  await new Promise(r => setTimeout(r, 30));
  isTransitioning.value = false;
}
</script>

<style scoped>
@import "./styles/questModalStyles.css";
</style>
