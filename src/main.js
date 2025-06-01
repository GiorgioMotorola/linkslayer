import { createApp } from 'vue';
import App from './App.vue';
import GameView from './views/GameView.vue';

const routes = [
  { path: '/', component: GameView },
];


createApp(App).mount('#app');
