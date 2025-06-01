<template>
  <main class="app-container">
    <GameView />
  </main>
</template>

<script setup>
import GameView from './views/GameView.vue';


</script>

<style>
body {
  margin: 0;
  font-family: "Lexend", sans-serif;
  background: #f8f9fa;
  color: #222;
  font-weight: 300;
  font-size: 16px;
}
.app-container {
  max-width: 1200px;
  margin: auto;
  padding: 2rem;
}

@media screen and (max-width: 600px) {
  .app-container {
  padding: .3rem;
}

body {
  font-size: 14px;
}
}
</style>
