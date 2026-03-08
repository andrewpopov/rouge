(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { normalizeActPool, groupByRole, buildActEncounterSet } = runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_BUILDERS;

  function createRuntimeContent(baseContent, seedBundle) {
    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidSeedBundle(seedBundle);

    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const generatedEnemyCatalog = {};
    const generatedEncounterCatalog = {};
    const generatedActEncounterIds = {};

    acts.forEach((actSeed) => {
      const poolEntries = normalizeActPool(seedBundle, actSeed.act);
      const groupedEntries = groupByRole(poolEntries);
      const bossEntry = bossEntries.find((entry) => entry.id === actSeed.boss.id) || null;
      const actContent = buildActEncounterSet({
        actSeed,
        bossEntry,
        groupedEntries,
      });
      Object.assign(generatedEnemyCatalog, actContent.enemyCatalog);
      Object.assign(generatedEncounterCatalog, actContent.encounterCatalog);
      generatedActEncounterIds[actSeed.act] = actContent.encounterIdsByKind;
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
    };

    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidRuntimeContent(runtimeContent);
    return runtimeContent;
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY = {
    createRuntimeContent,
  };
})();
