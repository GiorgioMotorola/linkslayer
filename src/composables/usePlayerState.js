// src/composables/usePlayerState.js

import { ref, computed } from "vue";

export function usePlayerState(hpCapBonus) {
  const playerClass = ref(null);
  const playerName = ref("");
  const playerHP = ref(0);
  const specialUsesLeft = ref(3);
  const totalSpecialsUsed = ref(0);
  const weaponBonus = ref(0);
  const shieldBonus = ref(0);
  const playerGold = ref(0);
  const shortRestsUsed = ref(0);
  const longRestsUsed = ref(0);

  const effectiveMaxHP = computed(() => {
    return playerClass.value ? playerClass.value.maxHP + hpCapBonus.value : 0;
  });

  return {
    playerClass,
    playerName,
    playerHP,
    specialUsesLeft,
    totalSpecialsUsed,
    weaponBonus,
    shieldBonus,
    playerGold,
    shortRestsUsed,
    longRestsUsed,
    effectiveMaxHP,
  };
}
