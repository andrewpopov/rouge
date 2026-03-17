(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { collectEffectFlagIds } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_WORLD_PATHS;

  const ALLOWED_MERCENARY_BEHAVIORS = new Set([
    "mark_hunter",
    "guard_after_attack",
    "burn_finisher",
    "backline_hunter",
    "guard_breaker",
    "boss_hunter",
    "wounded_hunter",
  ]);

  const MIN_MERCENARY_CONTRACTS = 7;
  const MIN_ROUTE_PERKS_PER_MERCENARY = 12;
  const MIN_COMPOUND_ROUTE_PERKS_PER_MERCENARY = 2;
  const MIN_SCALING_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RESERVE_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RELAY_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_CULMINATION_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_LEGACY_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RECKONING_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_RECOVERY_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_ACCORD_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_COVENANT_LINKED_ROUTE_PERKS_PER_MERCENARY = 1;
  const MIN_MERCENARY_ROUTE_PERK_BONUS_FAMILIES = 5;

  function pushError(errors: string[], message: string) { errors.push(message); }

  function validateStringIdList(values: unknown, label: string, errors: string[]) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value: unknown, index: number) => {
      if (typeof value !== "string" || !value) {
        pushError(errors, `${label}[${index}] must be a non-empty string.`);
      }
    });
  }

  function validateKnownStringIds(values: unknown, knownValues: Set<string>, label: string, errors: string[], referenceType: string) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value: unknown, index: number) => {
      if (typeof value === "string" && value && !knownValues.has(value)) {
        pushError(errors, `${label}[${index}] references unknown ${referenceType} "${value}".`);
      }
    });
  }

  function collectRouteFlagIds(worldNodeCatalog: WorldNodeCatalog | null | undefined, opportunityKey: keyof WorldNodeCatalog) {
    return new Set([
      ...(Object.values(worldNodeCatalog?.[opportunityKey] || {}) as OpportunityNodeDefinition[]).flatMap((opportunityDefinition) => (Array.isArray(opportunityDefinition?.variants) ? opportunityDefinition.variants : []).flatMap((variantDefinition) => (Array.isArray(variantDefinition?.choices) ? variantDefinition.choices : []).flatMap((choiceDefinition) => [...collectEffectFlagIds(choiceDefinition?.effects)]))),
    ]);
  }

  function validateMercenaryCatalog(mercenaryCatalog: Record<string, MercenaryDefinition>, knownWorldFlagIds: Set<string>, worldNodeCatalog: WorldNodeCatalog | null | undefined, errors: string[]) {
    const reserveRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "reserveOpportunities");
    const relayRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "relayOpportunities");
    const culminationRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "culminationOpportunities");
    const legacyRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "legacyOpportunities");
    const reckoningRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "reckoningOpportunities");
    const recoveryRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "recoveryOpportunities");
    const accordRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "accordOpportunities");
    const covenantRouteFlagIds = collectRouteFlagIds(worldNodeCatalog, "covenantOpportunities");

    if (Object.keys(mercenaryCatalog).length < MIN_MERCENARY_CONTRACTS) {
      pushError(errors, `mercenaryCatalog must define at least ${MIN_MERCENARY_CONTRACTS} mercenary contracts.`);
    }

    const routePerkBonusFamilies = new Set();
    (Object.values(mercenaryCatalog) as MercenaryDefinition[]).forEach((mercenary: MercenaryDefinition, index: number) => {
      const label = `mercenaryCatalog.${mercenary?.id || index}`;
      if (!mercenary?.id) {
        pushError(errors, `${label} is missing an id.`);
      }
      if (!mercenary?.name) {
        pushError(errors, `${label} is missing a name.`);
      }
      if (!mercenary?.role) {
        pushError(errors, `${label} is missing a role.`);
      }
      if (!Number.isFinite(Number(mercenary?.maxLife))) {
        pushError(errors, `${label}.maxLife must be numeric.`);
      }
      if (!Number.isFinite(Number(mercenary?.attack))) {
        pushError(errors, `${label}.attack must be numeric.`);
      }
      if (!mercenary?.passiveText) {
        pushError(errors, `${label} is missing passiveText.`);
      }
      if (!ALLOWED_MERCENARY_BEHAVIORS.has(mercenary?.behavior)) {
        pushError(errors, `${label}.behavior "${mercenary?.behavior || ""}" is not supported.`);
      }

      if (!Array.isArray(mercenary?.routePerks) || mercenary.routePerks.length < MIN_ROUTE_PERKS_PER_MERCENARY) {
        pushError(errors, `${label} must define at least ${MIN_ROUTE_PERKS_PER_MERCENARY} route perks.`);
        return;
      }

      const seenRoutePerkIds = new Set();
      let compoundRoutePerkCount = 0;
      let scalingRoutePerkCount = 0;
      let reserveLinkedRoutePerkCount = 0;
      let relayLinkedRoutePerkCount = 0;
      let culminationLinkedRoutePerkCount = 0;
      let legacyLinkedRoutePerkCount = 0;
      let reckoningLinkedRoutePerkCount = 0;
      let recoveryLinkedRoutePerkCount = 0;
      let accordLinkedRoutePerkCount = 0;
      let covenantLinkedRoutePerkCount = 0;
      mercenary.routePerks.forEach((routePerk: MercenaryRoutePerkDefinition, routePerkIndex: number) => {
        const routePerkLabel = `${label}.routePerks[${routePerkIndex}]`;
        if (!routePerk?.id) {
          pushError(errors, `${routePerkLabel} is missing an id.`);
        } else if (seenRoutePerkIds.has(routePerk.id)) {
          pushError(errors, `${label} reuses route perk id "${routePerk.id}".`);
        } else {
          seenRoutePerkIds.add(routePerk.id);
        }
        if (!routePerk?.title) {
          pushError(errors, `${routePerkLabel} is missing a title.`);
        }
        validateStringIdList(routePerk?.requiredFlagIds, `${routePerkLabel}.requiredFlagIds`, errors);
        if (!Array.isArray(routePerk?.requiredFlagIds) || routePerk.requiredFlagIds.length === 0) {
          pushError(errors, `${routePerkLabel} must require at least one world flag.`);
        } else if (routePerk.requiredFlagIds.length > 1) {
          compoundRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => reserveRouteFlagIds.has(flagId))) {
          reserveLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => relayRouteFlagIds.has(flagId))) {
          relayLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => culminationRouteFlagIds.has(flagId))) {
          culminationLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => legacyRouteFlagIds.has(flagId))) {
          legacyLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => reckoningRouteFlagIds.has(flagId))) {
          reckoningLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => recoveryRouteFlagIds.has(flagId))) {
          recoveryLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => accordRouteFlagIds.has(flagId))) {
          accordLinkedRoutePerkCount += 1;
        }
        if (Array.isArray(routePerk?.requiredFlagIds) && routePerk.requiredFlagIds.some((flagId: string) => covenantRouteFlagIds.has(flagId))) {
          covenantLinkedRoutePerkCount += 1;
        }
        if (knownWorldFlagIds.size > 0) {
          validateKnownStringIds(routePerk?.requiredFlagIds, knownWorldFlagIds, `${routePerkLabel}.requiredFlagIds`, errors, "world flag");
        }

        [
          "attackBonus",
          "attackBonusPerAct",
          "behaviorBonus",
          "behaviorBonusPerAct",
          "startGuard",
          "startGuardPerAct",
          "heroDamageBonus",
          "heroDamageBonusPerAct",
          "heroStartGuard",
          "heroStartGuardPerAct",
          "openingDraw",
          "openingDrawPerAct",
        ].forEach((field: string) => {
          const routePerkValue = routePerk?.[field as keyof MercenaryRoutePerkDefinition];
          if ((routePerkValue ?? null) !== null && !Number.isFinite(Number(routePerkValue))) {
            pushError(errors, `${routePerkLabel}.${field} must be numeric when present.`);
          }
        });

        [
          ["attack_bonus", routePerk?.attackBonus, routePerk?.attackBonusPerAct],
          ["behavior_bonus", routePerk?.behaviorBonus, routePerk?.behaviorBonusPerAct],
          ["start_guard", routePerk?.startGuard, routePerk?.startGuardPerAct],
          ["hero_damage_bonus", routePerk?.heroDamageBonus, routePerk?.heroDamageBonusPerAct],
          ["hero_start_guard", routePerk?.heroStartGuard, routePerk?.heroStartGuardPerAct],
          ["opening_draw", routePerk?.openingDraw, routePerk?.openingDrawPerAct],
        ].forEach(([familyId, baseValue, perActValue]) => {
          if (Number(baseValue || 0) > 0 || Number(perActValue || 0) > 0) {
            routePerkBonusFamilies.add(familyId);
          }
        });

        const hasCombatBonus =
          Number(routePerk?.attackBonus || 0) > 0 ||
          Number(routePerk?.attackBonusPerAct || 0) > 0 ||
          Number(routePerk?.behaviorBonus || 0) > 0 ||
          Number(routePerk?.behaviorBonusPerAct || 0) > 0 ||
          Number(routePerk?.startGuard || 0) > 0 ||
          Number(routePerk?.startGuardPerAct || 0) > 0 ||
          Number(routePerk?.heroDamageBonus || 0) > 0 ||
          Number(routePerk?.heroDamageBonusPerAct || 0) > 0 ||
          Number(routePerk?.heroStartGuard || 0) > 0 ||
          Number(routePerk?.heroStartGuardPerAct || 0) > 0 ||
          Number(routePerk?.openingDraw || 0) > 0 ||
          Number(routePerk?.openingDrawPerAct || 0) > 0;
        if (!hasCombatBonus) {
          pushError(errors, `${routePerkLabel} must grant at least one combat bonus or scaling bonus.`);
        }

        const hasPerActScaling =
          Number(routePerk?.attackBonusPerAct || 0) > 0 ||
          Number(routePerk?.behaviorBonusPerAct || 0) > 0 ||
          Number(routePerk?.startGuardPerAct || 0) > 0 ||
          Number(routePerk?.heroDamageBonusPerAct || 0) > 0 ||
          Number(routePerk?.heroStartGuardPerAct || 0) > 0 ||
          Number(routePerk?.openingDrawPerAct || 0) > 0;
        if (hasPerActScaling) {
          scalingRoutePerkCount += 1;
        }
        if (hasPerActScaling && !Number.isInteger(Number(routePerk?.scalingStartAct))) {
          pushError(errors, `${routePerkLabel}.scalingStartAct must be an integer when per-act scaling is used.`);
        }
      });

      if (compoundRoutePerkCount < MIN_COMPOUND_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_COMPOUND_ROUTE_PERKS_PER_MERCENARY} compound route perks with multiple required world flags.`
        );
      }
      if (scalingRoutePerkCount < MIN_SCALING_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_SCALING_ROUTE_PERKS_PER_MERCENARY} route perk with per-act scaling.`
        );
      }
      if (
        reserveLinkedRoutePerkCount > 0 &&
        reserveLinkedRoutePerkCount < MIN_RESERVE_LINKED_ROUTE_PERKS_PER_MERCENARY
      ) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RESERVE_LINKED_ROUTE_PERKS_PER_MERCENARY} reserve-linked route perk.`
        );
      }
      if (relayLinkedRoutePerkCount > 0 && relayLinkedRoutePerkCount < MIN_RELAY_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RELAY_LINKED_ROUTE_PERKS_PER_MERCENARY} relay-linked route perk.`
        );
      }
      if (
        culminationLinkedRoutePerkCount > 0 &&
        culminationLinkedRoutePerkCount < MIN_CULMINATION_LINKED_ROUTE_PERKS_PER_MERCENARY
      ) {
        pushError(
          errors,
          `${label} must define at least ${MIN_CULMINATION_LINKED_ROUTE_PERKS_PER_MERCENARY} culmination-linked route perk.`
        );
      }
      if (legacyLinkedRoutePerkCount > 0 && legacyLinkedRoutePerkCount < MIN_LEGACY_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_LEGACY_LINKED_ROUTE_PERKS_PER_MERCENARY} legacy-linked route perk.`
        );
      }
      if (
        reckoningLinkedRoutePerkCount > 0 &&
        reckoningLinkedRoutePerkCount < MIN_RECKONING_LINKED_ROUTE_PERKS_PER_MERCENARY
      ) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RECKONING_LINKED_ROUTE_PERKS_PER_MERCENARY} reckoning-linked route perk.`
        );
      }
      if (recoveryLinkedRoutePerkCount > 0 && recoveryLinkedRoutePerkCount < MIN_RECOVERY_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_RECOVERY_LINKED_ROUTE_PERKS_PER_MERCENARY} recovery-linked route perk.`
        );
      }
      if (accordLinkedRoutePerkCount > 0 && accordLinkedRoutePerkCount < MIN_ACCORD_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_ACCORD_LINKED_ROUTE_PERKS_PER_MERCENARY} accord-linked route perk.`
        );
      }
      if (covenantLinkedRoutePerkCount > 0 && covenantLinkedRoutePerkCount < MIN_COVENANT_LINKED_ROUTE_PERKS_PER_MERCENARY) {
        pushError(
          errors,
          `${label} must define at least ${MIN_COVENANT_LINKED_ROUTE_PERKS_PER_MERCENARY} covenant-linked route perk.`
        );
      }
    });

    if (routePerkBonusFamilies.size < MIN_MERCENARY_ROUTE_PERK_BONUS_FAMILIES) {
      pushError(
        errors,
        `mercenaryCatalog must expose at least ${MIN_MERCENARY_ROUTE_PERK_BONUS_FAMILIES} route perk bonus families.`
      );
    }
  }

  runtimeWindow.__ROUGE_CV_RUNTIME_MERCENARIES = {
    validateMercenaryCatalog,
  };
})();
