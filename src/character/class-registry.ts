/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, toNumber } = runtimeWindow.ROUGE_UTILS;

  const TREE_ARCHETYPES = {
    martial: {
      id: "martial",
      summary: "Build direct weapon pressure, sturdier frontlines, and unlock melee class skills.",
      bonusPerRank: {
        heroDamageBonus: 1,
        heroMaxLife: 1,
      },
      unlockThreshold: 2,
      unlockBonusPerThreshold: {
        heroDamageBonus: 1,
        heroGuardBonus: 1,
      },
    },
    arcane: {
      id: "arcane",
      summary: "Build mana pressure and spell scaling for class-driven skills.",
      bonusPerRank: {
        heroMaxEnergy: 1,
        heroBurnBonus: 1,
      },
      unlockThreshold: 2,
      unlockBonusPerThreshold: {
        heroBurnBonus: 1,
      },
    },
    support: {
      id: "support",
      summary: "Build guard, resilience, and safer sustained fights.",
      bonusPerRank: {
        heroGuardBonus: 1,
        heroMaxLife: 2,
      },
      unlockThreshold: 2,
      unlockBonusPerThreshold: {
        heroMaxLife: 2,
        heroDamageBonus: 1,
      },
    },
    command: {
      id: "command",
      summary: "Build tactical support and stronger mercenary follow-through.",
      bonusPerRank: {
        heroGuardBonus: 1,
        mercenaryAttack: 1,
        mercenaryMaxLife: 2,
      },
      unlockThreshold: 2,
      unlockBonusPerThreshold: {
        mercenaryAttack: 1,
        mercenaryMaxLife: 2,
        heroDamageBonus: 1,
      },
    },
  };
  const TREE_METADATA: Record<string, { behaviorTags: CardBehaviorTag[]; counterTags: CounterTag[] }> = {
    amazon_bow_and_crossbow: {
      behaviorTags: ["pressure", "setup", "payoff"],
      counterTags: ["anti_backline", "anti_summon", "telegraph_respect"],
    },
    amazon_javelin_and_spear: {
      behaviorTags: ["pressure", "payoff", "scaling"],
      counterTags: ["anti_summon", "anti_guard_break"],
    },
    amazon_passive_and_magic: {
      behaviorTags: ["salvage", "mitigation", "scaling", "protection"],
      counterTags: ["anti_attrition", "anti_backline"],
    },
    assassin_martial_arts: {
      behaviorTags: ["pressure", "payoff", "conversion"],
      counterTags: ["anti_guard_break", "telegraph_respect"],
    },
    assassin_shadow_disciplines: {
      behaviorTags: ["mitigation", "salvage", "disruption", "protection"],
      counterTags: ["anti_control", "anti_tax", "anti_attrition"],
    },
    assassin_traps: {
      behaviorTags: ["setup", "payoff", "scaling", "tax"],
      counterTags: ["anti_summon", "anti_backline", "anti_support_disruption"],
    },
    barbarian_combat_skills: {
      behaviorTags: ["pressure", "payoff", "conversion"],
      counterTags: ["anti_guard_break", "telegraph_respect"],
    },
    barbarian_combat_masteries: {
      behaviorTags: ["mitigation", "scaling", "support"],
      counterTags: ["anti_attrition", "anti_control"],
    },
    barbarian_warcries: {
      behaviorTags: ["tax", "disruption", "salvage", "protection"],
      counterTags: ["anti_summon", "anti_support_disruption", "anti_control"],
    },
    druid_elemental: {
      behaviorTags: ["setup", "payoff", "pressure", "scaling"],
      counterTags: ["anti_summon", "anti_backline"],
    },
    druid_shape_shifting: {
      behaviorTags: ["pressure", "mitigation", "conversion"],
      counterTags: ["anti_attrition", "anti_guard_break"],
    },
    druid_summoning: {
      behaviorTags: ["setup", "protection", "scaling", "salvage"],
      counterTags: ["anti_attrition", "anti_backline", "anti_control"],
    },
    necromancer_curses: {
      behaviorTags: ["tax", "disruption", "support", "conversion"],
      counterTags: ["anti_support_disruption", "anti_attrition", "anti_guard_break"],
    },
    necromancer_poison_and_bone: {
      behaviorTags: ["pressure", "payoff", "setup"],
      counterTags: ["anti_backline", "anti_attrition"],
    },
    necromancer_summoning: {
      behaviorTags: ["setup", "protection", "scaling"],
      counterTags: ["anti_attrition", "anti_control", "anti_summon"],
    },
    paladin_combat_skills: {
      behaviorTags: ["pressure", "mitigation", "payoff"],
      counterTags: ["anti_guard_break", "telegraph_respect"],
    },
    paladin_offensive_auras: {
      behaviorTags: ["support", "setup", "payoff", "scaling"],
      counterTags: ["anti_summon", "anti_fire_pressure"],
    },
    paladin_defensive_auras: {
      behaviorTags: ["mitigation", "protection", "support", "conversion"],
      counterTags: ["anti_attrition", "anti_fire_pressure", "anti_control"],
    },
    sorceress_cold: {
      behaviorTags: ["setup", "disruption", "mitigation", "payoff"],
      counterTags: ["telegraph_respect", "anti_backline", "anti_fire_pressure"],
    },
    sorceress_fire: {
      behaviorTags: ["pressure", "payoff", "scaling"],
      counterTags: ["anti_summon", "anti_guard_break"],
    },
    sorceress_lightning: {
      behaviorTags: ["pressure", "salvage", "disruption", "payoff"],
      counterTags: ["anti_backline", "anti_support_disruption", "anti_lightning_pressure"],
    },
  };
  const TREE_PROGRESS_OVERRIDES: Record<string, {
    bonusPerRank?: Partial<ItemBonusSet>;
    unlockBonusPerThreshold?: Partial<ItemBonusSet>;
  }> = {
    assassin_traps: {
      bonusPerRank: {
        heroDamageBonus: 1,
        heroMaxEnergy: 1,
      },
      unlockBonusPerThreshold: {
        heroDamageBonus: 1,
        heroBurnBonus: 1,
      },
    },
    paladin_offensive_auras: {
      bonusPerRank: {
        heroDamageBonus: 1,
        heroGuardBonus: 1,
      },
      unlockBonusPerThreshold: {
        heroDamageBonus: 1,
        heroMaxLife: 1,
      },
    },
  };
  const EXPLICIT_STARTER_SKILL_IDS: Record<string, string> = {
    amazon: "amazon_call_the_shot",
    assassin: "assassin_shadow_feint",
    barbarian: "barbarian_core_bash",
    druid: "druid_primal_attunement",
    necromancer: "necromancer_raise_servant",
    paladin: "paladin_sanctify",
    sorceress: "sorceress_core_fire_bolt",
  };

  function getTreeMetadata(treeId: string, archetypeId: string) {
    const exact = TREE_METADATA[treeId];
    if (exact) {
      return {
        behaviorTags: [...exact.behaviorTags],
        counterTags: [...exact.counterTags],
      };
    }
    if (archetypeId === TREE_ARCHETYPES.arcane.id) {
      return {
        behaviorTags: ["setup", "payoff", "scaling"],
        counterTags: ["anti_backline", "anti_support_disruption"],
      };
    }
    if (archetypeId === TREE_ARCHETYPES.support.id) {
      return {
        behaviorTags: ["mitigation", "support", "conversion"],
        counterTags: ["anti_attrition", "anti_control"],
      };
    }
    if (archetypeId === TREE_ARCHETYPES.command.id) {
      return {
        behaviorTags: ["protection", "salvage", "scaling"],
        counterTags: ["anti_summon", "anti_support_disruption"],
      };
    }
    return {
      behaviorTags: ["pressure", "payoff"],
      counterTags: ["anti_guard_break"],
    };
  }

  function getClassList(seedBundle: SeedBundle) {
    return Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : [];
  }

  function getSkillClassList(seedBundle: SeedBundle) {
    return Array.isArray(seedBundle?.skills?.classes) ? seedBundle.skills.classes : [];
  }

  function sortSkillSeeds(skills: SkillSeedDefinition[], starterSkillId = "") {
    const seenSkillIds = new Set();
    return (Array.isArray(skills) ? skills : [])
      .filter((skill) => skill?.id && skill?.name)
      .filter((skill) => {
        if (seenSkillIds.has(skill.id)) {
          return false;
        }
        seenSkillIds.add(skill.id);
        return true;
      })
      .sort((left, right) => {
        const leftIsStarter = Boolean(left?.isStarter) || left?.id === starterSkillId;
        const rightIsStarter = Boolean(right?.isStarter) || right?.id === starterSkillId;
        if (leftIsStarter !== rightIsStarter) {
          return leftIsStarter ? -1 : 1;
        }
        const levelDelta = Math.max(1, toNumber(left?.requiredLevel, 1)) - Math.max(1, toNumber(right?.requiredLevel, 1));
        if (levelDelta !== 0) {
          return levelDelta;
        }
        return String(left?.name || "").localeCompare(String(right?.name || ""));
      });
  }

  function inferSkillSlotAndTier(skill: SkillSeedDefinition, index: number, total: number, starterSkillId: string) {
    if (skill?.isStarter || skill?.id === starterSkillId) {
      return { slot: 1 as ClassSkillSlotNumber, tier: "starter" as ClassSkillTier };
    }

    const explicitSlot = skill?.slot;
    const explicitTier = skill?.tier;
    if ((explicitSlot === 1 || explicitSlot === 2 || explicitSlot === 3)
      && (explicitTier === "starter" || explicitTier === "bridge" || explicitTier === "capstone")) {
      return { slot: explicitSlot, tier: explicitTier };
    }

    const requiredLevel = Math.max(1, toNumber(skill?.requiredLevel, 1));
    const nearEndOfTree = index >= Math.max(0, total - 2);
    if (requiredLevel >= 24 || nearEndOfTree) {
      return { slot: 3 as ClassSkillSlotNumber, tier: "capstone" as ClassSkillTier };
    }

    return { slot: 2 as ClassSkillSlotNumber, tier: "bridge" as ClassSkillTier };
  }

  function inferSkillFamily(archetypeId: string, slot: ClassSkillSlotNumber, tier: ClassSkillTier) {
    if (tier === "capstone" || slot === 3) {
      return "commitment" as SkillFamilyId;
    }
    if (slot === 1) {
      if (archetypeId === TREE_ARCHETYPES.command.id) {
        return "command" as SkillFamilyId;
      }
      if (archetypeId === TREE_ARCHETYPES.arcane.id) {
        return "state" as SkillFamilyId;
      }
      return "answer" as SkillFamilyId;
    }

    if (archetypeId === TREE_ARCHETYPES.command.id) {
      return "trigger_arming" as SkillFamilyId;
    }
    if (archetypeId === TREE_ARCHETYPES.support.id) {
      return "recovery" as SkillFamilyId;
    }
    if (archetypeId === TREE_ARCHETYPES.arcane.id) {
      return "conversion" as SkillFamilyId;
    }
    return "answer" as SkillFamilyId;
  }

  const SKILL_ECONOMY_ENVELOPE: Record<ClassSkillTier, { maxCost: number; maxCooldown: number }> = {
    starter: { maxCost: 1, maxCooldown: 2 },
    bridge: { maxCost: 2, maxCooldown: 3 },
    capstone: { maxCost: 3, maxCooldown: 5 },
  };

  function clampSkillEconomy(tier: ClassSkillTier, rawCost: number, rawCooldown: number) {
    const envelope = SKILL_ECONOMY_ENVELOPE[tier] || SKILL_ECONOMY_ENVELOPE.bridge;
    return {
      cost: Math.min(envelope.maxCost, Math.max(0, rawCost)),
      cooldown: Math.min(envelope.maxCooldown, Math.max(0, rawCooldown)),
    };
  }

  function resolveSkillFamily(
    explicitFamily: string | undefined,
    archetypeId: string,
    slot: ClassSkillSlotNumber,
    tier: ClassSkillTier
  ) {
    if (
      explicitFamily
      && ["state", "command", "answer", "trigger_arming", "conversion", "recovery", "commitment"].includes(explicitFamily)
      && !(explicitFamily === "commitment" && tier !== "capstone")
    ) {
      return explicitFamily as SkillFamilyId;
    }
    return inferSkillFamily(archetypeId, slot, tier);
  }

  function normalizeSkillDefinition(
    skill: SkillSeedDefinition,
    index: number,
    total: number,
    archetypeId: string,
    starterSkillId: string
  ) {
    if (!skill?.id || !skill?.name) {
      return null;
    }

    const { slot, tier } = inferSkillSlotAndTier(skill, index, total, starterSkillId);
    const description = String(skill.summary || skill.description || "").trim();
    const exactText = String(skill.exactText || description || skill.name).trim();
    const summary = String(skill.summary || description || `${skill.name} becomes available as a ${tier} class skill.`).trim();
    const rawCost = Math.max(0, toNumber(skill.cost, slot === 3 ? 2 : 1));
    let defaultCooldown: number;
    if (slot === 1) {
      defaultCooldown = 2;
    } else if (slot === 2) {
      defaultCooldown = 3;
    } else {
      defaultCooldown = 4;
    }
    const rawCooldown = Math.max(0, toNumber(skill.cooldown, defaultCooldown));
    const { cost, cooldown } = clampSkillEconomy(tier, rawCost, rawCooldown);
    const family = resolveSkillFamily(skill.family, archetypeId, slot, tier);

    return {
      id: skill.id,
      name: skill.name,
      requiredLevel: Math.max(1, toNumber(skill.requiredLevel, 1)),
      family,
      slot,
      tier,
      cost,
      cooldown,
      summary,
      exactText,
      isStarter: skill.id === starterSkillId || Boolean(skill.isStarter),
      chargeCount: Math.max(0, toNumber(skill.chargeCount, 0)) || undefined,
      oncePerBattle: Boolean(skill.oncePerBattle),
      active: skill.active !== false,
      skillType: String(skill.skillType || "").trim() || undefined,
      damageType: String(skill.damageType || "").trim() as SkillDamageTypeId || undefined,
    };
  }

  function normalizeTreeSkills(skills: SkillSeedDefinition[], archetypeId: string, starterSkillId: string) {
    const sortedSkills = sortSkillSeeds(skills, starterSkillId);
    return sortedSkills
      .map((skill, index) => normalizeSkillDefinition(skill, index, sortedSkills.length, archetypeId, starterSkillId))
      .filter(Boolean);
  }

  function getFallbackStarterSkillId(trees: SkillTreeSeedDefinition[]) {
    for (const tree of Array.isArray(trees) ? trees : []) {
      const firstSkill = sortSkillSeeds(tree?.skills || [])[0];
      if (firstSkill?.id) {
        return firstSkill.id;
      }
    }
    return "";
  }

  function resolveStarterSkillId(entry: ClassSkillsSeedEntry) {
    const classId = String(entry?.classId || "");
    return String(entry?.starterSkillId || EXPLICIT_STARTER_SKILL_IDS[classId] || getFallbackStarterSkillId(entry?.trees || []) || "");
  }

  function getTreeArchetype(treeName: string, index: number) {
    const normalized = String(treeName || "").toLowerCase();
    const normalizedWords = normalized.replace(/[^a-z]+/g, " ").trim();

    if (normalizedWords === "offensive auras" || normalizedWords.includes("offensive aura")) {
      return TREE_ARCHETYPES.support;
    }

    if (
      ["elemental", "fire", "cold", "lightning", "poison", "bone", "trap", "curses", "orb", "sorcer", "mage"].some((token) =>
        normalizedWords.includes(token)
      )
    ) {
      return TREE_ARCHETYPES.arcane;
    }

    if (
      ["summon", "summoning", "warcries", "passive", "shadow", "spirit", "druid"].some((token) => normalizedWords.includes(token))
    ) {
      return TREE_ARCHETYPES.command;
    }

    if (["defensive", "offensive aura", "holy", "shape", "masteries", "discipline"].some((token) => normalizedWords.includes(token))) {
      return TREE_ARCHETYPES.support;
    }

    if (["combat", "bow", "crossbow", "javelin", "spear", "martial"].some((token) => normalizedWords.includes(token))) {
      return TREE_ARCHETYPES.martial;
    }

    // eslint-disable-next-line no-console
    console.warn(`getTreeArchetype: no token match for "${treeName}", falling back to positional index ${index}`);
    return [TREE_ARCHETYPES.martial, TREE_ARCHETYPES.arcane, TREE_ARCHETYPES.support][index] || TREE_ARCHETYPES.command;
  }

  function createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle) {
    const classesById = Object.fromEntries(getClassList(seedBundle).map((entry: ClassDefinition) => [entry.id, entry]));
    const classProgressionCatalog = Object.fromEntries(
      getSkillClassList(seedBundle)
        .filter((entry: ClassSkillsSeedEntry) => entry?.classId)
        .map((entry: ClassSkillsSeedEntry) => {
          const classDefinition = classesById[entry.classId] || null;
          const starterSkillId = resolveStarterSkillId(entry);
          const trees = (Array.isArray(entry.trees) ? entry.trees : [])
            .map((tree: SkillTreeSeedDefinition, index: number) => {
              const archetype = getTreeArchetype(tree?.name, index);
              const skills = normalizeTreeSkills(tree?.skills, archetype.id, starterSkillId);
              if (!tree?.id || !tree?.name || skills.length === 0) {
                return null;
              }

              return {
                id: tree.id,
                name: tree.name,
                archetypeId: archetype.id,
                summary: archetype.summary,
                ...getTreeMetadata(tree.id, archetype.id),
                bonusPerRank: {
                  ...(archetype.bonusPerRank || {}),
                  ...(TREE_PROGRESS_OVERRIDES[tree.id]?.bonusPerRank || {}),
                },
                maxRank: skills.length,
                unlockThreshold: Math.max(1, toNumber(archetype.unlockThreshold, 2)),
                unlockBonusPerThreshold: {
                  ...(archetype.unlockBonusPerThreshold || {}),
                  ...(TREE_PROGRESS_OVERRIDES[tree.id]?.unlockBonusPerThreshold || {}),
                },
                skills,
              };
            })
            .filter(Boolean);

          return [
            entry.classId,
            {
              classId: entry.classId,
              className: entry.className || classDefinition?.name || entry.classId,
              starterSkillId: starterSkillId || trees[0]?.skills?.[0]?.id || "",
              trees,
            },
          ];
        })
        .filter(([, entry]) => (entry as { trees: unknown[] }).trees.length > 0)
    );

    return {
      ...baseContent,
      classProgressionCatalog,
    };
  }

  function listPlayableClasses(seedBundle: SeedBundle) {
    return getClassList(seedBundle).map((entry: ClassDefinition) => ({ ...entry }));
  }

  function getClassDefinition(seedBundle: SeedBundle, classId: string) {
    return getClassList(seedBundle).find((entry: ClassDefinition) => entry.id === classId) || null;
  }

  function getDeckProfileId(content: GameContent, classId: string) {
    return content.classDeckProfiles?.[classId] || "warrior";
  }

  function normalizeStarterDeckCardId(cardId: string) {
    return String(cardId || "").replace(/_plus$/, "");
  }

  function buildStarterDeckWithoutStarterCards(content: GameContent, classId: string, starterDeck: string[]) {
    const starterSkillId = String(content?.classProgressionCatalog?.[classId]?.starterSkillId || EXPLICIT_STARTER_SKILL_IDS[classId] || "");
    if (!starterSkillId) {
      return [...starterDeck];
    }

    const normalizedStarterSkillId = normalizeStarterDeckCardId(starterSkillId);
    const filteredDeck = starterDeck.filter((cardId) => normalizeStarterDeckCardId(cardId) !== normalizedStarterSkillId);
    if (filteredDeck.length === starterDeck.length) {
      return [...starterDeck];
    }

    const removedCount = starterDeck.length - filteredDeck.length;
    const getCardTree = runtimeWindow.__ROUGE_SKILL_EVOLUTION?.getCardTree;
    const starterTree = getCardTree?.(starterSkillId) || "";
    const profileDeck = content?.starterDeckProfiles?.[getDeckProfileId(content, classId)] || [];
    const replacementPool = [
      ...filteredDeck.filter((cardId) => !starterTree || getCardTree?.(cardId) === starterTree),
      ...filteredDeck,
      ...profileDeck.filter((cardId) => normalizeStarterDeckCardId(cardId) !== normalizedStarterSkillId),
    ].filter(Boolean);

    if (replacementPool.length === 0) {
      return filteredDeck;
    }

    const rebuiltDeck = [...filteredDeck];
    for (let index = 0; index < removedCount; index += 1) {
      rebuiltDeck.push(replacementPool[index % replacementPool.length]);
    }
    return rebuiltDeck;
  }

  function getStarterDeckForClass(content: GameContent, classId: string) {
    const classDeck = content.classStarterDecks?.[classId];
    if (Array.isArray(classDeck) && classDeck.length > 0) {
      return buildStarterDeckWithoutStarterCards(content, classId, classDeck);
    }
    const profileId = getDeckProfileId(content, classId);
    const profileDeck = content.starterDeckProfiles?.[profileId];
    if (Array.isArray(profileDeck) && profileDeck.length > 0) {
      return buildStarterDeckWithoutStarterCards(content, classId, profileDeck);
    }
    return buildStarterDeckWithoutStarterCards(content, classId, content.starterDeck);
  }

  function createHeroFromClass(content: GameContent, classDefinition: ClassDefinition) {
    const baseHero = content.hero || ({} as Partial<HeroDefinition>);
    const maxLife = Math.max(
      1,
      Number.parseInt(classDefinition?.startingResources?.hitPoints, 10) || baseHero.maxLife || 1
    );
    const mana = Math.max(0, Number.parseInt(classDefinition?.startingResources?.mana, 10) || 0);
    const maxEnergy = clamp(Math.ceil(mana / 10), 3, 5);
    const potionHeal = clamp(Math.round(maxLife * 0.3), 10, 18);

    return {
      ...baseHero,
      id: baseHero.id || "hero",
      name: classDefinition?.name || baseHero.name || "Wanderer",
      classId: classDefinition?.id || "",
      className: classDefinition?.name || baseHero.className || "Wanderer",
      maxLife,
      maxEnergy,
      handSize: baseHero.handSize || 5,
      potionHeal,
      baseStats: { ...(classDefinition?.baseStats || {}) },
      startingResources: { ...(classDefinition?.startingResources || {}) },
    };
  }

  function getClassProgression(content: GameContent, classId: string) {
    return content?.classProgressionCatalog?.[classId] || null;
  }

  const CLASS_PREFERRED_FAMILIES = {
    barbarian: ["Swords", "Maces", "Polearms"],
    paladin: ["Maces", "Swords"],
    amazon: ["Bows", "Crossbows", "Javelins", "Spears", "Polearms"],
    assassin: ["Swords"],
    druid: ["Staves", "Maces"],
    sorceress: ["Wands", "Staves"],
    necromancer: ["Wands"],
  };

  function getPreferredWeaponFamilies(classId: string) {
    return (CLASS_PREFERRED_FAMILIES as Record<string, string[]>)[classId] || [];
  }

  runtimeWindow.ROUGE_CLASS_REGISTRY = {
    createRuntimeContent,
    listPlayableClasses,
    getClassDefinition,
    getDeckProfileId,
    getStarterDeckForClass,
    createHeroFromClass,
    getClassProgression,
    getPreferredWeaponFamilies,
  };
})();
