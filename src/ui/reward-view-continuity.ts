(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

  function buildRewardContinuityMarkup(
    appState: AppState,
    services: UiRenderServices,
    run: RunState,
    reward: RunReward,
    derivedParty: DerivedPartyState,
    _trainingRanks: number
  ): string {
    const { buildBadge, buildStat, escapeHtml } = services.renderUtils;
    const totalLedgerEntries =
      Object.keys(run.world?.questOutcomes || {}).length +
      Object.keys(run.world?.shrineOutcomes || {}).length +
      Object.keys(run.world?.eventOutcomes || {}).length +
      Object.keys(run.world?.opportunityOutcomes || {}).length;
    const isRouteReward = ["quest", "shrine", "event", "opportunity"].includes(reward.kind);

    let deltaLabel = "Immediate Delta";
    if (reward.endsRun) {
      deltaLabel = "Archive-Bound Delta";
    } else if (reward.endsAct) {
      deltaLabel = "Act-Close Delta";
    } else if (isRouteReward) {
      deltaLabel = "Route Delta";
    } else {
      deltaLabel = "Combat Delta";
    }

    let resolutionLine = "The expedition remains active after the reward resolves.";
    if (reward.endsRun) {
      resolutionLine = "This claim closes the final run and turns the next shell surface into archive review.";
    } else if (reward.endsAct) {
      resolutionLine = `${run.actTitle} closes here, then the shell pivots into the act-transition wrapper.`;
    }

    let nextShellLabel = "World Map";
    let nextShellTone = "available";
    let nextShellCopy = "After this claim the shell moves to World Map.";

    if (reward.endsRun) {
      nextShellLabel = "Run-End Review";
      nextShellTone = "cleared";
      nextShellCopy = "After this claim the shell moves to Run-End Review.";
    } else if (reward.endsAct) {
      nextShellLabel = "Act Transition";
      nextShellTone = "cleared";
      nextShellCopy = "After this claim the shell moves to Act Transition.";
    }

    return `
      <div class="feature-grid feature-grid-wide">
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>${escapeHtml(deltaLabel)}</strong>
            ${buildBadge(reward.kind, reward.endsAct || reward.endsRun ? "cleared" : "available")}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Zone", reward.zoneTitle)}
            ${buildStat("Deck", run.deck.length)}
            ${buildStat("Runewords", derivedParty.activeRunewords.length)}
            ${buildStat("Ledger", totalLedgerEntries)}
          </div>
          <p class="service-subtitle">${escapeHtml(resolutionLine)}</p>
        </article>
        <article class="feature-card">
          <div class="entity-name-row">
            <strong>Next Phase</strong>
            ${buildBadge(nextShellLabel, nextShellTone)}
          </div>
          <div class="entity-stat-grid">
            ${buildStat("Destination", nextShellLabel)}
            ${buildStat("Town", run.acts[run.currentActIndex + 1]?.town || run.safeZoneName)}
            ${buildStat("Encounter", reward.encounterNumber)}
          </div>
          <p class="service-subtitle">${escapeHtml(nextShellCopy)}</p>
        </article>
      </div>
    `;
  }

  function buildChoiceMutationLines(choice: RewardChoice, reward: RunReward, run: RunState, content: GameContent): string[] {
    let deckDelta = 0;
    let heroLifeDelta = 0;
    let heroEnergyDelta = 0;
    let heroPotionDelta = 0;
    let mercenaryAttackDelta = 0;
    let mercenaryLifeDelta = 0;
    let beltCapacityDelta = 0;
    let refillDelta = 0;
    let goldBonus = 0;
    let classPointDelta = 0;
    let attributePointDelta = 0;
    const lines: string[] = [];

    choice.effects.forEach((effect) => {
      switch (effect.kind) {
        case "add_card": {
          deckDelta += 1;
          const cardTitle = content.cardCatalog?.[effect.cardId || ""]?.title || effect.cardId || "Unknown card";
          lines.push(`Deck ${run.deck.length} -> ${run.deck.length + deckDelta} by adding ${cardTitle}.`);
          break;
        }
        case "upgrade_card": {
          const fromCard = content.cardCatalog?.[effect.fromCardId || ""]?.title || effect.fromCardId || "Unknown card";
          const toCard = content.cardCatalog?.[effect.toCardId || ""]?.title || effect.toCardId || "Unknown upgrade";
          lines.push(`Deck stays ${run.deck.length}, replacing ${fromCard} with ${toCard}.`);
          break;
        }
        case "hero_max_life": {
          heroLifeDelta += toNumber(effect.value, 0);
          lines.push(
            `Hero Life ${run.hero.currentLife}/${run.hero.maxLife} -> ${Math.min(run.hero.maxLife + heroLifeDelta, run.hero.currentLife + heroLifeDelta)}/${run.hero.maxLife + heroLifeDelta}.`
          );
          break;
        }
        case "hero_max_energy": {
          heroEnergyDelta += toNumber(effect.value, 0);
          lines.push(`Hero Energy ${run.hero.maxEnergy} -> ${run.hero.maxEnergy + heroEnergyDelta}.`);
          break;
        }
        case "hero_potion_heal": {
          heroPotionDelta += toNumber(effect.value, 0);
          lines.push(`Potion strength ${run.hero.potionHeal} -> ${run.hero.potionHeal + heroPotionDelta}.`);
          break;
        }
        case "mercenary_attack": {
          mercenaryAttackDelta += toNumber(effect.value, 0);
          lines.push(`Mercenary attack ${run.mercenary.attack} -> ${run.mercenary.attack + mercenaryAttackDelta}.`);
          break;
        }
        case "mercenary_max_life": {
          mercenaryLifeDelta += toNumber(effect.value, 0);
          lines.push(
            `Mercenary Life ${run.mercenary.currentLife}/${run.mercenary.maxLife} -> ${Math.min(run.mercenary.maxLife + mercenaryLifeDelta, run.mercenary.currentLife + mercenaryLifeDelta)}/${run.mercenary.maxLife + mercenaryLifeDelta}.`
          );
          break;
        }
        case "belt_capacity": {
          beltCapacityDelta += toNumber(effect.value, 0);
          const afterBeltMax = run.belt.max + beltCapacityDelta;
          const afterBeltCurrent = Math.min(afterBeltMax, run.belt.current + reward.grants.potions + refillDelta);
          lines.push(`Belt ${run.belt.current}/${run.belt.max} -> ${afterBeltCurrent}/${afterBeltMax}.`);
          break;
        }
        case "refill_potions": {
          refillDelta += toNumber(effect.value, 0);
          const afterBeltMax = run.belt.max + beltCapacityDelta;
          const afterBeltCurrent = Math.min(afterBeltMax, run.belt.current + reward.grants.potions + refillDelta);
          lines.push(`Belt charges ${run.belt.current}/${run.belt.max} -> ${afterBeltCurrent}/${afterBeltMax}.`);
          break;
        }
        case "gold_bonus": {
          goldBonus += toNumber(effect.value, 0);
          lines.push(`Gold ${run.gold} -> ${run.gold + reward.grants.gold + goldBonus}.`);
          break;
        }
        case "class_point": {
          classPointDelta += toNumber(effect.value, 0);
          lines.push(`Class points ${run.progression.classPointsAvailable} -> ${run.progression.classPointsAvailable + classPointDelta}.`);
          break;
        }
        case "attribute_point": {
          attributePointDelta += toNumber(effect.value, 0);
          lines.push(`Attribute points ${run.progression.attributePointsAvailable} -> ${run.progression.attributePointsAvailable + attributePointDelta}.`);
          break;
        }
        case "equip_item": {
          const item = content.itemCatalog?.[effect.itemId || ""] || null;
          const slot = item?.slot || effect.slot || "weapon";
          const SLOT_LABEL = runtimeWindow.ROUGE_ITEM_LOADOUT.EQUIPMENT_SLOT_LABELS;
          const loadoutKey = slot === "ring" ? "ring1" : slot;
          const currentItem = (run.loadout as Record<string, RunEquipmentState | null>)?.[loadoutKey]?.itemId ? content.itemCatalog?.[(run.loadout as Record<string, RunEquipmentState | null>)[loadoutKey].itemId]?.name || "Equipped" : "Empty";
          lines.push(`${SLOT_LABEL[slot] || slot} ${currentItem} -> ${item?.name || effect.itemId || "Unknown item"}.`);
          break;
        }
        case "add_socket": {
          const slot = effect.slot || "weapon";
          const loadoutKey2 = slot === "ring" ? "ring1" : slot;
          const equipment = (run.loadout as Record<string, RunEquipmentState | null>)?.[loadoutKey2] || null;
          const currentSockets = equipment?.socketsUnlocked || 0;
          const SLOT_LABEL2 = runtimeWindow.ROUGE_ITEM_LOADOUT.EQUIPMENT_SLOT_LABELS;
          lines.push(`${SLOT_LABEL2[slot] || slot} sockets ${currentSockets} -> ${currentSockets + 1}.`);
          break;
        }
        case "socket_rune": {
          const slot = effect.slot || "weapon";
          const loadoutKey3 = slot === "ring" ? "ring1" : slot;
          const runeLabel = content.runeCatalog?.[effect.runeId || ""]?.name || effect.runeId || "Unknown rune";
          const equipment = (run.loadout as Record<string, RunEquipmentState | null>)?.[loadoutKey3] || null;
          const filledSockets = equipment?.insertedRunes?.length || 0;
          lines.push(`${runeLabel} enters the ${slot}, filling sockets ${filledSockets} -> ${filledSockets + 1}.`);
          break;
        }
        case "record_quest_outcome":
        case "record_quest_follow_up":
        case "record_quest_consequence": {
          lines.push(`World ledger records ${effect.outcomeTitle || effect.outcomeId || "a quest consequence"} immediately.`);
          break;
        }
        case "record_node_outcome": {
          lines.push(`World ledger records ${effect.outcomeTitle || effect.outcomeId || "a node consequence"} on the ${effect.nodeType || "route"} lane.`);
          break;
        }
        default:
          break;
      }
    });

    const afterBeltMax = run.belt.max + beltCapacityDelta;
    const afterBeltCurrent = Math.min(afterBeltMax, run.belt.current + reward.grants.potions + refillDelta);
    const grantSummary = `Shared grants after claim: gold ${run.gold} -> ${run.gold + reward.grants.gold + goldBonus}, XP ${run.xp} -> ${run.xp + reward.grants.xp}, belt ${run.belt.current}/${run.belt.max} -> ${afterBeltCurrent}/${afterBeltMax}.`;

    if (lines.length === 0) {
      return [grantSummary, "No extra effect beyond the shared grants on this reward."];
    }

    return [grantSummary, ...lines];
  }

  function buildChoiceDeltaMarkup(choices: RewardChoice[], reward: RunReward, run: RunState, content: GameContent, renderUtils: RenderUtilsApi): string {
    const { buildBadge, buildStringList, escapeHtml } = renderUtils;
    return `
      <div class="feature-grid feature-grid-wide mutation-delta-grid">
        ${choices
          .map((choice) => {
            return `
              <article class="feature-card mutation-delta-card">
                <div class="entity-name-row">
                  <strong>${escapeHtml(choice.title)}</strong>
                  ${buildBadge(choice.kind || "choice", "available")}
                </div>
                <p class="service-subtitle">${escapeHtml(choice.subtitle)}</p>
                ${buildStringList(buildChoiceMutationLines(choice, reward, run, content), "log-list reward-list reward-preview-list")}
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  runtimeWindow.__ROUGE_REWARD_VIEW_CONTINUITY = {
    buildRewardContinuityMarkup,
    buildChoiceMutationLines,
    buildChoiceDeltaMarkup,
  };
})();
