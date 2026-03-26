(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    UNIQUE_ART_BASE,
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
    ENEMY_FALLBACK_DEFAULTS,
    ENEMY_FALLBACK_RULES,
    BROKEN_ENEMY_SPRITES,
    BROKEN_BOSS_SPRITES,
    ITEM_SPRITES,
    RUNE_SPRITES,
  } = runtimeWindow.__ROUGE_ASSET_MAP_DATA;
  const uniqueArtManifest = runtimeWindow.__ROUGE_UNIQUE_ART_MANIFEST || {
    enemies: [],
    bosses: [],
    portraits: [],
    mercenaries: [],
    items: [],
  };
  const UNIQUE_ENEMY_SPRITES = new Set(uniqueArtManifest.enemies || []);
  const UNIQUE_BOSS_SPRITES = new Set(uniqueArtManifest.bosses || []);
  const UNIQUE_CLASS_PORTRAITS = new Set(uniqueArtManifest.portraits || []);
  const UNIQUE_MERCENARY_SPRITES = new Set(uniqueArtManifest.mercenaries || []);
  const UNIQUE_ITEM_SPRITES = new Set(uniqueArtManifest.items || []);

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

  function parseEnemyTemplateId(templateId: string): { rawSlug: string; resolvedSlug: string | null; isBoss: boolean } {
    const match = TEMPLATE_ID_RE.exec(templateId);
    if (match) {
      const rawSlug = match[1].toLowerCase();
      return {
        rawSlug,
        resolvedSlug: resolveEnemySlug(rawSlug),
        isBoss: match[2] === "boss",
      };
    }

    const rawSlug = templateId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    return {
      rawSlug,
      resolvedSlug: resolveEnemySlug(rawSlug),
      isBoss: false,
    };
  }

  function getThemedFallbackEnemyIcon(templateId: string): string {
    const { rawSlug, resolvedSlug, isBoss } = parseEnemyTemplateId(templateId);
    const haystack = ` ${rawSlug} ${resolvedSlug || ""} `.toLowerCase();
    const matchedRule = ENEMY_FALLBACK_RULES.find((rule: { keywords: string[] }) =>
      rule.keywords.some((keyword) => haystack.includes(keyword))
    );
    if (matchedRule) {return matchedRule.icon;}
    return isBoss ? ENEMY_FALLBACK_DEFAULTS.boss : ENEMY_FALLBACK_DEFAULTS.regular;
  }

  function getEnemySprite(templateId: string): string | null {
    const { rawSlug, resolvedSlug, isBoss } = parseEnemyTemplateId(templateId);
    if (isBoss && rawSlug) {
      if (UNIQUE_BOSS_SPRITES.has(rawSlug)) {return `${UNIQUE_ART_BASE}/bosses/${rawSlug}.png`;}
      if (BROKEN_BOSS_SPRITES.has(rawSlug)) {return null;}
      return `${SPRITE_BASE}/bosses/${rawSlug}.png`;
    }
    if (resolvedSlug) {
      if (UNIQUE_ENEMY_SPRITES.has(resolvedSlug)) {return `${UNIQUE_ART_BASE}/enemies/${resolvedSlug}.png`;}
      if (!isBoss && BROKEN_ENEMY_SPRITES.has(resolvedSlug)) {return null;}
      return `${SPRITE_BASE}/${isBoss ? "bosses" : "enemies"}/${resolvedSlug}.png`;
    }
    if (KNOWN_ENEMY_SPRITES.has(rawSlug)) {
      if (UNIQUE_ENEMY_SPRITES.has(rawSlug)) {return `${UNIQUE_ART_BASE}/enemies/${rawSlug}.png`;}
      if (BROKEN_ENEMY_SPRITES.has(rawSlug)) {return null;}
      return `${SPRITE_BASE}/enemies/${rawSlug}.png`;
    }
    if (rawSlug) {
      if (!isBoss && BROKEN_ENEMY_SPRITES.has(rawSlug)) {return null;}
    }
    return null;
  }

  function getEnemyIcon(templateId: string): string {
    const sprite = getEnemySprite(templateId);
    if (sprite) {return sprite;}
    return getThemedFallbackEnemyIcon(templateId) || ENEMY_SVGS[simpleHash(templateId) % ENEMY_SVGS.length];
  }

  function getClassPortrait(classId: string): string | null {
    if (UNIQUE_CLASS_PORTRAITS.has(classId)) {return `${UNIQUE_ART_BASE}/portraits/${classId}.png`;}
    return CLASS_PORTRAITS[classId] || null;
  }

  function getClassSprite(classId: string): string | null {
    if (UNIQUE_CLASS_PORTRAITS.has(classId)) {return `${UNIQUE_ART_BASE}/portraits/${classId}.png`;}
    return CLASS_PORTRAITS[classId] || null;
  }

  function getMercenarySprite(role: string): string | null {
    const slug = role.replace(/\s+/g, "_").toLowerCase();
    if (UNIQUE_MERCENARY_SPRITES.has(slug)) {return `${UNIQUE_ART_BASE}/mercenaries/${slug}.png`;}
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

  function getItemSprite(sourceId: string, rarity: string = "", _slot: string = ""): string | null {
    if ((rarity === "brown" || rarity === "unique") && UNIQUE_ITEM_SPRITES.has(sourceId)) {
      return `${UNIQUE_ART_BASE}/items/${sourceId}.png`;
    }
    return ITEM_SPRITES[sourceId] || null;
  }

  function getRuneSprite(sourceId: string): string | null {
    return RUNE_SPRITES[sourceId] || null;
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
    getRuneSprite,
  };
})();
