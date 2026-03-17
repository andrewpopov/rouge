(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, toNumber } = runtimeWindow.ROUGE_UTILS;

  const TREE_ARCHETYPES = {
    martial: {
      id: "martial",
      summary: "Build direct weapon pressure and unlock frontline class skills.",
      bonusPerRank: {
        heroDamageBonus: 1,
      },
      unlockThreshold: 2,
      unlockBonusPerThreshold: {
        heroDamageBonus: 1,
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
      },
    },
  };

  function getClassList(seedBundle: SeedBundle) {
    return Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : [];
  }

  function getSkillClassList(seedBundle: SeedBundle) {
    return Array.isArray(seedBundle?.skills?.classes) ? seedBundle.skills.classes : [];
  }

  function normalizeSkillDefinition(skill: SkillSeedDefinition) {
    if (!skill?.id || !skill?.name) {
      return null;
    }

    return {
      id: skill.id,
      name: skill.name,
      requiredLevel: Math.max(1, toNumber(skill.requiredLevel, 1)),
    };
  }

  function normalizeTreeSkills(skills: SkillSeedDefinition[]) {
    const seenSkillIds = new Set();
    return (Array.isArray(skills) ? skills : [])
      .map(normalizeSkillDefinition)
      .filter((skill) => {
        if (!skill || seenSkillIds.has(skill.id)) {
          return false;
        }
        seenSkillIds.add(skill.id);
        return true;
      })
      .sort((left, right) => {
        const levelDelta = left.requiredLevel - right.requiredLevel;
        if (levelDelta !== 0) {
          return levelDelta;
        }
        return left.name.localeCompare(right.name);
      });
  }

  function getTreeArchetype(treeName: string, index: number) {
    const normalized = String(treeName || "").toLowerCase();

    if (
      ["elemental", "fire", "cold", "lightning", "poison", "bone", "trap", "curses", "orb", "sorcer", "mage"].some((token) =>
        normalized.includes(token)
      )
    ) {
      return TREE_ARCHETYPES.arcane;
    }

    if (
      ["summon", "summoning", "warcries", "passive", "shadow", "spirit", "druid"].some((token) => normalized.includes(token))
    ) {
      return TREE_ARCHETYPES.command;
    }

    if (["defensive", "holy", "shape", "masteries", "discipline"].some((token) => normalized.includes(token))) {
      return TREE_ARCHETYPES.support;
    }

    if (["combat", "bow", "crossbow", "javelin", "spear", "martial"].some((token) => normalized.includes(token))) {
      return TREE_ARCHETYPES.martial;
    }

    return [TREE_ARCHETYPES.martial, TREE_ARCHETYPES.arcane, TREE_ARCHETYPES.support][index] || TREE_ARCHETYPES.command;
  }

  function createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle) {
    const classesById = Object.fromEntries(getClassList(seedBundle).map((entry: ClassDefinition) => [entry.id, entry]));
    const classProgressionCatalog = Object.fromEntries(
      getSkillClassList(seedBundle)
        .filter((entry: ClassSkillsSeedEntry) => entry?.classId)
        .map((entry: ClassSkillsSeedEntry) => {
          const classDefinition = classesById[entry.classId] || null;
          const trees = (Array.isArray(entry.trees) ? entry.trees : [])
            .map((tree: SkillTreeSeedDefinition, index: number) => {
              const archetype = getTreeArchetype(tree?.name, index);
              const skills = normalizeTreeSkills(tree?.skills);
              if (!tree?.id || !tree?.name || skills.length === 0) {
                return null;
              }

              return {
                id: tree.id,
                name: tree.name,
                archetypeId: archetype.id,
                summary: archetype.summary,
                bonusPerRank: { ...(archetype.bonusPerRank || {}) },
                maxRank: skills.length,
                unlockThreshold: Math.max(1, toNumber(archetype.unlockThreshold, 2)),
                unlockBonusPerThreshold: { ...(archetype.unlockBonusPerThreshold || {}) },
                skills,
              };
            })
            .filter(Boolean);

          return [
            entry.classId,
            {
              classId: entry.classId,
              className: entry.className || classDefinition?.name || entry.classId,
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

  function getStarterDeckForClass(content: GameContent, classId: string) {
    const classDeck = content.classStarterDecks?.[classId];
    if (Array.isArray(classDeck) && classDeck.length > 0) {
      return [...classDeck];
    }
    const profileId = getDeckProfileId(content, classId);
    const profileDeck = content.starterDeckProfiles?.[profileId];
    return Array.isArray(profileDeck) && profileDeck.length > 0 ? [...profileDeck] : [...content.starterDeck];
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
    paladin: ["Swords", "Maces"],
    amazon: ["Polearms", "Swords"],
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
