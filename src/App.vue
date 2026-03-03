<!-- App.vue -->

<template>
  <main class="app-container">
    <GameView />
  </main>
</template>

<script setup>
import GameView from "./views/GameView.vue";
</script>

<style scoped>
body {
  margin: 0;
  background: #e2e6e7;
  color: #222;
  font-weight: 300;
  font-size: 16px;
  overflow-x: hidden;
  max-width: 100vw;
}

.app-container {
  max-width: 2000px;
  margin: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

@media screen and (max-width: 600px) {
  .app-container {
    padding: 0.3rem;
    max-width: 100vw;
    overflow-x: hidden;
    width: 100%;
    box-sizing: border-box;
  }

  body {
    font-size: 14px;
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
  }
}
</style>
