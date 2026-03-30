(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const COMBAT_BG_BASE = "./assets/curated/combat-backgrounds";

  // Zone title (lowercase partial match) → background image filename.
  // Longer keys win so specific zones like "kurast sewers" beat generic matches like "sewers".
  const ZONE_COMBAT_BG: Record<string, string> = {
    // Act 1
    "forsaken palisade": "moor.webp",
    "blighted moors": "moor.webp",
    "black pit": "den_of_evil.webp",
    "pale fields": "plains.webp",
    "graveyard ridge": "burial_grounds.webp",
    "cairn field": "stony_field.webp",
    "ashfall hamlet": "tristram.webp",
    "hollow passage": "underground_passage.webp",
    "gloamwood": "forest.webp",
    "drowning marsh": "black_marsh.webp",
    "ruined watchtower": "forgotten_tower.webp",
    "monastery gate": "tamoe_highland.webp",
    "outer abbey": "outer_cloister.webp",
    "gate barracks": "barracks.webp",
    "iron cells": "jail.webp",
    "inner cloister": "inner_cloister.webp",
    "black chapel": "cathedral.webp",
    "abbey vault": "catacombs.webp",
    // Act 2
    "oasis refuge": "oasis.webp",
    "shale flats": "rocky_waste.webp",
    "collapsed cisterns": "sewers.webp",
    "dust hills": "dry_hills.webp",
    "buried tomb entries": "halls_of_the_dead.webp",
    "salt oasis": "oasis.webp",
    "sunken archives": "lost_city.webp",
    "worm-tunnels": "maggot_lair.webp",
    "serpent vaults": "valley_of_snakes.webp",
    "veiled court": "harem.webp",
    "lower court": "palace_cellar.webp",
    "star archive": "arcane_sanctuary.webp",
    "sandscript canyon": "canyon_of_the_magi.webp",
    "royal vault": "tal_rasha.webp",
    "royal sepulcher": "tal_rasha.webp",
    // Act 3
    "rotting dock refuge": "jungle.webp",
    "widowwood": "spider_forest.webp",
    "spider hollows": "spider_cavern.webp",
    "fever marsh": "great_marsh.webp",
    "hunter village": "jungle.webp",
    "hunter canopy": "flayer_jungle.webp",
    "drowned causeway": "kurast_sewers.webp",
    "river quarter": "lower_kurast.webp",
    "idol market": "kurast_bazaar.webp",
    "flooded processional": "upper_kurast.webp",
    "temple stairs": "kurast_causeway.webp",
    "idol court": "travincal.webp",
    "corrupted sanctum": "durance_of_hate.webp",
    // Act 4
    "ruined sanctuary": "outer_steppes.webp",
    "burning causeway": "plains_of_despair.webp",
    "chained bastion": "city_of_the_damned.webp",
    "demon forge": "river_of_flame.webp",
    "black gate": "chaos_sanctuary.webp",
    "ashen throne": "chaos_sanctuary.webp",
    // Act 5
    "frosthaven keep": "mountain.webp",
    "siege walls": "mountain.webp",
    "watchfire ridge": "frigid_highlands.webp",
    "icebound river": "frozen_river.webp",
    "tombs of the fallen": "arreat_plateau.webp",
    "white drift cavern": "drifter_cavern.webp",
    "ancient halls": "ancients_way.webp",
    "mourning temple": "nihlathak.webp",
    "glacial tunnels": "glacial_trail.webp",
    "sorrow halls": "ice.webp",
    "frost scar": "frozen_tundra.webp",
    "ruin halls": "cave.webp",
    "the ascent": "arreat_summit.webp",
    "oathbreaker vault": "tomb.webp",
    "summit gate": "arreat_summit.webp",
    "summit citadel": "worldstone_keep.webp",
    "citadel core": "throne_of_destruction.webp",
    "crown of ruin": "throne_of_destruction.webp",
  };

  const ZONE_COMBAT_BG_PATTERNS = Object.entries(ZONE_COMBAT_BG).sort((a, b) => b[0].length - a[0].length);

  function getCombatBackground(zoneTitle: string): string {
    const key = zoneTitle.toLowerCase();
    for (const [pattern, file] of ZONE_COMBAT_BG_PATTERNS) {
      if (key.includes(pattern)) {return `${COMBAT_BG_BASE}/${file}`;}
    }
    return `${COMBAT_BG_BASE}/moor.webp`;
  }

  runtimeWindow.__ROUGE_COMBAT_BG = { getCombatBackground };
})();
