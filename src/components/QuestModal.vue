<template>
  <div class="quest-overlay">
    <div class="transition-fade" :class="{ active: isTransitioning }"></div>
    <div class="quest-modal">

      <div class="quest-icon">🕯️</div>

      <div class="quest-title">The Growling Dark</div>

      <div class="quest-scene">{{ currentStep.scene }}</div>

      <div class="quest-choices">
        <button
          v-for="(choice, i) in currentStep.choices"
          :key="i"
          class="quest-choice-btn"
          @click="choose(choice)"
        >
          {{ choice.text }}
        </button>

        <button class="quest-leave-btn" @click="$emit('close')">
          ← Leave the cave
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { QUESTS } from "@/utils/quests.js";

const emit = defineEmits(["start-combat", "close"]);

const quest = QUESTS[0];
const stepIndex = ref(0);
const isTransitioning = ref(false);

const currentStep = ref(quest.steps[0]);

async function choose(choice) {
  if (choice.next === "combat") {
    emit("start-combat", quest.combatType);
    return;
  }

  if (choice.next === -1) {
    emit("close");
    return;
  }
  isTransitioning.value = true;
  await new Promise(r => setTimeout(r, 300));
  stepIndex.value = choice.next;
  currentStep.value = quest.steps[choice.next];
  await new Promise(r => setTimeout(r, 30));
  isTransitioning.value = false;
}
</script>

<style scoped>
@import "./styles/questModalStyles.css";
</style>
