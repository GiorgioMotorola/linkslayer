import { ref, watch } from "vue";

export function useModals() {
  const showRestModal = ref(false);
  const showShopModal = ref(false);
  const showTipsModal = ref(false);
  const isInventoryModalOpen = ref(false);
  const isMapModalOpen = ref(false);
  const restModalCount = ref(0);
  const longRestDismissCount = ref(0);
  const showCampfireOverlay = ref(false);
  const campfireReward = ref(null);
  const showRuneCacheModal = ref(false);
  const runeCacheReward = ref(null);

  watch(showRestModal, (newValue) => {
    if (newValue) {
      restModalCount.value++;
    } else if (restModalCount.value > 0 && restModalCount.value % 2 === 0) {
      longRestDismissCount.value++;
    }
  });

  function openInventoryModal() {
    isInventoryModalOpen.value = true;
  }

  function closeInventoryModal() {
    isInventoryModalOpen.value = false;
  }

  return {
    showRestModal,
    showShopModal,
    showTipsModal,
    isInventoryModalOpen,
    isMapModalOpen,
    restModalCount,
    longRestDismissCount,
    showCampfireOverlay,
    campfireReward,
    showRuneCacheModal,
    runeCacheReward,
    openInventoryModal,
    closeInventoryModal,
  };
}
