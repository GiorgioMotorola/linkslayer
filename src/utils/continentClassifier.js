/**
 * Classifies a Wikipedia article into one of 12 world map continents
 * by matching its visible category names against keyword rules.
 *
 * Priority order matters — first match wins.
 */

export const CONTINENTS = {
  ARTS:        "Realm One",
  BIOGRAPHY:   "Realm Two",
  GEOGRAPHY:   "Realm Three",
  HEALTH:      "Realm Four",
  HISTORY:     "Realm Five",
  MATHEMATICS: "Realm Six",
  NATURE:      "Realm Seven",
  PHILOSOPHY:  "Realm Eight",
  SOCIETY:     "Realm Nine",
  SPORTS:      "Realm Ten",
  TECHNOLOGY:  "Realm Eleven",
};

// Keyword patterns matched against lowercased category titles, in priority order
const CATEGORY_RULES = [
  {
    continent: CONTINENTS.BIOGRAPHY,
    keywords: [" births", " deaths", "people from", "politicians", "actors", "actresses",
               "musicians from", "writers from", "authors from", "scientists from",
               "mathematicians from", "businesspeople", "sportspeople", "nationals of"],
  },
  {
    continent: CONTINENTS.HISTORY,
    keywords: ["wars", "battle of", "empire", "dynasty", "ancient", "medieval",
               "renaissance", "revolution", "history of", "historical",
               "conflicts", "siege of", "rebellion", "crusade"],
  },
  {
    continent: CONTINENTS.GEOGRAPHY,
    keywords: ["national park", "populated places", "cities in", "towns in",
               "villages in", "counties in", "states of", "provinces of",
               "rivers of", "mountains of", "lakes of", "islands of",
               "geography of", "regions of", "districts of"],
  },
  {
    continent: CONTINENTS.MATHEMATICS,
    keywords: ["mathematics", "mathematical", "algebra", "geometry", "calculus",
               "theorem", "number theory", "statistics", "topology", "combinatorics"],
  },
  {
    continent: CONTINENTS.NATURE,
    keywords: ["biology", "chemistry", "physics", "astronomy", "ecology",
               "animals", "plants", "species", "genus", "family (natural",
               "fauna", "flora", "geology", "meteorology", "zoology", "botany",
               "fungi", "bacteria", "dinosaur", "fossil"],
  },
  {
    continent: CONTINENTS.HEALTH,
    keywords: ["medicine", "medical", "disease", "syndrome", "disorder",
               "health", "hospital", "surgery", "drugs", "pharmacology",
               "nutrition", "food and drink", "cuisine"],
  },
  {
    continent: CONTINENTS.PHILOSOPHY,
    keywords: ["philosophy", "philosophical", "religion", "religious", "theology",
               "mythology", "church", "faith", "spirituality", "buddhism",
               "christianity", "islam", "hinduism", "judaism"],
  },
  {
    continent: CONTINENTS.TECHNOLOGY,
    keywords: ["technology", "computing", "software", "hardware", "internet",
               "engineering", "electronics", "telecommunications", "robotics",
               "programming", "artificial intelligence", "video game"],
  },
  {
    continent: CONTINENTS.SPORTS,
    keywords: ["sport", "football", "basketball", "baseball", "tennis",
               "olympic", "soccer", "rugby", "golf", "racing", "swimming",
               "athletics", "cricket", "hockey", "boxing", "wrestling",
               "martial arts", "cycling"],
  },
  {
    continent: CONTINENTS.SOCIETY,
    keywords: ["politics", "political", "law", "legal", "economics", "economic",
               "education", "educational", "culture", "cultural", "society",
               "social", "government", "military units", "organizations"],
  },
  {
    continent: CONTINENTS.ARTS,
    keywords: ["music", "musical", "film", "television", "theatre", "theater",
               "literature", "painting", "sculpture", "architecture", "comics",
               "manga", "anime", "rock group", "rock band", "jazz", "pop music",
               "classical music", "opera", "dance", "poetry", "novel",
               "album", "song", "artist"],
  },
];

/**
 * Fetches categories from the Wikipedia API for a given article title
 * and returns the matching continent name.
 */
export async function classifyArticle(articleTitle) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=categories&cllimit=500&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();

    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    const categories = (page?.categories ?? []).map(c => c.title.toLowerCase());

    console.log('[Classifier]', articleTitle, '→ categories:', categories);

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(kw => categories.some(cat => cat.includes(kw)))) {
        console.log('[Classifier]', articleTitle, '→', rule.continent);
        return rule.continent;
      }
    }
  } catch (e) {
    console.warn("continentClassifier: failed to classify", articleTitle, e);
  }

  // No category match — hash the title to a deterministic realm
  const realms = Object.values(CONTINENTS);
  let hash = 0x811c9dc5;
  for (let i = 0; i < articleTitle.length; i++) {
    hash ^= articleTitle.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const continent = realms[(hash >>> 0) % realms.length];
  console.log('[Classifier]', articleTitle, '→ (no match, hashed to)', continent);
  return continent;
}
