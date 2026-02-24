// src/composables/useModals.js

import { ref, watch } from "vue";

export function useModals() {
  const showRestModal = ref(false);
  const showShopModal = ref(false);
  const showTipsModal = ref(false);
  const isInventoryModalOpen = ref(false);
  const isMapModalOpen = ref(false);
  const restModalCount = ref(0);

  // Track rest modal opens
  watch(showRestModal, (newValue) => {
    if (newValue) {
      restModalCount.value++;
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
    openInventoryModal,
    closeInventoryModal,
  };
}
