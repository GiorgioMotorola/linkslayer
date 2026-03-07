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

const showForm = ref(null);
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
@import "./styles/classSelectStyles.css";
</style>
