export const WEAPONS = [
  {
    id: "crossbow",
    name: "Crossbow",
    label: "Marksman",
    enrageLabel: "Marksman",
    description: "2× damage strike. Also fires a bolt at a random non-target enemy for 10 damage.",
  },
  {
    id: "flail",
    name: "Flail",
    label: "Sweep",
    enrageLabel: null,
    description: "Power Attack hits ALL living enemies for half normal damage instead of one target.",
  },
  {
    id: "shouting_halberd",
    name: "Shouting Halberd",
    label: "Give Me Blood",
    enrageLabel: "Give Me Blood",
    description: "2× damage strike. Roll the dice — on 10+, shout forces all non-target enemies to flee or trip next round.",
  },
  {
    id: "rogues_rapier",
    name: "Rogue's Rapier",
    label: "Greed is Good",
    enrageLabel: "Greed is Good",
    description: "2× damage strike. Roll the dice — on 10+, steal gold from the target.",
  },
  {
    id: "librarians_staff",
    name: "Librarian's Staff",
    label: "Burn enemies, not books",
    enrageLabel: "Burn enemies, not books",
    description: "2× damage strike. Roll the dice — on 10+, set ALL non-target enemies on fire for 3 rounds.",
  },
  {
    id: "conscriptors_chain",
    name: "Conscriptor's Chain",
    label: "Conscript",
    enrageLabel: "Conscript",
    description: "2× damage strike. Roll the dice — on 10+, drag one enemy to your side. They strike alongside you next attack for equal damage, then fall.",
  },
];

export function getWeapon(id) {
  return WEAPONS.find((w) => w.id === id) ?? null;
}
