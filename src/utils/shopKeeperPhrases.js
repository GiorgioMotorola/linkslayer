// src/utils/shopKeeperPhrases.js

const SHOP_PHRASES = [
  "Some may call these treasures. Me, I call them junk.",
  "Looking to improve your gear, eh? Good. Plenty here for a strong adventurer.",
  "Welcome, traveler! Take a look, everything's for sale... at a price.",
  "Got some rare finds today, if you've got the coin for 'em.",
  "Just arrived from a caravan, freshest stock in the lands!",
  "Lost something in the wilds? Perhaps I have a replacement for you.",
  "The world's a dangerous place. Best to be prepared, don't you think?",
  "Ah, a new face! Come on in, don't be shy.",
  "Got a bit of everything for everyone. Even for you, adventurer.",
  "My wares are of the finest quality, hand-picked by yours truly.",
  "Don't mind the dust, it adds character. And value, of course.",
  "Just between you and me, these prices are a steal!",
  "May your coin purse be heavy and your adventures light... on injuries, that is.",
  "Need to stock up? You've come to the right place.",
  "Don't see what you're looking for? Check back later, stock changes often!",
];

export function getRandomShopPhrase() {
  const randomIndex = Math.floor(Math.random() * SHOP_PHRASES.length);
  return `"${SHOP_PHRASES[randomIndex]}"`;
}