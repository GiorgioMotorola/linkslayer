<template>
  <div :class="props.embedded ? 'inventory-embedded' : 'inventory-overlay'" @click.self="props.embedded ? null : closeModal">
    <div class="inventory-content-game-style">
      <button v-if="!props.embedded" @click="closeModal" class="close-button-game-style">⎯ &nbsp; Close Backpack &nbsp; ⎯</button>
      <h2 class="inventory-title">Backpack</h2>

      <div class="inventory-items-container">
        <div v-if="inventory.minorHealthPotions > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Potion of Minor Health</span>
              <span class="item-count"
                >x{{ inventory.minorHealthPotions }}</span
              >
            </div>
            <div class="item-description">{{ itemDesc.minorHealthPotion }}<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('minorHealthPotion')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.healthPotions > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Potion of Major Health</span>
              <span class="item-count">x{{ inventory.healthPotions }}</span>
            </div>
            <div class="item-description">{{ itemDesc.healthPotion }}<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('healthPotion')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.breadcrumbs > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Breadcrumbs</span>
              <span class="item-count">x{{ inventory.breadcrumbs }}</span>
            </div>
            <div class="item-description">A humble handful of crumbs. Restores 5 HP when consumed.<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('breadcrumb')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.turkeyLegs > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Turkey Leg</span>
              <span class="item-count">x{{ inventory.turkeyLegs }}</span>
            </div>
            <div class="item-description">A hearty meal that restores HP.<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div><!-- Turkey Leg: loot-only, not in shopItems -->
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('turkeyLeg')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.barkTeas > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Bark Tea</span>
              <span class="item-count">x{{ inventory.barkTeas }}</span>
            </div>
            <div class="item-description">{{ itemDesc.barkTea }}<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('barkTea')">
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.frenchOnionSoups > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">French Onion Soup</span>
              <span class="item-count">x{{ inventory.frenchOnionSoups }}</span>
            </div>
            <div class="item-description">{{ itemDesc.frenchOnionSoup }}<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('frenchOnionSoup')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.adventurersRations > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Adventurer's Rations</span>
              <span class="item-count"
                >x{{ inventory.adventurersRations }}</span
              >
            </div>
            <div class="item-description">{{ itemDesc.adventurersRations }}<span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span></div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('adventurersRations')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.herbalPoultices > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Herbal Poultice</span>
              <span class="item-count">x{{ inventory.herbalPoultices }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.herbalPoultice }}
              <template v-if="isHealthRegenActive && healthRegenClicksRemaining > 0">
                ({{ healthRegenClicksRemaining }} clicks remaining).
              </template>
              <span class="hp-status"> — HP: {{ playerHP }}/{{ effectiveMaxHP }}</span>
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('herbalPoultice')"
              :disabled="isHealthRegenActive"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.enlightenmentFish > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">The Fish of Eternal Enlightenment</span>
              <span class="item-count"
                >x{{ inventory.enlightenmentFish }} (Heals
                {{ enlightenmentFishHp }} HP)</span
              >
            </div>
            <div class="item-description">
              Collects +1 HP per click. Can be consumed once. Currently {{ enlightenmentFishHp }} HP.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('enlightenmentFish')"
              :disabled="enlightenmentFishHp <= 0"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.antidotes > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Antidote</span>
              <span class="item-count">x{{ inventory.antidotes }}</span>
            </div>
            <div class="item-description">{{ itemDesc.antidote }}</div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('antidote')"
              :disabled="!isPoisoned"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.smokeBombs > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Smoke Bomb</span>
              <span class="item-count">x{{ inventory.smokeBombs }}</span>
            </div>
            <div class="item-description">{{ itemDesc.smokeBomb }}</div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('smokeBomb')"
              :disabled="!isInCombat || isBossEncounter"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.invisibilityCloaks > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Cloak of Invisibility</span>
              <span class="item-count"
                >x{{ inventory.invisibilityCloaks }}</span
              >
            </div>
            <div class="item-description">
              {{ itemDesc.invisibilityCloak }}
              <template v-if="isCloakActive && cloakClicksRemaining > 0">
                ({{ cloakClicksRemaining }} clicks remaining).
              </template>
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('invisibilityCloak')"
              :disabled="isCloakActive"
            >
              Use
            </button>
          </div>
        </div>

        <div
          v-if="inventory.sharedSufferingAmulets > 0"
          class="item-slot-wrapper"
        >
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Amulet of Shared Suffering</span>
              <span class="item-count"
                >x{{ inventory.sharedSufferingAmulets }}</span
              >
            </div>
            <div class="item-description">{{ itemDesc.sharedSufferingAmulet }}</div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('sharedSufferingAmulet')"
              :disabled="!isInCombat"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.compass > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Arcane Compass</span>
              <span class="item-count">x{{ inventory.compass }}</span>
            </div>
            <div class="item-description">{{ itemDesc.compass }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('compass')">
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.stickItem > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">A Cool Stick</span>
              <span class="item-count">x{{ inventory.stickItem }}</span>
            </div>
            <div class="item-description">{{ itemDesc.stickItem }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details disabled-placeholder" disabled>
              N/A
            </button>
          </div>
        </div>

        <div v-if="inventory.coolerStickItem > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">A Cooler Stick</span>
              <span class="item-count">x{{ inventory.coolerStickItem }}</span>
            </div>
            <div class="item-description">{{ itemDesc.coolerStickItem }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details disabled-placeholder" disabled>
              Passive
            </button>
          </div>
        </div>

        <div v-if="inventory.evenCoolerStickItem > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">An Even Cooler Stick</span>
              <span class="item-count">x{{ inventory.evenCoolerStickItem }}</span>
            </div>
            <div class="item-description">{{ itemDesc.evenCoolerStickItem }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details disabled-placeholder" disabled>
              Passive
            </button>
          </div>
        </div>

        <div v-if="inventory.flashPowders > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Flash Powder</span>
              <span class="item-count">x{{ inventory.flashPowders }}</span>
            </div>
            <div class="item-description">{{ itemDesc.flashPowder }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('flashPowder')" :disabled="!isInCombat || isBossEncounter">Use</button>
          </div>
        </div>

        <div v-if="inventory.venomVials > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Venom Vial</span>
              <span class="item-count">x{{ inventory.venomVials }}</span>
            </div>
            <div class="item-description">{{ itemDesc.venomVial }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('venomVial')" :disabled="!isInCombat">Use</button>
          </div>
        </div>

        <div v-if="inventory.serratedDaggers > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Serrated Dagger</span>
              <span class="item-count">x{{ inventory.serratedDaggers }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.serratedDagger }}
              <template v-if="isSerratedDaggerActive"> (Bleed primed on next attack.)</template>
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('serratedDagger')" :disabled="!isInCombat || isSerratedDaggerActive">Use</button>
          </div>
        </div>

        <div v-if="inventory.luckyCoins > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Lucky Coin</span>
              <span class="item-count">x{{ inventory.luckyCoins }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.luckyCoin }}
              <template v-if="isLuckyFleeActive"> (Guaranteed flee ready.)</template>
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('luckyCoin')" :disabled="!isInCombat || isLuckyFleeActive">Use</button>
          </div>
        </div>

        <div v-if="inventory.wardingShields > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Warding Shield</span>
              <span class="item-count">x{{ inventory.wardingShields }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.wardingShield }}
              <template v-if="wardingShieldHitsRemaining > 0"> ({{ wardingShieldHitsRemaining }} hits remaining.)</template>
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('wardingShield')" :disabled="wardingShieldHitsRemaining > 0">Use</button>
          </div>
        </div>

        <div v-if="inventory.wardStones > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Ward Stone</span>
              <span class="item-count">x{{ inventory.wardStones }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.wardStone }}
              <template v-if="isWardStoneActive"> ({{ wardStoneClicksRemaining }} clicks remaining.)</template>
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('wardStone')" :disabled="isWardStoneActive">Use</button>
          </div>
        </div>

        <div v-if="inventory.encounterBeacons > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Encounter Beacon</span>
              <span class="item-count">x{{ inventory.encounterBeacons }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.encounterBeacon }}
              <template v-if="isEncounterBeaconActive"> (Active — next encounter will be a friendly NPC.)</template>
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('encounterBeacon')" :disabled="isEncounterBeaconActive">Use</button>
          </div>
        </div>

        <div v-if="inventory.bountyScrolls > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Bounty Scroll</span>
              <span class="item-count">x{{ inventory.bountyScrolls }}</span>
            </div>
            <div class="item-description">
              {{ itemDesc.bountyScroll }}
              <template v-if="isBountyScrollActive"> (Active — next victory drops loot twice.)</template>
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('bountyScroll')" :disabled="isBountyScrollActive">Use</button>
          </div>
        </div>

        <div v-if="inventory.goldPouches > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Gold Pouch</span>
              <span class="item-count">x{{ inventory.goldPouches }} ({{ goldPouchAccumulatedGold }} gold stored)</span>
            </div>
            <div class="item-description">{{ itemDesc.goldPouch }}</div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('goldPouch')" :disabled="goldPouchAccumulatedGold <= 0">Use</button>
          </div>
        </div>

        <!-- Installed augments -->
        <template v-if="weaponAugment">
          <div class="item-slot-wrapper augment-slot-wrapper">
            <div class="item-details-box">
              <div class="item-name-quantity">
                <span class="item-name">{{ augmentLabel(weaponAugment) }}</span>
                <span class="augment-type-tag">⚔️ Weapon</span>
              </div>
              <div class="item-description">{{ augmentDesc(weaponAugment) }}</div>
            </div>
            <div class="item-button-box">
              <span class="augment-equipped-tag">Equipped</span>
            </div>
          </div>
        </template>

        <template v-if="defenseAugment">
          <div class="item-slot-wrapper augment-slot-wrapper">
            <div class="item-details-box">
              <div class="item-name-quantity">
                <span class="item-name">{{ augmentLabel(defenseAugment) }}</span>
                <span class="augment-type-tag">🛡️ Defense</span>
              </div>
              <div class="item-description">{{ augmentDesc(defenseAugment) }}</div>
            </div>
            <div class="item-button-box">
              <span class="augment-equipped-tag">Equipped</span>
            </div>
          </div>
        </template>

        <!-- Pending (uninstalled) augments -->
        <template v-for="key in uniquePendingWeapon" :key="'pw-' + key">
          <div class="item-slot-wrapper augment-slot-wrapper">
            <div class="item-details-box">
              <div class="item-name-quantity">
                <span class="item-name">{{ augmentLabel(key) }}</span>
                <span class="augment-type-tag">⚔️ Weapon</span>
              </div>
              <div class="item-description">{{ augmentDesc(key) }}</div>
            </div>
            <div class="item-button-box">
              <span class="augment-pending-tag">Install at Forge</span>
            </div>
          </div>
        </template>

        <template v-for="key in uniquePendingDefense" :key="'pd-' + key">
          <div class="item-slot-wrapper augment-slot-wrapper">
            <div class="item-details-box">
              <div class="item-name-quantity">
                <span class="item-name">{{ augmentLabel(key) }}</span>
                <span class="augment-type-tag">🛡️ Defense</span>
              </div>
              <div class="item-description">{{ augmentDesc(key) }}</div>
            </div>
            <div class="item-button-box">
              <span class="augment-pending-tag">Install at Forge</span>
            </div>
          </div>
        </template>

        <div
          v-if="isInventoryEmpty"
          class="item-slot-wrapper no-items-message-wrapper"
        >
          <div class="no-items-message">
            <span>Your Backpack is empty.</span>
          </div>
        </div>
      </div><!-- end backpack tab -->

    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";
import { shopItems } from "@/utils/shopItems.js";

const itemDesc = Object.fromEntries(
  shopItems.filter((i) => i.details && i.description).map((i) => [i.details, i.description])
);

const AUGMENT_LABELS = {
  bleedEdge:    "Serrated Edge",
  venomCoat:    "Venom Coat",
  thunderstrike:"Thunderstrike Rune",
  emberTemper:  "Ember Temper",
  cursedRune:   "Cursed Rune",
  soulShard:    "Soul Shard",
  thornplate:   "Thornplate",
  stoneskin:    "Stoneskin",
  bloodpactRune:"Bloodpact Rune",
  ironWill:     "Iron Will",
  wardensWard:  "Warden's Ward",
  frostbound:   "Frostbound",
};

function augmentLabel(key) { return AUGMENT_LABELS[key] ?? key; }
function augmentDesc(key)  { return itemDesc[key] ?? ""; }

const props = defineProps({
  embedded: { type: Boolean, default: false },
  inventory: {
    type: Object,
    required: true,
  },
  isCloakActive: {
    type: Boolean,
    default: false,
  },
  cloakClicksRemaining: {
    type: Number,
    default: 0,
  },
  isHealthRegenActive: {
    type: Boolean,
    default: false,
  },
  healthRegenClicksRemaining: {
    type: Number,
    default: 0,
  },
  isPoisoned: {
    type: Boolean,
    default: false,
  },
  isInCombat: {
    type: Boolean,
    default: false,
  },
  isBossEncounter: {
    type: Boolean,
    default: false,
  },
  playerHP: {
    type: Number,
    required: true,
  },
  effectiveMaxHP: {
    type: Number,
    required: true,
  },
  isBlurred: {
    type: Boolean,
    default: false,
  },
  enlightenmentFishHp: {
    type: Number,
    default: 0,
  },
  amuletOfSharedSufferingDamage: {
    type: Number,
    default: 0,
  },
  isSerratedDaggerActive: {
    type: Boolean,
    default: false,
  },
  isLuckyFleeActive: {
    type: Boolean,
    default: false,
  },
  wardingShieldHitsRemaining: {
    type: Number,
    default: 0,
  },
  isWardStoneActive: {
    type: Boolean,
    default: false,
  },
  wardStoneClicksRemaining: {
    type: Number,
    default: 0,
  },
  isEncounterBeaconActive: {
    type: Boolean,
    default: false,
  },
  goldPouchAccumulatedGold: {
    type: Number,
    default: 0,
  },
  isBountyScrollActive: {
    type: Boolean,
    default: false,
  },
  isIdle: {
    type: Boolean,
    default: false,
  },
  weaponAugment:          { type: String, default: "" },
  defenseAugment:         { type: String, default: "" },
  pendingWeaponAugments:  { type: Array,  default: () => [] },
  pendingDefenseAugments: { type: Array,  default: () => [] },
});

const emit = defineEmits(["close", "use-item"]);

const uniquePendingWeapon  = computed(() => [...new Set(props.pendingWeaponAugments)]);
const uniquePendingDefense = computed(() => [...new Set(props.pendingDefenseAugments)]);

const isInventoryEmpty = computed(() => {
  if (props.weaponAugment || props.defenseAugment) return false;
  if (props.pendingWeaponAugments.length || props.pendingDefenseAugments.length) return false;
  const skip = new Set(["questScrolls"]);
  for (const key in props.inventory) {
    if (skip.has(key)) continue;
    if (
      Object.prototype.hasOwnProperty.call(props.inventory, key) &&
      typeof props.inventory[key] === "number"
    ) {
      if (props.inventory[key] > 0) return false;
    }
  }
  return true;
});

function closeModal() {
  emit("close");
}

function useItem(itemType) {
  emit("use-item", itemType);
}
</script>

<style scoped>
@import "./styles/inventoryModalStyles.css";
</style>
