<!-- ArticleViewer.vue -->

<template>
  <div class="path">
    <span style="font-weight: 500; color: #0645ad">{{ formattedStart }}</span> →
    {{ formattedTarget }}
  </div>
  <div class="article">
    <div class="title">{{ formattedTitle }}</div>
    <div v-html="articleHtml" @click.prevent="handleLinkClick"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { fetchWikipediaArticle } from "@/utils/wikipediaApi";

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String,
});

const emit = defineEmits(["link-clicked"]);

const articleHtml = ref("");

const formattedTitle = computed(() => props.articleTitle.replaceAll("_", " "));

const formattedStart = computed(
  () => props.start?.toString().replaceAll("_", " ") ?? ""
);

const formattedTarget = computed(
  () => props.targets?.toString().replaceAll("_", " ") ?? ""
);

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
  border: solid 1px black;
  border-radius: 5px;
  padding: 1.5rem;
  background-color: #ffffff;
  max-width: 2000px;
  margin-bottom: 20rem;
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

@media screen and (max-width: 600px) {
  .article {
    padding: 0.5rem;
  }
  .title {
    font-size: 25px;
  }
}
</style>
