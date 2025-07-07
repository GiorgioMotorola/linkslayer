<!-- ClassSelect.vue -->
<template>
  <div class="modal">
    <div class="class-select">
      <h2>Who Are You?</h2>
      <input v-model="name" placeholder="Enter your name" class="name-input" />
      <h2>Select Your Class</h2>
      <div class="class-grid">
        <div v-for="(c, key) in classes" :key="key" class="class-card">
          <button @click="selectClass(key)">> Select {{ c.name }}</button>
          <div class="desc">{{ c.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { classes } from "@/utils/classes";

const name = ref("");
const emit = defineEmits(["select"]);

function selectClass(classKey) {
  if (!name.value.trim()) {
    alert("Please enter your name.");
    return;
  }

  emit("select", { classKey, name: name.value.trim() });
}
</script>

<style scoped>
* {
  font-family: "IBM Plex Mono", monospace;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.class-select {
  background: #e2e6e7;
  padding: 2rem;
  border-radius: 3px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
  border: 1px solid black;
}

.name-input {
  padding: 6px;
  border-radius: 6px;
  border: 1px solid rgb(156, 4, 4);
  text-align: center;
  font-size: 18px;
}

.class-grid {
  display: grid;
  /* grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); */
  gap: 2rem;
  margin-top: 1rem;
  text-align: left;
}

.class-card {
  background: #e2e6e7;
  /* padding: 1rem; */
  border-radius: 8px;
  /* border: 1px solid #ddd; */
}

button {
  background: #e2e6e7;
  border: none;
  font-size: 18px;
  text-transform: uppercase;
}

.desc {
  font-size: 13px;
}

button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

@keyframes pop-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
