<template>
  <div class="modal">
    <div class="class-select">
      <div class="game-title">LINKSLAYER</div>
      <div class="journey-prompt">
        "{{ journeyIntro }}
        <span style="color: #0645ad; font-weight: 400">{{
          promptedArticleStart
        }}</span>
        {{ journeyMiddle }}
        <span style="color: #0645ad; font-weight: 400">{{
          promptedArticleEnd
        }}</span>
        {{ journeyOutro }}"
      </div>
      <div id="notification-banner" class="notification-banner">
        <span id="notification-message"></span>
        <button class="close-button" @click="hideNotification">×</button>
      </div>
      <div class="who-are-you-div"></div>
      <div class="name-input-group">
        <input
          v-model="name"
          placeholder="What is your name?"
          class="name-input"
        />
        <button @click="randomizeName" class="randomize-name-button">🎲</button>
      </div>

      <div class="journey-length-selection">
        <div class="journey-length-prompt">Choose your journey length:</div>
        <div class="slider-container">
          <input
            type="range"
            min="3"
            max="9"
            step="1"
            v-model="selectedJourneyLength"
            class="journey-slider"
          />
          <span class="slider-value">{{ selectedJourneyLength }} Articles</span>
        </div>
      </div>
      <div class="class-grid">
        <div v-for="(c, key) in classes" :key="key" class="class-card">
          <button @click="selectClass(key)">> Select {{ c.name }}</button>
          <div class="desc">{{ c.description }}</div>
        </div>
      </div>
      <button class="tips-button" @click="openModal">Game Tips</button>
      <TipsModal v-if="isModalOpen" @close="closeModal" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { classes } from "@/utils/classes";
import prompts from "@/assets/data/prompts.json";
import TipsModal from "./TipsModal.vue";
import randomNames from "@/assets/data/randomNames.json";

const name = ref("");
const emit = defineEmits(["select", "show-tips"]);

// MODIFIED: New refs for intro, middle, and outro text
const journeyIntro = ref("");
const journeyMiddle = ref("");
const journeyOutro = ref("");

// MODIFIED: New refs for start and end prompted articles
const promptedArticleStart = ref("");
const promptedArticleEnd = ref("");

// REMOVED: journeyOne, journeyTwo, journeyThree, journeyFour, promptedArticleOne, promptedArticleTwo, promptedArticleThree

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String, // This prop might become redundant
  fullChain: Array,
});

const selectedJourneyLength = ref(3);

const isModalOpen = ref(false);

const openModal = () => {
  isModalOpen.value = true;
  emit("show-tips");
};

const closeModal = () => {
  isModalOpen.value = false;
};

let notificationTimeoutId = null;

async function showAlertAsBanner(message, duration = 3000) {
  await nextTick();

  const banner = document.getElementById("notification-banner");
  const messageSpan = document.getElementById("notification-message");

  if (!banner || !messageSpan) {
    console.error("Notification banner elements not found in the DOM.");
    alert(message);
    return;
  }
  banner.className = "notification-banner";

  messageSpan.textContent = message;
  banner.classList.add("show");

  if (notificationTimeoutId) {
    clearTimeout(notificationTimeoutId);
  }

  notificationTimeoutId = setTimeout(() => {
    hideNotification();
  }, duration);
}

function hideNotification() {
  const banner = document.getElementById("notification-banner");
  if (banner) {
    banner.classList.remove("show");
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
      notificationTimeoutId = null;
    }
  }
}

function selectClass(classKey) {
  if (!name.value.trim()) {
    showAlertAsBanner("Please enter your name before selecting a class.");
    return;
  }
  emit("select", {
    classKey,
    name: name.value.trim(),
    journeyLength: selectedJourneyLength.value,
  });
}

function randomizeName() {
  if (randomNames.length > 0) {
    const randomIndex = Math.floor(Math.random() * randomNames.length);
    name.value = randomNames[randomIndex];
  } else {
    console.warn("No names available in randomNames.json to randomize.");
    showAlertAsBanner("Could not find names to randomize. Please type one.");
  }
}

function loadRandomPrompt() {
  if (!prompts || prompts.length === 0) {
    console.error(
      "loadRandomPrompt: No prompts loaded from JSON or prompts array is empty."
    );
    return;
  }

  const randomIndex = Math.floor(Math.random() * prompts.length);
  const prompt = prompts[randomIndex];

  // MODIFIED: Assigning new prompt parts
  journeyIntro.value = prompt["journey-intro"] || "";
  journeyMiddle.value = prompt["journey-middle"] || "";
  journeyOutro.value = prompt["journey-outro"] || "";
  // REMOVED: journeyOne, journeyTwo, journeyThree, journeyFour

  // MODIFIED: Logic for assigning start and end articles
  if (props.fullChain && props.fullChain.length >= 3) {
    // Start article is always at index 0
    const startIndex = prompt["article-slot-start"];
    if (startIndex !== undefined && props.fullChain[startIndex] !== undefined) {
      promptedArticleStart.value =
        props.fullChain[startIndex].replaceAll("_", " ") ?? "";
    } else {
      promptedArticleStart.value = "";
      console.warn(
        "loadRandomPrompt: Could not assign Start Article. Slot index:",
        startIndex,
        "Full chain:",
        props.fullChain
      );
    }

    // End article is always at the last index (using -1 as a conceptual indicator)
    const endIndex = prompt["article-slot-end"]; // This will be -1
    const actualEndIndex = props.fullChain.length - 1; // Calculate actual last index
    if (
      endIndex !== undefined && // Ensure it's defined (even if -1)
      props.fullChain[actualEndIndex] !== undefined
    ) {
      promptedArticleEnd.value =
        props.fullChain[actualEndIndex].replaceAll("_", " ") ?? "";
    } else {
      promptedArticleEnd.value = "";
      console.warn(
        "loadRandomPrompt: Could not assign End Article. Actual end index:",
        actualEndIndex,
        "Full chain:",
        props.fullChain
      );
    }
  } else {
    console.warn(
      "loadRandomPrompt: fullChain prop not yet available or does not have at least 3 elements. Articles will not be populated."
    );
    promptedArticleStart.value = "";
    promptedArticleEnd.value = "";
  }
}

watch(
  () => props.fullChain,
  (newChain) => {
    if (newChain && newChain.length >= 3) {
      loadRandomPrompt();
    } else {
      // Potentially clear prompts if chain is too short, though it should always be >= 3
      journeyIntro.value = "";
      journeyMiddle.value = "";
      journeyOutro.value = "";
      promptedArticleStart.value = "";
      promptedArticleEnd.value = "";
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* All existing styles remain the same as the previous response */
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

.game-title {
  font-family: "Metal Mania", system-ui;
  font-size: 35px;
  font-weight: 400;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  text-decoration-line: underline;
  text-decoration-color: rgb(99, 79, 79);
  color: #990000;
  text-shadow: -2px -2px 0 #000000, 2px -2px 0 #000000, -2px 2px 0 #000000,
    2px 2px 0 #000000, -2px 0px 0 #000000, 2px 0px 0 #000000, 0px -2px 0 #000000,
    0px 2px 0 #000000;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0vh;
  z-index: 1000;
}

.class-select {
  background: #e2e6e7;
  padding: 1rem;
  border-radius: 3px;
  text-align: center;
  max-width: 650px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
  border: 1px solid black;
}

.who-are-you-div {
  margin-top: 1rem;
}

.name-input-group {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.name-input {
  padding: 5px;
  border-radius: 6px;
  border: 1px solid rgb(156, 4, 4);
  text-align: center;
  font-size: 18px;
}

.class-grid {
  display: grid;
  gap: 2rem;
  margin-top: 1rem;
  text-align: left;
}

.class-card {
  background: #e2e6e7;
  border-radius: 8px;
}

button {
  background: #e2e6e7;
  border: none;
  font-size: 20px;
}

.desc {
  font-size: 14px;
}

button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.journey-prompt {
  color: #1b1b1b;
  text-align: start;
  text-indent: 5rem;
  font-weight: 400;
  font-size: 16px;
  font-family: "MedievalSharp", cursive;
}

.notification-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #dc3545;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  display: none;
  opacity: 0;
  transition: opacity 0.5s ease-in-out, top 0.5s ease-in-out;
  min-width: 250px;
  max-width: 90%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notification-banner.show {
  display: flex;
  opacity: 1;
  top: 20px;
}

.notification-banner .close-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: 15px;
}

.tips-button {
  margin-top: 1.5rem;
  background-color: transparent;
  color: rgb(8, 8, 8);
  font-size: 17px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border: none;
  font-weight: 700;
}

.tips-button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.randomize-name-button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 5px 10px;
  margin-left: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.randomize-name-button:hover {
  background-color: #e0e0e0;
  transform: translateY(-1px);
}

.randomize-name-button:active {
  background-color: #d0d0d0;
  transform: translateY(0);
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

@keyframes npc-drop {
  0% {
    opacity: 0;
    transform: translateX(-150px);
  }
  60% {
    opacity: 1;
    transform: translateX(10px);
  }
  80% {
    transform: translateX(-5px);
  }
  100% {
    transform: translateX(0);
  }
}

@media screen and (max-width: 600px) {
  .class-select {
    padding: 0.8rem;
  }
  .game-title {
    font-size: 30px;
  }
  .journey-prompt {
    font-size: 16px;
    text-indent: 2rem;
  }
  .name-input {
    font-size: 16px;
    padding: 3px;
  }
  .randomize-name-button {
    font-size: 16px;
    padding: 3px 8px;
  }
  .class-grid {
    gap: 1rem;
  }
  button {
    font-size: 20px;
  }
  .desc {
    font-size: 13px;
  }
  .journey-length-selection {
    font-size: 14px;
    margin-top: 1rem;
    padding: 0.5rem;
  }
  .tips-button {
    font-size: 15px;
  }
}

.journey-length-selection {
  background-color: #f8f8f8;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  text-align: center;
}

.journey-length-prompt {
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #333;
  font-size: 15px;
}

.slider-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0 10%;
}

.journey-slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
  border-radius: 4px;
}

.journey-slider:hover {
  opacity: 1;
}

.journey-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0645ad;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.journey-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0645ad;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.slider-value {
  font-size: 1em;
  font-weight: 600;
  color: #0645ad;
  min-width: 120px;
  text-align: center;
}
</style>