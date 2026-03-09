(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getTrainingRanks(run: RunState): number {
    return ["vitality", "focus", "command"].reduce((total, track) => {
      return total + (Number.parseInt(String(run.progression?.training?.[track] ?? 0), 10) || 0);
    }, 0);
  }

  function getRewardContext(reward: RunReward, run: RunState) {
    const catalog = runtimeWindow.ROUGE_WORLD_NODES?.getCatalog?.() || null;
    const eventDefinition = catalog?.events?.[run.actNumber] || null;
    const linkedQuestRecord = eventDefinition?.requiresQuestId ? run.world?.questOutcomes?.[eventDefinition.requiresQuestId] || null : null;

    if (reward.kind === "quest") {
      return {
        title: "Quest Resolution",
        lines: [
          "This claim writes a quest outcome into the run ledger.",
          "Quest rewards clear the node immediately and can unlock aftermath content later in the act.",
          "No combat restarts after you choose here.",
        ],
      };
    }

    if (reward.kind === "shrine") {
      return {
        title: "Shrine Blessing",
        lines: [
          "This claim applies a persistent blessing to the current expedition.",
          "Shrines resolve immediately through the shared reward surface.",
          "No combat restarts after the blessing is taken.",
        ],
      };
    }

    if (reward.kind === "event") {
      return {
        title: "Aftermath Follow-Up",
        lines: [
          linkedQuestRecord
            ? `Triggered by ${linkedQuestRecord.title}: ${linkedQuestRecord.outcomeTitle}.`
            : "Triggered by an earlier quest result on this act route.",
          "This choice records a follow-up consequence back into the quest ledger.",
          "Aftermath rewards resolve immediately and return to the route.",
        ],
      };
    }

    if (reward.kind === "opportunity") {
      return {
        title: "Opportunity Chain",
        lines: [
          linkedQuestRecord?.followUpOutcomeTitle
            ? `Triggered by ${linkedQuestRecord.outcomeTitle} -> ${linkedQuestRecord.followUpOutcomeTitle}.`
            : "Triggered by the full quest chain on this act route.",
          "This choice records the final chain consequence back into the run ledger.",
          "Opportunity rewards still resolve through the shared reward surface.",
        ],
      };
    }

    return {
      title: "Combat Reward",
      lines: [
        reward.clearsZone ? "This claim clears the current area before the route resumes." : "This area still has more encounters after the claim resolves.",
        "Combat rewards can mutate deck, loadout, progression, or run inventory state.",
        "Choose one reward, then continue the route from the world map.",
      ],
    };
  }

  function getAdvanceGuideLines(reward: RunReward): string[] {
    if (reward.endsRun) {
      return [
        "Choose one reward effect.",
        "Apply the mutation.",
        "Move directly into the run-end review.",
      ];
    }

    if (reward.endsAct) {
      return [
        "Choose one reward effect.",
        "Apply the mutation.",
        "Move into the act transition wrapper and then the next town.",
      ];
    }

    return [
      "Choose one reward effect.",
      "Apply the mutation immediately to the current expedition.",
      "Return to the world map or next route state after the claim resolves.",
    ];
  }

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function buildRewardLedgerLines(run: RunState): string[] {
    const questLines = Object.values(run.world?.questOutcomes || {}).map((entry) => `Quest · ${entry.title}: ${entry.outcomeTitle}.`);
    const shrineLines = Object.values(run.world?.shrineOutcomes || {}).map((entry) => `Shrine · ${entry.title}: ${entry.outcomeTitle}.`);
    const eventLines = Object.values(run.world?.eventOutcomes || {}).map((entry) => `Aftermath · ${entry.title}: ${entry.outcomeTitle}.`);
    const opportunityLines = Object.values(run.world?.opportunityOutcomes || {}).map((entry) => `Opportunity · ${entry.title}: ${entry.outcomeTitle}.`);
    const lines = [...questLines, ...shrineLines, ...eventLines, ...opportunityLines];
    return lines.length > 0 ? lines.slice(-4).reverse() : ["No route ledger entries are active yet. Claims here still set the next route or archive handoff."];
  }

  function buildRewardContinuityMarkup(
    appState: AppState,
    services: UiRenderServices,
    run: RunState,
    reward: RunReward,
    derivedParty: DerivedPartyState,
    trainingRanks: number
  ): string {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { buildBadge, buildStat, buildStringList, escapeHtml } = services.renderUtils;
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const review = accountSummary.review || {
      availableConvergenceCount: 0,
      nextConvergenceTitle: "",
    };
    const planning: ProfilePlanningSummary = accountSummary.planning || common.createDefaultPlanningSummary();
    const ledgerLines = buildRewardLedgerLines(run);
    const totalLedgerEntries =
      Object.keys(run.world?.questOutcomes || {}).length +
      Object.keys(run.world?.shrineOutcomes || {}).length +
      Object.keys(run.world?.eventOutcomes || {}).length +
      Object.keys(run.world?.opportunityOutcomes || {}).length;
    const planningStageLines = common.getPlanningCharterStageLines
      ? common.getPlanningCharterStageLines(planning, appState.content)
      : [];
    const planningOverview = planning.overview;
    const activeRunewordNames = derivedParty.activeRunewords;
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

    let routeCarryLine = "This reward preserves the current route and hands control back to the next encounter in the same zone.";
    if (isRouteReward) {
      routeCarryLine = "This reward writes directly into the route ledger and returns to the map without another encounter.";
    } else if (reward.clearsZone) {
      routeCarryLine = "This reward finishes the current encounter package before the route board reopens.";
    }

    const deltaLines = [
      reward.clearsZone ? `${reward.zoneTitle} closes on this claim.` : `${reward.zoneTitle} stays active after this claim.`,
      isRouteReward
        ? "Route-side claims record consequence state without restarting combat."
        : "Combat claims still mutate deck, loadout, progression, and supplies before the route resumes.",
      resolutionLine,
    ];

    const routeCarryLines = [ledgerLines[0], routeCarryLine, `Active runewords riding the next combat: ${getPreviewLabel(activeRunewordNames, "none active yet")}.`];

    let accountPressureLabel = "Focused Tree";
    let accountPressureTone = accountSummary.focusedTreeId ? "cleared" : "locked";
    let accountPressureLines = [
      `Focused tree: ${accountSummary.focusedTreeTitle || "unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
      `Training ranks carried on this expedition: ${trainingRanks}.`,
      ...planningStageLines.slice(0, 1),
    ].filter(Boolean);

    if (review.availableConvergenceCount > 0) {
      accountPressureLabel = "Convergence Ready";
      accountPressureTone = "available";
      accountPressureLines = [
        `Ready convergence lane${review.availableConvergenceCount === 1 ? "" : "s"}: ${review.availableConvergenceCount}.`,
        `Next convergence: ${review.nextConvergenceTitle || "all current convergence lanes are online"}.`,
        ...planningStageLines.slice(0, 1),
      ].filter(Boolean);
    } else if (planning.plannedRunewordCount > 0) {
      accountPressureLabel = "Charters Live";
      accountPressureTone = "available";
      accountPressureLines = [
        `Planning stage: ${planningOverview.nextActionLabel || "Quiet"}.`,
        planningOverview.nextActionSummary || "No active runeword charter is pinned across the account.",
        ...planningStageLines.slice(0, 2),
      ].filter(Boolean);
    }

    let nextShellLabel = "World Map";
    let nextShellTone = "available";
    let nextShellCopy = "After this claim the shell moves to World Map.";
    let nextShellLines = [
      "The world map reopens with updated route state and the same expedition context.",
      `Current route ledger entries: ${totalLedgerEntries}.`,
      `Next map-side account pressure: ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
    ];

    if (reward.endsRun) {
      nextShellLabel = "Run-End Review";
      nextShellTone = "cleared";
      nextShellCopy = "After this claim the shell moves to Run-End Review.";
      nextShellLines = [
        "Run-end review turns expedition changes into archive delta and hall re-entry guidance.",
        `Archive-facing carry-through: ${accountSummary.focusedTreeTitle || "account focus unset"} -> ${accountSummary.nextMilestoneTitle || "all milestones cleared"}.`,
        `Current route ledger entries: ${totalLedgerEntries}.`,
      ];
    } else if (reward.endsAct) {
      nextShellLabel = "Act Transition";
      nextShellTone = "cleared";
      nextShellCopy = "After this claim the shell moves to Act Transition.";
      nextShellLines = [
        `The act-transition wrapper opens next and then sends the expedition to ${run.acts[run.currentActIndex + 1]?.town || "the final screen"}.`,
        "The next stop stays shell-owned: review the act delta, then enter town with the same loadout and account pressure.",
        `Current route ledger entries: ${totalLedgerEntries}.`,
      ];
    }

    return `
      <section class="panel flow-panel">
        <div class="panel-head">
          <h2>Continuity Delta Desk</h2>
          <p>The reward screen now carries the same continuity model as hall, town, and map: what changed, what pressure is still riding the expedition, and where the shell goes next after the claim.</p>
        </div>
        <div class="feature-grid feature-grid-wide">
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>${escapeHtml(deltaLabel)}</strong>
              ${buildBadge(reward.kind, reward.endsAct || reward.endsRun ? "cleared" : "available")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Zone", reward.zoneTitle)}
              ${buildStat("Gold", `+${reward.grants.gold}`)}
              ${buildStat("XP", `+${reward.grants.xp}`)}
              ${buildStat("Potions", `+${reward.grants.potions}`)}
            </div>
            ${buildStringList(deltaLines, "log-list reward-list reward-preview-list")}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Route Carry-Through</strong>
              ${buildBadge(`${totalLedgerEntries} logged`, totalLedgerEntries > 0 ? "available" : "locked")}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Ledger", totalLedgerEntries)}
              ${buildStat("Loadout", derivedParty.loadoutLines.length)}
              ${buildStat("Runewords", derivedParty.activeRunewords.length)}
              ${buildStat("Deck", run.deck.length)}
            </div>
            ${buildStringList(routeCarryLines, "log-list reward-list reward-preview-list")}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Account Pressure Carry-Through</strong>
              ${buildBadge(accountPressureLabel, accountPressureTone)}
            </div>
            <div class="entity-stat-grid">
              ${buildStat("Focus", accountSummary.focusedTreeTitle || "Unset")}
              ${buildStat("Next Milestone", accountSummary.nextMilestoneTitle || "Cleared")}
              ${buildStat("Ready Conv.", review.availableConvergenceCount)}
              ${buildStat("Charters", planning.plannedRunewordCount)}
            </div>
            ${buildStringList(accountPressureLines, "log-list reward-list reward-preview-list")}
          </article>
          <article class="feature-card">
            <div class="entity-name-row">
              <strong>Next Shell Handoff</strong>
              ${buildBadge(nextShellLabel, nextShellTone)}
            </div>
            <p>${escapeHtml(nextShellCopy)}</p>
            <div class="entity-stat-grid">
              ${buildStat("Next", nextShellLabel)}
              ${buildStat("Town", run.acts[run.currentActIndex + 1]?.town || run.safeZoneName)}
              ${buildStat("Encounter", reward.encounterNumber)}
              ${buildStat("Reward", reward.kind)}
            </div>
            ${buildStringList(nextShellLines, "log-list reward-list reward-preview-list")}
          </article>
        </div>
      </section>
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
    const lines = [];

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
          heroLifeDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(
            `Hero Life ${run.hero.currentLife}/${run.hero.maxLife} -> ${Math.min(run.hero.maxLife + heroLifeDelta, run.hero.currentLife + heroLifeDelta)}/${run.hero.maxLife + heroLifeDelta}.`
          );
          break;
        }
        case "hero_max_energy": {
          heroEnergyDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(`Hero Energy ${run.hero.maxEnergy} -> ${run.hero.maxEnergy + heroEnergyDelta}.`);
          break;
        }
        case "hero_potion_heal": {
          heroPotionDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(`Potion strength ${run.hero.potionHeal} -> ${run.hero.potionHeal + heroPotionDelta}.`);
          break;
        }
        case "mercenary_attack": {
          mercenaryAttackDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(`Mercenary attack ${run.mercenary.attack} -> ${run.mercenary.attack + mercenaryAttackDelta}.`);
          break;
        }
        case "mercenary_max_life": {
          mercenaryLifeDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(
            `Mercenary Life ${run.mercenary.currentLife}/${run.mercenary.maxLife} -> ${Math.min(run.mercenary.maxLife + mercenaryLifeDelta, run.mercenary.currentLife + mercenaryLifeDelta)}/${run.mercenary.maxLife + mercenaryLifeDelta}.`
          );
          break;
        }
        case "belt_capacity": {
          beltCapacityDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          const afterBeltMax = run.belt.max + beltCapacityDelta;
          const afterBeltCurrent = Math.min(afterBeltMax, run.belt.current + reward.grants.potions + refillDelta);
          lines.push(`Belt ${run.belt.current}/${run.belt.max} -> ${afterBeltCurrent}/${afterBeltMax}.`);
          break;
        }
        case "refill_potions": {
          refillDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          const afterBeltMax = run.belt.max + beltCapacityDelta;
          const afterBeltCurrent = Math.min(afterBeltMax, run.belt.current + reward.grants.potions + refillDelta);
          lines.push(`Belt charges ${run.belt.current}/${run.belt.max} -> ${afterBeltCurrent}/${afterBeltMax}.`);
          break;
        }
        case "gold_bonus": {
          goldBonus += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(`Gold ${run.gold} -> ${run.gold + reward.grants.gold + goldBonus}.`);
          break;
        }
        case "class_point": {
          classPointDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(`Class points ${run.progression.classPointsAvailable} -> ${run.progression.classPointsAvailable + classPointDelta}.`);
          break;
        }
        case "attribute_point": {
          attributePointDelta += Number.parseInt(String(effect.value || 0), 10) || 0;
          lines.push(`Attribute points ${run.progression.attributePointsAvailable} -> ${run.progression.attributePointsAvailable + attributePointDelta}.`);
          break;
        }
        case "equip_item": {
          const item = content.itemCatalog?.[effect.itemId || ""] || null;
          const slot = item?.slot || effect.slot || "weapon";
          const currentItem = run.loadout?.[slot]?.itemId ? content.itemCatalog?.[run.loadout[slot].itemId]?.name || run.loadout[slot].itemId : "Empty";
          lines.push(`${slot === "weapon" ? "Weapon" : "Armor"} ${currentItem} -> ${item?.name || effect.itemId || "Unknown item"}.`);
          break;
        }
        case "add_socket": {
          const slot = effect.slot || "weapon";
          const equipment = run.loadout?.[slot] || null;
          const currentSockets = equipment?.socketsUnlocked || 0;
          lines.push(`${slot === "weapon" ? "Weapon" : "Armor"} sockets ${currentSockets} -> ${currentSockets + 1}.`);
          break;
        }
        case "socket_rune": {
          const slot = effect.slot || "weapon";
          const runeLabel = content.runeCatalog?.[effect.runeId || ""]?.name || effect.runeId || "Unknown rune";
          const equipment = run.loadout?.[slot] || null;
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
      return [grantSummary, "No extra mutation beyond the shared grants on this reward."];
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

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildStat, buildStringList, buildBadge, buildChoiceList } = services.renderUtils;
    const run = appState.run;
    const reward = run.pendingReward;
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const trainingRanks = getTrainingRanks(run);
    const questOutcomeCount = Object.keys(run.world?.questOutcomes || {}).length;
    const rewardContext = getRewardContext(reward, run);
    const advanceGuideLines = getAdvanceGuideLines(reward);
    let buttonLabel = "Continue Journey";
    if (reward.endsRun) {
      buttonLabel = "Finish Run";
    } else if (reward.endsAct) {
      buttonLabel = "Travel To Next Act";
    }

    // Reward remains a read-and-choose surface; the actual mutation still happens when app-engine claims the choice.
    services.renderUtils.buildShell(root, {
      eyebrow: "Reward",
      title: reward.title,
      copy:
        "The reward screen is the mutation seam of the run. Every claim applies persistent changes before the shell hands control back to the map, the next act wrapper, or the run-end archive.",
      body: `
        ${common.renderRunStatus(run, "Reward", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="battle-grid">
          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Mutation Ledger</h2>
              <p>${escapeHtml(reward.zoneTitle)}</p>
            </div>
            ${buildStringList(reward.lines)}
            <div class="feature-grid feature-grid-wide reward-metadata-grid">
              <article class="feature-card">
                <div class="entity-name-row">
                  <strong>Reward Kind</strong>
                  ${buildBadge(reward.kind, "available")}
                </div>
                <p>${escapeHtml(`${buttonLabel} after the claim is applied.`)}</p>
              </article>
              <article class="feature-card">
                <strong>Grant Preview</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Gold", `+${reward.grants.gold}`)}
                  ${buildStat("XP", `+${reward.grants.xp}`)}
                  ${buildStat("Potions", `+${reward.grants.potions}`)}
                  ${buildStat("Encounter", reward.encounterNumber)}
                </div>
                <p>These grants land no matter which choice you pick.</p>
              </article>
              <article class="feature-card">
                <strong>Permanent Mutation</strong>
                <p>Choice effects can alter deck composition, party stats, equipment, socket state, runeword setup, or the world ledger before the route continues.</p>
              </article>
              <article class="feature-card">
                <strong>${escapeHtml(rewardContext.title)}</strong>
                ${buildStringList(rewardContext.lines, "log-list reward-list reward-preview-list")}
              </article>
              <article class="feature-card">
                <strong>Advance Guide</strong>
                ${buildStringList(advanceGuideLines, "log-list reward-list reward-preview-list")}
              </article>
            </div>
            ${buildRewardContinuityMarkup(appState, services, run, reward, derivedParty, trainingRanks)}
            ${common.buildAccountMetaContinuityMarkup(appState, services.appEngine.getAccountProgressSummary(appState), services.renderUtils, {
              copy:
                "Reward claims mutate the run, but the same account-meta board stays visible here so archive pressure, charter staging, mastery focus, and convergence readiness never disappear behind the mutation choice.",
            })}
            <div class="panel-head">
              <h2>Current Build</h2>
              <p>The loadout and active runewords shown here are already feeding the next combat override if the route continues.</p>
            </div>
            ${
              derivedParty.loadoutLines.length > 0
                ? buildStringList(derivedParty.loadoutLines, "log-list reward-list reward-preview-list")
                : '<p class="flow-copy">No equipped loadout lines are active yet.</p>'
            }
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Choose A Mutation</h2>
              <p>${escapeHtml(`${buttonLabel} only after selecting one choice. The preview badges call out the systems each option will change.`)}</p>
            </div>
            ${buildChoiceList(reward.choices)}
            <div class="panel-head panel-head-compact">
              <h3>Before And After</h3>
              <p>Every card below turns the live reward effects into explicit expedition deltas before you commit to one claim.</p>
            </div>
            ${buildChoiceDeltaMarkup(reward.choices, reward, run, appState.content, services.renderUtils)}
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Carry Forward</h2>
              <p>These expedition-facing values remain after the reward is applied. This is where reward readability ties back into town, map, and the next combat state.</p>
            </div>
            <div class="entity-row">
              <article class="entity-card ally">
                <div class="entity-name-row">
                  <strong class="entity-name">${escapeHtml(run.hero.name)}</strong>
                  <span class="entity-role">${escapeHtml(run.className)}</span>
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Life", `${run.hero.currentLife}/${run.hero.maxLife}`)}
                  ${buildStat("Energy", run.hero.maxEnergy)}
                  ${buildStat("Potion", run.hero.potionHeal)}
                  ${buildStat("Deck", run.deck.length)}
                </div>
              </article>
              <article class="entity-card ally">
                <div class="entity-name-row">
                  <strong class="entity-name">${escapeHtml(run.mercenary.name)}</strong>
                  <span class="entity-role">${escapeHtml(run.mercenary.role)}</span>
                </div>
                <div class="entity-stat-grid">
                  ${buildStat("Life", `${run.mercenary.currentLife}/${run.mercenary.maxLife}`)}
                  ${buildStat("Attack", run.mercenary.attack)}
                  ${buildStat("Belt", `${run.belt.current}/${run.belt.max}`)}
                  ${buildStat("Gold", run.gold)}
                </div>
              </article>
            </div>
            <div class="feature-grid feature-grid-wide reward-state-grid">
              <article class="feature-card">
                <strong>Progression State</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Skill Pts", run.progression.skillPointsAvailable)}
                  ${buildStat("Training", trainingRanks)}
                  ${buildStat("Trophies", run.progression.bossTrophies.length)}
                  ${buildStat("Runewords", derivedParty.activeRunewords.length)}
                </div>
                <p>These values stay on the expedition after the claim resolves.</p>
              </article>
              <article class="feature-card">
                <strong>Quest And Loadout Hooks</strong>
                <p>${escapeHtml(`${questOutcomeCount} resolved quest outcomes and ${derivedParty.loadoutLines.length} active loadout lines are already part of this run.`)}</p>
                ${buildStringList(
                  [
                    "Reward previews can add deck growth, equipment swaps, rune insertion, or world-ledger outcomes.",
                    "Shrine and special-event rewards land here without forcing a custom shell path.",
                  ],
                  "log-list reward-list reward-preview-list"
                )}
              </article>
            </div>
          </article>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_REWARD_VIEW = {
    render,
  };
})();
