// src/utils/restPhrases.js

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