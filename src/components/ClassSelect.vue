<template>
  <div class="modal">
    <div class="class-select">
      <div class="cs-auth-widget">
        <template v-if="user">
          <span class="cs-auth-name">{{ userLabel }}</span>
          <button class="cs-auth-link" @click="handleSignOut">Sign out</button>
        </template>
        <template v-else>
          <button class="cs-auth-link" @click="toggleForm('signin')">Sign in</button>
          <span class="cs-auth-sep">·</span>
          <button class="cs-auth-link" @click="toggleForm('signup')">Sign up</button>
        </template>
        <div v-if="showForm" class="cs-auth-dropdown">
          <div class="cs-auth-dropdown-title">{{ showForm === 'signup' ? 'Create Account' : 'Sign In' }}</div>
          <input v-model="authEmail" type="email" placeholder="Email" class="cs-auth-input" @keyup.enter="submitAuth" />
          <input v-model="authPassword" type="password" placeholder="Password" class="cs-auth-input" @keyup.enter="submitAuth" />
          <div v-if="authError" class="cs-auth-error">{{ authError }}</div>
          <div v-if="authSuccess" class="cs-auth-success">{{ authSuccess }}</div>
          <button class="cs-auth-submit" @click="submitAuth" :disabled="authLoading">
            {{ authLoading ? '...' : showForm === 'signup' ? 'Create Account' : 'Sign In' }}
          </button>
        </div>
      </div>

      <div class="game-title">
        <div class="game-name">LINK</div>
        <div class="game-name">SLAYER</div>
        <img :src="logo" alt="LINKSLAYER game title" />
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
      <div class="goal-input-group">
        <input
          v-model="goal"
          placeholder="What is your goal?"
          class="name-input goal-input"
        />
        <button @click="randomizeGoal" class="randomize-name-button">🎲</button>
      </div>

      <div class="journey-length-selection">
        <div class="journey-length-prompt"></div>
        <div class="button-group-container">
          <button
            v-for="length in [5, 6, 7, 8, 9, 10, 11, 12]"
            :key="length"
            :class="{ 'selected-button': selectedJourneyLength === length }"
            @click="selectedJourneyLength = length"
            class="journey-length-button"
          >
            {{ length }} Articles
          </button>
        </div>
      </div>

      <div class="class-grid">
        <div v-for="(c, key) in classes" :key="key" class="class-card">
          <div class="class-card-top">
            <span class="class-card-name">{{ c.name }}</span>
            <button class="class-select-btn" @click="selectClass(key)">Select ▶</button>
          </div>
          <div class="class-card-stats">
            <span class="stat-pill">❤️ {{ c.maxHP }} HP</span>
            <span v-if="c.startingWeaponBonus > 0" class="stat-pill">🗡 +{{ c.startingWeaponBonus }} Weapon</span>
            <span v-if="c.startingShieldBonus > 0" class="stat-pill">🛡 +{{ c.startingShieldBonus }} Defense</span>
            <span v-if="c.startingPlayerGold > 0" class="stat-pill">💰 {{ c.startingPlayerGold }}g</span>
            <span v-if="c.startingSpecialUses > 0" class="stat-pill">✨ +{{ c.startingSpecialUses }} Charges</span>
            <span v-if="key === 'Mundane'" class="stat-pill stat-pill-hard">⚠️ Hard Mode</span>
          </div>
          <div class="class-card-desc">{{ c.specialTiers[0].name }}: {{ c.specialTiers[0].description }}</div>
        </div>
      </div>
      <button class="tips-button" @click="openModal">How To Play</button>
      <TipsModal v-if="isModalOpen" @close="closeModal" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from "vue";
import { classes } from "@/utils/classes";
import prompts from "@/assets/data/prompts.json";
import TipsModal from "./TipsModal.vue";
import randomNames from "@/assets/data/randomNames.json";
import logo from "../assets/newlogo-nobg1.png";
import { useAuth } from "@/composables/useAuth";

const { user, signIn, signUp, signOut } = useAuth();

const showForm = ref(null); // null | 'signin' | 'signup'
const authEmail = ref("");
const authPassword = ref("");
const authError = ref("");
const authLoading = ref(false);
const authSuccess = ref("");

const userLabel = computed(() => user.value?.email?.split("@")[0] ?? "");

function toggleForm(mode) {
  showForm.value = showForm.value === mode ? null : mode;
  authEmail.value = "";
  authPassword.value = "";
  authError.value = "";
  authSuccess.value = "";
}

async function submitAuth() {
  if (!authEmail.value || !authPassword.value) {
    authError.value = "Please enter email and password.";
    return;
  }
  authLoading.value = true;
  authError.value = "";
  authSuccess.value = "";
  try {
    if (showForm.value === "signup") {
      const data = await signUp(authEmail.value, authPassword.value);
      if (data.session) {
        showForm.value = null;
      } else {
        authSuccess.value = "Check your email to confirm your account.";
      }
    } else {
      await signIn(authEmail.value, authPassword.value);
      showForm.value = null;
    }
  } catch (err) {
    authError.value = err.message ?? "Something went wrong.";
  } finally {
    authLoading.value = false;
  }
}

async function handleSignOut() {
  await signOut();
}

const name = ref("");
const goal = ref("");
const emit = defineEmits(["select", "show-tips"]);

const randomGoals = [
"Kill all evil",
"Find lost treasures",
"Eat and drink",
"Become the greatest to ever do it",
"I don't have a goal",
"Find a new home to live out the rest of my days"
];

const journeyIntro = ref("");
const journeyMiddle = ref("");
const journeyOutro = ref("");

const promptedArticleStart = ref("");
const promptedArticleEnd = ref("");

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String,
  fullChain: Array,
});

const selectedJourneyLength = ref(5);

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
    goal: goal.value.trim(),
  });
}

function randomizeGoal() {
  const idx = Math.floor(Math.random() * randomGoals.length);
  goal.value = randomGoals[idx];
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

  journeyIntro.value = prompt["journey-intro"] || "";
  journeyMiddle.value = prompt["journey-middle"] || "";
  journeyOutro.value = prompt["journey-outro"] || "";

  if (props.fullChain && props.fullChain.length >= 3) {
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

    const endIndex = prompt["article-slot-end"];
    const actualEndIndex = props.fullChain.length - 1;
    if (
      endIndex !== undefined &&
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
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

.game-title {
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-name {
  font-family: "Metal Mania", system-ui;
  font-weight: 400;
  letter-spacing: 7px;
  text-decoration-color: rgb(99, 79, 79);
  color: #990000;
  font-size: 25px;
}

.game-title img {
  max-width: 80px;
  max-height: 80px;
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
  padding-top: 0.5vh;
  z-index: 1000;
  background: #5e5e5e8e;
  backdrop-filter: blur(6px);
  overflow-y: auto;
}

.class-select {
  background: #e8ecee;
  padding: 1rem;
  border-radius: 3px;
  text-align: center;
  max-width: 750px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
  border: 1px solid black;
  box-sizing: border-box;
  position: relative;
}

.cs-auth-widget {
  position: absolute;
  top: 8px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-family: "IBM Plex Sans", sans-serif;
  z-index: 10;
}

.cs-auth-name {
  color: #555;
  font-size: 12px;
}

.cs-auth-sep {
  color: #aaa;
  font-size: 12px;
}

.cs-auth-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #0645ad;
  cursor: pointer;
  font-family: "IBM Plex Sans", sans-serif;
  text-decoration: none;
  font-weight: 500;
}

.cs-auth-link:hover {
  color: #003380;
}

.cs-auth-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
  width: 220px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 7px;
  z-index: 100;
}

.cs-auth-dropdown-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  text-align: center;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.cs-auth-input {
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: "IBM Plex Sans", sans-serif;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.cs-auth-input:focus {
  border-color: #0645ad;
}

.cs-auth-error {
  font-size: 11px;
  color: #c0392b;
  text-align: center;
}

.cs-auth-success {
  font-size: 11px;
  color: #27ae60;
  text-align: center;
}

.cs-auth-submit {
  padding: 5px 10px;
  background: #0645ad;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-family: "IBM Plex Sans", sans-serif;
  cursor: pointer;
  width: 100%;
}

.cs-auth-submit:hover:not(:disabled) {
  background: #003380;
}

.cs-auth-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.who-are-you-div {
  margin-top: 1.5rem;
  margin-bottom: 1.5;
}

.name-input-group {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.goal-input-group {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.name-input {
  padding: 5px 12px;
  border-radius: 5px;
  border: 1px solid #c0a0a0;
  text-align: center;
  font-size: 15px;
  width: 300px;
  max-width: 100%;
}

.goal-input {
  width: 380px;
  max-width: 100%;
  font-size: 14px !important;
  color: #555;
}

.class-grid {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.75rem;
  text-align: left;
}

.class-card {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid #d4cfc8;
  border-radius: 6px;
  padding: 7px 12px;
  text-align: left;
}

.class-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.class-card-name {
  font-family: "MedievalSharp", cursive;
  font-size: 17px;
  color: #1a1a1a;
}

.class-select-btn {
  font-family: "MedievalSharp", cursive;
  font-size: 13px;
  background: transparent;
  border: 1px solid #990000;
  border-radius: 4px;
  color: #990000;
  padding: 4px 11px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.class-select-btn:hover {
  background: #990000;
  color: white;
}

.class-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.stat-pill {
  font-size: 11px;
  font-family: "IBM Plex Sans", sans-serif;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 2px 9px;
  color: #444;
}

.stat-pill-hard {
  background: rgba(180, 60, 0, 0.08);
  border-color: rgba(180, 60, 0, 0.25);
  color: #8b3a00;
}

.class-card-desc {
  font-size: 12.5px;
  color: #666;
  font-style: italic;
  font-family: "IBM Plex Sans", sans-serif;
  line-height: 1.4;
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
}

.notification-banner.show {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.button-group-container {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.journey-length-button {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 6px 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: center;
  font-family: "IBM Plex Sans", sans-serif;
  font-weight: 500;
  white-space: nowrap;
}

.journey-length-button:hover {
  background-color: #e0e0e0;
  border-color: #999;
}

.journey-length-button.selected-button {
  background-color: #0645ad;
  color: white;
  border-color: #003380;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  font-weight: 700;
}

@media screen and (max-width: 600px) {
  .modal {
    align-items: flex-start;
    padding-top: 0.25rem;
    padding-bottom: 0.5rem;
  }

  .class-select {
    padding: 0.5rem 0.75rem;
    width: 96%;
    margin: 0 auto;
    max-height: none;
  }

  .game-title img {
    max-width: 45px;
    max-height: 45px;
  }

  .game-name {
    font-size: 18px;
    letter-spacing: 3px;
  }

  .who-are-you-div {
    margin-top: 0;
  }

  .name-input-group {
    margin-top: 0.5rem;
    margin-bottom: 0.3rem;
  }

  .goal-input-group {
    margin-top: 0.25rem;
    margin-bottom: 0.4rem;
  }

  .name-input {
    font-size: 13px;
    padding: 4px 8px;
    width: 100%;
    max-width: 220px;
  }

  .randomize-name-button {
    font-size: 14px;
    padding: 4px 8px;
  }

  .journey-length-selection {
    margin-top: 0.3rem;
    padding: 0.2rem;
  }

  .button-group-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .journey-length-button {
    font-size: 11px;
    padding: 4px 2px;
    flex: 1 1 calc(25% - 4px);
    white-space: nowrap;
  }

  .class-grid {
    gap: 0.3rem;
    margin-top: 0.3rem;
  }

  .class-card {
    padding: 5px 10px;
  }

  .class-card-top {
    margin-bottom: 2px;
  }

  .class-card-stats {
    gap: 3px;
    margin-bottom: 2px;
  }

  .class-card-name {
    font-size: 15px;
  }

  .class-select-btn {
    font-size: 11px;
    padding: 3px 7px;
  }

  .stat-pill {
    font-size: 10px;
    padding: 1px 7px;
  }

  .class-card-desc {
    font-size: 11px;
  }

  .tips-button {
    font-size: 13px;
    margin-top: 0.3rem;
  }

  .journey-prompt {
    font-size: 14px;
    text-indent: 1rem;
  }
}

.journey-length-selection {
  background: transparent;
  padding: 0.5rem;
  margin-top: 1.5rem;
  text-align: center;
}

.journey-length-prompt {
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #333;
  font-size: 15px;
}

</style>
