<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="tips-modal-content">
      <button class="close-button" @click="$emit('close')">×</button>
      <h2>Game Tips</h2>
      <div class="tips-content">
        <p>
          Even if you can get to your destinations quickly, it's best to look
          around a bit. There are tough enemies, and the boss is tough as well,
          so it's best to build up your character.
        </p>
        <p>
          Fighting enemies can be deadly. Fleeing is always a good option if the
          dice are in your favor. However, enemies will often drop great loot
          that could quickly build up your character.
        </p>
        <p>
          If you are lost (on an article that doesn't seem at all close to your
          next destination), why not try to "get to a higher ground to find
          something familiar in the distance" (click on familiar things until
          you find something that may connect to your next destination)? For
          instance, you are in...
        </p>
        <p>
          There may be some options that appear to be the right choice, but
          consider your choices carefully. For instance, taking a shortcut may
          seem like a good idea, but it may cut your clicks down far enough to
          prevent a short or long rest trigger. On the other hand, it may get
          you closer...
        </p>
        <p>
          Consider how you think about directions in the real world. You have to
          go down A Street and then turn on B Street, then turn down C Street,
          and so on... If you need to get somewhere, try to think of where you
          need to go several clicks before to get there.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from "vue";

// Define the custom event that this component can emit
const emit = defineEmits(["close"]);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.tips-modal-content {
  background: #f7f7f7;
  padding: 2.5rem;
  border-radius: 10px;
  max-width: 800px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
  text-align: left;
  border: 2px solid #333;
}

.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2.5rem; /* Larger close button */
  color: #333;
  cursor: pointer;
  line-height: 1; /* Adjust vertical alignment */
  padding: 0; /* Remove default padding */
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #a00; /* Redder on hover */
}

h2 {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
  font-size: 3rem;
  color: #005c99;
  text-align: center;
  margin-bottom: 1.5rem;
}

h3 {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
  font-size: 1.8rem;
  color: #02204d;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.3rem;
}

p,
ul {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 1rem;
}

ul {
  list-style-type: disc;
  margin-left: 20px;
  padding-left: 10px;
}

li {
  margin-bottom: 0.5rem;
}

b,
strong {
  font-weight: bold;
  color: #00008b;
}
</style>
