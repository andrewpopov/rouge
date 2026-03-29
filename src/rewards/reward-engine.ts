(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  const {
    pickProgressionChoice,
    getRewardAccountFeatures,
    scaleGoldValue,

    buildBoonChoice,
  } = runtimeWindow.__ROUGE_REWARD_ENGINE_PROGRESSION;
  const { clamp, toNumber } = runtimeWindow.ROUGE_UTILS;

  const MAX_BELT_SIZE = 5;
  const CARD_ROLE_LABELS: Record<CardRewardRole, string> = {
    foundation: "Foundation",
    engine: "Engine",
    support: "Support",
    tech: "Tech",
  };
  const CARD_ROLE_SCORE_WEIGHTS: Record<CardRewardRole, number> = {
    foundation: 1,
    engine: 4,
    support: 2,
    tech: 2,
  };
  const SUPPORT_ROLE_PRIORITY: Record<CardRewardRole, number> = {
    support: 4,
    tech: 3,
    foundation: 2,
    engine: 1,
  };
  const TREE_RANK_SCORE_WEIGHT = 12;
  const FAVORED_TREE_SCORE_BONUS = 2;
  const PRIMARY_TREE_CARD_SCORE_MULTIPLIER = 1;
  const SUPPORT_TREE_CARD_SCORE_MULTIPLIER = 0.45;
  const SECONDARY_WEAPON_FAMILY_THRESHOLD = 0.7;
  const DAMAGE_EFFECT_KINDS = new Set<CardEffectKind>(["damage", "damage_all"]);
  const CONTROL_EFFECT_KINDS = new Set<CardEffectKind>([
    "apply_slow",
    "apply_slow_all",
    "apply_freeze",
    "apply_freeze_all",
    "apply_stun",
    "apply_stun_all",
    "apply_paralyze",
    "apply_paralyze_all",
  ]);
  const SUPPORT_EFFECT_KINDS = new Set<CardEffectKind>([
    "gain_guard_self",
    "gain_guard_party",
    "heal_hero",
    "heal_mercenary",
    "mark_enemy_for_mercenary",
    "buff_mercenary_next_attack",
  ]);
  const BUILD_PATHS: Record<string, Record<string, { label: string; primaryTrees: string[]; supportTrees: string[] }>> = {
    amazon: {
      amazon_bow_and_crossbow: {
        label: "Bow Volley",
        primaryTrees: ["bow"],
        supportTrees: ["passive"],
      },
      amazon_javelin_and_spear: {
        label: "Javelin Storm",
        primaryTrees: ["javelin"],
        supportTrees: ["passive"],
      },
      amazon_passive_and_magic: {
        label: "Passive Tempo",
        primaryTrees: ["passive"],
        supportTrees: ["bow", "javelin"],
      },
    },
    assassin: {
      assassin_martial_arts: {
        label: "Martial Burst",
        primaryTrees: ["martial_arts"],
        supportTrees: ["shadow"],
      },
      assassin_shadow_disciplines: {
        label: "Shadow Tempo",
        primaryTrees: ["shadow"],
        supportTrees: ["martial_arts", "traps"],
      },
      assassin_traps: {
        label: "Trap Field",
        primaryTrees: ["traps"],
        supportTrees: ["shadow"],
      },
    },
    barbarian: {
      barbarian_combat_skills: {
        label: "Combat Pressure",
        primaryTrees: ["combat_skills"],
        supportTrees: ["warcries", "masteries"],
      },
      barbarian_combat_masteries: {
        label: "Mastery Frontline",
        primaryTrees: ["masteries"],
        supportTrees: ["combat_skills", "warcries"],
      },
      barbarian_warcries: {
        label: "Warcry Tempo",
        primaryTrees: ["warcries"],
        supportTrees: ["combat_skills", "masteries"],
      },
    },
    druid: {
      druid_elemental: {
        label: "Elemental Storm",
        primaryTrees: ["elemental"],
        supportTrees: ["summoning"],
      },
      druid_shape_shifting: {
        label: "Shifter Bruiser",
        primaryTrees: ["shape_shifting"],
        supportTrees: ["summoning"],
      },
      druid_summoning: {
        label: "Summoner Engine",
        primaryTrees: ["summoning"],
        supportTrees: ["elemental", "shape_shifting"],
      },
    },
    necromancer: {
      necromancer_curses: {
        label: "Curse Control",
        primaryTrees: ["curses"],
        supportTrees: ["poison_bone", "summoning"],
      },
      necromancer_poison_and_bone: {
        label: "Bone Burst",
        primaryTrees: ["poison_bone"],
        supportTrees: ["curses"],
      },
      necromancer_summoning: {
        label: "Summon Swarm",
        primaryTrees: ["summoning"],
        supportTrees: ["curses", "poison_bone"],
      },
    },
    paladin: {
      paladin_combat_skills: {
        label: "Combat Zeal",
        primaryTrees: ["combat"],
        supportTrees: ["offensive_auras", "defensive_auras"],
      },
      paladin_defensive_auras: {
        label: "Defensive Anchor",
        primaryTrees: ["defensive_auras"],
        supportTrees: ["combat"],
      },
      paladin_offensive_auras: {
        label: "Offensive Aura",
        primaryTrees: ["offensive_auras"],
        supportTrees: ["combat"],
      },
    },
    sorceress: {
      sorceress_cold: {
        label: "Cold Control",
        primaryTrees: ["cold"],
        supportTrees: ["lightning"],
      },
      sorceress_fire: {
        label: "Fire Burst",
        primaryTrees: ["fire"],
        supportTrees: ["lightning"],
      },
      sorceress_lightning: {
        label: "Lightning Tempo",
        primaryTrees: ["lightning"],
        supportTrees: ["fire", "cold"],
      },
    },
  };
  const ARCHETYPE_WEAPON_FAMILIES: Record<string, string[]> = {
    amazon_bow_and_crossbow: ["Bows", "Crossbows"],
    amazon_javelin_and_spear: ["Javelins", "Spears"],
    amazon_passive_and_magic: ["Bows", "Javelins", "Spears"],
    assassin_martial_arts: ["Swords", "Maces"],
    assassin_shadow_disciplines: ["Swords", "Wands"],
    assassin_traps: ["Swords", "Wands"],
    barbarian_combat_skills: ["Swords", "Maces"],
    barbarian_combat_masteries: ["Swords", "Maces", "Polearms"],
    barbarian_warcries: ["Maces", "Swords"],
    druid_elemental: ["Staves", "Maces"],
    druid_shape_shifting: ["Maces", "Polearms"],
    druid_summoning: ["Staves", "Maces"],
    necromancer_curses: ["Wands"],
    necromancer_poison_and_bone: ["Wands"],
    necromancer_summoning: ["Wands"],
    paladin_combat_skills: ["Maces", "Swords"],
    paladin_defensive_auras: ["Maces", "Swords"],
    paladin_offensive_auras: ["Maces", "Swords"],
    sorceress_cold: ["Staves"],
    sorceress_fire: ["Staves"],
    sorceress_lightning: ["Staves"],
  };

  function getDeckUpgradeThreshold(actNumber: number) {
    return 12 + Math.max(0, actNumber) * 2;
  }

  function getDeckSoftCardCap(actNumber: number) {
    return 14 + Math.max(0, actNumber) * 2;
  }

  function getDeckHardCardCap(actNumber: number) {
    return 18 + Math.max(0, actNumber) * 3;
  }

  const BOON_POOLS: Record<string, { id: string; title: string; subtitle: string; description: string; effects: RewardChoiceEffect[] }[]> = {
    opening: [
      {
        id: "field_training",
        title: "Field Training",
        subtitle: "Hero Boon",
        description: "Raise the hero's max Life by 6 and recover that amount immediately.",
        effects: [{ kind: "hero_max_life", value: 6 }],
      },
      {
        id: "supply_cache",
        title: "Supply Cache",
        subtitle: "Run Economy",
        description: "Take extra gold and top off one potion charge for the road ahead.",
        effects: [
          { kind: "gold_bonus", value: 18 },
          { kind: "refill_potions", value: 1 },
        ],
      },
      {
        id: "mercenary_drill",
        title: "Mercenary Drill",
        subtitle: "Companion Boon",
        description: "Harden your mercenary with +1 attack and +4 max Life.",
        effects: [
          { kind: "mercenary_attack", value: 1 },
          { kind: "mercenary_max_life", value: 4 },
        ],
      },
    ],
    branchBattle: [
      {
        id: "battlefield_rites",
        title: "Battlefield Rites",
        subtitle: "Hero Boon",
        description: "Raise the hero's max Life by 8 and recover that amount immediately.",
        effects: [{ kind: "hero_max_life", value: 8 }],
      },
      {
        id: "war_chest",
        title: "War Chest",
        subtitle: "Run Economy",
        description: "Take extra gold and refill one potion charge.",
        effects: [
          { kind: "gold_bonus", value: 26 },
          { kind: "refill_potions", value: 1 },
        ],
      },
      {
        id: "escort_contract",
        title: "Escort Contract",
        subtitle: "Companion Boon",
        description: "Raise mercenary attack by 1 and max Life by 6.",
        effects: [
          { kind: "mercenary_attack", value: 1 },
          { kind: "mercenary_max_life", value: 6 },
        ],
      },
    ],
    branchMiniboss: [
      {
        id: "veteran_instinct",
        title: "Veteran Instinct",
        subtitle: "Hero Boon",
        description: "Raise the hero's max Life by 10 and recover that amount immediately.",
        effects: [{ kind: "hero_max_life", value: 10 }],
      },
      {
        id: "belt_satchel",
        title: "Belt Satchel",
        subtitle: "Utility Boon",
        description: "Increase belt capacity by 1 and immediately gain 1 potion charge.",
        effects: [
          { kind: "belt_capacity", value: 1 },
          { kind: "refill_potions", value: 1 },
        ],
      },
      {
        id: "mercenary_veterancy",
        title: "Mercenary Veterancy",
        subtitle: "Companion Boon",
        description: "Raise mercenary attack by 2 and max Life by 6.",
        effects: [
          { kind: "mercenary_attack", value: 2 },
          { kind: "mercenary_max_life", value: 6 },
        ],
      },
    ],
    boss: [
      {
        id: "horadric_satchel",
        title: "Horadric Satchel",
        subtitle: "Major Boon",
        description: "Increase belt capacity by 1 and immediately refill 2 potion charges.",
        effects: [
          { kind: "belt_capacity", value: 1 },
          { kind: "refill_potions", value: 2 },
        ],
      },
      {
        id: "inner_focus",
        title: "Inner Focus",
        subtitle: "Major Boon",
        description: "Raise max Energy by 1 and improve potion healing by 2.",
        effects: [
          { kind: "hero_max_energy", value: 1 },
          { kind: "hero_potion_heal", value: 2 },
        ],
      },
      {
        id: "warband_command",
        title: "Warband Command",
        subtitle: "Major Boon",
        description: "Raise hero max Life by 12 and mercenary attack by 2 and max Life by 8.",
        effects: [
          { kind: "hero_max_life", value: 12 },
          { kind: "mercenary_attack", value: 2 },
          { kind: "mercenary_max_life", value: 8 },
        ],
      },
    ],
  };

  function getDeckProfileId(content: GameContent, classId: string) {
    return content.classDeckProfiles?.[classId] || "warrior";
  }

  function getChoiceSeed(run: RunState, zone: ZoneState, actNumber: number, encounterNumber: number) {
    return actNumber * 41 + encounterNumber * 17 + run.deck.length * 7 + zone.title.length;
  }

  function getCardTree(cardId: string) {
    return runtimeWindow.__ROUGE_SKILL_EVOLUTION?.getCardTree?.(cardId) || "";
  }

  function getBuildPath(classId: string, treeId: string) {
    return BUILD_PATHS[classId]?.[treeId] || null;
  }

  function getCardClassId(cardId: string, card: CardDefinition | null = null) {
    const source = String(card?.skillRef || cardId || "");
    const prefix = source.split("_")[0] || "";
    return BUILD_PATHS[prefix] ? prefix : "";
  }

  function inferCardRewardRole(cardId: string, card: CardDefinition | null) {
    if (!card?.skillRef) {
      return "foundation" as CardRewardRole;
    }
    const effectKinds = new Set((Array.isArray(card.effects) ? card.effects : []).map((effect: CardEffect) => effect.kind));
    const hasDamage = [...effectKinds].some((kind) => DAMAGE_EFFECT_KINDS.has(kind));
    const hasControl = [...effectKinds].some((kind) => CONTROL_EFFECT_KINDS.has(kind));
    const hasSupport = [...effectKinds].some((kind) => SUPPORT_EFFECT_KINDS.has(kind));
    const hasDraw = effectKinds.has("draw");
    const hasArea = effectKinds.has("damage_all") || effectKinds.has("apply_burn_all") || effectKinds.has("apply_poison_all");
    const hasFreezeOrSlow = effectKinds.has("apply_freeze") || effectKinds.has("apply_freeze_all") || effectKinds.has("apply_slow") || effectKinds.has("apply_slow_all");

    if (hasControl) {
      if (hasDamage && !hasArea && !hasFreezeOrSlow && !hasSupport && !hasDraw) {
        return "engine";
      }
      return "tech";
    }
    if ((hasSupport || hasDraw) && !hasDamage) {
      return "support";
    }
    if (hasDamage && (hasSupport || hasDraw) && !hasArea) {
      return "support";
    }
    if (hasArea && !hasControl) {
      return "engine";
    }
    if (hasDamage) {
      return "engine";
    }
    return "support";
  }

  function buildCardArchetypeTags(cardId: string, card: CardDefinition | null = null) {
    const classId = getCardClassId(cardId, card);
    const tree = getCardTree(cardId);
    if (!classId || !tree) {
      return [];
    }
    return Object.entries(BUILD_PATHS[classId] || {})
      .filter(([, path]) => path.primaryTrees.includes(tree) || path.supportTrees.includes(tree))
      .map(([pathId]) => pathId)
      .sort();
  }

  function annotateCardRewardMetadata(content: GameContent) {
    Object.values(content?.cardCatalog || {}).forEach((card: CardDefinition) => {
      if (!card) {
        return;
      }
      card.rewardRole = inferCardRewardRole(card.id, card);
      card.archetypeTags = buildCardArchetypeTags(card.id, card);
    });
  }

  function getCardRewardRole(cardId: string, content: GameContent | null = null): CardRewardRole {
    const card =
      content?.cardCatalog?.[cardId] ||
      runtimeWindow.ROUGE_GAME_CONTENT?.cardCatalog?.[cardId] ||
      runtimeWindow.__ROUGE_CLASS_CARDS?.classCardCatalog?.[cardId] ||
      null;
    return (card?.rewardRole as CardRewardRole | undefined) || inferCardRewardRole(cardId, card);
  }

  function getCardArchetypeTags(cardId: string, content: GameContent | null = null) {
    const card =
      content?.cardCatalog?.[cardId] ||
      runtimeWindow.ROUGE_GAME_CONTENT?.cardCatalog?.[cardId] ||
      runtimeWindow.__ROUGE_CLASS_CARDS?.classCardCatalog?.[cardId] ||
      null;
    return Array.isArray(card?.archetypeTags) ? [...card.archetypeTags] : buildCardArchetypeTags(cardId, card);
  }

  function getArchetypeLabels(archetypeTags: string[]) {
    return archetypeTags
      .map((tag) => {
        const classId = tag.split("_").shift() || "";
        return BUILD_PATHS[classId]?.[tag]?.label || "";
      })
      .filter(Boolean);
  }

  function getArchetypeWeaponFamilies(archetypeId: string) {
    return [...(ARCHETYPE_WEAPON_FAMILIES[archetypeId] || [])];
  }

  function createEmptyArchetypeScores(classId: string) {
    return Object.fromEntries(
      Object.keys(BUILD_PATHS[classId] || {}).map((archetypeId) => [archetypeId, 0])
    ) as Record<string, number>;
  }

  function getArchetypeCardMatchMultiplier(classId: string, archetypeId: string, treeId: string) {
    const path = BUILD_PATHS[classId]?.[archetypeId];
    if (!path || !treeId) {
      return 0;
    }
    if (path.primaryTrees.includes(treeId)) {
      return PRIMARY_TREE_CARD_SCORE_MULTIPLIER;
    }
    if (path.supportTrees.includes(treeId)) {
      return SUPPORT_TREE_CARD_SCORE_MULTIPLIER;
    }
    return 0;
  }

  function sortArchetypeScoreEntries(classId: string, scores: Record<string, number>) {
    const classPaths = BUILD_PATHS[classId] || {};
    return Object.entries(scores || {})
      .filter(([archetypeId]) => Boolean(classPaths[archetypeId]))
      .map(([archetypeId, rawScore]) => ({
        archetypeId,
        label: classPaths[archetypeId].label,
        score: Math.max(0, toNumber(rawScore, 0)),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  }

  function computeArchetypeScores(run: RunState, content: GameContent) {
    annotateCardRewardMetadata(content);
    const scores = createEmptyArchetypeScores(run.classId);
    const classProgression = run.progression?.classProgression;
    const favoredTreeId = classProgression?.favoredTreeId || "";

    Object.keys(scores).forEach((archetypeId) => {
      const treeRank = toNumber(classProgression?.treeRanks?.[archetypeId], 0);
      if (treeRank > 0) {
        scores[archetypeId] += treeRank * TREE_RANK_SCORE_WEIGHT;
      }
      if (favoredTreeId === archetypeId && treeRank > 0) {
        scores[archetypeId] += FAVORED_TREE_SCORE_BONUS;
      }
    });

    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const treeId = getCardTree(cardId);
      if (!treeId) {
        return;
      }
      const role = getCardRewardRole(cardId, content);
      const weight = CARD_ROLE_SCORE_WEIGHTS[role] || CARD_ROLE_SCORE_WEIGHTS.foundation;
      Object.keys(scores).forEach((archetypeId) => {
        if (Object.prototype.hasOwnProperty.call(scores, archetypeId)) {
          const treeMatchMultiplier = getArchetypeCardMatchMultiplier(run.classId, archetypeId, treeId);
          if (treeMatchMultiplier > 0) {
            scores[archetypeId] += weight * treeMatchMultiplier;
          }
        }
      });
    });

    return scores;
  }

  function syncArchetypeScores(run: RunState, content: GameContent) {
    const nextScores = computeArchetypeScores(run, content);
    if (run.progression?.classProgression) {
      run.progression.classProgression.archetypeScores = { ...nextScores };
    }
    return nextScores;
  }

  function getArchetypeScoreEntries(run: RunState, content: GameContent) {
    const scores = syncArchetypeScores(run, content);
    return sortArchetypeScoreEntries(run.classId, scores);
  }

  function getDominantArchetype(run: RunState, content: GameContent) {
    const ranked = getArchetypeScoreEntries(run, content);
    return {
      primary: ranked[0] || null,
      secondary: ranked[1] || null,
    };
  }

  function getStrategicWeaponFamilies(run: RunState, content: GameContent) {
    const dominant = getDominantArchetype(run, content);
    const families: string[] = [];
    const primaryFamilies = getArchetypeWeaponFamilies(dominant.primary?.archetypeId || "");
    const secondaryFamilies = getArchetypeWeaponFamilies(dominant.secondary?.archetypeId || "");
    const classFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
    const includeSecondaryFamilies =
      primaryFamilies.length === 0 ||
      (
        secondaryFamilies.length > 0 &&
        toNumber(dominant.secondary?.score, 0) >= toNumber(dominant.primary?.score, 0) * SECONDARY_WEAPON_FAMILY_THRESHOLD
      );
    let prioritizedFamilies = classFamilies;
    if (primaryFamilies.length > 0) {
      prioritizedFamilies = [
        ...primaryFamilies,
        ...(includeSecondaryFamilies ? secondaryFamilies : []),
      ];
    } else if (secondaryFamilies.length > 0) {
      prioritizedFamilies = secondaryFamilies;
    }
    prioritizedFamilies.forEach((family) => {
      if (!families.includes(family)) {
        families.push(family);
      }
    });
    return families;
  }

  function inferDeckBuildPath(run: RunState) {
    const treeCounts = new Map<string, number>();
    (Array.isArray(run.deck) ? run.deck : []).forEach((cardId: string) => {
      const tree = getCardTree(cardId);
      if (!tree) {
        return;
      }
      treeCounts.set(tree, (treeCounts.get(tree) || 0) + 1);
    });
    const ranked = [...treeCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    const [topTree, topCount] = ranked[0] || ["", 0];
    const secondCount = ranked[1]?.[1] || 0;
    if (!topTree || topCount < 2 || topCount <= secondCount) {
      return null;
    }

    const classPaths = BUILD_PATHS[run.classId] || {};
    return (
      Object.entries(classPaths).find(([, path]) => path.primaryTrees.includes(topTree))?.[0] ||
      Object.entries(classPaths).find(([, path]) => path.supportTrees.includes(topTree))?.[0] ||
      ""
    );
  }

  function getRewardPathPreference(run: RunState, content: GameContent) {
    const dominantArchetypes = getDominantArchetype(run, content);
    const trackedPath = dominantArchetypes.primary ? getBuildPath(run.classId, dominantArchetypes.primary.archetypeId) : null;
    if (
      trackedPath &&
      (!dominantArchetypes.secondary || dominantArchetypes.primary!.score > dominantArchetypes.secondary.score)
    ) {
      return {
        source: "tracked",
        treeId: dominantArchetypes.primary!.archetypeId,
        label: trackedPath.label,
        score: dominantArchetypes.primary!.score,
        primaryTrees: [...trackedPath.primaryTrees],
        supportTrees: [...trackedPath.supportTrees],
      };
    }

    const favoredTreeId = run.progression?.classProgression?.favoredTreeId || "";
    const favoredPath = favoredTreeId ? getBuildPath(run.classId, favoredTreeId) : null;
    if (favoredPath) {
      return {
        source: "favored",
        treeId: favoredTreeId,
        label: favoredPath.label,
        score: toNumber(run.progression?.classProgression?.archetypeScores?.[favoredTreeId], 0),
        primaryTrees: [...favoredPath.primaryTrees],
        supportTrees: [...favoredPath.supportTrees],
      };
    }

    const inferredTreeId = inferDeckBuildPath(run);
    const inferredPath = inferredTreeId ? getBuildPath(run.classId, inferredTreeId) : null;
    if (inferredPath) {
      return {
        source: "emerging",
        treeId: inferredTreeId,
        label: inferredPath.label,
        score: toNumber(run.progression?.classProgression?.archetypeScores?.[inferredTreeId], 0),
        primaryTrees: [...inferredPath.primaryTrees],
        supportTrees: [...inferredPath.supportTrees],
      };
    }

    return null;
  }

  function getPoolCandidates(pool: string[], usedCardIds: Set<string>, content: GameContent) {
    return (Array.isArray(pool) ? pool : []).filter((cardId: string) => {
      return Boolean(content.cardCatalog[cardId]) && !usedCardIds.has(cardId);
    });
  }

  function pickCandidateWithTreeBias(candidates: string[], seed: number, preferredTrees: string[] = [], supportTrees: string[] = []) {
    if (candidates.length === 0) {
      return "";
    }
    if (preferredTrees.length > 0) {
      const primaryCandidates = candidates.filter((cardId: string) => preferredTrees.includes(getCardTree(cardId)));
      if (primaryCandidates.length > 0) {
        return primaryCandidates[seed % primaryCandidates.length];
      }
    }
    if (supportTrees.length > 0) {
      const supportCandidates = candidates.filter((cardId: string) => supportTrees.includes(getCardTree(cardId)));
      if (supportCandidates.length > 0) {
        return supportCandidates[seed % supportCandidates.length];
      }
    }
    return candidates[seed % candidates.length];
  }

  function pickPreferredCardId(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const candidates = getPoolCandidates(pool, usedCardIds, content);
    if (candidates.length === 0) {
      return "";
    }
    return pickCandidateWithTreeBias(candidates, seed, preferredTrees, supportTrees);
  }

  function pickRoleScopedCardId(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    role: CardRewardRole,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const candidates = getPoolCandidates(pool, usedCardIds, content).filter((cardId: string) => getCardRewardRole(cardId, content) === role);
    return pickCandidateWithTreeBias(candidates, seed, preferredTrees, supportTrees);
  }

  function pickCardForRole(
    pool: string[],
    seed: number,
    usedCardIds: Set<string>,
    content: GameContent,
    role: CardRewardRole,
    preferredTrees: string[] = [],
    supportTrees: string[] = []
  ) {
    const strictMatch = pickRoleScopedCardId(pool, seed, usedCardIds, content, role, preferredTrees, supportTrees);
    if (strictMatch) {
      return strictMatch;
    }
    return pickPreferredCardId(pool, seed, usedCardIds, content, preferredTrees, supportTrees);
  }

  function buildRoleSubtitle(buildPath: ReturnType<typeof getRewardPathPreference>, role: CardRewardRole) {
    const roleLabel = CARD_ROLE_LABELS[role] || CARD_ROLE_LABELS.engine;
    return buildPath ? `${buildPath.label} ${roleLabel}` : `${roleLabel} Skill`;
  }

  function getUpgradableCardIds(run: RunState, content: GameContent) {
    const seen = new Set();
    return run.deck.filter((cardId: string) => {
      const upgradedCardId = `${cardId}_plus`;
      if (seen.has(cardId) || !content.cardCatalog[upgradedCardId]) {
        return false;
      }
      seen.add(cardId);
      return true;
    });
  }

  function buildCardChoice(cardId: string, content: GameContent, subtitle: string) {
    const card = content.cardCatalog[cardId];
    const cardRewardRole = getCardRewardRole(cardId, content);
    const archetypeTags = getCardArchetypeTags(cardId, content);
    const archetypeLabels = getArchetypeLabels(archetypeTags);
    return {
      id: `reward_card_${cardId}`,
      kind: "card",
      title: card.title,
      subtitle,
      description: card.text,
      previewLines: [
        `Role: ${CARD_ROLE_LABELS[cardRewardRole]}.`,
        ...(archetypeLabels.length > 0 ? [`Archetypes: ${archetypeLabels.join(" / ")}.`] : []),
        `Add ${card.title} to your deck.`,
        `Deck size +1.`,
      ],
      cardRewardRole,
      archetypeTags,
      effects: [{ kind: "add_card" as const, cardId }],
    };
  }

  function buildUpgradeChoice(fromCardId: string, content: GameContent) {
    const upgradedCardId = `${fromCardId}_plus`;
    const baseCard = content.cardCatalog[fromCardId];
    const upgradedCard = content.cardCatalog[upgradedCardId];
    if (!baseCard || !upgradedCard) {
      return null;
    }

    return {
      id: `reward_upgrade_${fromCardId}`,
      kind: "upgrade",
      title: `Upgrade ${baseCard.title}`,
      subtitle: `Sharpen ${CARD_ROLE_LABELS[getCardRewardRole(fromCardId, content)]}`,
      description: upgradedCard.text,
      previewLines: [
        `Replace 1x ${baseCard.title} with ${upgradedCard.title}.`,
        `Keep deck size the same.`,
      ],
      cardRewardRole: getCardRewardRole(fromCardId, content),
      archetypeTags: getCardArchetypeTags(fromCardId, content),
      effects: [{ kind: "upgrade_card" as const, fromCardId, toCardId: upgradedCardId }],
    };
  }

  function sortReinforceCandidates(cardIds: string[], content: GameContent, buildPath: ReturnType<typeof getRewardPathPreference>) {
    return [...cardIds].sort((left, right) => {
      const leftTree = getCardTree(left);
      const rightTree = getCardTree(right);
      const leftPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(leftTree)));
      const rightPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(rightTree)));
      if (leftPrimary !== rightPrimary) {
        return rightPrimary - leftPrimary;
      }

      const leftRoleWeight = CARD_ROLE_SCORE_WEIGHTS[getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = CARD_ROLE_SCORE_WEIGHTS[getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function sortSupportCandidates(cardIds: string[], content: GameContent, buildPath: ReturnType<typeof getRewardPathPreference>) {
    return [...cardIds].sort((left, right) => {
      const leftTree = getCardTree(left);
      const rightTree = getCardTree(right);
      const leftSupportTree = Number(Boolean(buildPath?.supportTrees?.includes(leftTree)));
      const rightSupportTree = Number(Boolean(buildPath?.supportTrees?.includes(rightTree)));
      if (leftSupportTree !== rightSupportTree) {
        return rightSupportTree - leftSupportTree;
      }

      const leftPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(leftTree)));
      const rightPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(rightTree)));
      if (leftPrimary !== rightPrimary) {
        return rightPrimary - leftPrimary;
      }

      const leftRoleWeight = SUPPORT_ROLE_PRIORITY[getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = SUPPORT_ROLE_PRIORITY[getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function sortPivotCandidates(
    cardIds: string[],
    content: GameContent,
    primaryArchetypeId: string,
    pivotArchetypeId: string
  ) {
    return [...cardIds].sort((left, right) => {
      const leftTags = getCardArchetypeTags(left, content);
      const rightTags = getCardArchetypeTags(right, content);
      const leftExactPivot = Number(Boolean(pivotArchetypeId && leftTags.includes(pivotArchetypeId)));
      const rightExactPivot = Number(Boolean(pivotArchetypeId && rightTags.includes(pivotArchetypeId)));
      if (leftExactPivot !== rightExactPivot) {
        return rightExactPivot - leftExactPivot;
      }

      const leftEscapesPrimary = Number(leftTags.some((tag) => tag && tag !== primaryArchetypeId));
      const rightEscapesPrimary = Number(rightTags.some((tag) => tag && tag !== primaryArchetypeId));
      if (leftEscapesPrimary !== rightEscapesPrimary) {
        return rightEscapesPrimary - leftEscapesPrimary;
      }

      const leftRoleWeight = CARD_ROLE_SCORE_WEIGHTS[getCardRewardRole(left, content)] || 0;
      const rightRoleWeight = CARD_ROLE_SCORE_WEIGHTS[getCardRewardRole(right, content)] || 0;
      if (leftRoleWeight !== rightRoleWeight) {
        return rightRoleWeight - leftRoleWeight;
      }

      return String(content.cardCatalog[left]?.title || left).localeCompare(String(content.cardCatalog[right]?.title || right));
    });
  }

  function getStrategicRewardPool(run: RunState, content: GameContent) {
    const classPool = getClassPoolForZone(content, run.classId, "boss", run.actNumber);
    const profileId = getDeckProfileId(content, run.classId);
    return classPool.length > 0 ? classPool : (content.rewardPools?.profileCards?.[profileId] || []);
  }

  function resolveReinforceBuildReward(run: RunState, content: GameContent) {
    annotateCardRewardMetadata(content);
    const buildPath = getRewardPathPreference(run, content);
    if (!buildPath?.treeId) {
      return {
        effect: { kind: "class_point" as const, value: 1 },
        previewLine: "Build reinforcement: Gain 1 class point.",
      };
    }

    const matchingUpgrades = sortReinforceCandidates(
      getUpgradableCardIds(run, content).filter((cardId: string) => getCardArchetypeTags(cardId, content).includes(buildPath.treeId)),
      content,
      buildPath
    );
    const upgradeCardId = matchingUpgrades[0] || "";
    if (upgradeCardId) {
      const upgradedCardId = `${upgradeCardId}_plus`;
      const baseTitle = content.cardCatalog[upgradeCardId]?.title || upgradeCardId;
      const upgradedTitle = content.cardCatalog[upgradedCardId]?.title || upgradedCardId;
      return {
        effect: { kind: "upgrade_card" as const, fromCardId: upgradeCardId, toCardId: upgradedCardId },
        previewLine: `Build reinforcement: Upgrade ${baseTitle} to ${upgradedTitle}.`,
      };
    }

    const usedCardIds = new Set(Array.isArray(run.deck) ? run.deck : []);
    const fallbackPool = getStrategicRewardPool(run, content);
    const addCandidates = sortReinforceCandidates(
      getPoolCandidates(fallbackPool, usedCardIds, content).filter((cardId: string) => getCardArchetypeTags(cardId, content).includes(buildPath.treeId)),
      content,
      buildPath
    );
    const addCardId = addCandidates[0] || "";
    if (addCardId) {
      const addedTitle = content.cardCatalog[addCardId]?.title || addCardId;
      return {
        effect: { kind: "add_card" as const, cardId: addCardId },
        previewLine: `Build reinforcement: Add ${addedTitle} to your deck.`,
      };
    }

    return {
      effect: { kind: "class_point" as const, value: 1 },
      previewLine: `Build reinforcement: Gain 1 class point for ${buildPath.label}.`,
    };
  }

  function resolveSupportBuildReward(run: RunState, content: GameContent) {
    annotateCardRewardMetadata(content);
    const buildPath = getRewardPathPreference(run, content);
    if (!buildPath?.treeId) {
      return {
        effect: { kind: "hero_max_life" as const, value: 3 },
        previewLine: "Build support: Gain 3 max Life.",
      };
    }

    const matchingUpgrades = sortSupportCandidates(
      getUpgradableCardIds(run, content).filter((cardId: string) => {
        if (!getCardArchetypeTags(cardId, content).includes(buildPath.treeId)) {
          return false;
        }
        const role = getCardRewardRole(cardId, content);
        return role === "support" || role === "tech" || role === "foundation";
      }),
      content,
      buildPath
    );
    const upgradeCardId = matchingUpgrades[0] || "";
    if (upgradeCardId) {
      const upgradedCardId = `${upgradeCardId}_plus`;
      const baseTitle = content.cardCatalog[upgradeCardId]?.title || upgradeCardId;
      const upgradedTitle = content.cardCatalog[upgradedCardId]?.title || upgradedCardId;
      return {
        effect: { kind: "upgrade_card" as const, fromCardId: upgradeCardId, toCardId: upgradedCardId },
        previewLine: `Build support: Upgrade ${baseTitle} to ${upgradedTitle}.`,
      };
    }

    const usedCardIds = new Set(Array.isArray(run.deck) ? run.deck : []);
    const addCandidates = sortSupportCandidates(
      getPoolCandidates(getStrategicRewardPool(run, content), usedCardIds, content).filter((cardId: string) => {
        if (!getCardArchetypeTags(cardId, content).includes(buildPath.treeId)) {
          return false;
        }
        const role = getCardRewardRole(cardId, content);
        return role === "support" || role === "tech" || role === "foundation";
      }),
      content,
      buildPath
    );
    const addCardId = addCandidates[0] || "";
    if (addCardId) {
      const addedTitle = content.cardCatalog[addCardId]?.title || addCardId;
      return {
        effect: { kind: "add_card" as const, cardId: addCardId },
        previewLine: `Build support: Add ${addedTitle} to steady ${buildPath.label}.`,
      };
    }

    return {
      effect: { kind: "hero_max_life" as const, value: 3 },
      previewLine: `Build support: Gain 3 max Life for ${buildPath.label}.`,
    };
  }

  function resolvePivotBuildReward(run: RunState, content: GameContent) {
    annotateCardRewardMetadata(content);
    const dominant = getDominantArchetype(run, content);
    const buildPath = getRewardPathPreference(run, content);
    const primaryArchetypeId = dominant.primary?.archetypeId || buildPath?.treeId || "";
    const pivotArchetypeId =
      dominant.secondary?.archetypeId && dominant.secondary.archetypeId !== primaryArchetypeId
        ? dominant.secondary.archetypeId
        : "";
    const pivotLabel = (pivotArchetypeId && BUILD_PATHS[run.classId]?.[pivotArchetypeId]?.label) || "an alternate build";

    const usedCardIds = new Set(Array.isArray(run.deck) ? run.deck : []);
    const addCandidates = sortPivotCandidates(
      getPoolCandidates(getStrategicRewardPool(run, content), usedCardIds, content).filter((cardId: string) => {
        const tags = getCardArchetypeTags(cardId, content);
        if (tags.length === 0) {
          return false;
        }
        if (pivotArchetypeId) {
          return tags.includes(pivotArchetypeId);
        }
        return tags.some((tag) => tag && tag !== primaryArchetypeId);
      }),
      content,
      primaryArchetypeId,
      pivotArchetypeId
    );
    const addCardId = addCandidates[0] || "";
    if (addCardId) {
      const addedTitle = content.cardCatalog[addCardId]?.title || addCardId;
      return {
        effect: { kind: "add_card" as const, cardId: addCardId },
        previewLine: `Strategic pivot: Add ${addedTitle} to keep ${pivotLabel} open.`,
      };
    }

    return {
      effect: { kind: "class_point" as const, value: 1 },
      previewLine: `Strategic pivot: Gain 1 class point to keep ${pivotLabel} open.`,
    };
  }

  function pickBoonChoice(zoneRole: string, seed: number, profile: ProfileState | null = null, actNumber: number = 1) {
    const pool = (BOON_POOLS as Record<string, typeof BOON_POOLS.opening>)[zoneRole] || BOON_POOLS.opening;
    const definition = pool[seed % pool.length];
    const scaledEffects = definition.effects.map((effect: RewardChoiceEffect) => {
      if (effect.kind === "gold_bonus") {
        return {
          ...effect,
          value: scaleGoldValue(effect.value + Math.max(0, actNumber - 1) * 2, profile),
        };
      }

      return { ...effect };
    });
    const choice = buildBoonChoice({
      ...definition,
      effects: scaledEffects,
    });
    if (getRewardAccountFeatures(profile).economyLedger && scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "gold_bonus")) {
      choice.previewLines.push("Economy Ledger dividend is active on this payout.");
    }
    return choice;
  }

  function ensureThreeChoices({
    choices,
    run,
    zone,
    content,
    seed,
    usedCardIds,
    profile = null,
    actNumber = 1,
    allowFallbackCards = true,
  }: {
    choices: RewardChoice[];
    run: RunState;
    zone: ZoneState;
    content: GameContent;
    seed: number;
    usedCardIds: Set<string>;
    profile?: ProfileState | null;
    actNumber?: number;
    allowFallbackCards?: boolean;
  }) {
    const profileId = getDeckProfileId(content, run.classId);
    const buildPath = getRewardPathPreference(run, content);
    const fallbackPools = [
      content.rewardPools?.profileCards?.[profileId] || [],
      content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [],
      content.rewardPools?.bossCards || [],
    ];

    if (allowFallbackCards) {
      for (let poolIndex = 0; choices.length < 3 && poolIndex < fallbackPools.length; poolIndex += 1) {
        const pool = fallbackPools[poolIndex];
        const cardId = pickPreferredCardId(
          pool,
          seed + poolIndex + choices.length,
          usedCardIds,
          content,
          buildPath?.primaryTrees || [],
          buildPath?.supportTrees || []
        );
        if (!cardId) {
          continue;
        }
        usedCardIds.add(cardId);
        choices.push(buildCardChoice(cardId, content, buildPath ? `${buildPath.label} Skill` : "Fallback Skill"));
      }
    }

    while (choices.length < 3) {
      choices.push(pickBoonChoice(zone.zoneRole, seed + choices.length, profile, actNumber));
    }

    return choices.slice(0, runtimeWindow.ROUGE_LIMITS.REWARD_CHOICES);
  }

  function getClassPoolForZone(content: GameContent, classId: string, zoneRole: string, actNumber: number) {
    const classPools = content.classRewardPools?.[classId];
    if (!classPools) {
      return [];
    }
    if (actNumber >= 4 || zoneRole === "boss") {
      return [...classPools.late, ...classPools.mid];
    }
    if (actNumber >= 2 || zoneRole === "branchMiniboss" || zoneRole === "branchBattle") {
      return [...classPools.mid, ...classPools.early];
    }
    return [...classPools.early];
  }

  function buildRewardChoices({ content, run, zone, actNumber, encounterNumber, profile = null }: { content: GameContent; run: RunState; zone: ZoneState; actNumber: number; encounterNumber: number; profile?: ProfileState | null }) {
    annotateCardRewardMetadata(content);
    const seed = getChoiceSeed(run, zone, actNumber, encounterNumber);
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const usedCardIds = new Set<string>();
    const choices: RewardChoice[] = [];
    const profileId = getDeckProfileId(content, run.classId);
    const buildPath = getRewardPathPreference(run, content);
    const classPool = getClassPoolForZone(content, run.classId, zone.zoneRole, actNumber);
    const profilePool = classPool.length > 0 ? classPool : (content.rewardPools?.profileCards?.[profileId] || []);
    const zonePool = content.rewardPools?.zoneRoleCards?.[zone.zoneRole] || [];
    const bossPool = content.rewardPools?.bossCards || [];
    const upgradableCardIds = getUpgradableCardIds(run, content);
    const preferredUpgradeCandidates = upgradableCardIds.filter((cardId: string) => {
      const tree = getCardTree(cardId);
      return buildPath?.primaryTrees?.includes(tree) || buildPath?.supportTrees?.includes(tree);
    });
    const upgradeSource = preferredUpgradeCandidates.length > 0 ? preferredUpgradeCandidates : upgradableCardIds;
    const upgradeCardId = upgradeSource.length > 0 ? upgradeSource[seed % upgradeSource.length] : "";
    const upgradeChoice = upgradeCardId ? buildUpgradeChoice(upgradeCardId, content) : null;
    const deckSize = Array.isArray(run.deck) ? run.deck.length : 0;
    const upgradeThreshold = getDeckUpgradeThreshold(actNumber);
    const softCardCap = getDeckSoftCardCap(actNumber);
    const hardCardCap = getDeckHardCardCap(actNumber);
    const preferUpgrade = deckSize >= upgradeThreshold && Boolean(upgradeChoice);
    const softCapCards = deckSize >= softCardCap;
    const hardCapCards = deckSize >= hardCardCap;
    const equipmentChoice = itemSystem?.buildEquipmentChoice({
      content,
      run,
      zone,
      actNumber,
      encounterNumber,
      profile,
    });
    const progressionChoice = pickProgressionChoice(zone, seed + 3, run, actNumber, content, profile);

    const firstCardPool = zone.kind === ZONE_KIND.BOSS ? [...bossPool, ...profilePool] : [...profilePool, ...zonePool];
    const firstCardId = pickCardForRole(
      firstCardPool,
      seed,
      usedCardIds,
      content,
      "engine",
      buildPath?.primaryTrees || [],
      buildPath?.supportTrees || []
    );
    const canOfferPrimaryCard = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !hardCapCards;
    if (firstCardId && canOfferPrimaryCard) {
      usedCardIds.add(firstCardId);
      choices.push(buildCardChoice(firstCardId, content, buildRoleSubtitle(buildPath, getCardRewardRole(firstCardId, content))));
    } else if (preferUpgrade && upgradeChoice) {
      choices.push(upgradeChoice);
    }

    if (progressionChoice) {
      choices.push(progressionChoice);
    }

    if (equipmentChoice) {
      choices.push(equipmentChoice);
    }

    if (preferUpgrade && upgradeChoice && !choices.some((choice) => choice.id === upgradeChoice.id) && choices.length < 3) {
      choices.push(upgradeChoice);
    }

    if (zone.kind === ZONE_KIND.BOSS) {
      if (choices.length < 3) {
        choices.push(pickBoonChoice("boss", seed + 9, profile, actNumber));
      }
      if (upgradeChoice && choices.length < 3 && !choices.some((choice) => choice.id === upgradeChoice.id)) {
        choices.push(upgradeChoice);
      }
    } else if ((zone.kind === ZONE_KIND.MINIBOSS || zone.zoneRole === "branchBattle") && upgradeChoice) {
      if (choices.length >= 3) {
        choices[choices.length - 1] = upgradeChoice;
      } else {
        choices.push(upgradeChoice);
      }
    }

    const boonRole = zone.kind === ZONE_KIND.BOSS ? "boss" : zone.zoneRole;
    if (zone.kind !== ZONE_KIND.BOSS && choices.length < 3) {
      choices.push(pickBoonChoice(boonRole, seed + 9, profile, actNumber));
    }

    const secondCardPool = zone.kind === ZONE_KIND.BOSS ? [...zonePool, ...profilePool] : [...zonePool, ...profilePool, ...bossPool];
    const canOfferSecondaryCard = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !softCapCards;
    if (choices.length < 3 && canOfferSecondaryCard) {
      let secondCardId = pickRoleScopedCardId(
        secondCardPool,
        seed + 5,
        usedCardIds,
        content,
        "support",
        buildPath?.supportTrees || buildPath?.primaryTrees || [],
        buildPath?.primaryTrees || []
      );
      if (!secondCardId) {
        secondCardId = pickRoleScopedCardId(
          secondCardPool,
          seed + 6,
          usedCardIds,
          content,
          "tech",
          buildPath?.primaryTrees || buildPath?.supportTrees || [],
          buildPath?.supportTrees || []
        );
      }
      if (!secondCardId) {
        secondCardId = pickCardForRole(
          secondCardPool,
          seed + 5,
          usedCardIds,
          content,
          "support",
          buildPath?.supportTrees || buildPath?.primaryTrees || [],
          buildPath?.primaryTrees || []
        );
      }
      if (secondCardId) {
        usedCardIds.add(secondCardId);
        choices.push(buildCardChoice(secondCardId, content, buildRoleSubtitle(buildPath, getCardRewardRole(secondCardId, content))));
      }
    }

    const allowFallbackCards = zone.kind === ZONE_KIND.BOSS ? !hardCapCards : !softCapCards;
    return ensureThreeChoices({
      choices,
      run,
      zone,
      content,
      seed: seed + 13,
      usedCardIds,
      profile,
      actNumber,
      allowFallbackCards,
    });
  }

  function addCardToDeck(run: RunState, cardId: string, content: GameContent) {
    if (!content.cardCatalog[cardId]) {
      return { ok: false, message: `Unknown reward card: ${cardId}` };
    }
    run.deck.push(cardId);
    return { ok: true };
  }

  function upgradeCardInDeck(run: RunState, fromCardId: string, toCardId: string, content: GameContent) {
    if (!fromCardId || !toCardId || !content.cardCatalog[toCardId]) {
      return { ok: false, message: "Reward upgrade is invalid." };
    }
    const deckIndex = run.deck.findIndex((cardId: string) => cardId === fromCardId);
    if (deckIndex < 0) {
      return { ok: false, message: `No ${fromCardId} copy remains in the deck.` };
    }
    run.deck.splice(deckIndex, 1, toCardId);
    return { ok: true };
  }

  function applyChoice(run: RunState, choice: RewardChoice, content: GameContent) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const equipmentEffects = effects.filter((effect: RewardChoiceEffect) => {
      return (
        effect.kind === "equip_item" ||
        effect.kind === "grant_item" ||
        effect.kind === "grant_rune" ||
        effect.kind === "socket_rune" ||
        effect.kind === "add_socket"
      );
    });

    if (equipmentEffects.length > 0 && itemSystem) {
      const equipmentResult = itemSystem.applyChoice(
        run,
        {
          ...choice,
          effects: equipmentEffects,
        },
        content
      );
      if (!equipmentResult.ok) {
        return equipmentResult;
      }
    }

    for (let index = 0; index < effects.length; index += 1) {
      const rawEffect = effects[index];
      let effect = rawEffect;
      if (rawEffect.kind === "reinforce_build") {
        effect = resolveReinforceBuildReward(run, content).effect;
      } else if (rawEffect.kind === "support_build") {
        effect = resolveSupportBuildReward(run, content).effect;
      } else if (rawEffect.kind === "pivot_build") {
        effect = resolvePivotBuildReward(run, content).effect;
      }
      if (
        effect.kind === "equip_item" ||
        effect.kind === "grant_item" ||
        effect.kind === "grant_rune" ||
        effect.kind === "socket_rune" ||
        effect.kind === "add_socket"
      ) {
        continue;
      }

      if (effect.kind === "add_card") {
        const result = addCardToDeck(run, effect.cardId, content);
        if (!result.ok) {
          return result;
        }
        continue;
      }

      if (effect.kind === "upgrade_card") {
        const result = upgradeCardInDeck(run, effect.fromCardId, effect.toCardId, content);
        if (!result.ok) {
          return result;
        }
        continue;
      }

      if (effect.kind === "hero_max_life") {
        const lifeGain = toNumber(effect.value, 0);
        run.hero.maxLife += lifeGain;
        run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "hero_max_energy") {
        const energyGain = toNumber(effect.value, 0);
        run.hero.maxEnergy = clamp(run.hero.maxEnergy + energyGain, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
        continue;
      }

      if (effect.kind === "hero_potion_heal") {
        const potionGain = toNumber(effect.value, 0);
        run.hero.potionHeal = clamp(run.hero.potionHeal + potionGain, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_POTION_HEAL);
        continue;
      }

      if (effect.kind === "mercenary_attack") {
        const attackGain = toNumber(effect.value, 0);
        run.mercenary.attack += attackGain;
        continue;
      }

      if (effect.kind === "mercenary_max_life") {
        const lifeGain = toNumber(effect.value, 0);
        run.mercenary.maxLife += lifeGain;
        run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "belt_capacity") {
        const capacityGain = toNumber(effect.value, 0);
        run.belt.max = clamp(run.belt.max + capacityGain, 1, MAX_BELT_SIZE);
        continue;
      }

      if (effect.kind === "refill_potions") {
        const refillAmount = toNumber(effect.value, 0);
        run.belt.current = Math.min(run.belt.max, run.belt.current + refillAmount);
        continue;
      }

      if (effect.kind === "gold_bonus") {
        const goldGain = toNumber(effect.value, 0);
        run.gold += goldGain;
        run.summary.goldGained += goldGain;
        continue;
      }

      if (effect.kind === "class_point") {
        const pointGain = toNumber(effect.value, 0);
        run.progression.classPointsAvailable += pointGain;
        run.summary.classPointsEarned += pointGain;
        continue;
      }

      if (effect.kind === "attribute_point") {
        const pointGain = toNumber(effect.value, 0);
        run.progression.attributePointsAvailable += pointGain;
        run.summary.attributePointsEarned += pointGain;
      }
    }

    syncArchetypeScores(run, content);
    return { ok: true };
  }

  runtimeWindow.ROUGE_REWARD_ENGINE = {
    annotateCardRewardMetadata,
    getCardRewardRole,
    getCardArchetypeTags,
    computeArchetypeScores,
    syncArchetypeScores,
    getArchetypeScoreEntries,
    getDominantArchetype,
    getArchetypeWeaponFamilies,
    getStrategicWeaponFamilies,
    buildRewardChoices,
    applyChoice,
    getUpgradableCardIds,
    resolveReinforceBuildReward,
    resolveSupportBuildReward,
    resolvePivotBuildReward,
  };
})();
