// randomPair.js

const WIKI_ARTICLES = [
  "T-shirt",
  "Shirt",
  "Underwear",
];

export function getRandomChain(length = 3) {
  const shuffled = [...WIKI_ARTICLES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, length); 
}