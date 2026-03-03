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

  // Animate transition to next step
  isTransitioning.value = true;
  await new Promise(r => setTimeout(r, 300));
  stepIndex.value = choice.next;
  currentStep.value = quest.steps[choice.next];
  await new Promise(r => setTimeout(r, 30));
  isTransitioning.value = false;
}
</script>

<style scoped>
* {
  font-family: "IBM Plex Sans", sans-serif;
}

.quest-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  animation: fade-in-overlay 1s ease-out forwards;
  background:
    radial-gradient(ellipse at 25% 20%, rgba(255,200,80,0.06) 1px, transparent 1px),
    radial-gradient(ellipse at 70% 10%, rgba(255,200,80,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(6, 4, 2, 0.97), rgba(12, 8, 3, 0.95), rgba(8, 5, 2, 0.88));
}

@keyframes fade-in-overlay {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.quest-modal {
  padding: 2rem;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  background: rgba(14, 9, 3, 0.92);
  border: 1px solid rgba(160, 100, 20, 0.45);
  box-shadow: 0 0 40px rgba(140, 80, 10, 0.14), 0 8px 28px rgba(0, 0, 0, 0.75);
  animation: pop-in 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  position: relative;
}

@keyframes pop-in {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.quest-icon {
  font-size: 36px;
  text-align: center;
  animation: candle-flicker 2.4s ease-in-out infinite;
}

@keyframes candle-flicker {
  0%,100% { transform: scale(1)    rotate(-1deg); filter: drop-shadow(0 0 5px rgba(255,160,30,0.6)); }
  30%     { transform: scale(1.06) rotate(1deg);  filter: drop-shadow(0 0 10px rgba(255,180,40,0.8)); }
  60%     { transform: scale(0.96) rotate(-1deg); filter: drop-shadow(0 0 3px rgba(220,110,10,0.5)); }
}

.quest-title {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(200, 140, 40, 0.7);
  border-bottom: 1px solid rgba(160, 100, 20, 0.35);
  padding-bottom: 0.8rem;
}

.quest-scene {
  font-size: 17px;
  line-height: 1.7;
  color: rgb(210, 205, 195);
  border-bottom: 1px solid rgba(160, 100, 20, 0.2);
  padding-bottom: 1rem;
}

.quest-choices {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.quest-choice-btn {
  display: block;
  width: 100%;
  text-align: start;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  border: 1px solid rgba(150, 95, 18, 0.5);
  background: rgba(30, 16, 4, 0.65);
  color: #e8c890;
  transition: all 0.15s ease-in-out;
}

.quest-choice-btn:hover {
  background: rgba(165, 100, 18, 0.22);
  border-color: rgba(210, 140, 35, 0.75);
  color: #f5d898;
}

.quest-leave-btn {
  display: block;
  width: 100%;
  text-align: start;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid rgba(110, 70, 12, 0.4);
  background: transparent;
  color: rgba(180, 130, 50, 0.65);
  transition: all 0.15s ease-in-out;
  margin-top: 0.3rem;
}

.quest-leave-btn:hover {
  color: rgba(210, 160, 70, 0.9);
  border-color: rgba(150, 100, 20, 0.6);
}

/* ── Cross-fade transition overlay ─────────────────────── */
.transition-fade {
  position: absolute;
  inset: 0;
  background: black;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1002;
}

.transition-fade.active {
  opacity: 1;
}

/* ── Mobile ─────────────────────────────────────────────── */
@media screen and (max-width: 600px) {
  .quest-overlay {
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 0.75rem 0.5rem;
    box-sizing: border-box;
  }

  .quest-modal {
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
    gap: 0.8rem;
  }

  .quest-scene {
    font-size: 15px;
  }

  .quest-choice-btn,
  .quest-leave-btn {
    font-size: 13px;
    padding: 0.6rem 0.8rem;
  }
}
</style>
