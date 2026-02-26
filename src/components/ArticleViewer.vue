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
  <div v-if="inEncounter" class="overlay"></div>
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
    <button class="path-map-hint" @click="emit('open-map')">Full Path in Map</button>
  </div>
  <div class="article" :class="{ 'blurred-content': isBlurred }">
    <div v-if="inEncounter" class="overlay"></div>
    <div class="title">{{ formattedTitle }}</div>
    <div v-if="isLoading" class="loader-overlay">
      <!-- <div class="loader-content">
        <div class="spinner"></div>
        <p>Loading article...</p>
      </div> -->
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
import logo from "@/assets/newlogo-nobg1.png";

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String,
  fullChain: Array,
  currentTargetIndex: Number,
  inEncounter: Boolean,
  path: Array,
  isBlurred: Boolean,
});

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
  margin-top: 1.25rem;
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

.path-display {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #e8ecee;
  border-bottom: solid 1px black;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 5px 12px;
  box-sizing: border-box;
  gap: 8px;
}

.path-logo {
  height: 28px;
  width: auto;
  flex-shrink: 0;
}

.path-crumb {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #555;
  flex: 1;
  min-width: 0;
}

.path-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
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

.path-map-hint {
  font-size: 11px;
  color: #4b4949;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  font-family: inherit;
}

.path-map-hint:hover {
  color: #0645ad;
  background: rgba(6, 69, 173, 0.07);
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
    align-items: flex-start;
    gap: 8px;
  }

  .path-map-hint {
    font-size: 10px;
    padding: 1px 4px;
  }

  /* Force all article content to stay within viewport */
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
