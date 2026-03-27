export const EXPLORER_MAPS = {
  shipwreck: {
    title: "The Ardent Mara",
    subtitle: "An abandoned ship, lodged impossibly between two hills.",
    gridCols: 9,
    gridRows: 7,
    entrance: "deck",
    exitNode: "exit_point",
    nodes: {
      crows_nest:     { label: "Crow's Nest",     icon: '<i class="ra ra-hole-ladder"></i>', col: 4, row: 1, connections: ["deck"] },
      deck:           { label: "Main Deck",       icon: '<i class="ra ra-anchor"></i>', col: 4, row: 3, isEntrance: true, connections: ["crows_nest", "port_side", "starboard", "cargo_hold"] },
      port_side:      { label: "Port Side",       icon: '<i class="ra ra-grappling-hook"></i>', col: 2, row: 3, connections: ["deck"] },
      starboard:      { label: "Starboard",       icon: '<i class="ra ra-compass"></i>', col: 6, row: 3, connections: ["deck", "captains_cabin"] },
      captains_cabin: { label: "Captain's Cabin", icon: '<i class="ra ra-key"></i>', col: 8, row: 3, connections: ["starboard"] },
      cargo_hold:     { label: "Cargo Hold",      icon: '<i class="ra ra-stack"></i>', col: 4, row: 5, connections: ["deck", "exit_point"] },
      exit_point:     { label: "Exit",            icon: '<i class="ra ra-metal-gate"></i>', col: 4, row: 7, isExit: true, connections: ["cargo_hold"] },
    },
    outcomeNodes: ["crows_nest", "port_side", "starboard", "captains_cabin", "cargo_hold"],
    roomOutcomes: ["chest", "combat", "item", "lore", "empty"],
    loreText: "The pages are waterlogged but legible. The final entry reads: 'Day 47: the hills moved. I swear to God, the hills moved.' Nothing follows.",
    chestGold: [20, 40],
  },

  abandonedtavern: {
    title: "The Abandoned Tavern",
    subtitle: "Full of life. And yet...",
    gridCols: 5,
    gridRows: 9,
    entrance: "tavern_floor",
    exitNode: "front_door",
    nodes: {
      front_door:    { label: "Front Door",     icon: '<i class="ra ra-metal-gate"></i>', col: 3, row: 1, isExit: true,     connections: ["tavern_floor"] },
      tavern_floor:  { label: "Tavern Floor",   icon: '<i class="ra ra-beer"></i>', col: 3, row: 3, isEntrance: true, connections: ["front_door", "violin_corner", "rogue_corner", "the_bar"] },
      violin_corner: {
        label: "Violin Corner", icon: '<i class="ra ra-ocarina"></i>', col: 1, row: 3, outcome: "empty",
        connections: ["tavern_floor"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "at_violin", name,
          text: "A woman in a tattered dress plays a violin alone at a corner table. She doesn't acknowledge your presence. She doesn't stop playing. The melody is beautiful. You are immediately filled with dread.",
          options: [
            { text: "Listen to the music.", result: "explorer_room_damage", amount: 5, responseText: "An overwhelming sense of dread washes over you. Your chest tightens. You take 5 damage." },
          ],
        }}),
      },
      rogue_corner: {
        label: "Rogue's Table", icon: '<i class="ra ra-cloak-and-dagger"></i>', col: 5, row: 3, outcome: "empty",
        connections: ["tavern_floor"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "at_rogue", name,
          text: "A hooded figure sits in the shadows, flipping a coin over and over. Heads. Tails. Heads. Tails. You ask what he would recommend to order. He ignores you.",
          options: [
            { text: "Ask again, louder.", result: "explorer_room_complete", responseText: "He flips the coin one more time. He ignores you again." },
          ],
        }}),
      },
      the_bar: {
        label: "The Bar", icon: '<i class="ra ra-hood"></i>', col: 3, row: 5, outcome: "empty",
        connections: ["tavern_floor", "locked_door"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "at_bar", name,
          text: "The bartender is a gaunt figure polishing a long-cracked glass. He doesn't turn around. 'On the house,' he says, and slides a drink down the bar toward you. As your hand closes around it, it turns to dust and slowly blows away, leaving behind a cold iron key.",
          options: [
            { text: "Pick up the key.", result: "explorer_room_complete", responseText: "The key is cold and heavy. You pocket it." },
          ],
        }}),
      },
      locked_door: {
        label: "Locked Door", icon: '<i class="ra ra-locked-fortress"></i>', col: 1, row: 5, outcome: "empty",
        connections: ["the_bar", "back_hallway"],
        buildEncounter: (name, state) => {
          const barCleared = state?.rooms?.the_bar?.cleared ?? false;
          const text = barCleared
            ? "You press the key against the iron door. It begins to dissolve and the dust seeps into the lock. There is a heavy, resonant click. The door swings open on its own."
            : "A heavy iron door. No visible keyhole. As you push against it, something gives and the latch pops loose from the inside as if the lock was never meant to hold.";
          return { type: "lore", lore: { id: "at_door", name, text,
            options: [
              { text: "Step through.", result: "explorer_room_complete" },
            ],
          }};
        },
      },
      back_hallway: {
        label: "Back Hallway", icon: '<i class="ra ra-torch"></i>', col: 1, row: 7, outcome: "empty",
        connections: ["locked_door", "back_room"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "at_hallway", name,
          text: "You creep slowly through the hallway, straining your eyes trying to see ahead. The darkness is absolute. The air smells of copper and something far older.",
          options: [
            { text: "Press forward.", result: "explorer_room_complete" },
          ],
        }}),
      },
      back_room: {
        label: "Back Room", icon: '<i class="ra ra-skull"></i>', col: 1, row: 9, outcome: "combat",
        connections: ["back_hallway"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "at_boss", name,
          text: "The room opens up. In the center, something stirs... a pile of human remains begins to rise, piece by piece, bone by bone. An executioner's axe scrapes slowly along the stone floor as the thing lifts itself upright and turns toward you.",
          options: [
            { text: "Engage.", result: "explorer_room_combat", miniBossType: "Sentient Pile of Human Remains", responseText: "The remains drag the axe upright. Something where its face should be turns toward you." },
          ],
        }}),
      },
    },
  },

  bobbyshut: {
    title: "Bobby Lasagna's Domain",
    subtitle: "Large footsteps. Everywhere.",
    gridCols: 5,
    gridRows: 3,
    entrance: "hut_clearing",
    exitNode: "retreat_path",
    nodes: {
      hut_clearing: { label: "Hut Clearing", icon: '<i class="ra ra-wooden-sign"></i>', col: 3, row: 1, isEntrance: true, connections: ["hut_door", "search_area", "retreat_path"] },
      hut_door: {
        label: "Hut Door", icon: '<i class="ra ra-metal-gate"></i>', col: 1, row: 1, outcome: "combat",
        connections: ["hut_clearing"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "bz_door", name,
          text: "The hut door is old and gnarled. Something shifts behind it. The wood looks like it breathes.",
          options: [
            { text: "Knock on the door.", result: "explorer_room_combat", miniBossType: "Bobby Lasagna's Hut", responseText: "The hut groans. Legs sprout from its foundation. You are now in combat with a living, breathing hut." },
            { text: "Yell 'Hey Bobby. I'm ready to avenge Bulgresh.'", result: "explorer_room_combat", miniBossType: "Bobby Lasagna", responseText: "A figure emerges from the hut. 'Bulgresh, you say? He had it coming. Prepare to join him.'" },
            { text: "Step back.", flow: "close_encounter" },
          ],
        }}),
      },
      search_area: {
        label: "Overgrown Area", icon: '<i class="ra ra-leaf"></i>', col: 5, row: 1, outcome: "empty",
        connections: ["hut_clearing", "rustling_bushes"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "bz_search", name,
          text: "You meticulously search the overgrown surroundings, finding no immediate sign of Bobby. A hidden thorn bush snags your leg.",
          options: [
            { text: "Push through the thorns.", result: "explorer_room_damage", amount: 10, responseText: "The thorn bush deals 10 damage. You press on." },
          ],
        }}),
      },
      rustling_bushes: {
        label: "Rustling Bushes", icon: '<i class="ra ra-aware"></i>', col: 5, row: 3, outcome: "combat",
        connections: ["search_area"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "bz_bushes", name,
          text: "The bushes rustle. Then go still. Then move again.",
          options: [
            { text: "Ready yourself for combat.", result: "explorer_room_combat", miniBossType: "Bobby Lasagna", responseText: "Bobby Lasagna bursts from the foliage. 'So, you've come to meddle, have you?'" },
            { text: "Turn and run.", flow: "close_encounter" },
          ],
        }}),
      },
      retreat_path: { label: "Retreat", icon: '<i class="ra ra-player-dodge"></i>', col: 3, row: 3, isExit: true, connections: ["hut_clearing"] },
    },
  },

  mysteriouscave: {
    title: "The Mysterious Cave",
    subtitle: "Two paths. Neither promising.",
    gridCols: 5,
    gridRows: 5,
    entrance: "cave_entrance",
    exitNode: "narrow_exit",
    nodes: {
      cave_entrance: { label: "Cave Entrance", icon: '<i class="ra ra-hole-ladder"></i>', col: 3, row: 3, isEntrance: true, connections: ["narrow_path", "wide_path"] },
      narrow_path: {
        label: "Narrow Path", icon: '<i class="ra ra-mountains"></i>', col: 1, row: 3, outcome: "empty",
        connections: ["cave_entrance", "narrow_exit"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "mc_narrow", name,
          text: "You squeeze through a tight passage. It becomes more and more narrow as you go. The walls pressing in, the ceiling dropping.",
          options: [
            { text: "Keep pushing through.", result: "explorer_room_complete", responseText: "You manage to catch yourself and regroup. Daylight somewhere ahead." },
            { text: "Turn back.", flow: "close_encounter" },
          ],
        }}),
      },
      narrow_exit: { label: "Cave Exit", icon: '<i class="ra ra-metal-gate"></i>', col: 1, row: 1, isExit: true, connections: ["narrow_path"] },
      wide_path: {
        label: "Wide Path", icon: '<i class="ra ra-torch"></i>', col: 5, row: 3, outcome: "empty",
        connections: ["cave_entrance", "altar_chamber"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "mc_wide", name,
          text: "The wider path leads deeper into the dark. The air grows colder. The drip of water echoes from all sides.",
          options: [
            { text: "Proceed deeper.", result: "explorer_room_complete" },
            { text: "Turn back.", flow: "close_encounter" },
          ],
        }}),
      },
      altar_chamber: {
        label: "Altar Chamber", icon: '<i class="ra ra-crystal-ball"></i>', col: 5, row: 5, outcome: "combat",
        connections: ["wide_path"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "mc_altar", name,
          text: "A large cavern opens up. In the center, a strange altar flickers with faint, pale light. It glows. It shakes. It emits a heat that raises every hair on your skin.",
          options: [
            { text: "Touch the altar.", result: "explorer_room_combat", miniBossType: "Mind Flayer Spawn", responseText: "'You'll learn to regret touching my altar.'" },
            { text: "'I don't want any part of this.'", flow: "close_encounter" },
          ],
        }}),
      },
    },
  },

  whisperingwell: {
    title: "The Whispering Well",
    subtitle: "The voices are closer now.",
    gridCols: 5,
    gridRows: 7,
    entrance: "tunnel_entry",
    exitNode: "forest_exit",
    nodes: {
      tunnel_entry: { label: "Tunnel Entry", icon: '<i class="ra ra-hole-ladder"></i>', col: 3, row: 1, isEntrance: true, connections: ["cavern_fork"] },
      cavern_fork: {
        label: "Cavern Fork", icon: '<i class="ra ra-trail"></i>', col: 3, row: 3, outcome: "empty",
        connections: ["tunnel_entry", "ladder_passage", "inner_tunnel"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "ww_cavern", name,
          text: "The tunnel opens into a small cavern. A darker passage branches to the left. The main tunnel continues straight and the voices are much closer now.",
          options: [
            { text: "Move carefully through the cavern.", result: "explorer_room_complete" },
            { text: "Charge through yelling and screaming.", result: "explorer_room_combat", miniBossType: "Lich Apprentice", responseText: "Your shouts echo wildly. A monstrous growl answers from the dark." },
          ],
        }}),
      },
      ladder_passage: {
        label: "Ladder Passage", icon: '<i class="ra ra-hole-ladder"></i>', col: 1, row: 3, outcome: "combat",
        connections: ["cavern_fork"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "ww_ladder", name,
          text: "A rickety wooden ladder ascends into what sounds like a very active bandit camp. Boisterous laughter and the clinking of steel filter down from above.",
          options: [
            { text: "Say 'screw it' and go up the ladder.", result: "explorer_room_combat", miniBossType: "Bandit Camp", responseText: "You bravely and foolishly ascend. You're immediately spotted." },
            { text: "Back away quietly.", flow: "close_encounter" },
          ],
        }}),
      },
      inner_tunnel: {
        label: "Inner Tunnel", icon: '<i class="ra ra-leaf"></i>', col: 3, row: 5, outcome: "empty",
        connections: ["cavern_fork", "glow_alcove", "brute_chamber", "forest_exit"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "ww_inner", name,
          text: "The tunnel forks again. A soft, rhythmic glow pulses from the left passage. A heavy, rhythmic thudding echoes from the right.",
          options: [
            { text: "Scout the area before choosing.", result: "explorer_room_complete" },
          ],
        }}),
      },
      glow_alcove: {
        label: "Glow Alcove", icon: '<i class="ra ra-aura"></i>', col: 1, row: 5, outcome: "item",
        connections: ["inner_tunnel"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "ww_glow", name,
          text: "A hidden alcove shimmers with bioluminescent moss. The air here smells faintly of lemon and something older. The moss pulses slowly, like breathing.",
          options: [
            { text: "Consume the moss.", result: "explorer_room_complete", responseText: "It dissolves on your tongue. It tastes faintly of lemon and regret." },
            { text: "Leave it.", flow: "close_encounter" },
          ],
        }}),
      },
      brute_chamber: {
        label: "Brute Chamber", icon: '<i class="ra ra-skull"></i>', col: 5, row: 5, outcome: "combat",
        connections: ["inner_tunnel"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "ww_brute", name,
          text: "A crude underground training area. A hulking figure practices relentlessly with a heavy club, back turned to you. Then it stops. It turns.",
          options: [
            { text: "Engage the brute.", result: "explorer_room_combat", miniBossType: "Lich Apprentice", responseText: "The figure charges." },
            { text: "Retreat before it fully turns.", flow: "close_encounter" },
          ],
        }}),
      },
      forest_exit: { label: "Forest Exit", icon: '<i class="ra ra-metal-gate"></i>', col: 3, row: 7, isExit: true, connections: ["inner_tunnel"] },
    },
  },

  twintrunkedoak: {
    title: "The Sunken Grotto",
    subtitle: "Pirates hid their secrets well.",
    gridCols: 5,
    gridRows: 5,
    entrance: "grotto_entrance",
    exitNode: "river_exit",
    nodes: {
      grotto_entrance: { label: "Grotto Entrance", icon: '<i class="ra ra-ocean-emblem"></i>', col: 3, row: 1, isEntrance: true, connections: ["boulder_chamber"] },
      boulder_chamber: {
        label: "Boulder Chamber", icon: '<i class="ra ra-rune-stone"></i>', col: 3, row: 3, outcome: "empty",
        connections: ["grotto_entrance", "tunnel_fork"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "tt_boulder", name,
          text: "An unusually smooth boulder blocks the passage ahead. Four vertical lines are etched into its surface: 1st, 2nd, 3rd, 4th from left to right. The journal mentioned a pirate shanty: 'three, then one, then four, then two.'",
          options: [
            { text: "Press 3rd, 1st, 4th, 2nd.", result: "explorer_room_complete", responseText: "A deep rumble and the boulder grinds slowly inward. The passage beyond opens." },
            { text: "Press 1st, 2nd, 3rd, 4th.", result: "explorer_room_combat", miniBossType: "Grotto Banshee", responseText: "A mist seeps from the cracks of the boulder. It forms. It screams." },
            { text: "Press 4th, 3rd, 2nd, 1st.", result: "explorer_room_combat", miniBossType: "Grotto Banshee", responseText: "A mist seeps from the cracks of the boulder. It forms. It screams." },
            { text: "Force the boulder open.", result: "explorer_room_combat", miniBossType: "Grotto Banshee", responseText: "A mist seeps from the cracks of the boulder. It forms. It screams." },
          ],
        }}),
      },
      tunnel_fork: {
        label: "Tunnel Fork", icon: '<i class="ra ra-trident"></i>', col: 3, row: 5, outcome: "empty",
        connections: ["boulder_chamber", "treasure_chamber", "river_exit"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "tt_fork", name,
          text: "Beyond the boulder, two tunnels branch away. The left is darker and smells of old iron. The right sounds like rushing water... distant daylight, maybe.",
          options: [
            { text: "Take stock of the passages.", result: "explorer_room_complete" },
          ],
        }}),
      },
      treasure_chamber: {
        label: "Treasure Chamber", icon: '<i class="ra ra-gem"></i>', col: 1, row: 5, outcome: "empty",
        connections: ["tunnel_fork"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "tt_chest", name,
          text: "A small, secluded chamber. In the center sits a sturdy wooden chest bound with iron bands. A numerical lock adorns the front. The journal said: 'adding, subtracting, multiplying, and then adding again...'",
          options: [
            { text: "Enter '10'.", result: "explorer_room_complete", goldBonus: 100, responseText: "With a satisfying click, the lock springs open. Inside gleams a cache of coins." },
            { text: "Enter '5'.", result: "explorer_room_combat", miniBossType: "Grotto Banshee", responseText: "The lock stays shut. Mist seeps from its seams. It screams." },
            { text: "Enter '7'.", result: "explorer_room_combat", miniBossType: "Grotto Banshee", responseText: "The lock stays shut. Mist seeps from its seams. It screams." },
            { text: "Enter '12'.", result: "explorer_room_combat", miniBossType: "Grotto Banshee", responseText: "The lock stays shut. Mist seeps from its seams. It screams." },
          ],
        }}),
      },
      river_exit: { label: "River Exit", icon: '<i class="ra ra-metal-gate"></i>', col: 5, row: 5, isExit: true, connections: ["tunnel_fork"] },
    },
  },

  complinespring: {
    title: "The Compline Cave",
    subtitle: "Time forgot to finish here.",
    gridCols: 5,
    gridRows: 3,
    entrance: "cave_junction",
    exitNode: "exit_door",
    nodes: {
      cave_junction: { label: "Cave Junction", icon: '<i class="ra ra-compass"></i>', col: 3, row: 1, isEntrance: true, connections: ["left_passage", "statue_room"] },
      left_passage: {
        label: "Left Passage", icon: '<i class="ra ra-crossed-bones"></i>', col: 1, row: 1, outcome: "empty",
        connections: ["cave_junction", "exit_door"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "cs_left", name,
          text: "An old canvas bag sits atop a skeleton. It contains 50 gold coins. The rocks seal shut behind you with a deep grinding thud. An opening ahead slowly reveals two doors, side by side.",
          options: [
            { text: "Take Door One and leave.", result: "explorer_room_complete", goldBonus: 50, responseText: "You grab the coins and take Door One. It opens into pale light." },
            { text: "Take Door Two.", result: "explorer_room_combat", responseText: "You open the second door. Something was waiting." },
          ],
        }}),
      },
      statue_room: {
        label: "Statue Room", icon: '<i class="ra ra-hourglass"></i>', col: 5, row: 1, outcome: "empty",
        connections: ["cave_junction"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "cs_statue", name,
          text: "A large statue of an old man sits upon a shattered hourglass. The sand hangs suspended in mid-air, frozen mid-fall. Time forgot to finish here.",
          options: [
            { text: "Touch the sand.", result: "days_increase", amount: 100, responseText: "You feel light, then torn apart. Your bones smash and stretch. You wake up outside. The light is wrong. The seasons are wrong. Fifty days. Gone." },
            { text: "Eat the sand.", result: "days_increase", amount: 100, responseText: "Alright then. Whatever your reasons, they are your own. You feel light, then torn apart. Fifty days. Gone." },
          ],
        }}),
      },
      exit_door: { label: "Exit", icon: '<i class="ra ra-metal-gate"></i>', col: 1, row: 3, isExit: true, connections: ["left_passage"] },
    },
  },

  bunkerscape: {
    title: "The Kidnapper's Bunker",
    subtitle: "Left or right. Choose carefully.",
    gridCols: 5,
    gridRows: 3,
    entrance: "bunker_hallway",
    exitNode: "exit_cellar",
    nodes: {
      bunker_hallway: { label: "Hallway", icon: '<i class="ra ra-player"></i>', col: 3, row: 1, isEntrance: true, connections: ["kidnappers_room", "cellar_stairs"] },
      kidnappers_room: {
        label: "Kidnappers", icon: '<i class="ra ra-beer"></i>', col: 1, row: 1, outcome: "combat",
        connections: ["bunker_hallway"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "bk_kidnappers", name,
          text: "Through a closed door, loud clanking of ale glasses and drunken voices. You open it: a room full of rowdy, startled kidnappers. They all turn to face you.",
          options: [
            { text: "Kick the door down and get your revenge.", result: "explorer_room_combat", miniBossType: "Drunken Kidnappers", responseText: "You smash the door off its hinges. Combat begins." },
            { text: "Back away and shut it quietly.", flow: "close_encounter" },
          ],
        }}),
      },
      cellar_stairs: {
        label: "Cellar Stairs", icon: '<i class="ra ra-hole-ladder"></i>', col: 5, row: 1, outcome: "empty",
        connections: ["bunker_hallway", "exit_cellar"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "bk_stairs", name,
          text: "A set of stairs leads up to a heavy cellar door. Faint night air seeps through the cracks at the edges.",
          options: [
            { text: "Go through the cellar door.", result: "explorer_room_complete", responseText: "You push through. Cool night air hits your face." },
            { text: "Go back.", flow: "close_encounter" },
          ],
        }}),
      },
      exit_cellar: { label: "Exit", icon: '<i class="ra ra-metal-gate"></i>', col: 5, row: 3, isExit: true, connections: ["cellar_stairs"] },
    },
  },

  wizardstower: {
    title: "The Wizard's Tower",
    subtitle: "Something inside refuses to leave.",
    gridCols: 5,
    gridRows: 5,
    entrance: "foyer",
    exitNode: "exit",
    nodes: {
      top_of_tower: {
        label: "Top of Tower", icon: '<i class="ra ra-crystal-ball"></i>', col: 3, row: 1, outcome: "combat",
        connections: ["grand_staircase"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "wt_top", name,
          text: "The wizard's study. Arcane instruments line the walls, dusty tomes stacked in piles. In the center of the room, a strange pulsating orb floats at eye level.",
          options: [
            { text: "Confront the pulsating orb.", result: "explorer_room_combat", miniBossType: "Bog Hag (Wearing the skin of the Wizard)" },
            { text: "Search the study quickly.", result: "explorer_room_loot", amount: 30 },
            { text: "Descend the stairs.", flow: "close_encounter" },
          ],
        }}),
      },
      grand_staircase: {
        label: "Grand Staircase", icon: '<i class="ra ra-hole-ladder"></i>', col: 3, row: 2, outcome: "damage",
        connections: ["foyer", "top_of_tower"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "wt_stairs", name,
          text: "The stairs creak loudly under your weight. Halfway up, a panel flips in the wall and a dozen nails fly toward you.",
          options: [
            { text: "Dodge quickly.", result: "explorer_room_damage", amount: 3, responseText: "A nail grazes your arm. You take 3 damage but press on." },
            { text: "Tank it and push through.", result: "explorer_room_damage", amount: 10, responseText: "Nails pepper your side. You take 10 damage and press on." },
          ],
        }}),
      },
      left_corridor: {
        label: "Left Corridor", icon: '<i class="ra ra-torch"></i>', col: 1, row: 3, outcome: "item",
        connections: ["foyer", "dead_end"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "wt_left", name,
          text: "The corridor is lined with empty shelves and overturned furniture. It smells of dust and something faintly sweet. A discarded vial catches your eye.",
          options: [
            { text: "Pick up the vial.", result: "explorer_room_complete" },
            { text: "Leave it.", flow: "close_encounter" },
          ],
        }}),
      },
      foyer: {
        label: "Foyer", icon: '<i class="ra ra-castle-flag"></i>', col: 3, row: 3, isEntrance: true,
        connections: ["grand_staircase", "left_corridor", "right_corridor", "exit"],
      },
      right_corridor: {
        label: "Right Corridor", icon: '<i class="ra ra-arcane-mask"></i>', col: 5, row: 3, outcome: "empty",
        connections: ["foyer", "monster_lair"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "wt_right", name,
          text: "Surprisingly well-maintained for an abandoned tower. Faded tapestries line the walls. A guttural growl echoes from the ornate door at the end.",
          options: [
            { text: "Move toward the sound.", result: "explorer_room_complete" },
            { text: "Return to the foyer.", flow: "close_encounter" },
          ],
        }}),
      },
      dead_end: {
        label: "Dead End", icon: '<i class="ra ra-barrier"></i>', col: 1, row: 5, outcome: "empty",
        connections: ["left_corridor"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "wt_dead", name,
          text: "The corridor ends abruptly at a solid, unyielding wall. There is no way forward here.",
          options: [
            { text: "Return to the corridor.", result: "explorer_room_complete" },
          ],
        }}),
      },
      exit: {
        label: "Exit", icon: '<i class="ra ra-metal-gate"></i>', col: 3, row: 5, isExit: true,
        connections: ["foyer"],
      },
      monster_lair: {
        label: "Monster Lair", icon: '<i class="ra ra-aware"></i>', col: 5, row: 5, outcome: "combat",
        connections: ["right_corridor"],
        buildEncounter: (name) => ({ type: "lore", lore: { id: "wt_lair", name,
          text: "The growling grows louder. A large, ornate door stands before you, the wood warped and split. Something heavy paces behind it.",
          options: [
            { text: "Brace yourself and open the door.", result: "explorer_room_combat", miniBossType: "Bog Hag (Wearing the skin of the Wizard)" },
            { text: "Return to the corridor.", flow: "close_encounter" },
          ],
        }}),
      },
    },
  },
};

export function buildExplorerState(mapId) {
  const map = EXPLORER_MAPS[mapId];
  if (!map) return null;
  const rooms = {};

  if (map.outcomeNodes && map.roomOutcomes) {
    // Randomized outcomes (shipwreck style)
    const shuffled = [...map.roomOutcomes].sort(() => Math.random() - 0.5);
    map.outcomeNodes.forEach((nodeId, i) => {
      rooms[nodeId] = { outcome: shuffled[i], cleared: false, visited: false };
    });
  } else {
    // Fixed outcomes per node (wizard's tower style)
    Object.entries(map.nodes).forEach(([id, node]) => {
      if (!node.isEntrance && !node.isExit) {
        rooms[id] = { outcome: node.outcome ?? "empty", cleared: false, visited: false };
      }
    });
  }

  return { mapId, playerNode: map.entrance, rooms };
}
