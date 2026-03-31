(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { toNumber: getBonusValue } = runtimeWindow.ROUGE_UTILS;
  const { DECK_SURGERY_ZONES } = runtimeWindow.ROUGE_CONSTANTS;

  function getCombatBonuses(run: RunState, content: GameContent) {
    return runtimeWindow.ROUGE_RUN_FACTORY?.buildCombatBonuses?.(run, content) || {};
  }

  function getEffectivePartyState(run: RunState, content: GameContent) {
    const bonuses = getCombatBonuses(run, content);
    const heroMaxLife = run.hero.maxLife + getBonusValue(bonuses.heroMaxLife);
    const mercenaryMaxLife = run.mercenary.maxLife + getBonusValue(bonuses.mercenaryMaxLife);

    return {
      hero: {
        currentLife: Math.min(run.hero.currentLife, heroMaxLife),
        maxLife: heroMaxLife,
      },
      mercenary: {
        currentLife: Math.min(run.mercenary.currentLife, mercenaryMaxLife),
        maxLife: mercenaryMaxLife,
      },
    };
  }

  function getHealerCost(run: RunState, content: GameContent) {
    const effectiveParty = getEffectivePartyState(run, content);
    const missingHeroLife = Math.max(0, effectiveParty.hero.maxLife - effectiveParty.hero.currentLife);
    const missingMercenaryLife =
      run.mercenary.currentLife > 0 ? Math.max(0, effectiveParty.mercenary.maxLife - effectiveParty.mercenary.currentLife) : 0;
    const totalMissingLife = missingHeroLife + missingMercenaryLife;

    if (totalMissingLife <= 0) {
      return 0;
    }
    return Math.max(6, Math.ceil(totalMissingLife / 4) + run.actNumber * 2);
  }

  function buildHealerAction(run: RunState, content: GameContent) {
    const cost = getHealerCost(run, content);
    const affordable = run.gold >= cost;
    const disabled = cost <= 0 || !affordable;
    const statusLine = cost <= 0 ? "Party already restored." : `${cost} gold to restore all missing party Life.`;
    return {
      id: "healer_restore_party",
      category: "service",
      title: "Camp Relief",
      subtitle: "Restore Party",
      description: "Restore the hero and living mercenary to full Life before heading back into the field.",
      previewLines: [statusLine, affordable ? "Immediate recovery in town." : "Not enough gold yet."],
      cost,
      actionLabel: cost <= 0 ? "Ready" : "Restore",
      disabled,
    };
  }

  function getQuartermasterCost(run: RunState) {
    const missingCharges = Math.max(0, run.belt.max - run.belt.current);
    if (missingCharges <= 0) {
      return 0;
    }
    return missingCharges * (3 + run.actNumber);
  }

  function buildQuartermasterAction(run: RunState) {
    const cost = getQuartermasterCost(run);
    const affordable = run.gold >= cost;
    const disabled = cost <= 0 || !affordable;
    const missingCharges = Math.max(0, run.belt.max - run.belt.current);
    return {
      id: "quartermaster_refill_belt",
      category: "service",
      title: "Quartermaster",
      subtitle: "Refill Belt",
      description: "Buy enough potion stock to refill the current belt to maximum charges.",
      previewLines: [
        missingCharges > 0 ? `Refill ${missingCharges} missing belt charge${missingCharges === 1 ? "" : "s"}.` : "Belt already full.",
        cost > 0 ? `${cost} gold.` : "No purchase needed.",
      ],
      cost,
      actionLabel: cost <= 0 ? "Full" : "Refill",
      disabled,
    };
  }

  function hasQuartermasterDeckSurgeryUnlock(run: RunState) {
    return (run.acts || []).some((act) =>
      (act.zones || []).some((zone) =>
        zone.cleared && DECK_SURGERY_ZONES.has(zone.title)
      )
    );
  }

  // Kept local until the quartermaster surgery bench is wired into town actions.
  function _buildQuartermasterDeckSurgeryActions(run: RunState, content: GameContent): TownAction[] {
    const unlocked = hasQuartermasterDeckSurgeryUnlock(run);
    if (!unlocked) {
      return [{
        id: "quartermaster_deck_surgery_locked",
        category: "service",
        title: "Deck Surgery",
        subtitle: "Camp Upgrade",
        description: "Clear Black Pit or Ashfall Hamlet to unlock a one-time deck cut at the quartermaster bench.",
        previewLines: [
          "Unlocks after the Den of Evil or Tristram route equivalent is cleared.",
          "Once unlocked, the quartermaster can excise one card per expedition.",
        ],
        cost: 0,
        actionLabel: "Locked",
        disabled: true,
      }];
    }

    if (run.town.quartermasterDeckSurgeryUsed) {
      return [{
        id: "quartermaster_deck_surgery_spent",
        category: "service",
        title: "Deck Surgery Spent",
        subtitle: "One-Time Cut",
        description: "The quartermaster has already excised one card from this expedition's deck manifest.",
        previewLines: [
          "One deck cut per expedition.",
          `Current deck size: ${run.deck.length}.`,
        ],
        cost: 0,
        actionLabel: "Spent",
        disabled: true,
      }];
    }

    if (run.deck.length <= 5) {
      return [{
        id: "quartermaster_deck_surgery_none",
        category: "service",
        title: "Deck Surgery",
        subtitle: "Deck Too Tight",
        description: "Your deck is already at the minimum size for safe field cuts.",
        previewLines: [
          `Deck size: ${run.deck.length}. Minimum: 5.`,
          "The quartermaster will not cut deeper than that.",
        ],
        cost: 0,
        actionLabel: "Locked",
        disabled: true,
      }];
    }

    const seen = new Set<string>();
    const actions: TownAction[] = [];
    for (const cardId of run.deck) {
      if (seen.has(cardId)) {
        continue;
      }
      seen.add(cardId);
      const card = content.cardCatalog[cardId];
      if (!card) {
        continue;
      }
      const copyCount = run.deck.filter((entryId) => entryId === cardId).length;
      actions.push({
        id: `quartermaster_deck_surgery_${cardId}`,
        category: "service",
        title: `Excise ${card.title}`,
        subtitle: "Deck Surgery",
        description: `Once this expedition, the quartermaster can cut one copy of ${card.title} from your deck manifest. Deck size: ${run.deck.length} -> ${run.deck.length - 1}.`,
        previewLines: [
          `${card.text}`,
          `Deck holds ${copyCount} cop${copyCount === 1 ? "y" : "ies"} of ${card.title}.`,
          "One quartermaster cut per expedition.",
        ],
        cost: 0,
        actionLabel: "Excise",
        disabled: false,
      });
    }
    return actions;
  }

  function getMercenaryActionCost(run: RunState, mercenaryId: string) {
    const isCurrentMercenary = mercenaryId === run.mercenary.id;
    if (isCurrentMercenary) {
      if (run.mercenary.currentLife > 0) {
        return 0;
      }
      return 14 + run.actNumber * 4;
    }
    return 18 + run.actNumber * 5;
  }

  function buildMercenaryAction(run: RunState, mercenaryDefinition: MercenaryDefinition) {
    const isCurrentMercenary = mercenaryDefinition.id === run.mercenary.id;
    const cost = getMercenaryActionCost(run, mercenaryDefinition.id);
    const affordable = run.gold >= cost;
    const disabled = isCurrentMercenary ? run.mercenary.currentLife > 0 : !affordable;
    let subtitle = "Hire";
    let actionLabel = "Hire";
    let description = mercenaryDefinition.passiveText;
    const previewLines = [
      `Attack ${mercenaryDefinition.attack}, Life ${mercenaryDefinition.maxLife}.`,
      mercenaryDefinition.passiveText,
    ];

    if (isCurrentMercenary && run.mercenary.currentLife > 0) {
      subtitle = "On Contract";
      actionLabel = "Active";
      description = "This mercenary is already under contract for the current run.";
      previewLines.push("Current companion.");
    } else if (isCurrentMercenary) {
      subtitle = "Revive Contract";
      actionLabel = "Revive";
      description = "Revive your fallen mercenary at the current act safe zone.";
      previewLines.push(`${cost} gold revive fee.`);
    } else {
      previewLines.push(`${cost} gold contract fee.`);
    }

    return {
      id: `mercenary_contract_${mercenaryDefinition.id}`,
      category: "mercenary",
      title: mercenaryDefinition.name,
      subtitle,
      description,
      previewLines,
      cost,
      actionLabel,
      disabled,
    };
  }

  function getActMercenaries(content: GameContent, run: RunState): MercenaryDefinition[] {
    const allMercs = Object.values(content.mercenaryCatalog);
    const actMercs = allMercs.filter((merc) => merc.actOrigin === run.actNumber);
    // Always include the current contracted mercenary for revive, even if from another act
    if (run.mercenary?.id && !actMercs.some((merc) => merc.id === run.mercenary.id)) {
      const currentMerc = content.mercenaryCatalog[run.mercenary.id];
      if (currentMerc) {
        actMercs.unshift(currentMerc);
      }
    }
    return actMercs;
  }

  function describeBonuses(bonuses: ItemBonusSet): string {
    const parts: string[] = [];
    if (bonuses.heroMaxLife) { parts.push(`+${bonuses.heroMaxLife} Life`); }
    if (bonuses.heroMaxEnergy) { parts.push(`+${bonuses.heroMaxEnergy} Energy`); }
    if (bonuses.heroDamageBonus) { parts.push(`+${bonuses.heroDamageBonus} Dmg`); }
    if (bonuses.heroGuardBonus) { parts.push(`+${bonuses.heroGuardBonus} Guard`); }
    if (bonuses.heroBurnBonus) { parts.push(`+${bonuses.heroBurnBonus} Burn`); }
    if (bonuses.heroPotionHeal) { parts.push(`+${bonuses.heroPotionHeal} Potion`); }
    if (bonuses.mercenaryAttack) { parts.push(`+${bonuses.mercenaryAttack} Merc Atk`); }
    if (bonuses.mercenaryMaxLife) { parts.push(`+${bonuses.mercenaryMaxLife} Merc Life`); }
    return parts.join(", ") || "No bonuses";
  }

  function buildCharmPouchActions(profile: ProfileState, run: RunState): TownAction[] {
    const charmSystem = runtimeWindow.ROUGE_CHARM_SYSTEM;
    if (!charmSystem || !profile?.meta?.charms) {
      return [];
    }
    const summary = charmSystem.getCharmPouchSummary(profile);
    if (summary.unlockedCount === 0) {
      return [];
    }

    const actions: TownAction[] = [];
    const classId = run?.classId || "";

    for (const charm of summary.equippedCharms) {
      const classNote = charm.classId && charm.classId !== classId ? " (inactive — wrong class)" : "";
      actions.push({
        id: `${charmSystem.ACTION_UNEQUIP_PREFIX}${charm.id}`,
        category: "charm",
        title: charm.name,
        subtitle: `Equipped · ${charm.size} (${charm.slotCost} slot${charm.slotCost === 1 ? "" : "s"})`,
        description: `Remove this charm from the pouch.${classNote}`,
        previewLines: [describeBonuses(charm.bonuses), `${summary.slotsUsed}/${summary.capacity} slots used.`],
        cost: 0,
        actionLabel: "Unequip",
        disabled: false,
      });
    }

    for (const charm of summary.unequippedCharms) {
      const canEquip = charmSystem.canEquipCharm(profile, charm.id);
      const classNote = charm.classId ? ` (${charm.classId} only)` : "";
      actions.push({
        id: `${charmSystem.ACTION_EQUIP_PREFIX}${charm.id}`,
        category: "charm",
        title: charm.name,
        subtitle: `Available · ${charm.size} (${charm.slotCost} slot${charm.slotCost === 1 ? "" : "s"})${classNote}`,
        description: `Place this charm in the pouch.`,
        previewLines: [describeBonuses(charm.bonuses), canEquip ? `${summary.slotsRemaining} slot${summary.slotsRemaining === 1 ? "" : "s"} free.` : "Not enough pouch space."],
        cost: 0,
        actionLabel: canEquip ? "Equip" : "Full",
        disabled: !canEquip,
      });
    }

    return actions;
  }

  function listActions(content: GameContent, run: RunState, profile: ProfileState) {
    const mercenaryActions = getActMercenaries(content, run).map((mercenaryDefinition) => {
      return buildMercenaryAction(run, mercenaryDefinition);
    });
    const progressionActions = runtimeWindow.ROUGE_RUN_FACTORY?.listProgressionActions(run, content) || [];
    const itemActions = runtimeWindow.ROUGE_ITEM_SYSTEM?.listTownActions(run, profile, content) || [];

    const deckServices = runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES;
    const blacksmithActions = deckServices ? deckServices.buildBlacksmithActions(run, content) : [];
    const sageActions = deckServices ? deckServices.buildSageActions(run, content) : [];
    const gamblerActions = deckServices ? deckServices.buildGamblerActions(run) : [];

    const hasCube = runtimeWindow.ROUGE_HORADRIC_CUBE &&
      Array.isArray(profile?.meta?.unlocks?.townFeatureIds) &&
      profile.meta.unlocks.townFeatureIds.includes("horadric_cube");
    const cubeActions = hasCube
      ? runtimeWindow.ROUGE_HORADRIC_CUBE.buildCubeActions(profile)
      : [];

    const charmActions = buildCharmPouchActions(profile, run);

    return [
      buildHealerAction(run, content),
      buildQuartermasterAction(run),
      ...progressionActions,
      ...itemActions,
      ...blacksmithActions,
      ...sageActions,
      ...gamblerActions,
      ...charmActions,
      ...cubeActions,
      ...mercenaryActions,
    ];
  }

  function applyAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string) {
    const availableActions = listActions(content, run, profile);
    const action = availableActions.find((candidate) => candidate.id === actionId) || null;
    if (!action) {
      return { ok: false, message: "Unknown town action." };
    }
    if (action.disabled) {
      return { ok: false, message: "That town action is not available right now." };
    }

    if (actionId === "healer_restore_party") {
      const cost = getHealerCost(run, content);
      const effectiveParty = getEffectivePartyState(run, content);
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for healing." };
      }
      run.gold -= cost;
      run.hero.currentLife = effectiveParty.hero.maxLife;
      if (run.mercenary.currentLife > 0) {
        run.mercenary.currentLife = effectiveParty.mercenary.maxLife;
      }
      return { ok: true, message: "Party restored." };
    }

    if (actionId === "quartermaster_refill_belt") {
      const cost = getQuartermasterCost(run);
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold to refill the belt." };
      }
      run.gold -= cost;
      run.belt.current = run.belt.max;
      return { ok: true, message: "Belt refilled." };
    }

    if (actionId.startsWith("progression_spend_")) {
      return runtimeWindow.ROUGE_RUN_FACTORY.applyProgressionAction(run, actionId, content);
    }

    if (actionId.startsWith("progression_attribute_") || actionId.startsWith("progression_tree_")) {
      return runtimeWindow.ROUGE_RUN_FACTORY.applyProgressionAction(run, actionId, content);
    }

    if (
      actionId === "vendor_refresh_stock" ||
      actionId.startsWith("vendor_buy_") ||
      actionId.startsWith("vendor_consign_") ||
      actionId.startsWith("inventory_") ||
      actionId.startsWith("stash_")
    ) {
      return runtimeWindow.ROUGE_ITEM_SYSTEM.applyTownAction(run, profile, content, actionId);
    }

    if (actionId.startsWith("blacksmith_evolve_")) {
      const deckServices = runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES;
      if (!deckServices) {
        return { ok: false, message: "Deck services not available." };
      }
      return deckServices.applyBlacksmithAction(run, content, actionId);
    }

    if (actionId.startsWith("blacksmith_refine_")) {
      const deckServices = runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES;
      if (!deckServices) {
        return { ok: false, message: "Deck services not available." };
      }
      return deckServices.applyBlacksmithAction(run, content, actionId);
    }

    if (actionId.startsWith("sage_") && !actionId.startsWith("stash_")) {
      const deckServices = runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES;
      if (!deckServices) {
        return { ok: false, message: "Deck services not available." };
      }
      return deckServices.applySageAction(run, content, actionId);
    }

    if (actionId.startsWith("gambler_mystery_")) {
      const deckServices = runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES;
      if (!deckServices) {
        return { ok: false, message: "Deck services not available." };
      }
      return deckServices.applyGamblerAction(run, content, actionId);
    }

    const charmSystem = runtimeWindow.ROUGE_CHARM_SYSTEM;
    if (charmSystem && actionId.startsWith(charmSystem.ACTION_EQUIP_PREFIX)) {
      const charmId = actionId.slice(charmSystem.ACTION_EQUIP_PREFIX.length);
      return charmSystem.equipCharm(profile, charmId)
        ? { ok: true, message: "Charm equipped." }
        : { ok: false, message: "Cannot equip that charm." };
    }

    if (charmSystem && actionId.startsWith(charmSystem.ACTION_UNEQUIP_PREFIX)) {
      const charmId = actionId.slice(charmSystem.ACTION_UNEQUIP_PREFIX.length);
      return charmSystem.unequipCharm(profile, charmId)
        ? { ok: true, message: "Charm unequipped." }
        : { ok: false, message: "Charm is not equipped." };
    }

    const cube = runtimeWindow.ROUGE_HORADRIC_CUBE;
    if (cube && actionId.startsWith(cube.ACTION_PREFIX)) {
      const recipeId = actionId.slice(cube.ACTION_PREFIX.length);
      return cube.executeRecipe(profile, recipeId);
    }

    if (actionId.startsWith("mercenary_contract_")) {
      const mercenaryId = actionId.replace("mercenary_contract_", "");
      const mercenaryDefinition = content.mercenaryCatalog[mercenaryId];
      if (!mercenaryDefinition) {
        return { ok: false, message: "Unknown mercenary." };
      }

      const cost = getMercenaryActionCost(run, mercenaryId);
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for that mercenary contract." };
      }

      if (mercenaryId === run.mercenary.id) {
        if (run.mercenary.currentLife > 0) {
          return { ok: false, message: "That mercenary is already active." };
        }
        const effectiveParty = getEffectivePartyState(run, content);
        run.gold -= cost;
        run.mercenary.currentLife = effectiveParty.mercenary.maxLife;
        return { ok: true, message: "Mercenary revived." };
      }

      const bonuses = getCombatBonuses(run, content);
      run.gold -= cost;
      run.mercenary = {
        ...mercenaryDefinition,
        currentLife: mercenaryDefinition.maxLife + getBonusValue(bonuses.mercenaryMaxLife),
      };
      return { ok: true, message: "Mercenary contract updated." };
    }

    return { ok: false, message: "Town action is not implemented." };
  }

  runtimeWindow.ROUGE_TOWN_SERVICES = {
    listActions,
    applyAction,
  };
})();
