<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="tips-modal-content">
      <button class="close-button" @click="$emit('close')">×</button>
      <h2>How To Play</h2>
      <div class="tips-content">

        <h3>What Is This Game?</h3>
        <p>
          <strong>Linkslayer</strong> is a Tabletop RPG adventure played entirely through
          Wikipedia. A chain of real Wikipedia articles is generated for you, and your goal is to
          navigate from the first article to the next by clicking links within each page — just like
          you would on Wikipedia itself. Along the way you will fight monsters, meet NPCs, discover
          lore, loot gold, and face a final boss.
        </p>

        <h3>Combat</h3>
        <ul>
          <li><strong>Steady Strike</strong> — a reliable auto-hit attack. Safe but modest damage.</li>
          <li><strong>Power Strike</strong> — 1.5× damage, but you need a 7+ on a d20 to connect.</li>
          <li><strong>Reckless Strike</strong> — 2× damage, but requires a 13+ and a miss deals damage to you.</li>
          <li><strong>Class Ability</strong> — your class's unique skill. Powerful but limited uses.</li>
          <li><strong>Defend</strong> — brace for impact, reducing incoming damage by 10%.</li>
          <li><strong>Flee</strong> — roll a d20 (need 7+) to escape. Bosses cannot be fled from.</li>
        </ul>
        <p>
          Enemies can also do more than just attack. They may <strong>Defend</strong> (halving your damage),
          <strong>Steal</strong> gold from you, <strong>Enrage</strong> to hit harder in future turns,
          <strong>Confuse</strong> you to lock out one of your actions, or <strong>Summon</strong>
          reinforcements to restore their HP. Keep an eye on the intent badge so you're never caught off guard.
        </p>

        <h3>Classes</h3>
        <p>
          Your class determines your starting HP, your special ability, and some passive bonuses. Choose
          carefully — each plays very differently:
        </p>
        <ul>
          <li><strong>Fighter</strong> — durable warrior with high damage specials and a stun at Tier 3.</li>
          <li><strong>Wizard</strong> — glass cannon with random high-damage spells and a chance to stun.</li>
          <li><strong>Rogue</strong> — assassin who always skips the enemy's counterattack after a special, with a critical hit chance on normal attacks.</li>
          <li><strong>Paladin</strong> — balanced hybrid who deals damage and heals at the same time.</li>
          <li><strong>Mundane</strong> — starts with nothing special, but unlocks a devastating Grit Surge at Tier 3 based on missing HP.</li>
        </ul>
        <p>
          Class abilities can be <strong>upgraded up to Tier 3</strong> by making offerings at shrine
          encounters. Each tier makes the ability significantly more powerful.
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from "vue";

const emit = defineEmits(["close"]);
</script>

<style scoped>
@import "./styles/tipsModalStyles.css";
</style>
