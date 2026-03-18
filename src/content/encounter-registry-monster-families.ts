(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface MonsterFamilyOverride {
    keywords: string[];
    traits?: MonsterTraitKind[];
    family?: string;
    roleOverride?: string;
    lifeMultiplier?: number;
    attackMultiplier?: number;
    buildIntents?: (scale: EncounterRegistryEnemyScale, name: string) => EnemyIntent[];
  }

  const MONSTER_FAMILY_OVERRIDES: MonsterFamilyOverride[] = [
    // ── Fallen Shaman: resurrect dead Fallen, fireball ──
    {
      keywords: ["fallen shaman", "carver shaman", "devilkin shaman", "dark shaman", "warped shaman"],
      family: "fallen_shaman",
      roleOverride: "support",
      traits: [],
      buildIntents: (scale, name) => [
        { kind: "resurrect_ally", label: `${name} Resurrect`, value: scale.attack, target: "hero", cooldown: 2 },
        { kind: "attack_burn", label: `${name} Fireball`, value: scale.attack, target: "hero", secondaryValue: 1 },
      ],
    },
    // ── Fallen: flee on ally death ──
    {
      keywords: ["fallen", "carver", "devilkin", "dark one", "warped one"],
      family: "fallen",
      traits: ["flee_on_ally_death"],
      buildIntents: (scale, name) => [
        { kind: "attack", label: `${name} Stab`, value: scale.attack, target: "hero" },
        { kind: "attack", label: `${name} Slash`, value: scale.attack, target: "lowest_life" },
      ],
    },
    // ── Fetish: swift (double strike), low damage ──
    {
      keywords: ["fetish", "flayer", "soul killer", "rat man"],
      family: "fetish",
      traits: ["swift"],
      attackMultiplier: 0.6,
      buildIntents: (scale, name) => [
        { kind: "attack", label: `${name} Knife Stab`, value: Math.max(2, Math.floor(scale.attack * 0.6)), target: "hero" },
        { kind: "attack", label: `${name} Dart Throw`, value: Math.max(2, Math.floor(scale.attack * 0.6)), target: "lowest_life" },
      ],
    },
    // ── Fetish Shaman: resurrect fetish, inferno breath ──
    {
      keywords: ["fetish shaman", "flayer shaman", "soul killer shaman"],
      family: "fetish_shaman",
      roleOverride: "support",
      traits: [],
      buildIntents: (scale, name) => [
        { kind: "resurrect_ally", label: `${name} Resurrect`, value: scale.attack, target: "hero", cooldown: 2 },
        { kind: "attack_burn_all", label: `${name} Inferno`, value: Math.max(3, scale.attack - 1), secondaryValue: 2 },
      ],
    },
    // ── Bone Fetish / Stygian Doll: death explosion ──
    {
      keywords: ["undead flayer", "undead soul killer", "undead stygian doll", "stygian doll", "bone fetish"],
      family: "bone_fetish",
      traits: ["death_explosion"],
      buildIntents: (scale, name) => [
        { kind: "sunder_attack", label: `${name} Suicidal Rush`, value: scale.attack, target: "hero" },
        { kind: "attack", label: `${name} Knife Stab`, value: scale.attack, target: "hero" },
      ],
    },
    // ── Greater Mummy / Unraveler: resurrect undead, poison breath, regen ──
    {
      keywords: ["hollow one", "guardian", "unraveler", "horadrim ancient"],
      family: "greater_mummy",
      roleOverride: "support",
      traits: ["regeneration"],
      buildIntents: (scale, name) => [
        { kind: "resurrect_ally", label: `${name} Raise Dead`, value: scale.attack, target: "hero", cooldown: 3 },
        { kind: "attack_poison", label: `${name} Poison Breath`, value: scale.attack, target: "hero", secondaryValue: 3 },
      ],
    },
    // ── Zombie: death poison on some variants ──
    {
      keywords: ["dried corpse", "plague bearer"],
      family: "zombie_poison",
      traits: ["death_poison"],
      buildIntents: (scale, name) => [
        { kind: "attack_poison", label: `${name} Diseased Strike`, value: scale.attack, target: "hero", secondaryValue: 2 },
        { kind: "attack", label: `${name} Slam`, value: scale.attack + 1, target: "hero" },
      ],
    },
    // ── Oblivion Knight: curses + bone spirit ──
    {
      keywords: ["oblivion knight"],
      family: "oblivion_knight",
      roleOverride: "support",
      lifeMultiplier: 1.3,
      buildIntents: (scale, name) => [
        { kind: "curse_amplify", label: `${name} Amplify Damage`, value: 2, cooldown: 3 },
        { kind: "attack", label: `${name} Bone Spirit`, value: scale.attack + 3, target: "hero" },
        { kind: "curse_weaken", label: `${name} Decrepify`, value: 2, cooldown: 3 },
      ],
    },
    // ── Willowisp / Gloam / Burning Soul: high damage lightning, energy drain ──
    {
      keywords: ["gloam", "burning soul", "black soul", "storm caster"],
      family: "willowisp",
      roleOverride: "ranged",
      lifeMultiplier: 0.7,
      attackMultiplier: 1.5,
      buildIntents: (scale, name) => [
        { kind: "drain_energy", label: `${name} Lightning Bolt`, value: Math.floor(scale.attack * 1.5), target: "hero" },
        { kind: "attack", label: `${name} Charged Bolt`, value: Math.floor(scale.attack * 1.3), target: "lowest_life" },
      ],
    },
    // ── Succubus: blood mana curse, blood star ──
    {
      keywords: ["succubus", "vile temptress", "stygian harlot", "hell temptress", "blood temptress"],
      family: "succubus",
      roleOverride: "ranged",
      buildIntents: (scale, name) => [
        { kind: "curse_weaken", label: `${name} Blood Mana`, value: 2, cooldown: 3 },
        { kind: "attack", label: `${name} Blood Star`, value: scale.attack + 1, target: "hero" },
      ],
    },
    // ── Balrog / Venom Lord: inferno breath + heavy melee ──
    {
      keywords: ["balrog", "pit lord", "venom lord"],
      family: "balrog",
      roleOverride: "brute",
      lifeMultiplier: 1.3,
      attackMultiplier: 1.2,
      buildIntents: (scale, name) => [
        { kind: "attack_burn_all", label: `${name} Inferno Breath`, value: Math.max(4, scale.attack - 1), secondaryValue: 2 },
        { kind: "attack", label: `${name} Crushing Blow`, value: scale.attack + 3, target: "hero" },
      ],
    },
    // ── Sand Maggot: summon young ──
    {
      keywords: ["sand maggot", "rock worm", "devourer", "world killer"],
      family: "sand_maggot",
      roleOverride: "support",
      buildIntents: (scale, name) => [
        { kind: "summon_minion", label: `${name} Lay Eggs`, value: scale.attack, cooldown: 3 },
        { kind: "attack_poison", label: `${name} Poison Spit`, value: scale.attack, target: "hero", secondaryValue: 2 },
      ],
    },
    // ── Flesh Spawner / Grotesque: death spawn ──
    {
      keywords: ["flesh spawner", "stygian hag", "grotesque"],
      family: "flesh_spawner",
      traits: ["death_spawn"],
      buildIntents: (scale, name) => [
        { kind: "summon_minion", label: `${name} Spawn`, value: scale.attack, cooldown: 3 },
        { kind: "attack", label: `${name} Swipe`, value: scale.attack + 1, target: "hero" },
      ],
    },
    // ── Scarab: thorns (lightning aura) ──
    {
      keywords: ["dung soldier", "sand warrior", "scarab", "steel weevil"],
      family: "scarab",
      roleOverride: "brute",
      traits: ["thorns"],
      buildIntents: (scale, name) => [
        { kind: "guard", label: `${name} Shell Up`, value: scale.guard + 2 },
        { kind: "attack", label: `${name} Charged Bolt`, value: scale.attack + 1, target: "hero" },
      ],
    },
    // ── Thorned Hulk: frenzy when low HP ──
    {
      keywords: ["thorned hulk", "bramble hulk", "thrasher", "spike giant"],
      family: "thorned_hulk",
      roleOverride: "brute",
      traits: ["frenzy"],
      buildIntents: (scale, name) => [
        { kind: "attack", label: `${name} Smash`, value: scale.attack + 2, target: "hero" },
        { kind: "attack_all", label: `${name} Thrash`, value: Math.max(4, scale.attack - 1) },
      ],
    },
    // ── Wraith / Ghost: energy drain ──
    {
      keywords: ["ghost", "wraith", "specter", "apparition", "dark shape"],
      family: "wraith",
      roleOverride: "ranged",
      buildIntents: (scale, name) => [
        { kind: "drain_energy", label: `${name} Soul Drain`, value: scale.attack, target: "hero" },
        { kind: "attack", label: `${name} Spectral Touch`, value: scale.attack, target: "lowest_life" },
      ],
    },
    // ── Frozen Horror: cold/chill attacks ──
    {
      keywords: ["frozen horror", "frozen abyss", "ice spawn", "frenzied ice spawn"],
      family: "frozen_horror",
      traits: [],
      buildIntents: (scale, name) => [
        { kind: "attack_chill", label: `${name} Frost Strike`, value: scale.attack, target: "hero", secondaryValue: 1 },
        { kind: "attack", label: `${name} Ice Claw`, value: scale.attack + 1, target: "lowest_life" },
      ],
    },
    // ── Overseer / Lasher: buff allies ──
    {
      keywords: ["overseer", "lasher", "hell whip"],
      family: "overseer",
      roleOverride: "support",
      buildIntents: (scale, name) => [
        { kind: "buff_allies_attack", label: `${name} Whip Frenzy`, value: 2, cooldown: 2 },
        { kind: "attack", label: `${name} Lash`, value: scale.attack + 1, target: "hero" },
      ],
    },
    // ── Vampire: drain + fire attacks ──
    {
      keywords: ["ghoul lord", "night lord", "dark lord", "blood lord"],
      family: "vampire",
      roleOverride: "ranged",
      buildIntents: (scale, name) => [
        { kind: "drain_attack", label: `${name} Life Drain`, value: scale.attack, target: "lowest_life", secondaryValue: Math.max(3, Math.floor(scale.attack / 2)) },
        { kind: "attack_burn", label: `${name} Fireball`, value: scale.attack, target: "hero", secondaryValue: 2 },
      ],
    },
    // ── Claw Viper: charge + poison ──
    {
      keywords: ["claw viper", "pit viper", "salamander", "serpent magus", "tomb viper"],
      family: "claw_viper",
      roleOverride: "brute",
      buildIntents: (scale, name) => [
        { kind: "sunder_attack", label: `${name} Charge`, value: scale.attack + 1, target: "hero" },
        { kind: "attack_poison", label: `${name} Venom Strike`, value: scale.attack, target: "hero", secondaryValue: 2 },
      ],
    },
    // ── Spider: web slow + poison ──
    {
      keywords: ["arach", "poison spinner", "flame spider", "spider magus"],
      family: "spider",
      roleOverride: "ranged",
      buildIntents: (scale, name) => [
        { kind: "attack_chill", label: `${name} Web Spray`, value: scale.attack - 1, target: "hero", secondaryValue: 1 },
        { kind: "attack_poison", label: `${name} Venom Spit`, value: scale.attack, target: "hero", secondaryValue: 2 },
      ],
    },
    // ── Corpse Spitter / Regurgitator: consume corpse ──
    {
      keywords: ["corpulent", "corpse spitter", "maw fiend"],
      family: "regurgitator",
      roleOverride: "brute",
      buildIntents: (scale, name) => [
        { kind: "consume_corpse", label: `${name} Devour`, value: scale.attack },
        { kind: "attack", label: `${name} Slam`, value: scale.attack + 2, target: "hero" },
      ],
    },
    // ── Death Mauler: corpse explosion ──
    {
      keywords: ["death mauler"],
      family: "death_mauler",
      roleOverride: "brute",
      buildIntents: (scale, name) => [
        { kind: "sunder_attack", label: `${name} Burrow Strike`, value: scale.attack + 1, target: "hero" },
        { kind: "corpse_explosion", label: `${name} Corpse Explosion`, value: 3 },
      ],
    },
  ];

  function findFamilyOverride(name: string): MonsterFamilyOverride | null {
    const haystack = name.toLowerCase();
    for (const override of MONSTER_FAMILY_OVERRIDES) {
      if (override.keywords.some((kw) => haystack === kw || haystack.includes(kw))) {
        return override;
      }
    }
    return null;
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_MONSTER_FAMILIES = {
    MONSTER_FAMILY_OVERRIDES,
    findFamilyOverride,
  };
})();
