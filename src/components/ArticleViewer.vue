<template>
  <div class="article">
    <div class="title">{{ formattedTitle }}</div>
    <div v-html="articleHtml" @click.prevent="handleLinkClick"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { fetchWikipediaArticle } from '@/utils/wikipediaApi';

const props = defineProps({ articleTitle: String });
const emit = defineEmits(['link-clicked']);

const articleHtml = ref('');

const formattedTitle = computed(() =>
  props.articleTitle.replaceAll('_', ' ')
);

const load = async () => {
  articleHtml.value = await fetchWikipediaArticle(props.articleTitle);
};

const handleLinkClick = (event) => {
  const anchor = event.target.closest('a');
  if (anchor && anchor.href.includes('/wiki/')) {
    const title = decodeURIComponent(anchor.href.split('/wiki/')[1]);
    emit('link-clicked', title);
  }
};

watch(() => props.articleTitle, load);
onMounted(load);
</script>

<style>
.article {
  border: solid 1px black;
  border-radius: 5px;
  padding: 1.5rem;
  background-color: #ffffff;
  max-width: 2000px;
}

.title {
  font-size: 30px;
  font-weight: 400;
  border-bottom: 1px solid black;
}

@media screen and (max-width: 600px) {
  .article {
      padding: .5rem;
  }
  .title {
    font-size: 25px;
  }
}

</style>
