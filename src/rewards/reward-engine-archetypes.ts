(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

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
    assassin_martial_arts: ["Swords"],
    assassin_shadow_disciplines: ["Swords"],
    assassin_traps: ["Swords"],
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

  function getDeckProfileId(content: GameContent, classId: string) {
    return content.classDeckProfiles?.[classId] || "warrior";
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

  function getRewardPathPreference(run: RunState, content: GameContent): RewardPathPreference | null {
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

  runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES = {
    CARD_ROLE_LABELS,
    CARD_ROLE_SCORE_WEIGHTS,
    SUPPORT_ROLE_PRIORITY,
    getDeckProfileId,
    getCardTree,
    annotateCardRewardMetadata,
    getCardRewardRole,
    getCardArchetypeTags,
    getArchetypeLabels,
    computeArchetypeScores,
    syncArchetypeScores,
    getArchetypeScoreEntries,
    getDominantArchetype,
    getArchetypeWeaponFamilies,
    getStrategicWeaponFamilies,
    getRewardPathPreference,
  };
})();
