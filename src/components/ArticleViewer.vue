<template>
  <div
    v-if="errorMessage"
    :class="['error-message', { 'fade-out': isFadingOut }]"
  >
    {{ errorMessage }}
  </div>
  <div v-if="isLoading" class="loading-notification">
    <div class="loading-spinner"></div>
    <span>Loading Wikipedia article...</span>
  </div>
  <div v-if="autoSaveFeedback" class="save-notification">
    <span><i class="ra ra-save"></i></span>
  </div>
  <WeatherOverlay :weather="weatherType" />
  <div v-if="inEncounter" class="overlay"></div>
  <div class="path-wrapper">
    <div class="path-display">
      <!-- <img :src="logo" alt="logo" class="path-logo" /> -->
      <div class="path-crumb">
        <div class="path-group path-group-from">
          <span class="path-label">from</span>
          <span class="path-reading">{{ props.fullChain[props.currentTargetIndex]?.replaceAll("_", " ") }}</span>
        </div>
        <div class="path-group path-group-to">
          <span class="path-label path-label-goal">to</span>
          <span class="path-goal">{{ props.fullChain[props.currentTargetIndex + 1]?.replaceAll("_", " ") }}</span>
        </div>
      </div>
      <span class="path-day">Day {{ props.daysCount }}</span>
    </div>
    <div class="path-sub-bar" :class="{ 'blurred-content': props.isInCombat }">
      <div class="sky-bar">
        <div class="sky-track" :style="skyTrackStyle">
          <div class="sky-indicator" :style="{ left: skyPercent + '%' }">
            <span class="sky-icon" :style="isNightTime ? 'filter:drop-shadow(0 0 5px rgba(180,210,255,0.9))' : 'filter:drop-shadow(0 0 5px rgba(255,210,40,0.9))'" v-html="isNightTime ? '<i class=&quot;ra ra-moon-sun&quot; style=&quot;color:#c8d8f0&quot;></i>' : '<i class=&quot;ra ra-sun&quot; style=&quot;color:#ffd700&quot;></i>'"></span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="props.settlementOnThisPage" class="settlement-banner" :class="{ 'settlement-banner-disabled': props.inEncounter, 'settlement-banner-abandoned': props.settlementOnThisPage.abandoned }" @click="!props.inEncounter && emit('open-settlement')">
      <template v-if="props.settlementOnThisPage.abandoned">
        <i class="ra ra-skull"></i> {{ props.settlementOnThisPage.town_name }} has been abandoned and is being terrorized by {{ settlementGuardianName }}
      </template>
      <template v-else>
        <i class="ra ra-castle-emblem"></i> Visit {{ props.settlementOnThisPage.town_name }}, claimed by {{ props.settlementClaimedBy }}
      </template>
    </div>
  </div>
  <CombatOverlay
    :inEncounter="props.isInCombat"
    :playerClass="props.playerClass"
    :playerHP="props.playerHP"
    :playerMaxHP="props.playerMaxHP"
    :enemyHP="props.enemyHP"
    :articleTitle="props.articleTitle"
    :lastDamageDealt="props.lastDamageDealt"
    :lastDamageTaken="props.lastDamageTaken"
    :encounter="props.encounter"
    :enemyNextAction="props.enemyNextAction"
    :nextEnemyAttack="props.nextEnemyAttack"
    :enemyIntents="props.enemyIntents"
    :enemyStatusEffects="props.enemyStatusEffects"
    :enemyTurnKey="props.enemyTurnKey"
    :enemyHitKey="props.enemyHitKey"
    :playerHitKey="props.playerHitKey"
    :playerSelectedTarget="props.playerSelectedTarget"
    :actionsPlaying="props.actionsPlaying"
    :actionFlash="props.actionFlash"
    :lastProcEvent="props.lastProcEvent"
    :allyCompanion="props.allyCompanion"
    @switch-target="$emit('switch-target', $event)"
  />
  <div class="article" :class="{ 'blurred-content': isBlurred || props.isInCombat }">
    <div v-if="inEncounter" class="overlay"></div>
    <div class="title">{{ formattedTitle }}</div>
    <div v-if="isLoading" class="loader-overlay"></div>
    <div
      v-html="articleHtml"
      @click.prevent="handleLinkClick"
      :style="{ pointerEvents: inEncounter || isLoading || props.panelOpen ? 'none' : 'auto' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { fetchWikipediaArticle } from "@/utils/wikipediaApi";
import logo from "../assets/newlogo-nobg1.png";
import WeatherOverlay from "./WeatherOverlay.vue";
import CombatOverlay from "./CombatOverlay.vue";
import "./styles/articleViewerStyles.css";
import { SETTLEMENT_BOSS_DEFS } from "@/utils/settlementBossGenerator.js";

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String,
  fullChain: Array,
  currentTargetIndex: Number,
  inEncounter: Boolean,
  path: Array,
  isBlurred: Boolean,
  clickCount: { type: Number, default: 0 },
  longRestDismissCount: { type: Number, default: 0 },
  autoSaveFeedback: { type: Boolean, default: false },
  daysCount: { type: Number, default: 1 },
  playerClass: { type: Object, default: null },
  isInCombat: { type: Boolean, default: false },
  playerHP: { type: Number, default: 0 },
  playerMaxHP: { type: Number, default: 1 },
  enemyHP: { type: Number, default: 0 },
  lastDamageDealt: { type: Number, default: null },
  lastDamageTaken: { type: Number, default: null },
  enemyStatusEffects:  { type: Array, default: () => [] },
  settlementOnThisPage: { type: Object, default: null },
  panelOpen: { type: Boolean, default: false },
  settlementClaimedBy:  { type: String, default: "" },
  encounter:            { type: Object, default: null },
  enemyNextAction:      { type: String, default: null },
  nextEnemyAttack:      { type: Number, default: null },
  enemyIntents:         { type: Array, default: () => [] },
  enemyTurnKey:         { type: Number, default: 0 },
  enemyHitKey:          { type: Number, default: 0 },
  playerHitKey:         { type: Number, default: 0 },
  playerSelectedTarget: { type: Boolean, default: false },
  actionsPlaying:       { type: Boolean, default: false },
  actionFlash:          { type: Object,  default: null },
  lastProcEvent:        { type: Object,  default: null },
  allyCompanion:        { type: Object,  default: null },
});

function dayWeather(day) {
  let h = (day + 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = h ^ (h >>> 16);
  const r = (h >>> 0) % 100;
  if (r < 20) return 'clear';    // 20%
  if (r < 40) return 'snow';    // 20%
  if (r < 60) return 'rain';    // 20%
  if (r < 80) return 'leaves';  // 20%
  return 'blossom';             // 20%
}

const weatherType = computed(() => dayWeather(props.daysCount));

const settlementGuardianName = computed(() => {
  const key = props.settlementOnThisPage?.guardian_boss;
  return key ? (SETTLEMENT_BOSS_DEFS[key]?.name ?? key) : "an unknown creature";
});


const cyclePosition = computed(() => {
  if (props.clickCount <= 0) return 0;
  const adjusted = props.clickCount - props.longRestDismissCount * 24;
  return adjusted <= 0 ? 0 : (adjusted - 1) % 24;
});
const skyPercent  = computed(() => (cyclePosition.value / 23) * 100);
const isNightTime = computed(() => cyclePosition.value >= 16);

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
function lerpColor(a, b, t) {
  const [r1,g1,b1] = hexToRgb(a), [r2,g2,b2] = hexToRgb(b);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

const skyPhases = [
  { pos: 0,  color: '#f07040' },
  { pos: 2,  color: '#f0b838' },
  { pos: 5,  color: '#70c8f0' },
  { pos: 11, color: '#4898d8' },
  { pos: 14, color: '#e08828' },
  { pos: 16, color: '#7030a8' },
  { pos: 19, color: '#2a1848' },
  { pos: 23, color: '#2a1848' },
];

const skyColor = computed(() => {
  const pos = cyclePosition.value;
  for (let i = 0; i < skyPhases.length - 1; i++) {
    const from = skyPhases[i], to = skyPhases[i + 1];
    if (pos >= from.pos && pos <= to.pos) {
      const t = (pos - from.pos) / (to.pos - from.pos);
      return lerpColor(from.color, to.color, t);
    }
  }
  return skyPhases[skyPhases.length - 1].color;
});

const skyTrackStyle = computed(() => ({
  background: `radial-gradient(ellipse 15% 100% at ${skyPercent.value}% 50%, ${skyColor.value}, transparent), #1a1a1a`
}));

const emit = defineEmits(["link-clicked", "open-map", "open-settlement", "switch-target"]);

const articleHtml = ref("");
const errorMessage = ref("");
const isFadingOut = ref(false);
const clearErrorTimeout = ref(null);
const hideElementTimeout = ref(null);
const isLoading = ref(false);

const formattedTitle = computed(() => props.articleTitle.replaceAll("_", " "));


function parseWikipediaUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostnameParts = urlObj.hostname.split(".");
    const langCode = hostnameParts[0];

    const pathParts = urlObj.pathname.split("/");
    const title = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (
      (urlObj.hostname.endsWith("wikipedia.org") ||
        urlObj.hostname.endsWith("wiktionary.org")) &&
      pathParts[1] === "wiki"
    ) {
      return {
        langCode,
        title,
        isWikipedia: urlObj.hostname.endsWith("wikipedia.org"),
      };
    }
  } catch (e) {}
  return null;
}

const showAndClearError = (
  message,
  displayDuration = 6000,
  fadeDuration = 500
) => {
  if (clearErrorTimeout.value) {
    clearTimeout(clearErrorTimeout.value);
    clearErrorTimeout.value = null;
  }
  if (hideElementTimeout.value) {
    clearTimeout(hideElementTimeout.value);
    hideElementTimeout.value = null;
  }

  isFadingOut.value = false;
  errorMessage.value = message;

  if (message) {
    clearErrorTimeout.value = setTimeout(() => {
      isFadingOut.value = true;
      hideElementTimeout.value = setTimeout(() => {
        errorMessage.value = "";
        isFadingOut.value = false;
        hideElementTimeout.value = null;
      }, fadeDuration);
    }, displayDuration);
  }
};

const load = async () => {
  showAndClearError("");
  isLoading.value = true;

  if (!props.articleTitle || props.articleTitle.trim() === "") {
    console.warn("ArticleViewer tried to fetch an empty title.");
    showAndClearError("Invalid article title provided.", 4000);
    articleHtml.value = "";
    isLoading.value = false;
    return;
  }

  try {
    const articleContent = await fetchWikipediaArticle(props.articleTitle);

    if (articleContent === null) {
      console.error(
        `🛑 Failed to load article: ${props.articleTitle}. Keeping previous content.`
      );
      showAndClearError(
        `Failed to load "${props.articleTitle}". Please try another link.`,
        4000
      );
      return;
    }

    articleHtml.value = articleContent;
  } catch (error) {
    console.error("Error fetching Wikipedia article:", error);
    showAndClearError(
      `An unexpected error occurred while loading "${props.articleTitle}".`,
      4000
    );
    articleHtml.value = "";
  } finally {
    isLoading.value = false;
  }
};

const handleLinkClick = (event) => {
  if (props.inEncounter || isLoading.value) {
    return;
  }

  const anchor = event.target.closest("a");
  if (anchor) {
    const href = anchor.href;
    const parsedLink = parseWikipediaUrl(href);

    if (parsedLink) {
      const { langCode, title, isWikipedia } = parsedLink;

      if (!isWikipedia) {
        showAndClearError(
          `Sorry, "${title.replaceAll(
            "_",
            " "
          )}" is not a Wikipedia article and will not load properly. Please try another link.`,
          4000
        );
        return;
      }

      if (langCode === "en") {
        showAndClearError("");
        emit("link-clicked", title);
      } else {
        showAndClearError(
          `Sorry, "${title.replaceAll(
            "_",
            " "
          )}" is not an English Wikipedia article and will not load properly. Try another article.`,
          3500
        );
      }
    } else {
      showAndClearError(
        `Invalid or non-Wikipedia link clicked. Please click a valid Wikipedia article link.`,
        4000
      );
    }
  }
};

watch(() => props.articleTitle, load);
onMounted(load);
</script>

<style scoped>

.article {
  font-family: Arial, Helvetica, sans-serif;
  color: rgb(54, 54, 54);
  font-weight: 400;
  position: relative;
}


.settlement-banner {
  background: #4169E1;
  border-bottom: 0px solid #fdfdfd;
  color: #f5deb3;
  padding: 7px 14px;
  font-size: 0.90rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-family: "IBM Plex Sans", Arial, sans-serif;
}
.settlement-banner:hover {
  background: #6683da;
  color: #f5deb3;
}
.settlement-banner-disabled {
  /* opacity: 0.4; */
  cursor: not-allowed;
}
.settlement-banner-abandoned {
  background: #5c1a1a;
}
.settlement-banner-abandoned:hover {
  background: #7a2222;
}
.settlement-banner strong { color: #f5deb3; }
.settlement-banner-sub {
  color: #4c4c4d;
  font-size: 0.78rem;
}

.path-reading {
  color: #0645ad;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.path-goal {
  font-weight: 600;
  color: #b05a00;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

</style>