(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, hasTownFeature, getFocusedAccountTreeId } = runtimeWindow.ROUGE_UTILS;

  function getRewardAccountFeatures(profile: ProfileState | null | undefined) {
    const focusedTreeId = getFocusedAccountTreeId(profile);
    const masteryUnlocked =
      hasTownFeature(profile, "boss_trophy_gallery") ||
      hasTownFeature(profile, "class_roster_archive") ||
      hasTownFeature(profile, "training_grounds") ||
      hasTownFeature(profile, "war_college") ||
      hasTownFeature(profile, "paragon_doctrine") ||
      hasTownFeature(profile, "apex_doctrine") ||
      hasTownFeature(profile, "legend_doctrine") ||
      hasTownFeature(profile, "mythic_doctrine");
    return {
      economyLedger: hasTownFeature(profile, "economy_ledger"),
      bossTrophyGallery: hasTownFeature(profile, "boss_trophy_gallery"),
      trainingGrounds: hasTownFeature(profile, "training_grounds"),
      warCollege: hasTownFeature(profile, "war_college"),
      paragonDoctrine: hasTownFeature(profile, "paragon_doctrine"),
      apexDoctrine: hasTownFeature(profile, "apex_doctrine"),
      legendDoctrine: hasTownFeature(profile, "legend_doctrine"),
      mythicDoctrine: hasTownFeature(profile, "mythic_doctrine"),
      warAnnals: hasTownFeature(profile, "war_annals"),
      legendaryAnnals: hasTownFeature(profile, "legendary_annals"),
      immortalAnnals: hasTownFeature(profile, "immortal_annals"),
      masteryFocus: focusedTreeId === "mastery" && masteryUnlocked,
    };
  }

  function getArchiveRewardSignals(profile: ProfileState | null | undefined) {
    const accountSummary = runtimeWindow.ROUGE_PERSISTENCE?.getAccountProgressSummary?.(profile) || null;
    return {
      completedCount: clamp(accountSummary?.archive?.completedCount || 0, 0, 999),
      featureUnlockCount: clamp(accountSummary?.archive?.featureUnlockCount || 0, 0, 999),
      favoredTreeName: typeof accountSummary?.archive?.favoredTreeName === "string" ? accountSummary.archive.favoredTreeName : "",
    };
  }

  function scaleGoldValue(value: number, profile: ProfileState | null | undefined) {
    const features = getRewardAccountFeatures(profile);
    if (!features.economyLedger) {
      return value;
    }
    return Math.max(0, Math.ceil(value * 1.25));
  }

  function describeEffectPreview(effect: RewardChoiceEffect) {
    if (effect.kind === "hero_max_life") {return `Hero max Life +${effect.value}.`;}
    if (effect.kind === "hero_max_energy") {return `Hero max Energy +${effect.value}.`;}
    if (effect.kind === "hero_potion_heal") {return `Potion healing +${effect.value}.`;}
    if (effect.kind === "mercenary_attack") {return `Mercenary attack +${effect.value}.`;}
    if (effect.kind === "mercenary_max_life") {return `Mercenary max Life +${effect.value}.`;}
    if (effect.kind === "belt_capacity") {return `Belt capacity +${effect.value}.`;}
    if (effect.kind === "refill_potions") {return `Refill ${effect.value} potion charge${effect.value === 1 ? "" : "s"}.`;}
    if (effect.kind === "gold_bonus") {return `Gain ${effect.value} extra gold.`;}
    if (effect.kind === "class_point") {return `Gain ${effect.value} class point${effect.value === 1 ? "" : "s"}.`;}
    if (effect.kind === "attribute_point") {return `Gain ${effect.value} attribute point${effect.value === 1 ? "" : "s"}.`;}
    return "Run improves.";
  }

  function buildBoonChoice(boonDefinition: { id: string; title: string; subtitle: string; description: string; effects: RewardChoiceEffect[] }) {
    return {
      id: `reward_boon_${boonDefinition.id}`,
      kind: "boon",
      title: boonDefinition.title,
      subtitle: boonDefinition.subtitle,
      description: boonDefinition.description,
      previewLines: boonDefinition.effects.map(describeEffectPreview),
      effects: boonDefinition.effects.map((effect: RewardChoiceEffect) => ({ ...effect })),
    };
  }

  const PROGRESSION_BOON_POOLS: Record<string, { id: string; title: string; subtitle: string; description: string; effects: RewardChoiceEffect[] }[]> = {
    branchBattle: [
      {
        id: "battle_instinct",
        title: "Battle Instinct",
        subtitle: "Build Boon",
        description: "Gain 1 attribute point to sharpen the current run's stat line.",
        effects: [{ kind: "attribute_point", value: 1 }],
      },
    ],
    branchMiniboss: [
      {
        id: "heroic_instinct",
        title: "Heroic Instinct",
        subtitle: "Build Boon",
        description: "Gain 1 attribute point and 10 gold to shape the next stretch of the route.",
        effects: [
          { kind: "attribute_point", value: 1 },
          { kind: "gold_bonus", value: 10 },
        ],
      },
    ],
    boss: [
      {
        id: "class_mastery",
        title: "Class Mastery",
        subtitle: "Major Build Boon",
        description: "Gain 1 class point and 1 attribute point for a real post-boss build pivot.",
        effects: [
          { kind: "class_point", value: 1 },
          { kind: "attribute_point", value: 1 },
        ],
      },
    ],
  };

  function pickProgressionChoice(zone: ZoneState, seed: number, run: RunState, actNumber: number, content: GameContent, profile: ProfileState | null = null) {
    const pool = (PROGRESSION_BOON_POOLS as Record<string, typeof PROGRESSION_BOON_POOLS.boss>)[zone.kind] || (PROGRESSION_BOON_POOLS as Record<string, typeof PROGRESSION_BOON_POOLS.boss>)[zone.zoneRole] || [];
    if (pool.length === 0) {
      return null;
    }

    const definition = pool[seed % pool.length];
    const progressionSummary = runtimeWindow.ROUGE_RUN_FACTORY?.getProgressionSummary?.(run, content) || null;
    const focusedTreeName = progressionSummary?.favoredTreeName || run.className || "Current build";
    const features = getRewardAccountFeatures(profile);
    const archiveSignals = getArchiveRewardSignals(profile);
    const trainingGroundsClassBonus =
      features.trainingGrounds && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") ? 1 : 0;
    const masteryFocusClassBonus = features.masteryFocus && zone.kind === "boss" ? 1 : 0;
    const warCollegeClassBonus = features.warCollege && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") ? 1 : 0;
    const paragonDoctrineClassBonus =
      features.paragonDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 4 ? 1 : 0;
    const apexDoctrineClassBonus =
      features.apexDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5 ? 1 : 0;
    const legendDoctrineClassBonus =
      features.legendDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5
        ? 1 + Number(zone.kind === "boss")
        : 0;
    const mythicDoctrineClassBonus =
      features.mythicDoctrine && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5
        ? 2 + Number(zone.kind === "boss")
        : 0;
    const warAnnalsClassBonus =
      features.warAnnals && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 4
        ? 1 + Number(zone.kind === "boss" && actNumber >= 5 && archiveSignals.completedCount >= 4)
        : 0;
    const legendaryAnnalsClassBonus =
      features.legendaryAnnals && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5
        ? 1 + Number(zone.kind === "boss" && archiveSignals.completedCount >= 6)
        : 0;
    const immortalAnnalsClassBonus =
      features.immortalAnnals && (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5
        ? 1 + Number(zone.kind === "boss" && archiveSignals.completedCount >= 8)
        : 0;
    const trainingGroundsAttributeBonus = features.trainingGrounds && zone.kind === "boss" && actNumber >= 4 ? 1 : 0;
    const masteryFocusAttributeBonus = features.masteryFocus && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const warCollegeAttributeBonus = features.warCollege && zone.kind === "boss" && actNumber >= 4 ? 1 : 0;
    const paragonDoctrineAttributeBonus = features.paragonDoctrine && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const apexDoctrineAttributeBonus = features.apexDoctrine && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const legendDoctrineAttributeBonus = features.legendDoctrine && zone.kind === "boss" && actNumber >= 5 ? 1 : 0;
    const mythicDoctrineAttributeBonus = features.mythicDoctrine && zone.kind === "boss" && actNumber >= 5 ? 2 : 0;
    const warAnnalsAttributeBonus =
      features.warAnnals && zone.kind === "boss" && actNumber >= 4
        ? 1 + Number(actNumber >= 5 && archiveSignals.featureUnlockCount >= 3)
        : 0;
    const legendaryAnnalsAttributeBonus =
      features.legendaryAnnals && zone.kind === "boss" && actNumber >= 5
        ? 1 + Number(archiveSignals.featureUnlockCount >= 4)
        : 0;
    const immortalAnnalsAttributeBonus =
      features.immortalAnnals && zone.kind === "boss" && actNumber >= 5
        ? 1 + Number(archiveSignals.featureUnlockCount >= 6)
        : 0;
    const scaledEffects = definition.effects.map((effect: RewardChoiceEffect) => {
      if (effect.kind === "class_point") {
        return {
          ...effect,
          value:
            effect.value +
            (zone.kind === "boss" ? Math.min(2, Math.floor(Math.max(0, actNumber - 1) / 2)) : 0) +
            (features.bossTrophyGallery && zone.kind === "boss" ? 1 : 0) +
            trainingGroundsClassBonus + warCollegeClassBonus + paragonDoctrineClassBonus +
            apexDoctrineClassBonus + legendDoctrineClassBonus + mythicDoctrineClassBonus +
            warAnnalsClassBonus + legendaryAnnalsClassBonus + immortalAnnalsClassBonus +
            masteryFocusClassBonus,
        };
      }

      if (effect.kind === "attribute_point") {
        return {
          ...effect,
          value:
            effect.value +
            (zone.kind === "boss" && actNumber >= 4 ? 1 : 0) +
            (features.bossTrophyGallery && zone.kind === "boss" && actNumber >= 5 ? 1 : 0) +
            trainingGroundsAttributeBonus + warCollegeAttributeBonus + paragonDoctrineAttributeBonus +
            apexDoctrineAttributeBonus + legendDoctrineAttributeBonus + mythicDoctrineAttributeBonus +
            warAnnalsAttributeBonus + legendaryAnnalsAttributeBonus + immortalAnnalsAttributeBonus +
            masteryFocusAttributeBonus,
        };
      }

      if (effect.kind === "gold_bonus") {
        return { ...effect, value: scaleGoldValue(effect.value + actNumber * 4, profile) };
      }

      return { ...effect };
    });

    if ((zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 3) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    } else if (zone.zoneRole === "branchBattle" && actNumber >= 4) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.trainingGrounds && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "class_point") && (zone.kind === "miniboss" || zone.kind === "boss")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.trainingGrounds && zone.kind === "boss" && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(actNumber >= 4) + Number(features.masteryFocus && actNumber >= 5) });
    }
    if (features.warCollege && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(actNumber >= 4) });
    }
    if (features.warCollege && zone.kind === "boss") {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(actNumber >= 5) });
    }
    if (features.paragonDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 4) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.apexDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
    }
    if (features.apexDoctrine && zone.kind === "boss" && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
      scaledEffects.push({ kind: "attribute_point", value: 1 });
    }
    if (features.legendDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss") });
    }
    if (features.legendDoctrine && zone.kind === "boss" && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 1 });
      scaledEffects.push({ kind: "attribute_point", value: 1 });
    }
    if (features.mythicDoctrine && (zone.kind === "miniboss" || zone.zoneRole === "branchMiniboss") && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 2 });
    }
    if (features.mythicDoctrine && zone.kind === "boss" && actNumber >= 5) {
      scaledEffects.unshift({ kind: "class_point", value: 2 });
      scaledEffects.push({ kind: "attribute_point", value: 2 });
    }
    if (features.warAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "class_point")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss" && actNumber >= 5) });
    }
    if (features.warAnnals && zone.kind === "boss" && actNumber >= 4 && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(actNumber >= 5 && archiveSignals.completedCount >= 4) });
    }
    if (features.legendaryAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "class_point")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss" && archiveSignals.completedCount >= 6) });
    }
    if (features.legendaryAnnals && zone.kind === "boss" && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(archiveSignals.featureUnlockCount >= 4) });
    }
    if (features.immortalAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "class_point")) {
      scaledEffects.unshift({ kind: "class_point", value: 1 + Number(zone.kind === "boss" && archiveSignals.completedCount >= 8) });
    }
    if (features.immortalAnnals && zone.kind === "boss" && !scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "attribute_point")) {
      scaledEffects.push({ kind: "attribute_point", value: 1 + Number(archiveSignals.featureUnlockCount >= 6) });
    }

    const choice = buildBoonChoice({
      ...definition,
      id: `${definition.id}_${zone.id}_${actNumber}`,
      title: zone.kind === "boss" ? `${focusedTreeName} Mastery` : definition.title,
      description:
        zone.kind === "boss"
          ? `Gain a late-act build pivot that reinforces ${focusedTreeName.toLowerCase()} and keeps the run growing into town spends.`
          : `${definition.description} Current focus: ${focusedTreeName}.`,
      effects: scaledEffects,
    });

    if (progressionSummary?.nextClassUnlock) {
      choice.previewLines.push(progressionSummary.nextClassUnlock);
    }
    if (features.bossTrophyGallery && zone.kind === "boss") {
      choice.previewLines.push("Boss Trophy Gallery is reinforcing this post-boss build pivot.");
    }
    if (features.trainingGrounds && (zone.kind === "miniboss" || zone.kind === "boss")) {
      choice.previewLines.push("Training Grounds is converting account mastery into extra progression points.");
    }
    if (features.masteryFocus && zone.kind === "boss") {
      choice.previewLines.push("Mastery Hall focus is sharpening this reward pivot.");
    }
    if (features.warCollege && (zone.kind === "miniboss" || zone.kind === "boss")) {
      choice.previewLines.push("War College is hardening this late-run progression pivot.");
    }
    if (features.paragonDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 4) {
      choice.previewLines.push("Paragon Doctrine is codifying an extra late-act mastery dividend.");
    }
    if (features.apexDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Apex Doctrine is converting the archive of boss kills into an apex late-act mastery swing.");
    }
    if (features.legendDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Legend Doctrine is pushing this reward into a second-wave mastery summit for late-act pivots.");
    }
    if (features.mythicDoctrine && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Mythic Doctrine is pushing this reward into a third-wave mastery summit for the strongest late-act pivots.");
    }
    if (features.warAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 4) {
      const favoredTreeLine = archiveSignals.favoredTreeName ? ` Archived memory is still centered on ${archiveSignals.favoredTreeName}.` : "";
      choice.previewLines.push(`War Annals is translating archived expeditions into another mastery pivot.${favoredTreeLine}`);
    }
    if (features.legendaryAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Legendary Annals is translating the sovereign archive into another late-act mastery dividend.");
    }
    if (features.immortalAnnals && (zone.kind === "miniboss" || zone.kind === "boss") && actNumber >= 5) {
      choice.previewLines.push("Immortal Annals is translating the imperial archive into another mythic mastery dividend.");
    }
    if (features.economyLedger && scaledEffects.some((effect: RewardChoiceEffect) => effect.kind === "gold_bonus")) {
      choice.previewLines.push("Economy Ledger dividend is active on this build payout.");
    }

    return choice;
  }

  runtimeWindow.__ROUGE_REWARD_ENGINE_PROGRESSION = {
    pickProgressionChoice,
    getRewardAccountFeatures,
    scaleGoldValue,
    describeEffectPreview,
    buildBoonChoice,
  };
})();
