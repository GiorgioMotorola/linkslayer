<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :style="{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '99999',
        opacity: bgOpacity,
        transition: bgFading ? 'opacity 0.5s ease' : 'none',
      }"
    >
      <img
        :src="logo"
        alt="Link Slayer"
        :style="{
          width: '480px',
          maxWidth: '80vw',
          display: 'block',
          opacity: logoOpacity,
          transition: logoTransitioning ? 'opacity 0.7s ease' : 'none',
        }"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
const logo = new URL("../assets/link-slayer-logo.png", import.meta.url).href;

const emit = defineEmits(["done"]);

const visible = ref(true);
const logoOpacity = ref(0);
const logoTransitioning = ref(false);
const bgOpacity = ref(1);
const bgFading = ref(false);

onMounted(() => {
  document.body.style.overflow = "hidden";

  // Fade logo in
  setTimeout(() => {
    logoTransitioning.value = true;
    logoOpacity.value = 1;
  }, 100);

  // Fade logo out
  setTimeout(() => {
    logoOpacity.value = 0;
  }, 1800);

  // Fade background out
  setTimeout(() => {
    bgFading.value = true;
    bgOpacity.value = 0;
  }, 2600);

  // Done
  setTimeout(() => {
    visible.value = false;
    document.body.style.overflow = "";
    emit("done");
  }, 3200);
});

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>
