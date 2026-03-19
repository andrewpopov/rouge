(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const COMBAT_BG_BASE = "./assets/curated/combat-backgrounds";

  // Zone title (lowercase partial match) → background image filename.
  // Zones without a unique image reuse the closest environment-type image.
  const ZONE_COMBAT_BG: Record<string, string> = {
    // Act 1
    "blood moor": "moor.webp",
    "den of evil": "cave.webp",
    "cold plains": "plains.webp",
    "burial grounds": "ruins.webp",
    "stony field": "stony_field.webp",
    "underground passage": "cave.webp",
    "dark wood": "forest.webp",
    "tristram": "tristram.webp",
    "black marsh": "marsh.webp",
    "forgotten tower": "ruins.webp",
    "tamoe highland": "tamoe_highland.webp",
    "outer cloister": "monastery.webp",
    "barracks": "monastery.webp",
    "jail": "cave.webp",
    "inner cloister": "monastery.webp",
    "cathedral": "monastery.webp",
    "catacombs": "cave.webp",
    // Act 2
    "rocky waste": "desert.webp",
    "dry hills": "desert.webp",
    "sewers": "cave.webp",
    "halls of the dead": "tomb.webp",
    "far oasis": "oasis.webp",
    "lost city": "ruins.webp",
    "maggot lair": "cave.webp",
    "valley of snakes": "canyon.webp",
    "harem": "temple.webp",
    "palace cellar": "cave.webp",
    "arcane sanctuary": "temple.webp",
    "canyon of the magi": "canyon.webp",
    "tal rasha": "tomb.webp",
    // Act 3
    "spider forest": "jungle.webp",
    "spider cavern": "cave.webp",
    "great marsh": "marsh.webp",
    "flayer jungle": "jungle.webp",
    "flayer dungeon": "cave.webp",
    "lower kurast": "jungle.webp",
    "kurast bazaar": "jungle.webp",
    "upper kurast": "jungle.webp",
    "kurast causeway": "jungle.webp",
    "kurast sewers": "cave.webp",
    "travincal": "temple.webp",
    "durance of hate": "hell.webp",
    // Act 4
    "outer steppes": "hell.webp",
    "plains of despair": "hell.webp",
    "city of the damned": "hell.webp",
    "river of flame": "hell.webp",
    "chaos sanctuary": "hell.webp",
    // Act 5
    "bloody foothills": "mountain.webp",
    "frigid highlands": "ice.webp",
    "arreat plateau": "ancients_way.webp",
    "crystalline passage": "ice.webp",
    "glacial trail": "ice.webp",
    "frozen tundra": "frozen_tundra.webp",
    "frozen river": "frozen_tundra.webp",
    "nihlathak": "ice.webp",
    "drifter cavern": "cave.webp",
    "infernal pit": "hell.webp",
    "ancient": "ancients_way.webp",
    "arreat summit": "ancients_way.webp",
    "worldstone keep": "worldstone_keep.webp",
    "throne of destruction": "throne_of_destruction.webp",
  };

  function getCombatBackground(zoneTitle: string): string {
    const key = zoneTitle.toLowerCase();
    for (const [pattern, file] of Object.entries(ZONE_COMBAT_BG)) {
      if (key.includes(pattern)) {return `${COMBAT_BG_BASE}/${file}`;}
    }
    return `${COMBAT_BG_BASE}/moor.webp`;
  }

  runtimeWindow.__ROUGE_COMBAT_BG = { getCombatBackground };
})();
