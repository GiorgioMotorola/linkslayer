// Each book has 3 levels. readClicks = how many link clicks to finish reading.
// forgeCost = scrap metal required to craft at the Forge.
// type: "weapon" | "weapon_relic" | "defense_relic"

export const LIBRARY_BOOKS = [
  // ── Weapons ────────────────────────────────────────────────────────────────
  {
    id: "flail",
    type: "weapon",
    name: "Flail",
    icon: '<i class="ra ra-sword"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "Hits all enemies for half damage. 25% stun on hit." },
      { readClicks: 48, forgeCost: 8,  label: "Hits all enemies for half damage. 35% stun on hit." },
      { readClicks: 72, forgeCost: 16, label: "Hits all enemies for half damage. 45% stun on hit." },
    ],
  },
  {
    id: "crossbow",
    type: "weapon",
    name: "Crossbow",
    icon: '<i class="ra ra-sword"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "2× damage + fires a bolt at a second enemy for 10 dmg. 30% bleed on hit." },
      { readClicks: 48, forgeCost: 8,  label: "2× damage + fires a bolt at a second enemy for 10 dmg. 40% bleed on hit." },
      { readClicks: 72, forgeCost: 16, label: "2× damage + fires a bolt at a second enemy for 10 dmg. 50% bleed on hit." },
    ],
  },
  {
    id: "shouting_halberd",
    type: "weapon",
    name: "Shouting Halberd",
    icon: '<i class="ra ra-sword"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "2× damage. On 10+ roll: forces non-targets to flee or trip. 20% weaken on hit." },
      { readClicks: 48, forgeCost: 8,  label: "2× damage. On 10+ roll: forces non-targets to flee or trip. 30% weaken on hit." },
      { readClicks: 72, forgeCost: 16, label: "2× damage. On 10+ roll: forces non-targets to flee or trip. 40% weaken on hit." },
    ],
  },
  {
    id: "rogues_rapier",
    type: "weapon",
    name: "Rogue's Rapier",
    icon: '<i class="ra ra-sword"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "2× damage. On 10+ roll: steal gold. 30% poison on hit." },
      { readClicks: 48, forgeCost: 8,  label: "2× damage. On 10+ roll: steal gold. 40% poison on hit." },
      { readClicks: 72, forgeCost: 16, label: "2× damage. On 10+ roll: steal gold. 50% poison on hit." },
    ],
  },
  {
    id: "librarians_staff",
    type: "weapon",
    name: "Librarian's Staff",
    icon: '<i class="ra ra-sword"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "2× damage. On 10+ roll: sets all non-target enemies on fire. 30% burn on hit." },
      { readClicks: 48, forgeCost: 8,  label: "2× damage. On 10+ roll: sets all non-target enemies on fire. 40% burn on hit." },
      { readClicks: 72, forgeCost: 16, label: "2× damage. On 10+ roll: sets all non-target enemies on fire. 50% burn on hit." },
    ],
  },
  {
    id: "conscriptors_chain",
    type: "weapon",
    name: "Conscriptor's Chain",
    icon: '<i class="ra ra-sword"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "2× damage. On 10+ roll: conscript one enemy to fight for you. 15% restore 8 HP on kill." },
      { readClicks: 48, forgeCost: 8,  label: "2× damage. On 10+ roll: conscript one enemy to fight for you. 22% restore 10 HP on kill." },
      { readClicks: 72, forgeCost: 16, label: "2× damage. On 10+ roll: conscript one enemy to fight for you. 30% restore 14 HP on kill." },
    ],
  },

  // ── Weapon Relics ──────────────────────────────────────────────────────────
  {
    id: "bleedEdge",
    type: "weapon_relic",
    name: "Serrated Edge",
    icon: '<i class="ra ra-flask"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "30% chance on hit: Bleed (2 dmg × 4 turns)." },
      { readClicks: 48, forgeCost: 8,  label: "40% chance on hit: Bleed (2 dmg × 4 turns)." },
      { readClicks: 72, forgeCost: 16, label: "50% chance on hit: Bleed (2 dmg × 4 turns)." },
    ],
  },
  {
    id: "venomCoat",
    type: "weapon_relic",
    name: "Venom Coat",
    icon: '<i class="ra ra-flask"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "30% chance on hit: Poison enemy (−3 def × 3 turns)." },
      { readClicks: 48, forgeCost: 8,  label: "40% chance on hit: Poison enemy (−3 def × 3 turns)." },
      { readClicks: 72, forgeCost: 16, label: "50% chance on hit: Poison enemy (−3 def × 3 turns)." },
    ],
  },
  {
    id: "thunderstrike",
    type: "weapon_relic",
    name: "Thunderstrike Rune",
    icon: '<i class="ra ra-flask"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "25% chance on hit: Stun (skip enemy turn)." },
      { readClicks: 48, forgeCost: 8,  label: "35% chance on hit: Stun (skip enemy turn)." },
      { readClicks: 72, forgeCost: 16, label: "45% chance on hit: Stun (skip enemy turn)." },
    ],
  },
  {
    id: "emberTemper",
    type: "weapon_relic",
    name: "Ember Temper",
    icon: '<i class="ra ra-flask"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "30% chance on hit: Burn (5 dmg × 2 turns)." },
      { readClicks: 48, forgeCost: 8,  label: "40% chance on hit: Burn (5 dmg × 2 turns)." },
      { readClicks: 72, forgeCost: 16, label: "50% chance on hit: Burn (5 dmg × 2 turns)." },
    ],
  },
  {
    id: "cursedRune",
    type: "weapon_relic",
    name: "Cursed Rune",
    icon: '<i class="ra ra-flask"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "20% chance on hit: Weaken enemy (−2 dmg × 3 turns)." },
      { readClicks: 48, forgeCost: 8,  label: "30% chance on hit: Weaken enemy (−2 dmg × 3 turns)." },
      { readClicks: 72, forgeCost: 16, label: "40% chance on hit: Weaken enemy (−2 dmg × 3 turns)." },
    ],
  },
  {
    id: "soulShard",
    type: "weapon_relic",
    name: "Soul Shard",
    icon: '<i class="ra ra-flask"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "15% chance on kill: restore 8 HP." },
      { readClicks: 48, forgeCost: 8,  label: "22% chance on kill: restore 10 HP." },
      { readClicks: 72, forgeCost: 16, label: "30% chance on kill: restore 14 HP." },
    ],
  },

  // ── Defense Relics ─────────────────────────────────────────────────────────
  {
    id: "thornplate",
    type: "defense_relic",
    name: "Thornplate",
    icon: '<i class="ra ra-shield"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "Reflect 2 dmg on every hit taken." },
      { readClicks: 48, forgeCost: 8,  label: "Reflect 3 dmg on every hit taken." },
      { readClicks: 72, forgeCost: 16, label: "Reflect 5 dmg on every hit taken." },
    ],
  },
  {
    id: "stoneskin",
    type: "defense_relic",
    name: "Stoneskin",
    icon: '<i class="ra ra-shield"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "20% chance to fully block any hit." },
      { readClicks: 48, forgeCost: 8,  label: "30% chance to fully block any hit." },
      { readClicks: 72, forgeCost: 16, label: "40% chance to fully block any hit." },
    ],
  },
  {
    id: "bloodpactRune",
    type: "defense_relic",
    name: "Bloodpact Rune",
    icon: '<i class="ra ra-shield"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "When HP < 25%, gain +3 dmg for rest of combat." },
      { readClicks: 48, forgeCost: 8,  label: "When HP < 25%, gain +5 dmg for rest of combat." },
      { readClicks: 72, forgeCost: 16, label: "When HP < 25%, gain +8 dmg for rest of combat." },
    ],
  },
  {
    id: "ironWill",
    type: "defense_relic",
    name: "Iron Will",
    icon: '<i class="ra ra-shield"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "Block the first hit of every combat." },
      { readClicks: 48, forgeCost: 8,  label: "Block the first 2 hits of every combat." },
      { readClicks: 72, forgeCost: 16, label: "Block the first 3 hits of every combat." },
    ],
  },
  {
    id: "wardensWard",
    type: "defense_relic",
    name: "Warden's Ward",
    icon: '<i class="ra ra-shield"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "25% chance to halve incoming damage." },
      { readClicks: 48, forgeCost: 8,  label: "35% chance to halve incoming damage." },
      { readClicks: 72, forgeCost: 16, label: "50% chance to halve incoming damage." },
    ],
  },
  {
    id: "frostbound",
    type: "defense_relic",
    name: "Frostbound",
    icon: '<i class="ra ra-shield"></i>',
    levels: [
      { readClicks: 23, forgeCost: 4,  label: "20% chance to Chill attacker when hit (−1 dmg next hit)." },
      { readClicks: 48, forgeCost: 8,  label: "30% chance to Chill attacker when hit (−1 dmg next hit)." },
      { readClicks: 72, forgeCost: 16, label: "40% chance to Chill attacker when hit (−1 dmg next hit)." },
    ],
  },
];

export function getBook(id) {
  return LIBRARY_BOOKS.find((b) => b.id === id) ?? null;
}
