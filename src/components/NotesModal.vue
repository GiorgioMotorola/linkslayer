<template>
  <div :class="props.embedded ? 'notes-embedded' : 'modal-overlay'" @click.self="props.embedded ? null : closeModal">
    <div class="modal-content">

      <div class="modal-header">
        <span class="header-ornament"><i class="ra ra-quill-ink"></i></span>
        <span class="journal-title">Journal</span>
        <span class="header-ornament"><i class="ra ra-quill-ink"></i></span>
      </div>

      <div v-if="props.playerClass" class="char-sheet">
        <div class="char-sheet-row">
          <span class="char-field"><span class="char-label"><i class="ra ra-player"></i></span> {{ props.playerName || "Unknown" }}</span>
          <span class="char-field"><span class="char-label"><i class="ra ra-sword"></i></span> {{ props.playerClass?.name || "—" }}</span>
        </div>
        <div v-if="!props.dogName && hasAnyStatus" class="char-sheet-row">
          <span class="char-field status-line">
            <span v-if="props.weaponBonus > 0" class="status-emoji" :title="props.weaponBonus === 1 ? 'Cool Stick' : props.weaponBonus === 2 ? 'Cooler Stick' : 'Even Cooler Stick'"><i class="ra ra-vial"></i>{{ props.weaponBonus === 2 ? ' +2' : props.weaponBonus === 3 ? ' +5' : '' }}</span>
            <span v-if="props.isBlurred" class="status-emoji" title="Drunk"><i class="ra ra-beer"></i></span>
            <span v-if="props.isPlayerPoisoned" class="status-emoji" title="Poisoned"><i class="ra ra-venomous-snake"></i></span>
            <span v-if="props.isEnemyVenomed" class="status-emoji" title="Venom Vial"><i class="ra ra-corked-tube"></i></span>
            <span v-if="props.isEnemyBleeding" class="status-emoji" title="Bleeding"><i class="ra ra-dripping-blade"></i></span>
            <span v-if="props.encounterBeaconActive" class="status-emoji" title="Encounter Beacon"><i class="ra ra-lantern-flame"></i></span>
            <span v-if="props.wardingShieldHitsRemaining > 0" class="status-emoji" title="Warding Shield"><i class="ra ra-aura"></i></span>
            <span v-if="props.healthRegenActive" class="status-emoji" title="Herbal Poultice"><i class="ra ra-leaf"></i></span>
            <span v-if="props.isCloakActive" class="status-emoji" title="Cloak of Invisibility"><i class="ra ra-crystal-wand"></i></span>
          </span>
        </div>
        <div class="char-sheet-row">
          <span class="char-field"><span class="char-label"><i class="ra ra-plain-dagger"></i> Weapon</span> +{{ props.weaponBonus ?? 0 }}</span>
          <span class="char-field"><span class="char-label"><i class="ra ra-shield"></i> Defense</span> +{{ props.shieldBonus ?? 0 }}</span>
        </div>
        <div v-if="props.playerGoal" class="char-goal">
          <span class="char-label"><i class="ra ra-archery-target"></i> Goal</span>
          <span class="char-goal-text">"{{ props.playerGoal }}"</span>
        </div>
      </div>

      <div v-if="props.dogName" class="dog-pane" @click="petDog" title="Pet the dog!">
        <div class="dog-pane-left">
          <span class="dog-pane-emoji"><i class="ra ra-pawprint"></i></span>
        </div>
        <div class="dog-pane-info">
          <div class="dog-pane-name-line">
            <span class="dog-pane-name">{{ props.dogName }}</span>
            <span class="dog-pane-sep"> | </span>
            <span class="dog-pane-type">Dog</span>
            <span v-if="props.weaponBonus > 0" class="status-emoji" :title="props.weaponBonus === 1 ? 'Cool Stick' : props.weaponBonus === 2 ? 'Cooler Stick' : 'Even Cooler Stick'"><i class="ra ra-vial"></i>{{ props.weaponBonus === 2 ? ' +2' : props.weaponBonus === 3 ? ' +5' : '' }}</span>
            <span v-if="props.isBlurred" class="status-emoji" title="Drunk"><i class="ra ra-beer"></i></span>
            <span v-if="props.isPlayerPoisoned" class="status-emoji" title="Poisoned"><i class="ra ra-venomous-snake"></i></span>
            <span v-if="props.isEnemyVenomed" class="status-emoji" title="Venom Vial"><i class="ra ra-corked-tube"></i></span>
            <span v-if="props.isEnemyBleeding" class="status-emoji" title="Bleeding"><i class="ra ra-dripping-blade"></i></span>
            <span v-if="props.encounterBeaconActive" class="status-emoji" title="Encounter Beacon"><i class="ra ra-lantern-flame"></i></span>
            <span v-if="props.wardingShieldHitsRemaining > 0" class="status-emoji" title="Warding Shield"><i class="ra ra-aura"></i></span>
            <span v-if="props.healthRegenActive" class="status-emoji" title="Herbal Poultice"><i class="ra ra-leaf"></i></span>
            <span v-if="props.isCloakActive" class="status-emoji" title="Cloak of Invisibility"><i class="ra ra-crystal-wand"></i></span>
          </div>
          <div class="dog-pane-stat">+2 dmg per hit</div>
        </div>
        <div v-if="heartCount > 0" class="hearts-container">
          <span v-for="i in heartCount" :key="i" class="floating-heart"><i class="ra ra-two-hearts"></i></span>
        </div>
      </div>

      <div v-if="currentTierData" class="special-info-pane">
        <div class="special-info-header">
          <span class="special-info-name">✦ {{ currentTierData.name }}</span>
          <span class="special-tier-badge">Tier {{ props.specialTier }}</span>
        </div>
        <div class="special-info-desc">{{ currentTierData.description }}</div>
        <div class="special-tier-dots">
          <span
            v-for="t in 3"
            :key="t"
            class="tier-dot"
            :class="{ 'tier-dot-active': t <= props.specialTier, 'tier-dot-current': t === props.specialTier }"
          >{{ t }}</span>
        </div>
      </div>

      <div class="paper-wrapper">
        <textarea
          v-model="notesContent"
          placeholder="Jot down important clues and observations here..."
          class="notes-textarea"
        ></textarea>
      </div>

      <div class="modal-footer">
        <span class="save-indicator" :class="{ visible: justSaved }">✓ Saved</span>
        <span class="char-count">{{ notesContent.length }} characters</span>
      </div>

      <button v-if="!props.embedded" class="close-button" @click="closeModal">
        ⎯ &nbsp; Close Journal &nbsp; ⎯
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const props = defineProps({
  embedded: { type: Boolean, default: false },
  playerClass: { type: Object, default: null },
  specialTier: { type: Number, default: 1 },
  playerName: { type: String, default: "" },
  weaponBonus: { type: Number, default: 0 },
  shieldBonus: { type: Number, default: 0 },
  playerGoal: { type: String, default: "" },
  dogName: { type: String, default: "" },
  isBlurred: { type: Boolean, default: false },
  isPlayerPoisoned: { type: Boolean, default: false },
  isCloakActive: { type: Boolean, default: false },
  wardStoneActive: { type: Boolean, default: false },
  healthRegenActive: { type: Boolean, default: false },
  encounterBeaconActive: { type: Boolean, default: false },
  wardingShieldHitsRemaining: { type: Number, default: 0 },
  isEnemyVenomed: { type: Boolean, default: false },
  isEnemyBleeding: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const currentTierData = computed(() => {
  if (!props.playerClass?.specialTiers) return null;
  return props.playerClass.specialTiers[props.specialTier - 1] ?? null;
});

const hasAnyStatus = computed(() =>
  props.weaponBonus > 0 ||
  props.isBlurred ||
  props.isPlayerPoisoned ||
  props.isEnemyVenomed ||
  props.isEnemyBleeding ||
  props.encounterBeaconActive ||
  props.wardingShieldHitsRemaining > 0 ||
  props.healthRegenActive ||
  props.isCloakActive
);

const heartCount = ref(0);
let heartTimer = null;

function petDog() {
  heartCount.value = 3;
  clearTimeout(heartTimer);
  heartTimer = setTimeout(() => { heartCount.value = 0; }, 1500);
}

const notesContent = ref("");
const justSaved = ref(false);
const LOCAL_STORAGE_KEY = "gameClueNotes";
let saveTimer = null;

onMounted(() => {
  const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedNotes) {
    notesContent.value = savedNotes;
  }
});

watch(notesContent, (newNotes) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, newNotes);
  justSaved.value = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { justSaved.value = false; }, 1800);
});

const closeModal = () => {
  emit("close");
};
</script>

<style scoped>
@import "./styles/notesModalStyles.css";
</style>
