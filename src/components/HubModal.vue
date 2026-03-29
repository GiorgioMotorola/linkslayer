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
        <div v-else-if="activeTab === 'quests'" class="hub-tab-pane">
          <slot name="quests" />
          <div class="hub-close-bar">
            <button class="hub-close-btn" @click="$emit('close')">⎯ &nbsp; Close Inventory &nbsp; ⎯</button>
          </div>
        </div>
        <div v-else-if="activeTab === 'newgame'" class="hub-tab-pane hub-newgame-pane">
          <div class="hub-newgame-center">
            <div class="hub-account-section">
              <div class="hub-account-label">Signed in as</div>
              <div class="hub-account-name">{{ getUsername(user) }}</div>
              <div class="hub-username-row">
                <input v-model="newUsername" class="hub-username-input" type="text" placeholder="New username" maxlength="30" @keyup.enter="changeUsername" />
                <button class="hub-username-btn" @click="changeUsername" :disabled="!newUsername.trim() || usernameLoading">
                  {{ usernameLoading ? '...' : 'Change' }}
                </button>
              </div>
              <div v-if="usernameMsg" class="hub-username-msg">{{ usernameMsg }}</div>
            </div>
            <p class="hub-newgame-warning">Starting a new game will delete your current save.</p>
            <button class="hub-newgame-btn" @click="$emit('restart')"><i class="ra ra-sword"></i> Start New Game</button>
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
import { computed, ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  activeTab: { type: String, default: 'backpack' },
  isLoggedIn: { type: Boolean, default: false },
});

const tabs = computed(() => {
  const base = [
    { id: 'backpack', label: 'Backpack' },
    { id: 'map',      label: 'Map' },
    { id: 'journal',  label: 'Journal' },
    { id: 'quests',   label: 'Quests' },
  ];
  if (props.isLoggedIn) base.push({ id: 'newgame', label: 'Game' });
  return base;
});

const { user, getUsername, updateUsername } = useAuth();
const newUsername    = ref('');
const usernameMsg    = ref('');
const usernameLoading = ref(false);

async function changeUsername() {
  const name = newUsername.value.trim();
  if (!name) return;
  usernameLoading.value = true;
  usernameMsg.value = '';
  try {
    await updateUsername(name);
    newUsername.value = '';
    usernameMsg.value = `Username changed to "${name}".`;
  } catch (err) {
    usernameMsg.value = err.message ?? 'Something went wrong.';
  } finally {
    usernameLoading.value = false;
    setTimeout(() => { usernameMsg.value = ''; }, 3000);
  }
}

defineEmits(['close', 'change-tab', 'restart']);
</script>

<style scoped>
@import "./styles/hubModalStyles.css";
</style>
