<template>
  <div v-if="inEncounter" class="overlay"></div>
  <div class="path-display">
    <span :style="{ color: currentTargetIndexProp === 0 ? '#0645ad' : '#555' }">
      {{ formattedStart }}
    </span>
    <span> → </span>
    <span :style="{ color: currentTargetIndexProp === 1 ? '#0645ad' : '#555' }">
      {{ formattedSecondTarget }}
    </span>
    <span> → </span>
    <span :style="{ color: currentTargetIndexProp === 2 ? '#0645ad' : '#555' }">
      {{ formattedFinalTarget }}
    </span>
  </div>
  <div class="article">
    <div v-if="inEncounter" class="overlay"></div>
    <div class="title">{{ formattedTitle }}</div>
    <div
      v-html="articleHtml"
      @click.prevent="handleLinkClick"
      :style="{ pointerEvents: inEncounter ? 'none' : 'auto' }"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { fetchWikipediaArticle } from "@/utils/wikipediaApi";

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String,

  fullChain: Array,
  currentTargetIndex: Number,
  inEncounter: Boolean,
  path: Array,
});

const emit = defineEmits(["link-clicked"]);

const articleHtml = ref("");

const formattedTitle = computed(() => props.articleTitle.replaceAll("_", " "));

const formattedStart = computed(
  () => props.fullChain[0]?.replaceAll("_", " ") ?? ""
);
const formattedSecondTarget = computed(
  () => props.fullChain[1]?.replaceAll("_", " ") ?? ""
);
const formattedFinalTarget = computed(
  () => props.fullChain[2]?.replaceAll("_", " ") ?? ""
);

const currentTargetIndexProp = computed(() => props.currentTargetIndex);

const load = async () => {
  if (!props.articleTitle || props.articleTitle.trim() === "") {
    console.warn("ArticleViewer tried to fetch an empty title.");
    return;
  }

  try {
    articleHtml.value = await fetchWikipediaArticle(props.articleTitle);
  } catch (err) {
    console.error("🛑 Error loading article:", err);
    articleHtml.value = `<p style="color:red;">Error loading article: ${props.articleTitle}</p>`;
  }
};

const handleLinkClick = (event) => {
  const anchor = event.target.closest("a");
  if (anchor && anchor.href.includes("/wiki/")) {
    const title = decodeURIComponent(anchor.href.split("/wiki/")[1]);
    const normalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);
    emit("link-clicked", normalizedTitle);
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
  border: solid 1px black;
  border-radius: 5px;
  padding: 1.5rem;
  background-color: #ffffff;
  max-width: 2000px;
  margin-bottom: 20rem;
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
  font-size: 15px;
  text-align: center;
  margin-bottom: 0.5rem;
}

.path-display {
  font-size: 15px;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #555;
}

@media screen and (max-width: 600px) {
  .article {
    padding: 0.5rem;
  }
  .title {
    font-size: 25px;
  }
}
</style>
