(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    UNIQUE_ART_BASE,
    CARD_ILLUSTRATION_BASE: _CARD_ILLUSTRATION_BASE,
    MINION_ILLUSTRATION_BASE: _MINION_ILLUSTRATION_BASE,
    CARD_FRAME_BASE: _CARD_FRAME_BASE,
    SPRITE_BASE,
    CARD_ICONS,
    CARD_ILLUSTRATIONS,
    MINION_ILLUSTRATIONS,
    CARD_FRAMES,
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
    enemyVariants: {},
    bossVariants: {},
    portraitVariants: {},
    mercenaryVariants: {},
    itemVariants: {},
  };
  const UNIQUE_ENEMY_SPRITES = new Set(uniqueArtManifest.enemies || []);
  const UNIQUE_BOSS_SPRITES = new Set(uniqueArtManifest.bosses || []);
  const UNIQUE_CLASS_PORTRAITS = new Set(uniqueArtManifest.portraits || []);
  const UNIQUE_MERCENARY_SPRITES = new Set(uniqueArtManifest.mercenaries || []);
  const UNIQUE_ITEM_SPRITES = new Set(uniqueArtManifest.items || []);
  const UNIQUE_ART_VARIANT_SALT = Math.random().toString(36).slice(2);
  const MINION_ILLUSTRATION_FAMILIES: Record<string, string> = {
    necromancer_skeleton: "necro_army",
    necromancer_servant: "necro_army",
    necromancer_skeletal_mage: "necro_army",
    necromancer_clay_golem: "necro_golem",
    necromancer_blood_golem: "necro_golem",
    necromancer_iron_golem: "necro_golem",
    necromancer_fire_golem: "necro_golem",
    druid_spirit_wolf: "druid_pack",
    druid_spirit_wolf_2: "druid_pack",
    druid_dire_wolf: "druid_pack",
    necro_army: "necro_army",
    necro_golem: "necro_golem",
    druid_pack: "druid_pack",
  };

  const TEMPLATE_ID_RE = /^act_\d+_(.+)_(raider|ranged|support|brute|base|boss|alt|elite(?:_.*)?)$/;

  function simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function getUniqueArtVariantPaths(
    folder: string,
    slug: string,
    variantManifest: Record<string, string[]> | undefined | null
  ): string[] {
    const variants = Array.isArray(variantManifest?.[slug])
      ? variantManifest[slug].filter((entry) => typeof entry === "string" && /\.(png|webp)$/i.test(entry))
      : [];
    if (variants.length > 0) {
      return variants.map((entry) => `${UNIQUE_ART_BASE}/${folder}/${entry}`);
    }
    return [`${UNIQUE_ART_BASE}/${folder}/${slug}.webp`];
  }

  function pickUniqueArtPath(paths: string[], selectionKey: string, useSessionSalt = false): string | null {
    if (!Array.isArray(paths) || paths.length === 0) {
      return null;
    }
    if (paths.length === 1) {
      return paths[0];
    }

    // Weight the primary file slightly higher while still rotating alt art into use.
    const weightedPaths = [paths[0], ...paths];
    const hashKey = useSessionSalt ? `${UNIQUE_ART_VARIANT_SALT}:${selectionKey}` : selectionKey;
    const index = simpleHash(hashKey) % weightedPaths.length;
    return weightedPaths[index];
  }

  function resolveUniqueArtPath(
    folder: string,
    slug: string,
    variantManifest: Record<string, string[]> | undefined | null,
    selectionKey: string,
    useSessionSalt = false
  ): string | null {
    return pickUniqueArtPath(getUniqueArtVariantPaths(folder, slug, variantManifest), selectionKey, useSessionSalt);
  }

  function getCardIcon(cardId: string, effects?: CardEffect[]): string {
    if (CARD_ICONS[cardId]) {return CARD_ICONS[cardId];}
    const baseId = cardId.replace(/_plus$/, "");
    if (CARD_ICONS[baseId]) {return CARD_ICONS[baseId];}
    const hasDamage = effects?.some((e) => e.kind === "damage") ?? false;
    const pool = hasDamage ? ATTACK_ICONS : SKILL_ICONS;
    return pool[simpleHash(cardId) % pool.length];
  }

  function getCardIllustration(cardId: string): string | null {
    if (CARD_ILLUSTRATIONS[cardId]) {return CARD_ILLUSTRATIONS[cardId];}
    const baseId = cardId.replace(/_plus$/, "");
    if (CARD_ILLUSTRATIONS[baseId]) {return CARD_ILLUSTRATIONS[baseId];}
    return null;
  }

  function getMinionIllustration(templateId: string, artTier = 1): string | null {
    if (MINION_ILLUSTRATIONS[templateId]) {return MINION_ILLUSTRATIONS[templateId];}
    const family = MINION_ILLUSTRATION_FAMILIES[templateId] || templateId;
    if (MINION_ILLUSTRATIONS[family]) {return MINION_ILLUSTRATIONS[family];}
    const tier = Math.max(1, Math.min(5, Number(artTier) || 1));
    for (let candidate = tier; candidate >= 1; candidate--) {
      const key = `${family}_t${candidate}`;
      if (MINION_ILLUSTRATIONS[key]) {return MINION_ILLUSTRATIONS[key];}
    }
    return null;
  }

  function getCardFrame(roleKey: string): string | null {
    return CARD_FRAMES[roleKey] || null;
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
      if (UNIQUE_BOSS_SPRITES.has(rawSlug)) {
        return resolveUniqueArtPath("bosses", rawSlug, uniqueArtManifest.bossVariants, `boss:${templateId}`);
      }
      if (BROKEN_BOSS_SPRITES.has(rawSlug)) {return null;}
      return `${SPRITE_BASE}/bosses/${rawSlug}.png`;
    }
    if (rawSlug && UNIQUE_ENEMY_SPRITES.has(rawSlug)) {
      return resolveUniqueArtPath("enemies", rawSlug, uniqueArtManifest.enemyVariants, `enemy:${templateId}`);
    }
    if (resolvedSlug) {
      if (UNIQUE_ENEMY_SPRITES.has(resolvedSlug)) {
        return resolveUniqueArtPath("enemies", resolvedSlug, uniqueArtManifest.enemyVariants, `enemy:${templateId}`);
      }
      if (!isBoss && BROKEN_ENEMY_SPRITES.has(resolvedSlug)) {return null;}
      return `${SPRITE_BASE}/${isBoss ? "bosses" : "enemies"}/${resolvedSlug}.png`;
    }
    if (KNOWN_ENEMY_SPRITES.has(rawSlug)) {
      if (UNIQUE_ENEMY_SPRITES.has(rawSlug)) {
        return resolveUniqueArtPath("enemies", rawSlug, uniqueArtManifest.enemyVariants, `enemy:${templateId}`);
      }
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
    if (UNIQUE_CLASS_PORTRAITS.has(classId)) {
      return resolveUniqueArtPath("portraits", classId, uniqueArtManifest.portraitVariants, `portrait:${classId}`, true);
    }
    return CLASS_PORTRAITS[classId] || null;
  }

  function getClassSprite(classId: string): string | null {
    if (UNIQUE_CLASS_PORTRAITS.has(classId)) {
      return resolveUniqueArtPath("portraits", classId, uniqueArtManifest.portraitVariants, `portrait:${classId}`, true);
    }
    return CLASS_PORTRAITS[classId] || null;
  }

  function getMercenarySprite(role: string): string | null {
    const slug = role.replace(/\s+/g, "_").toLowerCase();
    if (UNIQUE_MERCENARY_SPRITES.has(slug)) {
      return resolveUniqueArtPath("mercenaries", slug, uniqueArtManifest.mercenaryVariants, `mercenary:${slug}`, true);
    }
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
      return resolveUniqueArtPath("items", sourceId, uniqueArtManifest.itemVariants, `item:${sourceId}`, true);
    }
    return ITEM_SPRITES[sourceId] || null;
  }

  function getRuneSprite(sourceId: string): string | null {
    return RUNE_SPRITES[sourceId] || null;
  }

  runtimeWindow.ROUGE_ASSET_MAP = {
    getCardIcon,
    getCardIllustration,
    getMinionIllustration,
    getCardFrame,
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
