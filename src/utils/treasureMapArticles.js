export const TREASURE_MAP_ARTICLES = [
  "Oak_Island",
  "Voynich_manuscript",
  "Antikythera_mechanism",
  "Hope_Diamond",
  "Amber_Room",
  "Mary_Celeste",
  "Roanoke_Colony",
  "El_Dorado",
  "Atlantis",
  "Bermuda_Triangle",
  "Nazca_Lines",
  "Stonehenge",
  "Easter_Island",
  "Machu_Picchu",
  "Pompeii",
  "Troy",
  "Ark_of_the_Covenant",
  "Holy_Grail",
  "Lost_City_of_Z",
  "Dead_Sea_Scrolls",
  "Rosetta_Stone",
  "Area_51",
  "Blackbeard",
  "Captain_Kidd",
  "Hanging_Gardens_of_Babylon",
];

export function getRandomTreasureMapArticle(existingMaps = []) {
  const usedArticles = new Set(existingMaps.map((m) => m.article));
  const available = TREASURE_MAP_ARTICLES.filter((a) => !usedArticles.has(a));
  const pool = available.length > 0 ? available : TREASURE_MAP_ARTICLES;
  return pool[Math.floor(Math.random() * pool.length)];
}
