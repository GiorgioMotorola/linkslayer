// src/utils/restPhrases.js

const TAVERN_PHRASES = [
  "The inn is warm. The road was not.",
  "Someone here has had a worse day than you. Probably.",
  "The hearth is going. The ale is cold. This is a good place.",
  "A full house tonight. The noise is almost comfortable.",
  "You settle in. The road can wait until morning.",
  "The smell of roasting meat and old wood. For now, this is enough.",
  "Candles on every table. Someone here cares about atmosphere.",
  "Not a bad inn. Not a good inn. A fine inn.",
  "The barkeep nods at you when you come in. That's enough.",
  "A quieter corner of the world for one night.",
];

const SIP_PHRASES = [
  "The ale is warm and faintly bitter. You don't mind.",
  "A man at the far end of the bar falls asleep mid-sentence. His companion doesn't notice.",
  "The barkeep refills someone's cup without being asked.",
  "Two rangers are arguing about whether a wolf can climb a tree. Neither seems willing to test it.",
  "A coin rolls off a table somewhere. Everyone looks. Nobody moves.",
  "The fire in the hearth pops. A dog near it lifts its head, decides it's nothing, and goes back to sleep.",
  "Someone at a corner table is reading a very small book with a very serious expression.",
  "The musician in the corner plays the same three chords again. Nobody complains. Nobody cheers.",
  "A merchant explains something with great urgency to a man who is clearly not listening.",
  "The ale tastes faintly of something you can't place. You decide not to investigate further.",
  "A chair scrapes across the floor. Heads turn. It's nothing. Heads return.",
  "You study the grain of the bar top. Someone carved 'HERE' into it. Nothing else.",
  "The barkeep says something to the dwarf at the end of the bar. The dwarf laughs too hard for what it probably was.",
  "The room gets a little louder for a moment, then settles again.",
  "Your cup is about half full now. You consider the ceiling.",
  "A pair of old boots hangs above the bar. No one seems to know why. No one asks.",
  "The candles on the tables have burned to different heights. Whoever lights them has a system.",
  "Something drops in the kitchen. A beat of silence. Then conversation resumes.",
  "A very large man at the next table is eating soup with complete concentration.",
  "The ale is better than it has any right to be. You note this.",
];

export function getRandomTavernPhrase() {
  return `"${TAVERN_PHRASES[Math.floor(Math.random() * TAVERN_PHRASES.length)]}"`;
}

export function getRandomSipPhrase() {
  return SIP_PHRASES[Math.floor(Math.random() * SIP_PHRASES.length)];
}

const REST_PHRASES = [
    "Resting under the broad canopy of an ancient oak.",
    "The dappled sunlight filters through the leaves as you rest.",
    "A moment of peace beneath the rustling forest trees.",
    "Leaning against a sturdy trunk, the forest hums around you.",
    "The gentle breeze through the woods soothes your weary bones.",
    "Finding respite in a clearing, surrounded by towering trees.",
    "Perched on a cliffside, the wind whispers tales of the peaks.",
    "Overlooking a vast expanse, you find a quiet spot to recover.",
    "The crisp mountain air invigorates you as you rest.",
    "High above the world, a moment of calm on the rocky slopes.",
    "The gentle lapping of waves provides a calming backdrop for your rest.",
    "Beside a babbling brook, you let the cool air refresh you.",
    "Resting by the water's edge, feeling the soft spray.",
    "Lying in a field of tall grass, watching the clouds drift by.",
    "The open plains stretch around you as you take a much-needed break.",
    "Beneath the wide-open sky, finding rest in the embrace of nature.",
    "Deep within a cool cave, a secure spot to recover.",
    "Finding refuge in a rocky alcove, safe from the elements.",
    "The world fades away for a moment, leaving only the sound of nature.",
    "Surrounded by the natural beauty of the land, you find repose.",
];

export function getRandomRestPhrase() {
  const randomIndex = Math.floor(Math.random() * REST_PHRASES.length);
  return `"${REST_PHRASES[randomIndex]}"`;
}