(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const {
    normalizeActPool,
    groupByRole,
    getElitePackages,
    getEliteAffixProfile,
    buildEnemyTemplate,
    buildEliteTemplate,
    buildBossTemplate,
  } = runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS;
  const {
    buildCovenantBossConfig,
    buildAftermathBossConfig,
    buildDrilledAftermathBossConfig,
    buildMobilizedAftermathBossConfig,
    buildPostedAftermathBossConfig,
  } = runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_BUILDERS_BOSS;
  const {
    getFlavor,
    pickEntry,
    pickEscortTemplate,
    makeEncounter,
    buildZoneEncounterSet,
  } = runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_BUILDERS_ZONES;
  const { MODIFIER_KIND } = runtimeWindow.ROUGE_COMBAT_MODIFIERS;
  const recipesApi = registryWindow.__ROUGE_ENCOUNTER_REGISTRY_BUILDERS_RECIPES as {
    ACT_ENCOUNTER_RECIPES: Array<{
      idSuffix: string;
      bucket?: "opening" | "branchBattle" | "branchMiniboss" | "boss";
      title: { kind: "bossName" } | { kind: "flavorLabel"; labelKey: string; suffix: string };
      description: { kind: "flavor"; key: string } | { kind: "flavorAppend"; key: string; suffix: string };
      enemyVariants?: Array<{ enemyRefs: string[]; minAct?: number; maxAct?: number }>;
      bossConfigKey?: string;
      modifiers?: Array<{ kindKey: keyof typeof MODIFIER_KIND; value: number | { kind: "act" | "halfCeilAct"; min?: number; max?: number; offset?: number }; minAct?: number; maxAct?: number }>;
      modifierExtensions?: Array<{ kindKey: keyof typeof MODIFIER_KIND; value: number | { kind: "act" | "halfCeilAct"; min?: number; max?: number; offset?: number }; minAct?: number; maxAct?: number }>;
    }>;
  };

  function matchesActCondition(actNumber: number, minAct?: number, maxAct?: number) {
    if (typeof minAct === "number" && actNumber < minAct) {
      return false;
    }
    if (typeof maxAct === "number" && actNumber > maxAct) {
      return false;
    }
    return true;
  }

  function resolveValueSpec(
    value: number | { kind: "act" | "halfCeilAct"; min?: number; max?: number; offset?: number },
    actNumber: number
  ) {
    if (typeof value === "number") {
      return value;
    }
    const offset = value.offset || 0;
    const base = value.kind === "halfCeilAct" ? Math.ceil(actNumber / 2) + offset : actNumber + offset;
    const minApplied = typeof value.min === "number" ? Math.max(value.min, base) : base;
    return typeof value.max === "number" ? Math.min(value.max, minApplied) : minApplied;
  }

  function resolveModifierEntries(
    modifierRecipes: Array<{ kindKey: keyof typeof MODIFIER_KIND; value: number | { kind: "act" | "halfCeilAct"; min?: number; max?: number; offset?: number }; minAct?: number; maxAct?: number }> | undefined,
    actNumber: number
  ) {
    return (Array.isArray(modifierRecipes) ? modifierRecipes : [])
      .filter((entry) => matchesActCondition(actNumber, entry.minAct, entry.maxAct))
      .map((entry) => ({
        kind: MODIFIER_KIND[entry.kindKey],
        value: resolveValueSpec(entry.value, actNumber),
      }));
  }

  function resolveTitle(
    titleSpec: { kind: "bossName" } | { kind: "flavorLabel"; labelKey: string; suffix: string },
    flavor: Record<string, unknown>,
    actSeed: ActSeed
  ) {
    if (titleSpec.kind === "bossName") {
      return actSeed.boss.name;
    }
    return `${String(flavor[titleSpec.labelKey] || "").trim()} ${titleSpec.suffix}`.trim();
  }

  function resolveDescription(
    descriptionSpec: { kind: "flavor"; key: string } | { kind: "flavorAppend"; key: string; suffix: string },
    flavor: Record<string, unknown>
  ) {
    const base = String(flavor[descriptionSpec.key] || "");
    if (descriptionSpec.kind === "flavor") {
      return base;
    }
    return `${base} ${descriptionSpec.suffix}`.trim();
  }

  function resolveEnemyRefs(
    variants: Array<{ enemyRefs: string[]; minAct?: number; maxAct?: number }> | undefined,
    actNumber: number
  ) {
    const recipeVariants = Array.isArray(variants) ? variants : [];
    return recipeVariants.find((variant) => matchesActCondition(actNumber, variant.minAct, variant.maxAct))?.enemyRefs || [];
  }

  function buildActEncounterSet({ actSeed, bossEntry, groupedEntries }: { actSeed: ActSeed; bossEntry: BossEntry | null | undefined; groupedEntries: EncounterRegistryGroupedEntries }) {
    const actNumber = actSeed.act;
    const flavor = getFlavor(actNumber);
    const raiderA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.raider, 0, groupedEntries.raider[0]), role: "raider" });
    const raiderB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.raider, 1, groupedEntries.raider[0]),
      role: "raider",
      variant: "alt",
    });
    const rangedA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.ranged, 0, groupedEntries.ranged[0]), role: "ranged" });
    const rangedB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.ranged, 1, groupedEntries.ranged[0]),
      role: "ranged",
      variant: "alt",
    });
    const supportA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.support, 0, groupedEntries.support[0]), role: "support" });
    const supportB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.support, 1, groupedEntries.support[0]),
      role: "support",
      variant: "alt",
    });
    const bruteA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.brute, 0, groupedEntries.brute[0]), role: "brute" });
    const bruteB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.brute, 1, groupedEntries.brute[0]),
      role: "brute",
      variant: "alt",
    });
    const [elitePackageA, elitePackageB, elitePackageC, elitePackageD] = getElitePackages(actNumber);
    const groupedEntriesRecord = groupedEntries as unknown as Record<string, EnemyPoolEntryRef[]>;
    const eliteA = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntriesRecord[elitePackageA.role], elitePackageA.entryIndex, groupedEntriesRecord[elitePackageA.role][0]),
      role: elitePackageA.role,
      profile: getEliteAffixProfile(elitePackageA.profileId),
      templateIdSuffix: elitePackageA.templateIdSuffix,
    });
    const eliteB = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntriesRecord[elitePackageB.role], elitePackageB.entryIndex, groupedEntriesRecord[elitePackageB.role][0]),
      role: elitePackageB.role,
      profile: getEliteAffixProfile(elitePackageB.profileId),
      templateIdSuffix: elitePackageB.templateIdSuffix,
    });
    const eliteC = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntriesRecord[elitePackageC.role], elitePackageC.entryIndex, groupedEntriesRecord[elitePackageC.role][0]),
      role: elitePackageC.role,
      profile: getEliteAffixProfile(elitePackageC.profileId),
      templateIdSuffix: elitePackageC.templateIdSuffix,
    });
    const eliteD = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntriesRecord[elitePackageD.role], elitePackageD.entryIndex, groupedEntriesRecord[elitePackageD.role][0]),
      role: elitePackageD.role,
      profile: getEliteAffixProfile(elitePackageD.profileId),
      templateIdSuffix: elitePackageD.templateIdSuffix,
    });
    const bossA = buildBossTemplate({ actNumber, actSeed, bossEntry });

    const templateIds = {
      raiderA: raiderA.templateId,
      raiderB: raiderB.templateId,
      rangedA: rangedA.templateId,
      rangedB: rangedB.templateId,
      supportA: supportA.templateId,
      supportB: supportB.templateId,
      bruteA: bruteA.templateId,
      bruteB: bruteB.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteC: eliteC.templateId,
      eliteD: eliteD.templateId,
      bossA: bossA.templateId,
    };

    const enemyTemplates = [raiderA, raiderB, rangedA, rangedB, supportA, supportB, bruteA, bruteB, eliteA, eliteB, eliteC, eliteD, bossA];
    const enemyCatalog = Object.fromEntries(enemyTemplates.map((template) => [template.templateId, template]));

    const bossAddIds = flavor.bossAdds || ["brute", "support"];
    const bossEscortOne = pickEscortTemplate(bossAddIds[0], rangedA.templateId, supportA.templateId, bruteA.templateId);
    let bossEnemyTemplateIds = [bossA.templateId, bossEscortOne, eliteB.templateId, eliteD.templateId];
    if (actNumber === 4) {
      bossEnemyTemplateIds = [bossA.templateId, eliteA.templateId, eliteD.templateId, bruteA.templateId];
    } else if (actNumber >= 5) {
      bossEnemyTemplateIds = [bossA.templateId, eliteA.templateId, eliteC.templateId, eliteD.templateId];
    }
    const bossBaseConfig = {
      enemyTemplateIds: bossEnemyTemplateIds,
      modifiers: [
        {
          kind: MODIFIER_KIND.BOSS_SCREEN,
          value: actNumber === 1 || actNumber === 4 ? 6 : Math.max(5, Math.min(8, actNumber + 3)),
        },
        {
          kind: MODIFIER_KIND.ESCORT_BULWARK,
          value: actNumber === 4 ? 3 : Math.max(4, actNumber + 1),
        },
      ],
    };
    const covenantBossConfig = buildCovenantBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteC: eliteC.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const aftermathBossConfig = buildAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteC: eliteC.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const drilledAftermathBossConfig = buildDrilledAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const mobilizedAftermathBossConfig = buildMobilizedAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const postedAftermathBossConfig = buildPostedAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const bossConfigs = {
      bossBaseConfig,
      covenantBossConfig,
      aftermathBossConfig,
      drilledAftermathBossConfig,
      mobilizedAftermathBossConfig,
      postedAftermathBossConfig,
    };

    const encounterCatalog = Object.fromEntries(
      recipesApi.ACT_ENCOUNTER_RECIPES.map((recipe) => {
        const encounterId = `act_${actNumber}_${recipe.idSuffix}`;
        const config = recipe.bossConfigKey
          ? bossConfigs[recipe.bossConfigKey as keyof typeof bossConfigs]
          : {
            enemyTemplateIds: resolveEnemyRefs(recipe.enemyVariants, actNumber).map((enemyRef) => templateIds[enemyRef as keyof typeof templateIds]),
            modifiers: resolveModifierEntries(recipe.modifiers, actNumber),
          };
        const modifiers = [
          ...((config?.modifiers as Array<{ kind: string; value: number }> | undefined) || []),
          ...resolveModifierEntries(recipe.modifierExtensions, actNumber),
        ];
        return [
          encounterId,
          makeEncounter(
            encounterId,
            resolveTitle(recipe.title, flavor, actSeed),
            resolveDescription(recipe.description, flavor),
            config?.enemyTemplateIds || [],
            modifiers
          ),
        ];
      })
    );

    return {
      enemyCatalog,
      encounterCatalog,
      encounterIdsByKind: {
        opening: recipesApi.ACT_ENCOUNTER_RECIPES
          .filter((recipe) => recipe.bucket === "opening")
          .map((recipe) => `act_${actNumber}_${recipe.idSuffix}`),
        branchBattle: recipesApi.ACT_ENCOUNTER_RECIPES
          .filter((recipe) => recipe.bucket === "branchBattle")
          .map((recipe) => `act_${actNumber}_${recipe.idSuffix}`),
        branchMiniboss: recipesApi.ACT_ENCOUNTER_RECIPES
          .filter((recipe) => recipe.bucket === "branchMiniboss")
          .map((recipe) => `act_${actNumber}_${recipe.idSuffix}`),
        boss: recipesApi.ACT_ENCOUNTER_RECIPES
          .filter((recipe) => recipe.bucket === "boss")
          .map((recipe) => `act_${actNumber}_${recipe.idSuffix}`),
      },
    };
  }

  registryWindow.__ROUGE_ENCOUNTER_REGISTRY_BUILDERS = { normalizeActPool, groupByRole, buildActEncounterSet, buildZoneEncounterSet };
})();
