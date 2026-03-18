(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { normalizeActPool, groupByRole, buildActEncounterSet, buildZoneEncounterSet } =
    runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_BUILDERS;
  const { slugify: slugifyZone } = runtimeWindow.ROUGE_UTILS;

  function createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle) {
    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidSeedBundle(seedBundle);

    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const zoneMonsterMap = seedBundle?.zoneMonsters || {};
    const generatedEnemyCatalog: Record<string, EnemyTemplate> = {};
    const generatedEncounterCatalog: Record<string, EncounterDefinition> = {};
    const generatedActEncounterIds: Record<number, GeneratedActEncounterIds> = {};
    const generatedZoneEncounterIds: Record<string, string[]> = {};

    acts.forEach((actSeed: ActSeed) => {
      const poolEntries = normalizeActPool(seedBundle, actSeed.act);
      const groupedEntries = groupByRole(poolEntries);
      const bossEntry = bossEntries.find((entry: BossEntry) => entry.id === actSeed.boss.id) || null;
      const actContent = buildActEncounterSet({
        actSeed,
        bossEntry,
        groupedEntries,
      });
      Object.assign(generatedEnemyCatalog, actContent.enemyCatalog);
      Object.assign(generatedEncounterCatalog, actContent.encounterCatalog);
      generatedActEncounterIds[actSeed.act] = actContent.encounterIdsByKind;

      const actZoneMonsters = zoneMonsterMap[`Act ${actSeed.act}`] || {} as Record<string, string[]>;
      (Object.entries(actZoneMonsters) as [string, string[]][]).forEach(([zoneName, monsterNames]) => {
        const zoneContent = buildZoneEncounterSet({
          actNumber: actSeed.act,
          zoneName,
          monsterNames,
        });
        if (zoneContent) {
          Object.assign(generatedEnemyCatalog, zoneContent.enemyCatalog);
          Object.assign(generatedEncounterCatalog, zoneContent.encounterCatalog);
          const zoneKey = `act_${actSeed.act}_${slugifyZone(zoneName)}`;
          generatedZoneEncounterIds[zoneKey] = zoneContent.encounterIds;
        }
      });
    });

    const runtimeContent = {
      ...baseContent,
      enemyCatalog: {
        ...baseContent.enemyCatalog,
        ...generatedEnemyCatalog,
      },
      encounterCatalog: {
        ...baseContent.encounterCatalog,
        ...generatedEncounterCatalog,
      },
      generatedActEncounterIds,
      generatedZoneEncounterIds,
    };

    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidRuntimeContent(runtimeContent);
    return runtimeContent;
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY = {
    createRuntimeContent,
  };
})();
