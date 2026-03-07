(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ALLOWED_INTENT_KINDS = new Set([
    "attack",
    "attack_all",
    "attack_and_guard",
    "drain_attack",
    "guard",
    "guard_allies",
    "heal_ally",
    "sunder_attack",
  ]);

  const ALLOWED_ELITE_AFFIXES = new Set([
    "warded",
    "huntsman",
    "rampaging",
    "dunebound",
    "vampiric",
    "hexbound",
    "hellforged",
    "tormentor",
    "warcaller",
    "frostbound",
  ]);

  function pushError(errors, message) {
    errors.push(message);
  }

  function hasAtLeastOneEnemy(poolEntry) {
    return [
      ...(Array.isArray(poolEntry?.enemies) ? poolEntry.enemies : []),
      ...(Array.isArray(poolEntry?.nativeEnemies) ? poolEntry.nativeEnemies : []),
      ...(Array.isArray(poolEntry?.guestEnemiesNightmareHell) ? poolEntry.guestEnemiesNightmareHell : []),
    ].length > 0;
  }

  function validateCardIdList(cardIds, cardCatalog, label, errors) {
    (Array.isArray(cardIds) ? cardIds : []).forEach((cardId, index) => {
      if (!cardCatalog?.[cardId]) {
        pushError(errors, `${label}[${index}] references missing card "${cardId}".`);
      }
    });
  }

  function validateGrants(grants, label, errors) {
    ["gold", "xp", "potions"].forEach((field) => {
      if (!Number.isFinite(Number(grants?.[field]))) {
        pushError(errors, `${label}.${field} must be numeric.`);
      }
    });
  }

  function validateStringIdList(values, label, errors) {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value, index) => {
      if (typeof value !== "string" || !value) {
        pushError(errors, `${label}[${index}] must be a non-empty string.`);
      }
    });
  }

  function validateNodeChoice(definition, choiceDefinition, label, expectedNodeType, errors, linkedQuestId = "") {
    if (!choiceDefinition?.id) {
      pushError(errors, `${label} is missing an id.`);
    }
    if (!choiceDefinition?.title) {
      pushError(errors, `${label} is missing a title.`);
    }
    if (!Array.isArray(choiceDefinition?.effects) || choiceDefinition.effects.length === 0) {
      pushError(errors, `${label} is missing effects.`);
      return;
    }

    if (expectedNodeType === "quest") {
      const questEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_quest_outcome");
      if (!questEffect?.questId || !questEffect?.outcomeId || !questEffect?.outcomeTitle) {
        pushError(errors, `${label} is missing a valid record_quest_outcome effect.`);
      } else if (questEffect.questId !== definition.id) {
        pushError(errors, `${label} record_quest_outcome references "${questEffect.questId}" but expected "${definition.id}".`);
      }
      if (!choiceDefinition.followUp) {
        pushError(errors, `${label} is missing follow-up event content.`);
      }
      return;
    }

    const nodeEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_node_outcome");
    if (!nodeEffect?.nodeId || !nodeEffect?.outcomeId || !nodeEffect?.outcomeTitle) {
      pushError(errors, `${label} is missing a valid record_node_outcome effect.`);
    } else {
      if (nodeEffect.nodeType !== expectedNodeType) {
        pushError(errors, `${label} record_node_outcome must use nodeType "${expectedNodeType}".`);
      }
      if (nodeEffect.nodeId !== definition.id) {
        pushError(errors, `${label} record_node_outcome references "${nodeEffect.nodeId}" but expected "${definition.id}".`);
      }
    }

    if (expectedNodeType === "event") {
      const followUpEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_quest_follow_up");
      if (!followUpEffect?.questId || !followUpEffect?.outcomeId || !followUpEffect?.outcomeTitle || !followUpEffect?.consequenceId) {
        pushError(errors, `${label} is missing a valid record_quest_follow_up effect.`);
      } else if (followUpEffect.questId !== linkedQuestId) {
        pushError(errors, `${label} record_quest_follow_up references "${followUpEffect.questId}" but expected "${linkedQuestId}".`);
      }
      return;
    }

    if (expectedNodeType === "opportunity") {
      const consequenceEffect = choiceDefinition.effects.find((effect) => effect.kind === "record_quest_consequence");
      if (!consequenceEffect?.questId || !consequenceEffect?.outcomeId || !consequenceEffect?.outcomeTitle || !consequenceEffect?.consequenceId) {
        pushError(errors, `${label} is missing a valid record_quest_consequence effect.`);
      } else if (consequenceEffect.questId !== linkedQuestId) {
        pushError(errors, `${label} record_quest_consequence references "${consequenceEffect.questId}" but expected "${linkedQuestId}".`);
      }
    }
  }

  function validateRewardDefinition(definition, label, expectedNodeType, errors, linkedQuestId = "") {
    if (!definition?.id) {
      pushError(errors, `${label} is missing an id.`);
    }
    if (!definition?.title) {
      pushError(errors, `${label} is missing a title.`);
    }
    if (!definition?.description) {
      pushError(errors, `${label} is missing a description.`);
    }
    if (!definition?.summary) {
      pushError(errors, `${label} is missing a summary.`);
    }
    validateGrants(definition?.grants, `${label}.grants`, errors);

    if (!Array.isArray(definition?.choices) || definition.choices.length === 0) {
      pushError(errors, `${label} is missing choices.`);
      return;
    }

    definition.choices.forEach((choiceDefinition, index) => {
      validateNodeChoice(definition, choiceDefinition, `${label}.choices[${index}]`, expectedNodeType, errors, linkedQuestId);
    });
  }

  function validateSeedBundle(seedBundle) {
    const errors = [];
    const classEntries = Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : [];
    const skillClasses = Array.isArray(seedBundle?.skills?.classes) ? seedBundle.skills.classes : [];
    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const enemyPools = Array.isArray(seedBundle?.enemyPools?.enemyPools) ? seedBundle.enemyPools.enemyPools : [];

    if (classEntries.length === 0) {
      pushError(errors, "Seed bundle is missing playable classes.");
    }

    if (skillClasses.length === 0) {
      pushError(errors, "Seed bundle is missing skills.json class progression content.");
    }

    const knownClassIds = new Set(classEntries.map((entry) => entry?.id).filter(Boolean));
    const seenSkillClassIds = new Set();
    skillClasses.forEach((entry, index) => {
      if (!entry?.classId) {
        pushError(errors, `skills.classes[${index}] is missing a classId.`);
        return;
      }
      if (!knownClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes[${index}] references unknown class "${entry.classId}".`);
      }
      if (seenSkillClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes contains duplicate classId "${entry.classId}".`);
      }
      seenSkillClassIds.add(entry.classId);

      const trees = Array.isArray(entry.trees) ? entry.trees : [];
      if (trees.length === 0) {
        pushError(errors, `skills.classes[${index}] is missing skill trees.`);
        return;
      }

      trees.forEach((tree, treeIndex) => {
        if (!tree?.id) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing an id.`);
        }
        if (!tree?.name) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing a name.`);
        }
        const skills = Array.isArray(tree?.skills) ? tree.skills : [];
        if (skills.length === 0) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing skills.`);
          return;
        }
        skills.forEach((skill, skillIndex) => {
          if (!skill?.id || !skill?.name) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing identity fields.`);
          }
          if (!Number.isFinite(Number(skill?.requiredLevel))) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing a numeric requiredLevel.`);
          }
        });
      });
    });

    classEntries.forEach((entry) => {
      if (entry?.id && !seenSkillClassIds.has(entry.id)) {
        pushError(errors, `Playable class "${entry.id}" is missing skills.json progression data.`);
      }
    });

    if (acts.length === 0) {
      pushError(errors, "Seed bundle is missing zone acts.");
    }

    const seenActs = new Set();
    acts.forEach((actSeed, index) => {
      if (!Number.isInteger(actSeed?.act)) {
        pushError(errors, `zones.acts[${index}] is missing a valid act number.`);
        return;
      }
      if (seenActs.has(actSeed.act)) {
        pushError(errors, `zones.acts contains duplicate act number ${actSeed.act}.`);
      }
      seenActs.add(actSeed.act);

      if (!actSeed?.boss?.id) {
        pushError(errors, `Act ${actSeed.act} is missing a boss id.`);
      } else if (!bossEntries.some((entry) => entry.id === actSeed.boss.id)) {
        pushError(errors, `Act ${actSeed.act} boss "${actSeed.boss.id}" has no matching bosses entry.`);
      }

      const poolEntry = enemyPools.find((entry) => entry.act === actSeed.act) || null;
      if (!poolEntry) {
        pushError(errors, `Act ${actSeed.act} is missing an enemy pool entry.`);
      } else if (!hasAtLeastOneEnemy(poolEntry)) {
        pushError(errors, `Act ${actSeed.act} enemy pool does not contain any enemies.`);
      }
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function validateRuntimeContent(content) {
    const errors = [];
    const cardCatalog = content?.cardCatalog || {};
    const enemyCatalog = content?.enemyCatalog || {};
    const encounterCatalog = content?.encounterCatalog || {};

    validateCardIdList(content?.starterDeck, cardCatalog, "starterDeck", errors);

    Object.entries(content?.starterDeckProfiles || {}).forEach(([profileId, cardIds]) => {
      validateCardIdList(cardIds, cardCatalog, `starterDeckProfiles.${profileId}`, errors);
    });

    Object.entries(content?.classDeckProfiles || {}).forEach(([classId, profileId]) => {
      const profileKey = String(profileId || "");
      if (!content?.starterDeckProfiles?.[profileKey]) {
        pushError(errors, `classDeckProfiles.${classId} references missing starter deck profile "${profileKey}".`);
      }
      if (!content?.classProgressionCatalog?.[classId]) {
        pushError(errors, `classProgressionCatalog is missing class "${classId}".`);
      }
    });

    Object.entries(content?.classProgressionCatalog || {}).forEach(([classId, progressionEntry]) => {
      const progression = progressionEntry as RuntimeClassProgressionDefinition | undefined;
      if (!Array.isArray(progression?.trees) || progression.trees.length === 0) {
        pushError(errors, `classProgressionCatalog.${classId} is missing trees.`);
        return;
      }

      progression.trees.forEach((tree, index) => {
        if (!tree?.id || !tree?.name) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing identity fields.`);
        }
        if (!Array.isArray(tree?.skills) || tree.skills.length === 0) {
          pushError(errors, `classProgressionCatalog.${classId}.trees[${index}] is missing skills.`);
        }
      });
    });

    Object.entries(content?.rewardPools?.profileCards || {}).forEach(([profileId, cardIds]) => {
      validateCardIdList(cardIds, cardCatalog, `rewardPools.profileCards.${profileId}`, errors);
    });
    Object.entries(content?.rewardPools?.zoneRoleCards || {}).forEach(([zoneRole, cardIds]) => {
      validateCardIdList(cardIds, cardCatalog, `rewardPools.zoneRoleCards.${zoneRole}`, errors);
    });
    validateCardIdList(content?.rewardPools?.bossCards, cardCatalog, "rewardPools.bossCards", errors);

    (Object.values(enemyCatalog) as EnemyTemplate[]).forEach((template) => {
      if (!template?.templateId) {
        pushError(errors, "Enemy catalog contains a template without a templateId.");
        return;
      }
      if (!Array.isArray(template.intents) || template.intents.length === 0) {
        pushError(errors, `Enemy template "${template.templateId}" is missing intents.`);
        return;
      }
      template.intents.forEach((intent, index) => {
        if (!ALLOWED_INTENT_KINDS.has(intent?.kind)) {
          pushError(errors, `Enemy template "${template.templateId}" has unsupported intent "${intent?.kind}" at index ${index}.`);
        }
      });

      const affixes = Array.isArray(template.affixes) ? template.affixes : [];
      affixes.forEach((affixId, index) => {
        if (!ALLOWED_ELITE_AFFIXES.has(affixId)) {
          pushError(errors, `Enemy template "${template.templateId}" has unsupported affix "${affixId}" at index ${index}.`);
        }
      });

      if (template.variant === "elite" && affixes.length === 0) {
        pushError(errors, `Enemy template "${template.templateId}" is marked elite but has no affixes.`);
      }
      if (template.variant !== "elite" && affixes.length > 0) {
        pushError(errors, `Enemy template "${template.templateId}" has affixes but is not marked elite.`);
      }
    });

    (Object.values(encounterCatalog) as EncounterDefinition[]).forEach((encounter) => {
      if (!Array.isArray(encounter?.enemies) || encounter.enemies.length === 0) {
        pushError(errors, `Encounter "${encounter?.id || "unknown"}" does not include any enemies.`);
        return;
      }
      encounter.enemies.forEach((enemyEntry, index) => {
        if (!enemyCatalog?.[enemyEntry?.templateId]) {
          pushError(
            errors,
            `Encounter "${encounter.id}" enemy[${index}] references missing template "${enemyEntry?.templateId}".`
          );
        }
      });
    });

    Object.entries(content?.generatedActEncounterIds || {}).forEach(([actNumber, groups]) => {
      Object.entries((groups || {}) as Record<string, string[]>).forEach(([groupName, encounterIds]) => {
        if (!Array.isArray(encounterIds) || encounterIds.length === 0) {
          pushError(errors, `generatedActEncounterIds.${actNumber}.${groupName} is empty.`);
          return;
        }
        encounterIds.forEach((encounterId, index) => {
          if (!encounterCatalog?.[encounterId]) {
            pushError(
              errors,
              `generatedActEncounterIds.${actNumber}.${groupName}[${index}] references missing encounter "${encounterId}".`
            );
          }
        });
      });
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function validateWorldNodeCatalog(worldNodeCatalog) {
    const errors = [];
    const quests = worldNodeCatalog?.quests || {};
    const shrines = worldNodeCatalog?.shrines || {};
    const events = worldNodeCatalog?.events || {};
    const opportunities = worldNodeCatalog?.opportunities || {};
    const actNumbers = new Set([
      ...Object.keys(quests),
      ...Object.keys(shrines),
      ...Object.keys(events),
      ...Object.keys(opportunities),
    ]);
    const seenNodeIds = new Map();

    if (actNumbers.size === 0) {
      pushError(errors, "World-node catalog is empty.");
    }

    actNumbers.forEach((actKey) => {
      const actNumber = Number(actKey);
      const questDefinition = quests[actNumber];
      const shrineDefinition = shrines[actNumber];
      const eventDefinition = events[actNumber];
      const opportunityDefinition = opportunities[actNumber];

      [
        { definition: questDefinition, label: `worldNodes.quests.${actKey}` },
        { definition: shrineDefinition, label: `worldNodes.shrines.${actKey}` },
        { definition: eventDefinition, label: `worldNodes.events.${actKey}` },
        { definition: opportunityDefinition, label: `worldNodes.opportunities.${actKey}` },
      ].forEach(({ definition, label }) => {
        if (!definition?.id) {
          return;
        }
        const duplicateLabel = seenNodeIds.get(definition.id);
        if (duplicateLabel) {
          pushError(errors, `${label} reuses node id "${definition.id}" already claimed by ${duplicateLabel}.`);
          return;
        }
        seenNodeIds.set(definition.id, label);
      });

      if (!questDefinition) {
        pushError(errors, `World-node catalog is missing a quest definition for act ${actKey}.`);
      } else {
        if (!questDefinition.zoneTitle) {
          pushError(errors, `worldNodes.quests.${actKey} is missing a zoneTitle.`);
        }
        validateRewardDefinition(questDefinition, `worldNodes.quests.${actKey}`, "quest", errors);
      }

      if (!shrineDefinition) {
        pushError(errors, `World-node catalog is missing a shrine definition for act ${actKey}.`);
      } else {
        if (!shrineDefinition.zoneTitle) {
          pushError(errors, `worldNodes.shrines.${actKey} is missing a zoneTitle.`);
        }
        validateRewardDefinition(shrineDefinition, `worldNodes.shrines.${actKey}`, "shrine", errors);
      }

      if (!eventDefinition) {
        pushError(errors, `World-node catalog is missing an event definition for act ${actKey}.`);
      } else {
        if (!eventDefinition.zoneTitle) {
          pushError(errors, `worldNodes.events.${actKey} is missing a zoneTitle.`);
        }
        if (!eventDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.events.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && eventDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.events.${actKey} requires quest "${eventDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        validateGrants(eventDefinition?.grants, `worldNodes.events.${actKey}.grants`, errors);
      }

      if (!opportunityDefinition) {
        pushError(errors, `World-node catalog is missing an opportunity definition for act ${actKey}.`);
      } else {
        if (!opportunityDefinition.zoneTitle) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a zoneTitle.`);
        }
        if (!opportunityDefinition.title) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a title.`);
        }
        if (!opportunityDefinition.description) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a description.`);
        }
        if (!opportunityDefinition.summary) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing a summary.`);
        }
        if (!opportunityDefinition.requiresQuestId) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing requiresQuestId.`);
        } else if (questDefinition?.id && opportunityDefinition.requiresQuestId !== questDefinition.id) {
          pushError(
            errors,
            `worldNodes.opportunities.${actKey} requires quest "${opportunityDefinition.requiresQuestId}" but act quest is "${questDefinition.id}".`
          );
        }
        validateGrants(opportunityDefinition?.grants, `worldNodes.opportunities.${actKey}.grants`, errors);

        if (!Array.isArray(opportunityDefinition.variants) || opportunityDefinition.variants.length === 0) {
          pushError(errors, `worldNodes.opportunities.${actKey} is missing variants.`);
        } else {
          const unconditionalVariantCount = opportunityDefinition.variants.filter((variantDefinition) => {
            return (
              (!Array.isArray(variantDefinition.requiresPrimaryOutcomeIds) || variantDefinition.requiresPrimaryOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFollowUpOutcomeIds) || variantDefinition.requiresFollowUpOutcomeIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresConsequenceIds) || variantDefinition.requiresConsequenceIds.length === 0) &&
              (!Array.isArray(variantDefinition.requiresFlagIds) || variantDefinition.requiresFlagIds.length === 0)
            );
          }).length;

          if (unconditionalVariantCount > 1) {
            pushError(errors, `worldNodes.opportunities.${actKey} has multiple unconditional variants.`);
          }

          opportunityDefinition.variants.forEach((variantDefinition, index) => {
            validateStringIdList(
              variantDefinition.requiresPrimaryOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresPrimaryOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFollowUpOutcomeIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFollowUpOutcomeIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresConsequenceIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresConsequenceIds`,
              errors
            );
            validateStringIdList(
              variantDefinition.requiresFlagIds,
              `worldNodes.opportunities.${actKey}.variants[${index}].requiresFlagIds`,
              errors
            );
            validateRewardDefinition(
              {
                ...variantDefinition,
                id: opportunityDefinition.id,
              },
              `worldNodes.opportunities.${actKey}.variants[${index}]`,
              "opportunity",
              errors,
              opportunityDefinition.requiresQuestId
            );
          });
        }
      }

      (Array.isArray(questDefinition?.choices) ? questDefinition.choices : []).forEach((choiceDefinition, index) => {
        if (!choiceDefinition?.followUp) {
          return;
        }
        validateRewardDefinition(
          {
            ...choiceDefinition.followUp,
            id: eventDefinition?.id || choiceDefinition.followUp.id,
          },
          `worldNodes.quests.${actKey}.choices[${index}].followUp`,
          "event",
          errors,
          eventDefinition?.requiresQuestId || ""
        );
      });
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function assertValid(report) {
    if (report.ok) {
      return;
    }
    throw new Error(`Content validation failed:\n- ${report.errors.join("\n- ")}`);
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR = {
    validateSeedBundle,
    assertValidSeedBundle(seedBundle) {
      assertValid(validateSeedBundle(seedBundle));
    },
    validateRuntimeContent,
    assertValidRuntimeContent(content) {
      assertValid(validateRuntimeContent(content));
    },
    validateWorldNodeCatalog,
    assertValidWorldNodeCatalog(worldNodeCatalog) {
      assertValid(validateWorldNodeCatalog(worldNodeCatalog));
    },
  };
})();
