<template>
  <div class="hub-overlay" @click.self="$emit('close')">
    <div class="hub-modal">
      <div class="hub-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['hub-tab', { 'hub-tab-active': activeTab === tab.id }]"
          @click="$emit('change-tab', tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="hub-content">
        <div v-if="activeTab === 'backpack'" class="hub-tab-pane">
          <slot name="backpack" />
          <div class="hub-close-bar">
            <button class="hub-close-btn" @click="$emit('close')">⎯ &nbsp; Close Inventory &nbsp; ⎯</button>
          </div>
        </div>
        <div v-else-if="activeTab === 'map'" class="hub-tab-pane">
          <slot name="map" />
          <div class="hub-close-bar">
            <button class="hub-close-btn" @click="$emit('close')">⎯ &nbsp; Close Inventory &nbsp; ⎯</button>
          </div>
        </div>
        <div v-else-if="activeTab === 'journal'" class="hub-tab-pane">
          <slot name="journal" />
          <div class="hub-close-bar">
            <button class="hub-close-btn" @click="$emit('close')">⎯ &nbsp; Close Inventory &nbsp; ⎯</button>
          </div>
        </div>
        <div v-else-if="activeTab === 'newgame'" class="hub-tab-pane hub-newgame-pane">
          <div class="hub-newgame-center">
            <p class="hub-newgame-warning">Starting a new game will delete your current save.</p>
            <button class="hub-newgame-btn" @click="$emit('restart')">⚔ Start New Game</button>
          </div>
          <div class="hub-close-bar">
            <button class="hub-close-btn" @click="$emit('close')">⎯ &nbsp; Close Inventory &nbsp; ⎯</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const tabs = [
  { id: 'backpack', label: '🎒 Backpack' },
  { id: 'map',      label: '🗺 Map' },
  { id: 'journal',  label: '📖 Journal' },
  { id: 'newgame',  label: '⚔ New Game' },
];

defineProps({
  activeTab: { type: String, default: 'backpack' },
});

defineEmits(['close', 'change-tab', 'restart']);
</script>

<style scoped>
.hub-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.hub-modal {
  background: #0e1420;
  border: 1px solid rgba(80, 110, 160, 0.4);
  border-radius: 10px;
  width: 90%;
  max-width: 900px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
  font-family: "IBM Plex Sans", sans-serif;
}

.hub-tabs {
  display: flex;
  border-bottom: 1px solid rgba(80, 110, 160, 0.3);
  background: rgba(8, 12, 24, 0.8);
  flex-shrink: 0;
}

.hub-tab {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 13px;
  font-family: "IBM Plex Sans", sans-serif;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #7a90b0;
  cursor: pointer;
  letter-spacing: 0.4px;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.hub-tab:hover {
  color: #b0c8e8;
  background: rgba(255, 255, 255, 0.04);
}

.hub-tab-active {
  color: #c8dcf4;
  border-bottom-color: #4a7aaa;
  background: rgba(40, 70, 120, 0.12);
}

.hub-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hub-tab-pane {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.hub-close-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 12px 0 14px;
  border-top: 1px solid rgba(80, 110, 160, 0.2);
  margin-top: auto;
}

.hub-close-btn {
  background: transparent;
  color: #7a90b0;
  border: 1px solid rgba(80, 110, 160, 0.35);
  border-radius: 4px;
  padding: 6px 20px;
  font-size: 11px;
  font-family: "IBM Plex Sans", sans-serif;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.hub-close-btn:hover {
  color: #b0c8e8;
  border-color: rgba(80, 110, 160, 0.6);
  background: rgba(255, 255, 255, 0.04);
}

.hub-newgame-pane {
  justify-content: space-between;
}

.hub-newgame-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
}

.hub-newgame-warning {
  color: #e08060;
  font-size: 15px;
  text-align: center;
  border: 1px solid rgba(180, 80, 40, 0.35);
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  background: rgba(100, 40, 15, 0.2);
  max-width: 420px;
}

.hub-newgame-btn {
  background: rgba(120, 30, 20, 0.5);
  color: #f0a080;
  border: 1px solid rgba(180, 60, 40, 0.55);
  border-radius: 6px;
  padding: 0.75rem 2rem;
  font-size: 15px;
  font-family: "IBM Plex Sans", sans-serif;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.hub-newgame-btn:hover {
  background: rgba(160, 40, 25, 0.6);
  border-color: rgba(220, 80, 55, 0.75);
  color: #ffc0a0;
}

@media screen and (max-width: 600px) {
  .hub-modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .hub-tab {
    font-size: 11px;
    padding: 0.6rem 0.4rem;
  }
}
</style>
