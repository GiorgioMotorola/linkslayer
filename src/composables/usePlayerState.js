import { ref, computed } from "vue";

export function usePlayerState(hpCapBonus) {
  const playerClass = ref(null);
  const playerName = ref("");
  const dogName = ref("");
  const playerHP = ref(0);
  const specialUsesLeft = ref(3);
  const totalSpecialsUsed = ref(0);
  const weaponBonus = ref(0);
  const shieldBonus = ref(0);
  const playerGold = ref(0);
  const shortRestsUsed = ref(0);
  const longRestsUsed = ref(0);
  const playerGoal = ref("");
  const specialTier = ref(1);
  const offeringPot = ref(0);
  const goldSpent = ref(0);
  const campTier = ref(0); // 0=ground, 1=sleeping bag, 2=pillow, 3=tent
  const weaponAugment = ref(""); // installed weapon augment key
  const defenseAugment = ref(""); // installed defense augment key
  const equippedWeapon = ref(null); // equipped special weapon id, null = base sword

  const effectiveMaxHP = computed(() => {
    return playerClass.value ? playerClass.value.maxHP + hpCapBonus.value : 0;
  });

  return {
    playerClass,
    playerName,
    dogName,
    playerHP,
    specialUsesLeft,
    totalSpecialsUsed,
    weaponBonus,
    shieldBonus,
    playerGold,
    shortRestsUsed,
    longRestsUsed,
    playerGoal,
    effectiveMaxHP,
    specialTier,
    offeringPot,
    goldSpent,
    campTier,
    weaponAugment,
    defenseAugment,
    equippedWeapon,
  };
}
