/**
 * Classifies a Wikipedia article into one of 12 world map continents
 * by checking its portal categories via the Wikipedia API.
 *
 * Priority order matters — if an article matches multiple portals,
 * the first match in the list wins.
 */

export const CONTINENTS = {
  ARTS:        "The Gilded Expanse",
  BIOGRAPHY:   "The Hall of Names",
  GEOGRAPHY:   "The Known Lands",
  HEALTH:      "The Healer's Isle",
  HISTORY:     "The Ancient Reaches",
  MATHEMATICS: "The Arcane Wastes",
  NATURE:      "The Wilds",
  PHILOSOPHY:  "The Sacred Grounds",
  SOCIETY:     "The Grand Forum",
  SPORTS:      "The Arena",
  TECHNOLOGY:  "The Iron Kingdoms",
  UNCHARTED:   "The Void",
};

// Portal category keywords → continent, in priority order
const PORTAL_RULES = [
  { keywords: ["portal:biography", "portal:people"],                         continent: CONTINENTS.BIOGRAPHY },
  { keywords: ["portal:history"],                                             continent: CONTINENTS.HISTORY },
  { keywords: ["portal:geography", "portal:places"],                         continent: CONTINENTS.GEOGRAPHY },
  { keywords: ["portal:mathematics", "portal:math"],                         continent: CONTINENTS.MATHEMATICS },
  { keywords: ["portal:science", "portal:nature", "portal:biology",
               "portal:ecology", "portal:environment", "portal:physics",
               "portal:chemistry", "portal:astronomy"],                       continent: CONTINENTS.NATURE },
  { keywords: ["portal:medicine", "portal:health", "portal:food"],           continent: CONTINENTS.HEALTH },
  { keywords: ["portal:philosophy", "portal:religion", "portal:mythology"],  continent: CONTINENTS.PHILOSOPHY },
  { keywords: ["portal:technology", "portal:computing", "portal:engineering",
               "portal:internet"],                                             continent: CONTINENTS.TECHNOLOGY },
  { keywords: ["portal:sports", "portal:games", "portal:recreation",
               "portal:olympics"],                                             continent: CONTINENTS.SPORTS },
  { keywords: ["portal:society", "portal:politics", "portal:law",
               "portal:economics", "portal:education", "portal:culture"],    continent: CONTINENTS.SOCIETY },
  { keywords: ["portal:arts", "portal:music", "portal:film", "portal:television",
               "portal:literature", "portal:theatre", "portal:comics",
               "portal:anime", "portal:architecture"],                        continent: CONTINENTS.ARTS },
];

/**
 * Fetches categories from the Wikipedia API for a given article title
 * and returns the matching continent name.
 */
export async function classifyArticle(articleTitle) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=categories&cllimit=50&clshow=!hidden&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();

    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    const categories = (page?.categories ?? []).map(c => c.title.toLowerCase());

    for (const rule of PORTAL_RULES) {
      if (rule.keywords.some(kw => categories.some(cat => cat.includes(kw)))) {
        return rule.continent;
      }
    }
  } catch (e) {
    console.warn("continentClassifier: failed to classify", articleTitle, e);
  }

  return CONTINENTS.UNCHARTED;
}
