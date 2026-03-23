(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    SPRITE_BASE,
    CARD_ICONS,
    ATTACK_ICONS,
    SKILL_ICONS,
    ENEMY_SVGS,
    UI_ICONS,
    INTENT_ICONS,
    CLASS_PORTRAITS,
    KNOWN_ENEMY_SPRITES,
    VARIANT_SPRITE_MAP,
    ITEM_SPRITES,
  } = runtimeWindow.__ROUGE_ASSET_MAP_DATA;

  const TEMPLATE_ID_RE = /^act_\d+_(.+)_(raider|ranged|support|brute|base|boss|alt|elite(?:_.*)?)$/;

  function simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function getCardIcon(cardId: string, effects?: CardEffect[]): string {
    if (CARD_ICONS[cardId]) {return CARD_ICONS[cardId];}
    const baseId = cardId.replace(/_plus$/, "");
    if (CARD_ICONS[baseId]) {return CARD_ICONS[baseId];}
    const hasDamage = effects?.some((e) => e.kind === "damage") ?? false;
    const pool = hasDamage ? ATTACK_ICONS : SKILL_ICONS;
    return pool[simpleHash(cardId) % pool.length];
  }

  function resolveEnemySlug(rawSlug: string): string | null {
    if (KNOWN_ENEMY_SPRITES.has(rawSlug)) {return rawSlug;}
    if (VARIANT_SPRITE_MAP[rawSlug]) {return VARIANT_SPRITE_MAP[rawSlug];}
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
    const slug = templateId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    if (KNOWN_ENEMY_SPRITES.has(slug)) {return `${SPRITE_BASE}/enemies/${slug}.png`;}
    return null;
  }

  function getEnemyIcon(templateId: string): string {
    const sprite = getEnemySprite(templateId);
    if (sprite) {return sprite;}
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

  function getItemSprite(sourceId: string): string | null {
    return ITEM_SPRITES[sourceId] || null;
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
    getItemSprite,
  };
})();
