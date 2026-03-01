<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">

      <div class="modal-header">
        <span class="header-ornament">✒️</span>
        <span class="journal-title">Journal</span>
        <span class="header-ornament">✒️</span>
      </div>

      <div v-if="props.playerClass" class="char-sheet">
        <div class="char-sheet-row">
          <span class="char-field"><span class="char-label">👤</span> {{ props.playerName || "Unknown" }}</span>
          <span class="char-field"><span class="char-label">⚔</span> {{ props.playerClass?.name || "—" }}</span>
        </div>
        <div class="char-sheet-row">
          <span class="char-field"><span class="char-label">🗡 Weapon</span> +{{ props.weaponBonus ?? 0 }}</span>
          <span class="char-field"><span class="char-label">🛡 Defense</span> +{{ props.shieldBonus ?? 0 }}</span>
        </div>
        <div v-if="props.playerGoal" class="char-goal">
          <span class="char-label">🎯 Goal</span>
          <span class="char-goal-text">"{{ props.playerGoal }}"</span>
        </div>
      </div>

      <div v-if="currentTierData" class="special-info-pane">
        <div class="special-info-header">
          <span class="special-info-name">✦ {{ currentTierData.name }}</span>
          <span class="special-tier-badge">Tier {{ props.specialTier }}</span>
        </div>
        <div class="special-info-desc">{{ currentTierData.description }}</div>
        <div class="special-tier-dots">
          <span
            v-for="t in 3"
            :key="t"
            class="tier-dot"
            :class="{ 'tier-dot-active': t <= props.specialTier, 'tier-dot-current': t === props.specialTier }"
          >{{ t }}</span>
        </div>
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
import { ref, computed, onMounted, watch } from "vue";

const props = defineProps({
  playerClass: { type: Object, default: null },
  specialTier: { type: Number, default: 1 },
  playerName: { type: String, default: "" },
  weaponBonus: { type: Number, default: 0 },
  shieldBonus: { type: Number, default: 0 },
  playerGoal: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const currentTierData = computed(() => {
  if (!props.playerClass?.specialTiers) return null;
  return props.playerClass.specialTiers[props.specialTier - 1] ?? null;
});

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
  z-index: 2000;
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

/* ── Character sheet ── */
.char-sheet {
  background: rgba(255, 230, 160, 0.06);
  border: 1px solid rgba(180, 130, 40, 0.3);
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.char-sheet-row {
  display: flex;
  gap: 20px;
}

.char-field {
  font-size: 13px;
  color: #c8a060;
  display: flex;
  align-items: center;
  gap: 5px;
}

.char-label {
  font-size: 11px;
  color: #8a6a40;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.char-goal {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 2px;
  border-top: 1px solid rgba(180, 130, 40, 0.2);
  margin-top: 2px;
}

.char-goal-text {
  font-size: 12px;
  color: #b89060;
  font-style: italic;
  line-height: 1.4;
}

/* ── Class Special info pane ── */
.special-info-pane {
  background: rgba(255, 230, 160, 0.08);
  border: 1px solid rgba(180, 130, 40, 0.35);
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.special-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.special-info-name {
  font-size: 13px;
  font-weight: 700;
  color: #d4a845;
  letter-spacing: 0.5px;
}

.special-tier-badge {
  font-size: 10px;
  font-weight: 700;
  color: #8a6a00;
  background: rgba(200, 160, 0, 0.2);
  border: 1px solid rgba(180, 130, 0, 0.4);
  border-radius: 3px;
  padding: 1px 6px;
  letter-spacing: 0.5px;
}

.special-info-desc {
  font-size: 12px;
  color: #b89060;
  font-style: italic;
  line-height: 1.4;
}

.special-tier-dots {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.tier-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid rgba(180, 130, 40, 0.3);
  color: #6a5030;
  background: rgba(100, 70, 20, 0.2);
}

.tier-dot.tier-dot-active {
  border-color: rgba(200, 150, 40, 0.6);
  color: #c8a060;
  background: rgba(140, 100, 20, 0.3);
}

.tier-dot.tier-dot-current {
  border-color: #d4a845;
  color: #f0c060;
  background: rgba(180, 130, 20, 0.4);
  box-shadow: 0 0 6px rgba(210, 160, 30, 0.4);
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
