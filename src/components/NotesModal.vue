<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">

      <div class="modal-header">
        <span class="header-ornament">✒️</span>
        <span class="journal-title">Journal</span>
        <span class="header-ornament">✒️</span>
      </div>

      <div class="paper-wrapper">
        <textarea
          v-model="notesContent"
          placeholder="Jot down important clues and observations here..."
          class="notes-textarea"
        ></textarea>
      </div>

      <div class="modal-footer">
        <span class="save-indicator" :class="{ visible: justSaved }">✓ Saved</span>
        <span class="char-count">{{ notesContent.length }} characters</span>
      </div>

      <button class="close-button" @click="closeModal">
        ⎯ &nbsp; Close Journal &nbsp; ⎯
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const emit = defineEmits(["close"]);

const notesContent = ref("");
const justSaved = ref(false);
const LOCAL_STORAGE_KEY = "gameClueNotes";
let saveTimer = null;

onMounted(() => {
  const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedNotes) {
    notesContent.value = savedNotes;
  }
});

watch(notesContent, (newNotes) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, newNotes);
  justSaved.value = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { justSaved.value = false; }, 1800);
});

const closeModal = () => {
  emit("close");
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Leather cover */
.modal-content {
  background: #1e1510;
  background-image:
    radial-gradient(ellipse at 20% 10%, rgba(80, 50, 20, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 90%, rgba(40, 20, 5, 0.5) 0%, transparent 50%);
  border: 3px solid #4a3520;
  border-radius: 5px;
  padding: 22px 24px 18px;
  width: 88%;
  max-width: 580px;
  box-shadow:
    0 12px 45px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(120, 80, 30, 0.25),
    inset 0 0 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Header ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-bottom: 13px;
  border-bottom: 1px solid #3a2810;
}

.journal-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #c8a060;
}

.header-ornament {
  font-size: 13px;
  opacity: 0.75;
}

/* ── Aged paper wrapper ── */
.paper-wrapper {
  border: 1px solid #c4a87a;
  border-radius: 3px;
  box-shadow:
    0 3px 12px rgba(0, 0, 0, 0.5),
    inset 0 0 8px rgba(180, 140, 80, 0.1);
  overflow: hidden;
}

/* ── Lined textarea ── */
.notes-textarea {
  display: block;
  width: 100%;
  min-height: 260px;
  padding: 14px 16px;
  box-sizing: border-box;
  border: none;
  outline: none;
  resize: vertical;

  /* Aged paper */
  background-color: #f5ecd0;
  line-height: 1.6;
  padding-top: 13px;

  color: #2a1e08;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 0.93em;
}

.notes-textarea::placeholder {
  color: #a08850;
  font-style: italic;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2px;
}

.save-indicator {
  font-size: 11px;
  color: #7aaa7a;
  letter-spacing: 1px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.save-indicator.visible {
  opacity: 1;
}

.char-count {
  font-size: 11px;
  color: #6a5030;
  letter-spacing: 0.5px;
}

/* ── Close button ── */
.close-button {
  display: block;
  margin: 2px auto 0;
  padding: 7px 22px;
  background: linear-gradient(135deg, #4a3018 0%, #2e1c08 100%);
  border: 1px solid #6a4828;
  border-radius: 3px;
  color: #c8a060;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.close-button:hover {
  background: linear-gradient(135deg, #5a3a22 0%, #3a2210 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
</style>
