<template>
  <div class="dog-overlay" @click.self="$emit('named', dogNameInput.trim() || 'Dog')">
    <div class="dog-modal">
      <div class="dog-header">
        <span class="header-ornament">🐶</span>
        <span class="header-title">A New Companion</span>
        <span class="header-ornament">🐶</span>
      </div>
      <p class="dog-prompt">What will you call them?</p>
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
@import "./styles/dogNameModalStyles.css";
</style>
