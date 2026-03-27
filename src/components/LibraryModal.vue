<template>
  <div class="library-overlay" @click.self="$emit('close')">
    <div class="library-modal">
      <div class="library-title"><i class="ra ra-book"></i> Infinite Library</div>

      <div class="library-subtitle">Check out one book at a time. Read it between rests, then forge it.</div>

      <!-- Current reading status -->
      <div v-if="libraryBook" class="library-reading-status">
        <div class="reading-status-label">Currently reading</div>
        <div class="reading-status-name">{{ getBook(libraryBook.id)?.name }}</div>
        <div class="reading-progress-bar">
          <div class="reading-progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="reading-progress-text">{{ libraryProgress }} / {{ readTarget }} clicks</div>
      </div>

      <div v-else-if="libraryReady" class="library-ready-status">
        <i class="ra ra-book"></i> <strong>{{ getBook(libraryReady.id)?.name }}</strong> is ready to forge!
        <span class="ready-hint">Visit the Forge to craft it.</span>
      </div>

      <!-- Book sections -->
      <div v-for="section in sections" :key="section.label" class="library-section">
        <div class="library-section-header">{{ section.label }}</div>
        <div class="library-book-list">
          <div
            v-for="book in section.books"
            :key="book.id"
            class="library-book-row"
            :class="{ 'is-reading': libraryBook?.id === book.id, 'is-ready': libraryReady?.id === book.id }"
          >
            <div class="book-icon" v-html="book.icon"></div>
            <div class="book-info">
              <div class="book-name">
                {{ book.name }}
                <span v-if="craftedLevels[book.id]" class="book-level-badge">Lv {{ craftedLevels[book.id] }}</span>
              </div>
              <div class="book-desc">{{ nextLevel(book)?.label }}</div>
              <div class="book-meta">
                <span><i class="ra ra-book"></i> {{ nextLevel(book)?.readClicks }} clicks</span>
                <span><i class="ra ra-cog"></i> {{ nextLevel(book)?.forgeCost }} scrap to forge</span>
              </div>
            </div>
            <div class="book-action">
              <div v-if="libraryBook?.id === book.id" class="book-reading-indicator">Reading…</div>
              <div v-else-if="libraryReady?.id === book.id" class="book-ready-indicator">Ready ✓</div>
              <div v-else-if="craftedLevels[book.id] >= 3" class="book-maxed">Mastered</div>
              <button
                v-else
                class="book-read-btn"
                :disabled="!!libraryBook || !!libraryReady"
                @click="startReading(book)"
              >
                {{ craftedLevels[book.id] ? `Read Lv ${craftedLevels[book.id] + 1}` : 'Check Out' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button class="library-close-btn" @click="$emit('close')">← Back to Camp</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { LIBRARY_BOOKS, getBook } from "@/utils/libraryBooks";

const props = defineProps({
  libraryBook:    { type: Object,  default: null },
  libraryProgress:{ type: Number,  default: 0 },
  libraryReady:   { type: Object,  default: null },
  craftedLevels:  { type: Object,  default: () => ({}) },
  scrapMetal:     { type: Number,  default: 0 },
});

const emit = defineEmits(["close", "start-reading"]);

const sections = [
  { label: "Weapons",       books: LIBRARY_BOOKS.filter(b => b.type === "weapon") },
  { label: "Weapon Relics", books: LIBRARY_BOOKS.filter(b => b.type === "weapon_relic") },
  { label: "Defense Relics",books: LIBRARY_BOOKS.filter(b => b.type === "defense_relic") },
];

function nextLevel(book) {
  const crafted = props.craftedLevels[book.id] ?? 0;
  return book.levels[crafted] ?? null;
}

const readTarget = computed(() => {
  if (!props.libraryBook) return 23;
  const book = getBook(props.libraryBook.id);
  return book?.levels[props.libraryBook.levelIndex]?.readClicks ?? 23;
});

const progressPct = computed(() => {
  if (!readTarget.value) return 0;
  return Math.min(100, (props.libraryProgress / readTarget.value) * 100);
});

function startReading(book) {
  const crafted = props.craftedLevels[book.id] ?? 0;
  if (crafted >= 3) return;
  emit("start-reading", { id: book.id, type: book.type, levelIndex: crafted });
}
</script>

<style scoped>
@import "./styles/libraryModalStyles.css";
</style>
