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
    <span>💾 Saved</span>
  </div>
  <div v-if="inEncounter" class="overlay"></div>
  <div class="path-wrapper">
    <div class="path-display">
      <img :src="logo" alt="logo" class="path-logo" />
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

    </div>
    <div class="path-sub-bar">
      <div class="sky-bar">
        <div class="sky-track" :style="skyTrackStyle">
          <div class="sky-indicator" :style="{ left: skyPercent + '%' }">
            <span class="sky-icon">{{ isNightTime ? '🌙' : '☀️' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="article" :class="{ 'blurred-content': isBlurred }">
    <div v-if="inEncounter" class="overlay"></div>
    <div class="title">{{ formattedTitle }}</div>
    <div v-if="isLoading" class="loader-overlay">
  </div>
    <div
      v-html="articleHtml"
      @click.prevent="handleLinkClick"
      :style="{ pointerEvents: inEncounter || isLoading ? 'none' : 'auto' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { fetchWikipediaArticle } from "@/utils/wikipediaApi";
import logo from "../assets/newlogo-nobg1.png";

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

const emit = defineEmits(["link-clicked", "open-map"]);

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
* {
  font-family: Arial, Helvetica, sans-serif;
  color: rgb(54, 54, 54);
  font-weight: 400;
}
.article {
  position: relative;
  border-radius: 5px;
  padding: 1.5rem;
  background-color: #ffffff;
  max-width: 2000px;
  margin-bottom: 25rem;
  margin-top: 4.5rem;
  z-index: 10;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  background: rgba(0, 0, 0, 0);
  background: rgba(0, 0, 0, 0);
  pointer-events: all;
  cursor: not-allowed;
}

.title {
  font-size: 30px;
  font-weight: 400;
  border-bottom: 1px solid black;
}

.path {
  font-size: 20px;
  text-align: center;
  margin-bottom: 0.5rem;
  font-family: "Roboto", sans-serif;
}

.path-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.path-display {
  background: #e8ecee;
  border-bottom: solid 1px #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  box-sizing: border-box;
  position: relative;
}

.path-sub-bar {
  border-bottom: solid 1px #222;
  box-sizing: border-box;
  overflow: hidden;
}

.path-logo {
  height: 28px;
  width: auto;
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.path-crumb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: #555;
}

.path-group {
  display: flex;
  flex-direction: column;
  width: 220px;
}

.path-group-from {
  align-items: flex-end;
  text-align: right;
}

.path-group-to {
  align-items: flex-start;
  text-align: left;
}

.path-label {
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #888;
  line-height: 1;
  margin-bottom: 2px;
}

.path-label-goal {
  color: #888;
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

.sky-bar {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.sky-track {
  position: relative;
  height: 26px;
  border-radius: 0;
  overflow: visible;
}


.sky-indicator {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 2;
  transition: left 0.5s ease;
}

.sky-icon {
  font-size: 15px;
  line-height: 18px;
  filter: drop-shadow(0 0 5px rgba(255, 210, 40, 0.9));
}


.error-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(184, 29, 29, 0.986);
  color: white;
  padding: 15px 30px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 44px 15px rgba(0, 0, 0, 0.2);
  font-size: 1.1em;
  text-align: center;
  opacity: 1;
  transition: opacity 0.5s ease-out;
}

.error-message.fade-out {
  opacity: 0;
}

.loading-notification {
  position: fixed;
  top: 12px;
  right: 12px;
  background: #111;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 6px;
  z-index: 999;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideInRight 0.2s ease-out;
  letter-spacing: 0.3px;
}

.loading-notification span {
  color: #fff;
}

.save-notification {
  position: fixed;
  top: 12px;
  left: 12px;
  background: #111;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  z-index: 999;
  font-size: 0.8em;
  animation: slideInLeft 0.2s ease-out;
  letter-spacing: 0.3px;
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.blurred-content {
  filter: blur(5px);
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  flex-direction: column;
  backdrop-filter: blur(2px);
}

.loader-content {
  text-align: center;
  color: #333;
  font-size: 1.2em;
}

.loader-content .spinner {
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}


@media screen and (max-width: 600px) {
  .article {
    padding: 0.5rem;
    max-width: 100vw;
    width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: 14px;
  }
  .title {
    font-size: 22px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .path-display {
    padding: 4px 8px;
    gap: 4px;
  }

  .path-sub-bar {
    padding: 0;
  }

  .sky-icon {
    font-size: 13px;
  }


  .path-logo {
    height: 20px;
  }

  .path-label {
    font-size: 7px;
    letter-spacing: 1px;
    margin-bottom: 1px;
  }

  .path-reading {
    max-width: none;
    font-size: 11px;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    word-break: break-word;
  }

  .path-goal {
    max-width: none;
    font-size: 11px;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    word-break: break-word;
  }

  .path-crumb {
    gap: 8px;
  }

  .path-group {
    width: 140px;
  }

  .article :deep(img) {
    max-width: 100% !important;
    height: auto !important;
  }

  .article :deep(table) {
    max-width: 100% !important;
    overflow-x: auto !important;
    display: block !important;
  }

  .article :deep(pre) {
    max-width: 100% !important;
    overflow-x: auto !important;
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
  }

  .article :deep(*) {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .loading-notification {
    top: 8px;
    right: 8px;
    padding: 6px 10px;
    font-size: 0.75em;
    gap: 6px;
  }

  .loading-spinner {
    width: 12px;
    height: 12px;
  }
}
</style>
