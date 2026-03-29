(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  type OutcomeRecordLike = { outcomeTitle: string; followUpOutcomeTitle?: string };

  function getWorldNodeVariantsApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_VARIANTS) {
      throw new Error("World-node variant helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_VARIANTS;
  }

  const resolverSpecs: Record<string, {
    resolve: (run: RunState, actNumber: number) => Record<string, unknown>;
    buildContextLines: (resolved: Record<string, unknown>) => string[];
    pickDefinition: (resolved: Record<string, unknown>) => WorldNodeRewardDefinition;
  }> = {
    shrine_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveShrineOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const shrineRecord = resolved.shrineRecord as OutcomeRecordLike;
        return [`Earlier shrine result: ${shrineRecord.outcomeTitle}.`];
      },
      pickDefinition(resolved) {
        return resolved.shrineOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    crossroad_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveCrossroadOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const shrineRecord = resolved.shrineRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.crossroadOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    reserve_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveReserveOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const opportunityRecord = resolved.opportunityRecord as OutcomeRecordLike;
        const shrineOpportunityRecord = resolved.shrineOpportunityRecord as OutcomeRecordLike;
        const crossroadOpportunityRecord = resolved.crossroadOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier route lane: ${opportunityRecord.outcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.reserveOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    relay_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveRelayOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const reserveOpportunityRecord = resolved.reserveOpportunityRecord as OutcomeRecordLike;
        return [`Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`];
      },
      pickDefinition(resolved) {
        return resolved.relayOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    culmination_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveCulminationOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const relayOpportunityRecord = resolved.relayOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier relay lane: ${relayOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.culminationOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    legacy_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveLegacyOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const culminationOpportunityRecord = resolved.culminationOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.legacyOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    reckoning_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveReckoningOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const reserveOpportunityRecord = resolved.reserveOpportunityRecord as OutcomeRecordLike;
        const culminationOpportunityRecord = resolved.culminationOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.reckoningOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    recovery_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveRecoveryOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const shrineOpportunityRecord = resolved.shrineOpportunityRecord as OutcomeRecordLike;
        const culminationOpportunityRecord = resolved.culminationOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.recoveryOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    accord_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveAccordOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const shrineOpportunityRecord = resolved.shrineOpportunityRecord as OutcomeRecordLike;
        const crossroadOpportunityRecord = resolved.crossroadOpportunityRecord as OutcomeRecordLike;
        const culminationOpportunityRecord = resolved.culminationOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.accordOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    covenant_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveCovenantOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const legacyOpportunityRecord = resolved.legacyOpportunityRecord as OutcomeRecordLike;
        const reckoningOpportunityRecord = resolved.reckoningOpportunityRecord as OutcomeRecordLike;
        const recoveryOpportunityRecord = resolved.recoveryOpportunityRecord as OutcomeRecordLike;
        const accordOpportunityRecord = resolved.accordOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.covenantOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    detour_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveDetourOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const recoveryOpportunityRecord = resolved.recoveryOpportunityRecord as OutcomeRecordLike;
        const accordOpportunityRecord = resolved.accordOpportunityRecord as OutcomeRecordLike;
        const covenantOpportunityRecord = resolved.covenantOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.detourOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
    escalation_opportunity: {
      resolve(run, actNumber) {
        return getWorldNodeVariantsApi().resolveEscalationOpportunityVariant(run, actNumber) as unknown as Record<string, unknown>;
      },
      buildContextLines(resolved) {
        const questRecord = resolved.questRecord as OutcomeRecordLike;
        const legacyOpportunityRecord = resolved.legacyOpportunityRecord as OutcomeRecordLike;
        const reckoningOpportunityRecord = resolved.reckoningOpportunityRecord as OutcomeRecordLike;
        const covenantOpportunityRecord = resolved.covenantOpportunityRecord as OutcomeRecordLike;
        return [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
        ];
      },
      pickDefinition(resolved) {
        return resolved.escalationOpportunityDefinition as WorldNodeRewardDefinition;
      },
    },
  };

  function resolveOpportunityNode(nodeType: string, run: RunState, actNumber: number) {
    const spec = resolverSpecs[nodeType];
    if (!spec) {
      return null;
    }
    const resolved = spec.resolve(run, actNumber);
    return {
      definition: spec.pickDefinition(resolved),
      variant: resolved.variant as WorldNodeRewardDefinition,
      contextLines: spec.buildContextLines(resolved),
    };
  }

  runtimeWindow.__ROUGE_WORLD_NODE_ENGINE_OPPORTUNITY_RESOLVERS = {
    resolveOpportunityNode,
  };
})();
