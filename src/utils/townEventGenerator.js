// ── Name lists (shared with SettlementModal) ───────────────────────────────
const WORKER_FIRST = ["Aldric","Brynn","Cedric","Dara","Elara","Finn","Gwynn","Hadwin","Isolde","Joren","Kira","Leofric","Maren","Niall","Oren","Petra","Quen","Rowan","Sable","Tomas","Ursa","Vael","Wren","Xyra","Yvaine","Zephyr"];
const WORKER_LAST  = ["Smith","Cooper","Thatcher","Miller","Fletcher","Ward","Mason","Tanner","Sawyer","Fisher","Baker","Potter","Weaver","Carter","Archer","Brewer","Chandler","Dyer","Fuller","Glazer"];

// ── Seeded RNG (mulberry32-ish) ────────────────────────────────────────────
function makeRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return function () {
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff;
  };
}

// ── Resident name from cellIndex + slot ───────────────────────────────────
function residentName(cellIndex, slot) {
  const seed = (cellIndex * 100 + slot) >>> 0;
  const a = Math.imul(seed, 2654435761) >>> 0;
  const b = Math.imul(seed, 2246822519) >>> 0;
  return `${WORKER_FIRST[a % WORKER_FIRST.length]} ${WORKER_LAST[b % WORKER_LAST.length]}`;
}

// Replacement name when a slot's original occupant has died
function replacementName(cellIndex, slot, generation) {
  const seed = (cellIndex * 10000 + slot * 100 + generation + 999) >>> 0;
  const a = Math.imul(seed, 2654435761) >>> 0;
  const b = Math.imul(seed, 2246822519) >>> 0;
  return `${WORKER_FIRST[a % WORKER_FIRST.length]} ${WORKER_LAST[b % WORKER_LAST.length]}`;
}

// ── Extract sentinels from buildings array ─────────────────────────────────
export function getDeadNames(buildings) {
  return (buildings ?? []).find(b => b.type === "__residents__")?.deadNames ?? [];
}

export function getTownLog(buildings) {
  return (buildings ?? []).find(b => b.type === "__townlog__")?.townLog ?? {};
}

// ── Get all living residents across all houses ─────────────────────────────
export function getLivingResidents(buildings, deadNames) {
  const deadSet = new Set(deadNames ?? []);
  const houses = (buildings ?? []).filter(b => b.type === "house");
  const residents = [];
  for (const house of houses) {
    for (let slot = 0; slot < 5; slot++) {
      let name = residentName(house.cellIndex, slot);
      let gen = 0;
      while (deadSet.has(name)) {
        gen++;
        name = replacementName(house.cellIndex, slot, gen);
      }
      residents.push(name);
    }
  }
  return residents;
}

// ── Get all 5 residents for a single house (for the info panel) ────────────
export function getHouseResidents(cellIndex, deadNames) {
  const deadSet = new Set(deadNames ?? []);
  const names = [];
  for (let slot = 0; slot < 5; slot++) {
    let name = residentName(cellIndex, slot);
    let gen = 0;
    while (deadSet.has(name)) {
      gen++;
      name = replacementName(cellIndex, slot, gen);
    }
    names.push(name);
  }
  return names;
}

// ── Generate 3–5 town events for a given day ──────────────────────────────
// Returns { events: string[], newDeaths: string[] }
export function generateDayEvents(buildings, deadNames, day) {
  const residents = getLivingResidents(buildings, deadNames);
  if (residents.length === 0) return { events: [], newDeaths: [] };

  const rng = makeRng(day * 1000 + (buildings?.length ?? 0));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const pickResident = () => pick(residents);

  const has = (type) => (buildings ?? []).some(b => b.type === type);
  const hasTavern       = has("tavern");
  const hasSmithy       = has("smithy");
  const hasFarm         = has("farm");
  const hasCastle       = has("castle");
  const hasGeneralStore = has("general_store");
  const hasBrewery      = has("brewery");
  const hasWell         = has("well");
  const hasBridge       = has("bridge");

  // ── Event pools ────────────────────────────────────────────────────────
  const pool = [];

  // Always available (only requires at least one house)
  pool.push(
    () => `${pickResident()} and ${pickResident()} argued loudly through a shared wall.`,
    () => `${pickResident()} was seen mending a fence post before dawn.`,
    () => `A stray cat appeared on ${pickResident()}'s doorstep and has not left.`,
    () => `${pickResident()} complained the roads were muddy again.`,
    () => `${pickResident()} received a letter from a relative in another town.`,
    () => `${pickResident()} swept their front path twice. Nobody knows why.`,
    () => `${pickResident()} spotted what they called a very large crow perched near the road.`,
    () => `${pickResident()} helped ${pickResident()} carry a heavy load across town.`,
    () => `A traveling merchant briefly stopped at the edge of town before moving on.`,
    () => `${pickResident()} claims to have dreamed of floods three nights running.`,
    () => `A dog belonging to ${pickResident()} got loose and was recovered an hour later.`,
    () => `The sky this morning was a strange shade of orange. ${pickResident()} took it as an omen.`,
    () => `${pickResident()} and ${pickResident()} were seen talking near the road for a long time.`,
    () => `${pickResident()} found an old coin in the mud near their door. No one claimed it.`,
    () => `${pickResident()} reported hearing strange sounds in the night. Nobody else heard anything.`,
    () => `${pickResident()} refused to leave the house today. Did not explain.`,
    () => `${pickResident()} and ${pickResident()} made peace after last week's disagreement. Briefly.`,
    () => `A child — belonging to ${pickResident()}, it's assumed — was found asleep under a cart.`,
    () => `${pickResident()} planted something in the yard. They have not said what.`,
    () => `${pickResident()} saw a shooting star and told everyone about it at length.`,
  );

  if (hasTavern) {
    pool.push(
      () => `${pickResident()} drank far too much at the tavern and had to be helped home by ${pickResident()}.`,
      () => `A fight broke out at the tavern between ${pickResident()} and a stranger passing through. The stranger left.`,
      () => `${pickResident()} was spotted at the tavern at an hour that raised a few eyebrows.`,
      () => `The tavern ran low on ale. ${pickResident()} was reportedly inconsolable.`,
      () => `A bard passed through and played four songs at the tavern. ${pickResident()} wept openly.`,
      () => `${pickResident()} spent the whole evening at the tavern and returned with a suspicious amount of coin.`,
      () => `${pickResident()} bet ${pickResident()} three coins over a dice game at the tavern and lost. Has not spoken of it since.`,
      () => `${pickResident()} told a story at the tavern that no one fully believed.`,
      () => `Someone left a hat at the tavern. ${pickResident()} claimed it even though it does not fit.`,
    );
  }

  if (hasSmithy) {
    pool.push(
      () => `${pickResident()} burned their hand lightly at the smithy. It was not serious, but they mentioned it repeatedly.`,
      () => `The smithy worked late into the night. ${pickResident()} complained about the noise.`,
      () => `${pickResident()} commissioned a new set of hinges from the smithy.`,
      () => `${pickResident()} dropped a freshly forged horseshoe on their foot. ${pickResident()} witnessed it and said nothing.`,
      () => `The smithy's chimney smoked badly today. ${pickResident()} has already filed a complaint with whoever listens to complaints.`,
      () => `${pickResident()} spent the morning at the smithy having a blade re-edged.`,
    );
  }

  if (hasFarm) {
    pool.push(
      () => `${pickResident()} spent the morning pulling weeds at the farm.`,
      () => `The east field yielded an unusually large turnip. ${pickResident()} brought it around to show people.`,
      () => `${pickResident()} spotted a fox near the farm and chased it for some distance.`,
      () => `Rain overnight damaged part of the crop. ${pickResident()} assessed the loss and said it was fine. It was not fine.`,
      () => `${pickResident()} argued with ${pickResident()} about when to rotate the fields. It remains unresolved.`,
      () => `${pickResident()} found a nest of field mice near the grain store. Handled it.`,
    );
  }

  if (hasCastle) {
    pool.push(
      () => `A notice was posted on the castle gate. ${pickResident()} read it aloud for those who couldn't.`,
      () => `${pickResident()} petitioned the castle about a boundary dispute. It is still pending.`,
      () => `Guards at the castle changed shift noisily at midnight. ${pickResident()} did not sleep well.`,
      () => `${pickResident()} was briefly held at the castle gate before being allowed through.`,
      () => `A courier arrived at the castle carrying sealed letters from somewhere distant.`,
      () => `${pickResident()} was seen speaking privately with one of the castle guards for an uncomfortable amount of time.`,
    );
  }

  if (hasGeneralStore) {
    pool.push(
      () => `${pickResident()} spent longer than expected at the general store and came home with less than planned.`,
      () => `${pickResident()} returned an item to the general store. A brief argument followed. No refund was given.`,
      () => `The general store was out of salt. ${pickResident()} was not pleased about this.`,
      () => `${pickResident()} helped restock the shelves at the general store in exchange for a small discount.`,
      () => `${pickResident()} and ${pickResident()} reached for the last candle at the store at the same time.`,
    );
  }

  if (hasBrewery) {
    pool.push(
      () => `A batch at the brewery fermented poorly. ${pickResident()} was blamed.`,
      () => `The brewery was shut briefly for cleaning. ${pickResident()} stood outside waiting.`,
      () => `${pickResident()} was given a sample from the new batch. Their reaction was described as "complicated."`,
      () => `The smell from the brewery was stronger than usual today. ${pickResident()} opened every window.`,
      () => `${pickResident()} claims the brewery has improved significantly and has told everyone.`,
    );
  }

  if (hasWell) {
    pool.push(
      () => `${pickResident()} found something at the bottom of the well. They haven't said what.`,
      () => `${pickResident()} dropped the well bucket and spent twenty minutes recovering it.`,
      () => `There was a brief dispute over well access between ${pickResident()} and ${pickResident()}. Resolved without incident.`,
      () => `The well rope frayed. ${pickResident()} fixed it and mentioned it to everyone they saw.`,
    );
  }

  if (hasBridge) {
    pool.push(
      () => `${pickResident()} fished from the bridge and caught nothing. They stayed for hours.`,
      () => `A plank on the bridge is loose. ${pickResident()} has noticed it. Has not fixed it.`,
      () => `${pickResident()} and ${pickResident()} sat on the bridge at dusk and talked for a long time.`,
    );
  }

  // ── Death event (rare, ~7% per day) ──────────────────────────────────
  const newDeaths = [];
  let deathText = null;
  if (rng() < 0.07 && residents.length > 2) {
    const victim = pickResident();
    const causes = [
      `${victim} passed away quietly in the night. The town mourns.`,
      `${victim} collapsed while working and did not recover. They will be missed.`,
      `${victim} fell ill earlier this week and has since passed. Neighbors left flowers at the door.`,
      `${victim} was found on the road outside town, apparently having lost their footing in the dark. They did not survive.`,
    ];
    deathText = pick(causes);
    newDeaths.push(victim);
  }

  // ── Pick 3–5 events (no duplicates) ───────────────────────────────────
  const count = 3 + Math.floor(rng() * 3); // 3, 4, or 5
  const usedIdx = new Set();
  const events = [];

  if (deathText) events.push(deathText);

  let attempts = 0;
  while (events.length < count && attempts < 200) {
    attempts++;
    const idx = Math.floor(rng() * pool.length);
    if (usedIdx.has(idx)) continue;
    usedIdx.add(idx);
    events.push(pool[idx]());
  }

  return { events, newDeaths };
}
