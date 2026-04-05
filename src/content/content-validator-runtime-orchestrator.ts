(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { collectEffectFlagIds } = runtimeWindow.__ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;
  const { validateMercenaryCatalog } = runtimeWindow.__ROUGE_CV_RUNTIME_MERCENARIES;
  const {
    pushError,
    collectKnownWorldFlagIds,
    validateCardAndClassContent,
    validateEnemyCatalog,
    validateEncounterCatalog,
    validateGeneratedActEncounters,
    validateConsequenceEncounterPackages,
    validateConsequenceRewardPackages,
  } = runtimeWindow.__ROUGE_CV_RUNTIME_VALIDATORS;

  void collectEffectFlagIds;

  function validateRuntimeContent(content: GameContent) {
    const errors: string[] = [];
    const cardCatalog = content?.cardCatalog || {};
    const mercenaryCatalog = content?.mercenaryCatalog || {};
    const enemyCatalog = content?.enemyCatalog || {};
    const encounterCatalog = content?.encounterCatalog || {};
    const eliteAffixesByAct: Record<number, Set<string>> = {};
    const worldNodeCatalog = runtimeWindow.ROUGE_WORLD_NODE_CATALOG?.getCatalog?.();
    const knownWorldFlagIds = collectKnownWorldFlagIds(worldNodeCatalog);

    (Object.values(mercenaryCatalog) as MercenaryDefinition[]).forEach((mercenary: MercenaryDefinition) => {
      (Array.isArray(mercenary?.routePerks) ? mercenary.routePerks : []).forEach((routePerk: MercenaryRoutePerkDefinition) => {
        (Array.isArray(routePerk?.requiredFlagIds) ? routePerk.requiredFlagIds : []).forEach((flagId: string) => {
          if (typeof flagId === "string" && flagId) {
            knownWorldFlagIds.add(flagId);
          }
        });
      });
    });
    validateMercenaryCatalog(mercenaryCatalog, knownWorldFlagIds, worldNodeCatalog, errors);

    validateCardAndClassContent(content, cardCatalog, errors);
    validateEnemyCatalog(enemyCatalog, eliteAffixesByAct, errors);
    validateEncounterCatalog(encounterCatalog, enemyCatalog, errors);
    validateGeneratedActEncounters(content, encounterCatalog, eliteAffixesByAct, errors);

    Object.keys(content?.consequenceEncounterPackages || {}).forEach((actNumber: string) => {
      if (!content?.generatedActEncounterIds?.[Number(actNumber)]) {
        pushError(errors, `consequenceEncounterPackages.${actNumber} references unknown act ${actNumber}.`);
      }
    });

    Object.keys(content?.consequenceRewardPackages || {}).forEach((actNumber: string) => {
      if (!content?.generatedActEncounterIds?.[Number(actNumber)]) {
        pushError(errors, `consequenceRewardPackages.${actNumber} references unknown act ${actNumber}.`);
      }
    });

    Object.keys(content?.generatedActEncounterIds || {}).forEach((actNumber: string) => {
      const hasEncounterPackages = Array.isArray(content?.consequenceEncounterPackages?.[Number(actNumber)]);
      const hasRewardPackages = Array.isArray(content?.consequenceRewardPackages?.[Number(actNumber)]);
      if (!hasEncounterPackages && !hasRewardPackages) {
        return;
      }
      validateConsequenceEncounterPackages(actNumber, content, encounterCatalog, knownWorldFlagIds, errors);
      validateConsequenceRewardPackages(actNumber, content, knownWorldFlagIds, errors);
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  runtimeWindow.__ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT = {
    validateRuntimeContent,
  };
})();
