<template>
  <div class="modal">
    <div class="class-select">
      <div class="journey-prompt">
        {{ journeyOne }}
        <span style="color: darkblue; font-weight: 500">{{
          promptedArticleOne
        }}</span>
        {{ journeyTwo }}
        <span style="color: darkred; font-weight: 500">{{
          promptedArticleTwo
        }}</span>
        {{ journeyThree }}
        <span style="color: darkgreen; font-weight: 500">{{
          promptedArticleThree
        }}</span>
        {{ journeyFour }}
      </div>

      <div class="who-are-you-div"></div>
      <input v-model="name" placeholder="Enter your name" class="name-input" />
      <div class="select-class">Select Your Class</div>
      <div class="class-grid">
        <div v-for="(c, key) in classes" :key="key" class="class-card">
          <button @click="selectClass(key)">> Select {{ c.name }}</button>
          <div class="desc">{{ c.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { classes } from "@/utils/classes";
import prompts from "@/assets/data/prompts.json";

console.log("ClassSelect.vue: Component setup started.");
console.log("Prompts data loaded directly:", prompts);

const name = ref("");
const emit = defineEmits(["select"]);

const journeyOne = ref("");
const journeyTwo = ref("");
const journeyThree = ref("");
const journeyFour = ref("");

const promptedArticleOne = ref("");
const promptedArticleTwo = ref("");
const promptedArticleThree = ref("");

const props = defineProps({
  articleTitle: String,
  start: String,
  targets: String,
  fullChain: Array,
});

console.log(
  "ClassSelect.vue: Initial props received (might be empty):",
  props.fullChain
);

function selectClass(classKey) {
  if (!name.value.trim()) {
    alert("Please enter your name.");
    return;
  }
  emit("select", { classKey, name: name.value.trim() });
}

function loadRandomPrompt() {
  console.log("loadRandomPrompt: Function called.");

  if (!prompts || prompts.length === 0) {
    console.error(
      "loadRandomPrompt: No prompts loaded from JSON or prompts array is empty."
    );
    return;
  }
  console.log("loadRandomPrompt: Prompts array has", prompts.length, "items.");

  const randomIndex = Math.floor(Math.random() * prompts.length);
  const prompt = prompts[randomIndex];
  console.log("loadRandomPrompt: Selected prompt:", prompt);

  journeyOne.value = prompt["journey-one"] || "";
  journeyTwo.value = prompt["journey-two"] || "";
  journeyThree.value = prompt["journey-three"] || "";
  journeyFour.value = prompt["journey-four"] || "";
  console.log(
    "loadRandomPrompt: Journey texts assigned. J1:",
    journeyOne.value,
    "J4:",
    journeyFour.value
  );

  console.log(
    "loadRandomPrompt: Checking fullChain status. Current fullChain:",
    props.fullChain
  );

  if (props.fullChain && props.fullChain.length >= 3) {
    console.log(
      "loadRandomPrompt: fullChain is available and has at least 3 elements. Length:",
      props.fullChain.length
    );

    const slotOneIndex = prompt["article-slot-one"];
    if (
      slotOneIndex !== undefined &&
      props.fullChain[slotOneIndex] !== undefined
    ) {
      promptedArticleOne.value =
        props.fullChain[slotOneIndex].replaceAll("_", " ") ?? "";
      console.log(
        "loadRandomPrompt: Article 1 assigned:",
        promptedArticleOne.value,
        "from index",
        slotOneIndex
      );
    } else {
      promptedArticleOne.value = "";
      console.warn(
        "loadRandomPrompt: Could not assign Article 1. Slot index:",
        slotOneIndex,
        "Full chain:",
        props.fullChain
      );
    }

    const slotTwoIndex = prompt["article-slot-two"];
    if (
      slotTwoIndex !== undefined &&
      props.fullChain[slotTwoIndex] !== undefined
    ) {
      promptedArticleTwo.value =
        props.fullChain[slotTwoIndex].replaceAll("_", " ") ?? "";
      console.log(
        "loadRandomPrompt: Article 2 assigned:",
        promptedArticleTwo.value,
        "from index",
        slotTwoIndex
      );
    } else {
      promptedArticleTwo.value = "";
      console.warn(
        "loadRandomPrompt: Could not assign Article 2. Slot index:",
        slotTwoIndex,
        "Full chain:",
        props.fullChain
      );
    }

    const slotThreeIndex = prompt["article-slot-three"];
    if (
      slotThreeIndex !== undefined &&
      props.fullChain[slotThreeIndex] !== undefined
    ) {
      promptedArticleThree.value =
        props.fullChain[slotThreeIndex].replaceAll("_", " ") ?? "";
      console.log(
        "loadRandomPrompt: Article 3 assigned:",
        promptedArticleThree.value,
        "from index",
        slotThreeIndex
      );
    } else {
      promptedArticleThree.value = "";
      console.warn(
        "loadRandomPrompt: Could not assign Article 3. Slot index:",
        slotThreeIndex,
        "Full chain:",
        props.fullChain
      );
    }
  } else {
    console.warn(
      "loadRandomPrompt: fullChain prop not yet available or does not have at least 3 elements. Articles will not be populated."
    );
    promptedArticleOne.value = "";
    promptedArticleTwo.value = "";
    promptedArticleThree.value = "";
  }
}

watch(
  () => props.fullChain,
  (newChain) => {
    console.log("Watcher: props.fullChain changed. New value:", newChain);
    if (newChain && newChain.length >= 3) {
      console.log(
        "Watcher: fullChain has at least 3 elements. Calling loadRandomPrompt."
      );
      loadRandomPrompt();
    } else {
      console.log(
        "Watcher: fullChain is empty, null, or has fewer than 3 elements. Not calling loadRandomPrompt yet."
      );
    }
  },
  { immediate: true }
);
</script>

<style scoped>
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 7vh;
  z-index: 1000;
}

.class-select {
  background: #e2e6e7;
  padding: 2rem;
  border-radius: 3px;
  text-align: center;
  max-width: 650px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
  border: 1px solid black;
}

.who-are-you-div {
  margin-top: 1rem;
}

.select-class {
  margin-top: 2rem;
  font-size: 30px;
  text-decoration-line: underline;
}

.name-input {
  padding: 5px;
  border-radius: 6px;
  border: 1px solid rgb(156, 4, 4);
  text-align: center;
  font-size: 18px;
}

.class-grid {
  display: grid;
  gap: 2rem;
  margin-top: 1rem;
  text-align: left;
}

.class-card {
  background: #e2e6e7;
  border-radius: 8px;
}

button {
  background: #e2e6e7;
  border: none;
  font-size: 25px;
}

.desc {
  font-size: 15px;
}

button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.journey-prompt {
  font-style: italic;
  color: #1b1b1b;
  text-align: start;
  text-indent: 5rem;
  font-weight: 400;
  font-size: 18px;
}

@keyframes pop-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
