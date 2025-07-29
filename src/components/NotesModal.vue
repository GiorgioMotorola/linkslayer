<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="journal-title">Journal</div>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      <textarea
        v-model="notesContent"
        placeholder="Jot down important clues and observations here..."
        class="notes-textarea"
      ></textarea>
      <div class="modal-footer"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const emit = defineEmits(["close"]);

const notesContent = ref("");
const LOCAL_STORAGE_KEY = "gameClueNotes";

onMounted(() => {
  const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedNotes) {
    notesContent.value = savedNotes;
  }
});

watch(notesContent, (newNotes) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, newNotes);
});

const closeModal = () => {
  emit("close");
};
</script>

<style scoped>
* {
  font-family: "Roboto", sans-serif;
  font-optical-sizing: auto;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #2a2a2aef;
  border: 2px solid #5a5a5a;
  border-radius: 8px;
  padding: 25px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: #e0e0e0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.journal-title {
  font-size: 20px;
}

.modal-header h2 {
  margin: 0;
  color: #f0e68c;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #e0e0e0;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.close-button:hover {
  background-color: #555;
  color: #fff;
}

.notes-textarea {
  width: 100%;
  min-height: 250px;
  padding: 15px;
  border: 1px solid #444;
  border-radius: 5px;
  background-color: #333;
  color: #e0e0e0;
  font-family: "Roboto Mono", monospace;
  font-size: 0.95em;
  resize: vertical;
  outline: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.notes-textarea::placeholder {
  color: #bbb;
}

.notes-textarea:focus {
  border-color: #8c8c8c;
  box-shadow: 0 0 0 2px rgba(140, 140, 140, 0.3);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #444;
}
</style>
