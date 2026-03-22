(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const { uniquePush } = runtimeWindow.ROUGE_UTILS;

  function ensureWorldState(run: RunState): RunWorldState {
    if (!run.world || typeof run.world !== "object") {
      run.world = {
        resolvedNodeIds: [],
        questOutcomes: {},
        shrineOutcomes: {},
        eventOutcomes: {},
        opportunityOutcomes: {},
        worldFlags: [],
      };
      return run.world;
    }

    run.world.resolvedNodeIds = Array.isArray(run.world.resolvedNodeIds) ? run.world.resolvedNodeIds : [];
    run.world.questOutcomes = run.world.questOutcomes || {};
    run.world.shrineOutcomes = run.world.shrineOutcomes || {};
    run.world.eventOutcomes = run.world.eventOutcomes || {};
    run.world.opportunityOutcomes = run.world.opportunityOutcomes || {};
    run.world.worldFlags = Array.isArray(run.world.worldFlags) ? run.world.worldFlags : [];
    return run.world;
  }

  function collectFlagIds(effects: RewardChoiceEffect[] | undefined): string[] {
    return (Array.isArray(effects) ? effects : []).reduce((flagIds, effect) => {
      (Array.isArray(effect?.flagIds) ? effect.flagIds : []).forEach((flagId) => uniquePush(flagIds, flagId));
      return flagIds;
    }, [] as string[]);
  }

  function recordFlags(world: RunWorldState, record: RunWorldState["questOutcomes"][string] | null, flagIds: string[]) {
    flagIds.forEach((flagId) => {
      uniquePush(world.worldFlags, flagId);
      if (record && Array.isArray(record.flags)) {
        uniquePush(record.flags, flagId);
      }
    });
  }

  function recordShrineOutcome(run: RunState, reward: RunReward, choice: RewardChoice): ActionResult {
    const world = ensureWorldState(run);
    const shrineEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === "shrine";
    });

    if (!shrineEffect?.nodeId || !shrineEffect?.outcomeId || !shrineEffect?.outcomeTitle) {
      return { ok: false, message: "Shrine choice is missing outcome metadata." };
    }

    const record = {
      nodeId: shrineEffect.nodeId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: shrineEffect.outcomeId,
      outcomeTitle: shrineEffect.outcomeTitle,
      flagIds: collectFlagIds(choice.effects),
    };

    world.shrineOutcomes[shrineEffect.nodeId] = record;
    record.flagIds.forEach((flagId) => uniquePush(world.worldFlags, flagId));
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function recordQuestOutcome(run: RunState, reward: RunReward, choice: RewardChoice): ActionResult {
    const world = ensureWorldState(run);
    const questEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_quest_outcome";
    });

    if (!questEffect?.questId || !questEffect?.outcomeId || !questEffect?.outcomeTitle) {
      return { ok: false, message: "Quest choice is missing outcome metadata." };
    }

    const existingRecord = world.questOutcomes[questEffect.questId] || null;
    const record = {
      questId: questEffect.questId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: questEffect.outcomeId,
      outcomeTitle: questEffect.outcomeTitle,
      status: "primary_resolved" as const,
      followUpNodeId: existingRecord?.followUpNodeId,
      followUpOutcomeId: existingRecord?.followUpOutcomeId,
      followUpOutcomeTitle: existingRecord?.followUpOutcomeTitle,
      consequenceIds: Array.isArray(existingRecord?.consequenceIds) ? [...existingRecord.consequenceIds] : [],
      flags: Array.isArray(existingRecord?.flags) ? [...existingRecord.flags] : [],
    };

    world.questOutcomes[questEffect.questId] = record;
    recordFlags(world, record, collectFlagIds(choice.effects));
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function recordEventOutcome(run: RunState, reward: RunReward, choice: RewardChoice): ActionResult {
    const world = ensureWorldState(run);
    const nodeEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === "event";
    });
    const followUpEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_quest_follow_up";
    });

    if (!nodeEffect?.nodeId || !nodeEffect?.outcomeId || !nodeEffect?.outcomeTitle) {
      return { ok: false, message: "Event choice is missing node outcome metadata." };
    }
    if (!followUpEffect?.questId || !followUpEffect?.outcomeId || !followUpEffect?.outcomeTitle || !followUpEffect?.consequenceId) {
      return { ok: false, message: "Event choice is missing quest follow-up metadata." };
    }

    const questRecord = world.questOutcomes[followUpEffect.questId];
    if (!questRecord) {
      return { ok: false, message: `Event choice references missing quest state "${followUpEffect.questId}".` };
    }

    const flagIds = collectFlagIds(choice.effects);
    world.eventOutcomes[nodeEffect.nodeId] = {
      nodeId: nodeEffect.nodeId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: nodeEffect.outcomeId,
      outcomeTitle: nodeEffect.outcomeTitle,
      linkedQuestId: followUpEffect.questId,
      flagIds,
    };

    questRecord.status = "follow_up_resolved";
    questRecord.followUpNodeId = nodeEffect.nodeId;
    questRecord.followUpOutcomeId = followUpEffect.outcomeId;
    questRecord.followUpOutcomeTitle = followUpEffect.outcomeTitle;
    uniquePush(questRecord.consequenceIds, followUpEffect.consequenceId);
    recordFlags(world, questRecord, flagIds);
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function recordOpportunityOutcome(
    run: RunState,
    reward: RunReward,
    choice: RewardChoice,
    options: WorldNodeOutcomeOptions | undefined
  ): ActionResult {
    const world = ensureWorldState(run);
    const nodeEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === "opportunity";
    });
    const consequenceEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_quest_consequence";
    });

    if (!nodeEffect?.nodeId || !nodeEffect?.outcomeId || !nodeEffect?.outcomeTitle) {
      return { ok: false, message: "Opportunity choice is missing node outcome metadata." };
    }

    const flagIds = collectFlagIds(choice.effects);
    world.opportunityOutcomes[nodeEffect.nodeId] = {
      nodeId: nodeEffect.nodeId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: nodeEffect.outcomeId,
      outcomeTitle: nodeEffect.outcomeTitle,
      linkedQuestId: consequenceEffect?.questId || "",
      flagIds,
    };

    if (!consequenceEffect) {
      const isShrineOpportunityNodeId =
        typeof options?.isShrineOpportunityNodeId === "function" ? options.isShrineOpportunityNodeId : () => false;
      if (!isShrineOpportunityNodeId(nodeEffect.nodeId)) {
        return { ok: false, message: "Opportunity choice is missing quest consequence metadata." };
      }
      recordFlags(world, null, flagIds);
      uniquePush(world.resolvedNodeIds, reward.zoneId);
      return { ok: true };
    }

    if (!consequenceEffect.questId || !consequenceEffect.outcomeId || !consequenceEffect.outcomeTitle || !consequenceEffect.consequenceId) {
      return { ok: false, message: "Opportunity choice is missing quest consequence metadata." };
    }

    const questRecord = world.questOutcomes[consequenceEffect.questId];
    if (!questRecord) {
      return { ok: false, message: `Opportunity choice references missing quest state "${consequenceEffect.questId}".` };
    }

    questRecord.status = "chain_resolved";
    uniquePush(questRecord.consequenceIds, consequenceEffect.consequenceId);
    recordFlags(world, questRecord, flagIds);
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function applyChoice(
    run: RunState,
    reward: RunReward,
    choice: RewardChoice,
    options?: WorldNodeOutcomeOptions
  ): ActionResult {
    if (reward.kind === ZONE_KIND.QUEST) {
      return recordQuestOutcome(run, reward, choice);
    }
    if (reward.kind === ZONE_KIND.SHRINE) {
      return recordShrineOutcome(run, reward, choice);
    }
    if (reward.kind === ZONE_KIND.EVENT) {
      return recordEventOutcome(run, reward, choice);
    }
    if (reward.kind === ZONE_KIND.OPPORTUNITY) {
      return recordOpportunityOutcome(run, reward, choice, options);
    }
    return { ok: false, message: "Unsupported world-node reward type." };
  }

  runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES = {
    applyChoice,
  };
})();
