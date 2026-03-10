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

  const TEMPLATE_ID_RE = /^act_\d+_(.+)_(raider|ranged|support|brute|base|boss|elite(?:_.*)?)$/;

  function getEnemySprite(templateId: string): string | null {
    // Template IDs: act_{N}_{entryId}_{suffix}
    const m = TEMPLATE_ID_RE.exec(templateId);
    if (m) {
      const slug = m[1].toLowerCase();
      const sub = m[2] === "boss" ? "bosses" : "enemies";
      return `${SPRITE_BASE}/${sub}/${slug}.png`;
    }
    // Fallback for non-standard IDs
    const slug = templateId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    return `${SPRITE_BASE}/enemies/${slug}.png`;
  }

  function getEnemyIcon(templateId: string): string {
    // Try sprite first
    const sprite = getEnemySprite(templateId);
    if (sprite) {return sprite;}
    // Fallback to SVG icons
    return ENEMY_SVGS[simpleHash(templateId) % ENEMY_SVGS.length];
  }

  function getClassPortrait(classId: string): string | null {
    return CLASS_PORTRAITS[classId] || null;
  }

  function getClassSprite(classId: string): string | null {
    const slug = classId.toLowerCase();
    return `${SPRITE_BASE}/classes/${slug}.png`;
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
