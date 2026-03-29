(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG;
  const itemLoadout = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const loot = runtimeWindow.__ROUGE_ITEM_SYSTEM_LOOT;
  const choiceBuilder = runtimeWindow.__ROUGE_ITEM_SYSTEM_CHOICE;

  runtimeWindow.ROUGE_ITEM_SYSTEM = {
    createRuntimeContent: itemCatalog.createRuntimeContent,
    hydrateRunLoadout: itemLoadout.hydrateRunLoadout,
    hydrateRunInventory: itemTown.hydrateRunInventory,
    hydrateProfileStash: itemLoadout.hydrateProfileStash,
    buildEquipmentChoice: choiceBuilder.buildEquipmentChoice,
    buildZoneLootTable: loot.buildZoneLootTable,
    applyChoice: itemLoadout.applyChoice,
    listTownActions: itemTown.listTownActions,
    applyTownAction: itemTown.applyTownAction,
    buildCombatBonuses: itemLoadout.buildCombatBonuses,
    buildCombatMitigationProfile: itemLoadout.buildCombatMitigationProfile,
    getActiveRunewords: itemLoadout.getActiveRunewords,
    getLoadoutSummary: itemLoadout.getLoadoutSummary,
    getInventorySummary: itemTown.getInventorySummary,
  };
})();
