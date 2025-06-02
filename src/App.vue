<template>
    <div class="how-to">Start at the first article. Click through Wikipedia links to reach the second destination. Then from the second destination, reach a third and final destination. Then you're done.</div>
  <img :src="scenicLogo" class="logo" alt="Image" width="75" />
  <main class="app-container">
    <GameView />
  </main>
</template>

<script setup>
import GameView from './views/GameView.vue';
import scenicLogo from '@/assets/scenic-logo.png';


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
  max-width: 2000px;
  margin: auto;
  padding: 2rem;
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
  padding: .3rem;
}

body {
  font-size: 14px;
}

.logo {
max-width: 50px;
}
}
</style>
