// src/utils/shopItems.js

export const shopItems = [
  {
    id: "potion_healing",
    name: "Potion of Healing",
    cost: 15,
    effect: "health",
    amount: 15,
    description: "Restores 15 HP instantly.",
  },
  {
    id: "whetstone",
    name: "Whetstone",
    cost: 20,
    effect: "weapon",
    amount: 1,
    description: "Permanently increases your Weapon Damage by 1.",
  },
  {
    id: "sturdy_buckler",
    name: "Sturdy Buckler",
    cost: 20,
    effect: "shield",
    amount: 1,
    description: "Permanently increases your Defense Bonus by 1.",
  },
  {
    id: "tome_knowledge",
    name: "Tome of Knowledge",
    cost: 15,
    effect: "special",
    amount: 1,
    description: "Grants +1 Class Ability Charge.",
  },
  {
    id: "arcane_compass",
    name: "Arcane Compass",
    cost: 25,
    effect: "inventoryItem",
    details: "compass",
    description: "Skips you to a random non-start/end article. Consumable.",
  },
  {
    id: "health_potion_consumable",
    name: "Health Potion",
    cost: 15,
    effect: "inventoryItem",
    details: "healthPotion",
    amount: 30,
    description: "Consumable. Recovers 30 HP when used from inventory.",
  },
];
