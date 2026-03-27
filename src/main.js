import { createApp } from 'vue';
import '@/assets/Rpg-Awesome-master/Rpg-Awesome-master/css/rpg-awesome.css';
import App from './App.vue';
import GameView from './views/GameView.vue';

const routes = [
  { path: '/', component: GameView },
];


createApp(App).mount('#app');
