(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ICON_BASE = "./assets/curated/icons";
  const SPRITE_BASE = "./assets/curated/sprites";
  const PORTRAIT_BASE = "./assets/curated/portraits";

  // ── Card Icons ──
  // Explicit mappings for authored cards; fallback uses effect-based selection.
  const CARD_ICONS: Record<string, string> = {
    strike: `${ICON_BASE}/cards/01_steam-blast.svg`,
    defend: `${ICON_BASE}/cards/09_valve.svg`,
    fireball: `${ICON_BASE}/cards/04_laser-blast.svg`,
    ice_bolt: `${ICON_BASE}/cards/02_bolt-bomb.svg`,
    lightning: `${ICON_BASE}/cards/19_tesla-coil.svg`,
    poison_dagger: `${ICON_BASE}/cards/03_drill.svg`,
    shield_bash: `${ICON_BASE}/cards/05_overdrive.svg`,
    heal: `${ICON_BASE}/cards/13_battery-plus.svg`,
    cleave: `${ICON_BASE}/cards/06_cogsplosion.svg`,
    whirlwind: `${ICON_BASE}/cards/16_radar-sweep.svg`,
    charge: `${ICON_BASE}/cards/08_walking-turret.svg`,
    iron_skin: `${ICON_BASE}/cards/17_power-generator.svg`,
    power_strike: `${ICON_BASE}/cards/07_spark-plug.svg`,
    multi_shot: `${ICON_BASE}/cards/15_smoke-bomb.svg`,
    inner_sight: `${ICON_BASE}/cards/11_bellows.svg`,
    slow_missiles: `${ICON_BASE}/cards/10_steam.svg`,
    war_cry: `${ICON_BASE}/cards/18_nuclear-plant.svg`,
    berserk: `${ICON_BASE}/cards/24_energy-tank.svg`,
    bone_spear: `${ICON_BASE}/cards/22_pipes.svg`,
    corpse_explosion: `${ICON_BASE}/cards/21_coal-pile.svg`,
  };

  const ATTACK_ICONS = [
    `${ICON_BASE}/cards/01_steam-blast.svg`,
    `${ICON_BASE}/cards/02_bolt-bomb.svg`,
    `${ICON_BASE}/cards/03_drill.svg`,
    `${ICON_BASE}/cards/04_laser-blast.svg`,
    `${ICON_BASE}/cards/05_overdrive.svg`,
    `${ICON_BASE}/cards/06_cogsplosion.svg`,
  ];

  const SKILL_ICONS = [
    `${ICON_BASE}/cards/09_valve.svg`,
    `${ICON_BASE}/cards/10_steam.svg`,
    `${ICON_BASE}/cards/11_bellows.svg`,
    `${ICON_BASE}/cards/12_plug.svg`,
    `${ICON_BASE}/cards/13_battery-plus.svg`,
    `${ICON_BASE}/cards/17_power-generator.svg`,
  ];

  // ── Enemy Icons (SVG fallbacks for enemies without sprites) ──
  const ENEMY_SVGS = [
    `${ICON_BASE}/enemies/01_steam-locomotive.svg`,
    `${ICON_BASE}/enemies/02_iron-hulled-warship.svg`,
    `${ICON_BASE}/enemies/03_dreadnought.svg`,
    `${ICON_BASE}/enemies/04_gas-mask.svg`,
    `${ICON_BASE}/enemies/05_mechanical-arm.svg`,
    `${ICON_BASE}/enemies/06_walking-turret.svg`,
    `${ICON_BASE}/enemies/07_laser-turret.svg`,
    `${ICON_BASE}/enemies/08_spoutnik.svg`,
    `${ICON_BASE}/enemies/09_satellite.svg`,
    `${ICON_BASE}/enemies/10_tesla.svg`,
    `${ICON_BASE}/enemies/11_frankenstein-creature.svg`,
    `${ICON_BASE}/enemies/12_zeppelin.svg`,
  ];

  // ── UI Icons ──
  const UI_ICONS: Record<string, string> = {
    hp: `${ICON_BASE}/ui/hp_life-bar.svg`,
    energy: `${ICON_BASE}/ui/energy_battery-50.svg`,
    guard: `${ICON_BASE}/ui/power_plug.svg`,
    burn: `${ICON_BASE}/ui/heat_radiations.svg`,
    turn: `${ICON_BASE}/ui/turn_pocket-watch.svg`,
    alert: `${ICON_BASE}/ui/alert_wall-light.svg`,
    crit: `${ICON_BASE}/ui/crit_cross-flare.svg`,
    idea: `${ICON_BASE}/ui/idea_light-bulb.svg`,
  };

  // ── Intent Icons ──
  const INTENT_ICONS: Record<string, string> = {
    attack: `${ICON_BASE}/cards/01_steam-blast.svg`,
    guard: `${ICON_BASE}/cards/09_valve.svg`,
    buff: `${ICON_BASE}/cards/13_battery-plus.svg`,
    debuff: `${ICON_BASE}/cards/14_battery-minus.svg`,
    heal: `${ICON_BASE}/cards/13_battery-plus.svg`,
    unknown: `${ICON_BASE}/ui/idea_light-bulb.svg`,
  };

  // ── Class Portraits ──
  const CLASS_PORTRAITS: Record<string, string> = {
    amazon: `${PORTRAIT_BASE}/amazon.png`,
    assassin: `${PORTRAIT_BASE}/assassin.png`,
    barbarian: `${PORTRAIT_BASE}/barbarian.png`,
    druid: `${PORTRAIT_BASE}/druid.png`,
    necromancer: `${PORTRAIT_BASE}/necromancer.png`,
    paladin: `${PORTRAIT_BASE}/paladin.png`,
    sorceress: `${PORTRAIT_BASE}/sorceress.png`,
  };

  function simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function getCardIcon(cardId: string, effects?: CardEffect[]): string {
    if (CARD_ICONS[cardId]) {return CARD_ICONS[cardId];}
    // Plus variants: strip _plus suffix
    const baseId = cardId.replace(/_plus$/, "");
    if (CARD_ICONS[baseId]) {return CARD_ICONS[baseId];}
    // Fallback: pick based on whether card has damage effects
    const hasDamage = effects?.some((e) => e.kind === "damage") ?? false;
    const pool = hasDamage ? ATTACK_ICONS : SKILL_ICONS;
    return pool[simpleHash(cardId) % pool.length];
  }

  const TEMPLATE_ID_RE = /^act_\d+_(.+)_(raider|ranged|support|brute|base|boss|alt|elite(?:_.*)?)$/;

  // Sprites that exist in assets/curated/sprites/enemies/
  const KNOWN_ENEMY_SPRITES = new Set([
    "abominable","baal_s_minion","baboon_demon","bat_demon","blood_hawk",
    "blood_hawk_nest","blood_lord","blunderbore","bone_fetish","catapult",
    "claw_viper","corrupt_rogue","corrupt_rogue_archer","corrupt_rogue_spearwoman",
    "council_member","death_mauler","demon_imp","fallen","fallen_shaman",
    "fetish","fetish_shaman","fire_tower","flying_scimitar","frog_demon",
    "frozen_horror","gargoyle_trap","giant_mosquito","giant_spider","goatman",
    "leaper","lightning_spire","megademon","minion_of_destruction","mummy",
    "mummy_sarcophagus","oblivion_knight","overseer","pain_worm",
    "reanimated_horde","regurgitator","reziarfg","sabre_cat","sand_maggot",
    "sand_maggot_egg","sand_maggot_young","sand_raider","scarab_demon",
    "siege_beast","skeleton","skeleton_archer","skeleton_mage","slinger",
    "spike_fiend","stygian_fury","succubus","suicide_minion","swarm",
    "tainted","undead_horror","vampire","vile_child","vile_mother",
    "vulture_demon","wendigo","willowisp","wraith","zakarum_priest",
    "zakarum_zealot","zombie",
  ]);

  // D2 variant names → base sprite that exists
  const VARIANT_SPRITE_MAP: Record<string, string> = {
    dark_hunter: "corrupt_rogue_archer",
    dark_ranger: "corrupt_rogue_archer",
    dark_spearwoman: "corrupt_rogue_spearwoman",
    black_rogue: "corrupt_rogue",
    dark_stalker: "corrupt_rogue",
    vile_hunter: "corrupt_rogue_archer",
    vile_lancer: "corrupt_rogue_spearwoman",
    flesh_hunter: "corrupt_rogue_archer",
    night_clan: "goatman",
    blood_clan: "goatman",
    moon_clan: "goatman",
    hell_clan: "goatman",
    death_clan: "goatman",
    bone_warrior: "skeleton",
    bone_archer: "skeleton_archer",
    bone_mage: "skeleton_mage",
    burning_dead: "skeleton",
    burning_dead_archer: "skeleton_archer",
    burning_dead_mage: "skeleton_mage",
    horror: "skeleton",
    horror_archer: "skeleton_archer",
    horror_mage: "skeleton_mage",
    returned: "skeleton",
    returned_archer: "skeleton_archer",
    returned_mage: "skeleton_mage",
    hungry_dead: "zombie",
    ghoul: "zombie",
    drowned_carcass: "zombie",
    plague_bearer: "zombie",
    cadaver: "zombie",
    brute: "wendigo",
    gargantuan_beast: "wendigo",
    yeti: "wendigo",
    carver: "fallen",
    carver_shaman: "fallen_shaman",
    devilkin: "fallen",
    devilkin_shaman: "fallen_shaman",
    dark_one: "fallen",
    dark_one_shaman: "fallen_shaman",
    warped_one: "fallen",
    warped_shaman: "fallen_shaman",
    quill_rat: "spike_fiend",
    thorn_beast: "spike_fiend",
    razor_spine: "spike_fiend",
    foul_crow: "blood_hawk",
    foul_crow_nest: "blood_hawk_nest",
    black_raptor: "blood_hawk",
    black_vulture_nest: "blood_hawk_nest",
    cloud_stalker: "blood_hawk",
    cloud_stalker_nest: "blood_hawk_nest",
    huntress: "sabre_cat",
    spear_cat: "sabre_cat",
    night_tiger: "sabre_cat",
    hell_cat: "sabre_cat",
    cave_leaper: "leaper",
    tomb_creeper: "leaper",
    tree_lurker: "leaper",
    sand_leaper: "leaper",
    dung_soldier: "scarab_demon",
    sand_warrior: "sand_raider",
    marauder: "sand_raider",
    invader: "sand_raider",
    infidel: "sand_raider",
    assailant: "sand_raider",
    itchies: "swarm",
    black_locusts: "swarm",
    hell_swarm: "swarm",
    plague_bugs: "swarm",
    sucker: "giant_mosquito",
    feeder: "giant_mosquito",
    blood_hook: "giant_mosquito",
    flayer: "fetish",
    flayer_shaman: "fetish_shaman",
    soul_killer: "fetish",
    soul_killer_shaman: "fetish_shaman",
    stygian_doll: "fetish",
    jungle_hunter: "fetish",
    thorned_hulk: "wendigo",
    bramble_hulk: "wendigo",
    thrasher: "wendigo",
    bog_creature: "wendigo",
    swamp_dweller: "wendigo",
    slime_prince: "frog_demon",
    gloam: "willowisp",
    burning_soul: "willowisp",
    black_soul: "willowisp",
    doom_caster: "oblivion_knight",
    abyss_knight: "oblivion_knight",
    pit_lord: "megademon",
    venom_lord: "megademon",
    balrog: "megademon",
    flesh_spawner: "vile_mother",
    stygian_hag: "vile_mother",
    grotesque: "vile_mother",
    flesh_beast: "vile_child",
    stygian_dog: "vile_child",
    grotesque_wyrm: "vile_child",
    hell_temptress: "succubus",
    blood_temptress: "succubus",
    stygian_fury: "succubus",
    cantor: "zakarum_priest",
    heirophant: "zakarum_priest",
    zealot: "zakarum_zealot",
    faithful: "zakarum_zealot",
    apparition: "wraith",
    specter: "wraith",
    banished: "regurgitator",
    blood_lord: "blood_lord",
    enslaved: "overseer",
    slayer: "overseer",
    death_mauler: "death_mauler",
    minion_of_destruction: "minion_of_destruction",
    undead_scavenger: "zombie",
    // ── Spelling / additional D2 variants ──
    saber_cat: "sabre_cat",
    afflicted: "tainted",
    misshapen: "tainted",
    disfigured: "tainted",
    albino_roach: "scarab_demon",
    scarab: "scarab_demon",
    steel_weevil: "scarab_demon",
    arach: "giant_spider",
    flame_spider: "giant_spider",
    poison_spinner: "giant_spider",
    spider_magus: "giant_spider",
    black_archer: "skeleton_archer",
    dark_archer: "skeleton_archer",
    black_lancer: "corrupt_rogue_spearwoman",
    dark_lancer: "corrupt_rogue_spearwoman",
    flesh_archer: "corrupt_rogue_archer",
    vile_archer: "corrupt_rogue_archer",
    blood_boss: "overseer",
    overlord: "overseer",
    lasher: "overseer",
    hell_whip: "overseer",
    blood_bringer: "blood_lord",
    blood_diver: "bat_demon",
    blood_wing: "bat_demon",
    dark_familiar: "bat_demon",
    gloombat: "bat_demon",
    winged_nightmare: "bat_demon",
    carrion_bird: "vulture_demon",
    hell_buzzard: "vulture_demon",
    corpse_spitter: "regurgitator",
    putrid_defiler: "regurgitator",
    corpulent: "zombie",
    gorbelly: "zombie",
    prowling_dead: "zombie",
    rot_walker: "zombie",
    unholy_corpse: "zombie",
    crush_beast: "siege_beast",
    crusher: "siege_beast",
    damned: "wraith",
    dark_shape: "wraith",
    ghost: "wraith",
    defiled_warrior: "skeleton",
    dark_lord: "vampire",
    night_lord: "vampire",
    ghoul_lord: "vampire",
    devourer: "sand_maggot",
    rock_worm: "sand_maggot",
    giant_lamprey: "sand_maggot",
    groper: "sand_maggot",
    strangler: "sand_maggot",
    maw_fiend: "sand_maggot",
    doom_ape: "baboon_demon",
    doom_knight: "oblivion_knight",
    dominus: "oblivion_knight",
    dried_corpse: "mummy",
    embalmed: "mummy",
    preserved_dead: "mummy",
    sexton: "mummy",
    horadrim_ancient: "mummy",
    unraveler: "mummy",
    guardian: "mummy_sarcophagus",
    dune_beast: "wendigo",
    wailing_beast: "wendigo",
    snow_yeti: "wendigo",
    ancient_barbarian_1: "wendigo",
    ancient_barbarian_2: "wendigo",
    ancient_barbarian_3: "wendigo",
    fiend: "spike_fiend",
    razor_pit_demon: "spike_fiend",
    fire_boar: "demon_imp",
    imp: "demon_imp",
    hell_spawn: "demon_imp",
    greater_hell_spawn: "demon_imp",
    frenzied_ice_spawn: "frozen_horror",
    ice_spawn: "frozen_horror",
    hell_bovine: "wendigo",
    hell_slinger: "slinger",
    night_slinger: "slinger",
    night_marauder: "sand_raider",
    hell_witch: "succubus",
    stygian_harlot: "succubus",
    vile_temptress: "succubus",
    vile_witch: "succubus",
    baal_taunt: "baal_s_minion",
    minion: "baal_s_minion",
    mauler: "death_mauler",
    pit_viper: "claw_viper",
    salamander: "claw_viper",
    serpent_magus: "claw_viper",
    tomb_viper: "claw_viper",
    storm_caster: "willowisp",
    rat_man: "fetish",
    undead_flayer: "fetish",
    undead_soul_killer: "fetish",
    undead_stygian_doll: "fetish",
    dark_shaman: "fallen_shaman",
    urdar: "megademon",
    world_killer: "megademon",
    temple_guard: "zakarum_zealot",
    zakarumite: "zakarum_zealot",
  };

  function resolveEnemySlug(rawSlug: string): string | null {
    // Direct match
    if (KNOWN_ENEMY_SPRITES.has(rawSlug)) {return rawSlug;}
    // Variant mapping
    if (VARIANT_SPRITE_MAP[rawSlug]) {return VARIANT_SPRITE_MAP[rawSlug];}
    // Zone-prefixed entry IDs: z_{zone_slug}_{monster_slug}
    // Try all possible splits since zone and monster can both have underscores
    if (rawSlug.startsWith("z_")) {
      const rest = rawSlug.slice(2);
      const parts = rest.split("_");
      for (let i = 1; i < parts.length; i++) {
        const monsterSlug = parts.slice(i).join("_");
        if (KNOWN_ENEMY_SPRITES.has(monsterSlug)) {return monsterSlug;}
        if (VARIANT_SPRITE_MAP[monsterSlug]) {return VARIANT_SPRITE_MAP[monsterSlug];}
      }
    }
    return null;
  }

  function getEnemySprite(templateId: string): string | null {
    const m = TEMPLATE_ID_RE.exec(templateId);
    if (m) {
      const rawSlug = m[1].toLowerCase();
      const sub = m[2] === "boss" ? "bosses" : "enemies";
      const resolved = resolveEnemySlug(rawSlug);
      if (resolved) {return `${SPRITE_BASE}/${sub}/${resolved}.png`;}
      return null;
    }
    // Fallback for non-standard IDs
    const slug = templateId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    if (KNOWN_ENEMY_SPRITES.has(slug)) {return `${SPRITE_BASE}/enemies/${slug}.png`;}
    return null;
  }

  function getEnemyIcon(templateId: string): string {
    const sprite = getEnemySprite(templateId);
    if (sprite) {return sprite;}
    // Fallback to SVG icons
    return ENEMY_SVGS[simpleHash(templateId) % ENEMY_SVGS.length];
  }

  function getClassPortrait(classId: string): string | null {
    return CLASS_PORTRAITS[classId] || null;
  }

  function getClassSprite(classId: string): string | null {
    return CLASS_PORTRAITS[classId] || null;
  }

  function getMercenarySprite(role: string): string | null {
    const slug = role.replace(/\s+/g, "_").toLowerCase();
    return `${SPRITE_BASE}/mercenaries/${slug}.png`;
  }

  function getUiIcon(key: string): string | null {
    return UI_ICONS[key] || null;
  }

  function getIntentIcon(intentDescription: string): string {
    const desc = intentDescription.toLowerCase();
    if (desc.includes("attack") || desc.includes("deal") || desc.includes("damage")) {return INTENT_ICONS.attack;}
    if (desc.includes("guard") || desc.includes("block") || desc.includes("defend")) {return INTENT_ICONS.guard;}
    if (desc.includes("buff") || desc.includes("strength")) {return INTENT_ICONS.buff;}
    if (desc.includes("debuff") || desc.includes("weaken")) {return INTENT_ICONS.debuff;}
    if (desc.includes("heal")) {return INTENT_ICONS.heal;}
    return INTENT_ICONS.unknown;
  }

  runtimeWindow.ROUGE_ASSET_MAP = {
    getCardIcon,
    getEnemyIcon,
    getEnemySprite,
    getClassPortrait,
    getClassSprite,
    getMercenarySprite,
    getUiIcon,
    getIntentIcon,
  };
})();
