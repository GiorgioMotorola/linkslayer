<template>
  <div class="dog-overlay" @click.self="$emit('named', dogNameInput.trim() || 'Dog')">
    <div class="dog-modal">
      <div class="dog-header">
        <span class="header-ornament">🐕</span>
        <span class="header-title">A New Companion</span>
        <span class="header-ornament">🐕</span>
      </div>
      <p class="dog-prompt">The dog looks up at you with bright, eager eyes. What will you call them?</p>
      <input
        ref="inputEl"
        v-model="dogNameInput"
        class="dog-name-input"
        type="text"
        maxlength="24"
        placeholder="Enter a name..."
        @keyup.enter="confirm"
      />
      <button class="dog-confirm-btn" @click="confirm">Name Your Companion</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const emit = defineEmits(["named"]);
const dogNameInput = ref("");
const inputEl = ref(null);

onMounted(() => {
  inputEl.value?.focus();
});

function confirm() {
  emit("named", dogNameInput.value.trim() || "Dog");
}
</script>

<style scoped>
.dog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.dog-modal {
  background: #011316;
  border: 1px solid rgba(100, 140, 60, 0.35);
  border-radius: 8px;
  width: 90%;
  max-width: 380px;
  padding: 28px 28px 24px;
  box-shadow:
    0 10px 50px rgba(0, 0, 0, 0.8),
    inset 0 0 40px rgba(0, 0, 0, 0.4);
  font-family: "IBM Plex Sans", sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.dog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgb(111, 221, 0);
  width: 100%;
}

.header-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #c8b97a;
}

.header-ornament {
  font-size: 18px;
  opacity: 0.85;
}

.dog-prompt {
  font-size: 13px;
  color: #d6ced5;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.dog-name-input {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(100, 140, 60, 0.4);
  border-radius: 5px;
  color: #e8e4d0;
  font-size: 15px;
  font-family: "IBM Plex Sans", sans-serif;
  padding: 8px 14px;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
}

.dog-name-input:focus {
  border-color: rgba(140, 180, 80, 0.6);
}

.dog-confirm-btn {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 5px;
  color: #c8b97a;
  font-size: 12px;
  font-family: "IBM Plex Sans", sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 8px 28px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.dog-confirm-btn:hover {
  background: rgba(55, 85, 25, 0.8);
  border-color: rgba(130, 180, 70, 0.7);
}
</style>
