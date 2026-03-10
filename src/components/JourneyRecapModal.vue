<template>
  <div class="recap-overlay">
    <div class="scroll-wrap">
      <div class="scroll-top-rod"></div>
      <div class="scroll-body">
        <div class="scroll-inner">

          <div class="recap-title">{{ type === 'victory' ? '⚔️ A Tale of Valor' : '💀 A Hero Falls' }}</div>
          <div class="recap-divider">✦ ✦ ✦</div>

          <p class="recap-text" v-html="narrative"></p>

          <div class="recap-stats">
            <div class="recap-stat"><span class="rs-label">Days</span><span class="rs-val">{{ daysCount }}</span></div>
            <div class="recap-stat"><span class="rs-label">Roads Walked</span><span class="rs-val">{{ clickCount }}</span></div>
            <div class="recap-stat"><span class="rs-label">Enemies Slain</span><span class="rs-val">{{ enemiesKilled }}</span></div>
            <div class="recap-stat" v-if="weaponBonus > 0"><span class="rs-label">Weapon Forged</span><span class="rs-val">+{{ weaponBonus }}</span></div>
            <div class="recap-stat" v-if="shieldBonus > 0"><span class="rs-label">Shield Reinforced</span><span class="rs-val">+{{ shieldBonus }}</span></div>
            <div class="recap-stat" v-if="goldSpent > 0"><span class="rs-label">Gold Spent</span><span class="rs-val">{{ goldSpent }}g</span></div>
            <div class="recap-stat" v-if="totalSpecialsUsed > 0"><span class="rs-label">Abilities Used</span><span class="rs-val">{{ totalSpecialsUsed }}</span></div>
            <div class="recap-stat" v-if="longRestsUsed > 0 || shortRestsUsed > 0"><span class="rs-label">Rests Taken</span><span class="rs-val">{{ longRestsUsed + shortRestsUsed }}</span></div>
          </div>

          <div class="recap-divider">✦ ✦ ✦</div>

          <button class="recap-continue" @click="$emit('continue')">
            {{ type === 'victory' ? 'Claim Victory' : 'Meet Your Fate' }}
          </button>

        </div>
      </div>
      <div class="scroll-bottom-rod"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  type:             { type: String,  default: 'victory' },
  playerName:       { type: String,  default: 'Adventurer' },
  playerClass:      { type: Object,  default: null },
  daysCount:        { type: Number,  default: 1 },
  clickCount:       { type: Number,  default: 0 },
  weaponBonus:      { type: Number,  default: 0 },
  shieldBonus:      { type: Number,  default: 0 },
  enemiesKilled:    { type: Number,  default: 0 },
  totalSpecialsUsed:{ type: Number,  default: 0 },
  goldSpent:        { type: Number,  default: 0 },
  shortRestsUsed:   { type: Number,  default: 0 },
  longRestsUsed:    { type: Number,  default: 0 },
  dogName:          { type: String,  default: '' },
  lastBattle:       { type: Object,  default: () => ({ enemyName: '', article: '' }) },
});

defineEmits(['continue']);

const className  = computed(() => props.playerClass?.name ?? 'Adventurer');
const dayWord    = computed(() => props.daysCount === 1 ? 'a single day' : `${props.daysCount} days`);

const enemyLabel = computed(() => {
  const n = props.lastBattle?.enemyName;
  const a = props.lastBattle?.article;
  if (n && a && n !== a) return `${a} ${n}`;
  return n || a || 'the darkness';
});

const classVerb = {
  Fighter: 'cut down',
  Rogue:   'vanished into legend after slaying',
  Wizard:  'exhausted their last spell to defeat',
  Paladin: 'smote',
  Mundane: 'somehow bested',
};

const narrative = computed(() => {
  const name  = `<strong>${props.playerName}</strong>`;
  const cls   = className.value;
  const enemy = `<strong>${enemyLabel.value}</strong>`;
  const verb  = classVerb[cls] ?? 'defeated';
  const days  = dayWord.value;
  const roads = props.clickCount;
  const slain = props.enemiesKilled;
  const dog   = props.dogName ? `<strong>${props.dogName}</strong>` : '';

  const weaponLine = props.weaponBonus > 0
    ? ` Their blade was honed ${props.weaponBonus} time${props.weaponBonus > 1 ? 's' : ''}.`
    : ' Their blade was never once sharpened.';

  const shieldLine = props.shieldBonus > 0
    ? ` Their shield was reinforced ${props.shieldBonus} time${props.shieldBonus > 1 ? 's' : ''}.`
    : '';

  const goldLine = props.goldSpent > 0
    ? ` ${props.goldSpent} gold was spent along the way.`
    : '';

  const slainLine = slain === 0
    ? ` They never once drew blood.`
    : slain === 1
    ? ` One enemy fell before them.`
    : ` ${slain} enemies fell before them.`;

  if (props.type === 'victory') {
    const dogLine = dog
      ? ` Their faithful companion ${dog} bit enemies alongside ${name} every step of the way. After they slew ${enemy}, ${name} and ${dog} built a cabin near a river ${dog} loved to play in, and lived out their days in peace.`
      : '';
    return `After ${days} wandering the realm, ${name} the ${cls} ${verb} ${enemy} and the realm was saved. They walked ${roads} road${roads !== 1 ? 's' : ''}.${slainLine}${weaponLine}${shieldLine}${goldLine}${dogLine}`;
  } else {
    const dogLine = dog
      ? ` Their faithful companion ${dog} had bitten enemies alongside ${name}. After ${name} fell, ${dog} finished off the enemy, buried them where they lay, and walked into the sunset looking for their next adventure.`
      : ' Their story ends here.';
    return `${name} the ${cls} fell on day ${props.daysCount}, struck down by ${enemy}. They had walked ${roads} road${roads !== 1 ? 's' : ''}.${slainLine}${weaponLine}${shieldLine}${goldLine}${dogLine}`;
  }
});
</script>

<style scoped>
.recap-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: recap-fade-in 0.6s ease forwards;
}

@keyframes recap-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.scroll-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: clamp(300px, 60vw, 680px);
  animation: scroll-unfurl 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transform-origin: center top;
}

@keyframes scroll-unfurl {
  0%   { transform: scaleY(0.05); opacity: 0; }
  60%  { transform: scaleY(1.03); opacity: 1; }
  100% { transform: scaleY(1);    opacity: 1; }
}

.scroll-top-rod,
.scroll-bottom-rod {
  width: 100%;
  height: 18px;
  background: linear-gradient(to bottom, #8b6914, #c9a227, #8b6914);
  border-radius: 9px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.6);
  position: relative;
  z-index: 1;
}

.scroll-body {
  width: calc(100% - 16px);
  background: linear-gradient(160deg, #f5e9c8 0%, #ede0b0 40%, #e8d89a 100%);
  box-shadow: inset 0 0 40px rgba(160, 120, 40, 0.25), 0 4px 20px rgba(0,0,0,0.5);
  padding: 0;
  position: relative;
}

.scroll-inner {
  padding: 2rem 2.5rem;
}

.recap-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  font-family: Georgia, serif;
  color: #3a2200;
  margin-bottom: 0.4rem;
  letter-spacing: 1px;
}

.recap-divider {
  text-align: center;
  color: #8b6914;
  font-size: 1rem;
  margin: 0.6rem 0;
  letter-spacing: 6px;
}

.recap-text {
  font-family: Georgia, serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: #2a1800;
  text-align: center;
  margin: 0.5rem 0 1.2rem;
}

.recap-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.2rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.recap-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(139, 105, 20, 0.12);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 6px;
  padding: 0.3rem 0.7rem;
  min-width: 80px;
}

.rs-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #7a5500;
  font-family: Georgia, serif;
}

.rs-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: #3a2200;
  font-family: Georgia, serif;
}

.recap-continue {
  display: block;
  margin: 0.5rem auto 0;
  padding: 0.6rem 2rem;
  background: #3a2200;
  color: #f5e9c8;
  border: 2px solid #8b6914;
  border-radius: 6px;
  font-family: Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background 0.2s, color 0.2s;
}

.recap-continue:hover {
  background: #8b6914;
  color: #fff;
}
</style>
