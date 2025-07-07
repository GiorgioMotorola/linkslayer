<!-- App.vue -->

<template>
  <main class="app-container">
    <GameView />
  </main>
</template>

<script setup>
import GameView from "./views/GameView.vue";
import scenicLogo from "@/assets/scenic-logo.png";
</script>

<style scoped>
body {
  margin: 0;
  background: #f8f9fa;
  color: #222;
  font-weight: 300;
  font-size: 16px;
}
.app-container {
  max-width: 2000px;
  margin: auto;
  padding: 0.5rem;
}

.logo {
  position: absolute;
  top: 0;
  right: 0;
}

.how-to {
  font-size: 15px;
  text-align: center;
}

@media screen and (max-width: 600px) {
  .app-container {
    padding: 0.3rem;
  }

  body {
    font-size: 14px;
  }

  .logo {
    max-width: 50px;
  }

  .how-to {
    font-size: 12px;
    text-align: center;
    margin-right: 2.5rem;
    margin-left: 2.5rem;
  }
}
</style>
