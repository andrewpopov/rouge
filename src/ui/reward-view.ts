(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  const { getTrainingRankCount } = runtimeWindow.ROUGE_RUN_STATE;

  function getRewardContext(reward: RunReward, run: RunState) {
    const catalog = runtimeWindow.ROUGE_WORLD_NODES?.getCatalog?.() || null;
    const eventDefinition = catalog?.events?.[run.actNumber] || null;
    const linkedQuestRecord = eventDefinition?.requiresQuestId ? run.world?.questOutcomes?.[eventDefinition.requiresQuestId] || null : null;

    if (reward.kind === ZONE_KIND.QUEST) {
      return {
        title: "Quest Resolution",
        lines: [
          "This claim writes a quest outcome into the run ledger.",
          "Quest rewards clear the node immediately and can unlock aftermath content later in the act.",
          "No combat restarts after you choose here.",
        ],
      };
    }

    if (reward.kind === ZONE_KIND.SHRINE) {
      return {
        title: "Shrine Blessing",
        lines: [
          "This claim applies a persistent blessing to the current expedition.",
          "Shrines resolve immediately through the shared reward surface.",
          "No combat restarts after the blessing is taken.",
        ],
      };
    }

    if (reward.kind === ZONE_KIND.EVENT) {
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

    if (reward.kind === ZONE_KIND.OPPORTUNITY) {
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

  const EFFECT_ICON_MAP: Record<string, string> = {
    add_card: "\u{1F0CF}",
    upgrade_card: "\u2B06",
    hero_max_life: "\u2764",
    hero_max_energy: "\u26A1",
    hero_potion_heal: "\u{1F9EA}",
    mercenary_attack: "\u2694",
    mercenary_max_life: "\u{1F6E1}",
    belt_capacity: "\u{1F392}",
    refill_potions: "\u{1F9EA}",
    gold_bonus: "\u{1F4B0}",
    equip_item: "\u{1F5E1}",
    add_socket: "\u{1F4A0}",
    socket_rune: "\u{1F48E}",
    class_point: "\u2B50",
    attribute_point: "\u{1F4CA}",
    record_quest_outcome: "\u{1F4DC}",
    record_quest_follow_up: "\u{1F4DC}",
    record_quest_consequence: "\u{1F4DC}",
    record_node_outcome: "\u{1F4DC}",
  };

  function getEffectIcons(choice: RewardChoice): string[] {
    const seen = new Set<string>();
    const icons: string[] = [];
    for (const effect of choice.effects) {
      const icon = EFFECT_ICON_MAP[effect.kind] || "";
      if (icon && !seen.has(icon)) {
        seen.add(icon);
        icons.push(icon);
      }
    }
    return icons;
  }

  function getCompactDeltaLines(choice: RewardChoice, run: RunState, content: GameContent): string[] {
    const lines: string[] = [];
    for (const effect of choice.effects) {
      switch (effect.kind) {
        case "add_card": {
          const cardTitle = content.cardCatalog?.[effect.cardId || ""]?.title || effect.cardId || "?";
          lines.push(`+1 Card: ${cardTitle}`);
          break;
        }
        case "upgrade_card": {
          const toCard = content.cardCatalog?.[effect.toCardId || ""]?.title || "Upgraded";
          lines.push(`\u2B06 ${toCard}`);
          break;
        }
        case "hero_max_life":
          lines.push(`Life ${run.hero.maxLife} \u2192 ${run.hero.maxLife + (effect.value || 0)}`);
          break;
        case "hero_max_energy":
          lines.push(`Energy ${run.hero.maxEnergy} \u2192 ${run.hero.maxEnergy + (effect.value || 0)}`);
          break;
        case "hero_potion_heal":
          lines.push(`Potion ${run.hero.potionHeal} \u2192 ${run.hero.potionHeal + (effect.value || 0)}`);
          break;
        case "mercenary_attack":
          lines.push(`Merc Atk ${run.mercenary.attack} \u2192 ${run.mercenary.attack + (effect.value || 0)}`);
          break;
        case "mercenary_max_life":
          lines.push(`Merc Life ${run.mercenary.maxLife} \u2192 ${run.mercenary.maxLife + (effect.value || 0)}`);
          break;
        case "belt_capacity":
          lines.push(`Belt ${run.belt.max} \u2192 ${run.belt.max + (effect.value || 0)}`);
          break;
        case "refill_potions":
          lines.push(`+${effect.value || 0} Belt charges`);
          break;
        case "gold_bonus":
          lines.push(`+${effect.value || 0} Bonus Gold`);
          break;
        case "equip_item": {
          const item = content.itemCatalog?.[effect.itemId || ""];
          lines.push(`Equip: ${item?.name || "Item"}`);
          break;
        }
        case "add_socket":
          lines.push(`+1 Socket (${effect.slot || "weapon"})`);
          break;
        case "socket_rune": {
          const rune = content.runeCatalog?.[effect.runeId || ""];
          lines.push(`Insert: ${rune?.name || "Rune"}`);
          break;
        }
        case "class_point":
          lines.push(`+${effect.value || 1} Class Point`);
          break;
        case "attribute_point":
          lines.push(`+${effect.value || 1} Attribute Point`);
          break;
        case "record_quest_outcome":
        case "record_quest_follow_up":
        case "record_quest_consequence":
        case "record_node_outcome":
          lines.push(`\u{1F4DC} ${effect.outcomeTitle || "Ledger entry"}`);
          break;
        default:
          break;
      }
    }
    return lines;
  }

  function getCategoryTag(choice: RewardChoice): string {
    const kinds = new Set(choice.effects.map((e) => e.kind));
    if (kinds.has("add_card") || kinds.has("upgrade_card")) {
      return "DECK";
    }
    if (kinds.has("equip_item") || kinds.has("add_socket") || kinds.has("socket_rune")) {
      return "GEAR";
    }
    if (kinds.has("class_point") || kinds.has("attribute_point")) {
      return "PROGRESSION";
    }
    if (kinds.has("hero_max_life") || kinds.has("hero_max_energy") || kinds.has("mercenary_attack") || kinds.has("mercenary_max_life")) {
      return "STATS";
    }
    if (kinds.has("hero_potion_heal") || kinds.has("belt_capacity") || kinds.has("refill_potions")) {
      return "SUPPLY";
    }
    if (kinds.has("gold_bonus")) {
      return "GOLD";
    }
    if (kinds.has("record_quest_outcome") || kinds.has("record_quest_follow_up") || kinds.has("record_quest_consequence") || kinds.has("record_node_outcome")) {
      return "QUEST";
    }
    return "REWARD";
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const continuity = runtimeWindow.__ROUGE_REWARD_VIEW_CONTINUITY;
    const { escapeHtml, buildStat, buildStringList } = services.renderUtils;
    const run = appState.run;
    const reward = run.pendingReward;
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const trainingRanks = getTrainingRankCount(run.progression?.training);
    const rewardContext = getRewardContext(reward, run);
    let buttonLabel = "Continue Journey";
    if (reward.endsRun) {
      buttonLabel = "Finish Run";
    } else if (reward.endsAct) {
      buttonLabel = "Travel To Next Act";
    }

    const REWARD_KIND_ICONS: Record<string, string> = {
      quest: "\u{1F4DC}",
      shrine: "\u2728",
      event: "\u26A0",
      opportunity: "\u2726",
    };
    const kindIcon = REWARD_KIND_ICONS[reward.kind] || "\u2694";

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="reward-overlay">
        <div class="reward-popup" data-action="noop">
          <div class="reward-popup__header">
            <span class="reward-popup__icon">${kindIcon}</span>
            <div class="reward-popup__titles">
              <h1 class="reward-popup__title">${escapeHtml(reward.title)}</h1>
              <span class="reward-popup__sub">${escapeHtml(reward.zoneTitle)} \u00b7 ${escapeHtml(rewardContext.title)}</span>
            </div>
          </div>

          <div class="reward-popup__grants">
            <span class="reward-grant reward-grant--gold">\u{1F4B0} +${reward.grants.gold}</span>
            <span class="reward-grant reward-grant--xp">\u2B50 +${reward.grants.xp} XP</span>
            <span class="reward-grant reward-grant--potions">\u{1F9EA} +${reward.grants.potions}</span>
            <span class="reward-grant reward-grant--life">\u2764 ${run.hero.currentLife}/${run.hero.maxLife}</span>
          </div>

          <h2 class="reward-popup__choose-label">Choose Your Reward</h2>

          <div class="reward-popup__choices">
            ${reward.choices.map((choice) => {
              const icons = getEffectIcons(choice);
              const { RARITY } = runtimeWindow.ROUGE_ITEM_CATALOG;
              const choiceRarity = choice.effects?.find((e) => e.rarity)?.rarity || RARITY.WHITE;
              const RARITY_CLASS_MAP: Record<string, string> = { [RARITY.UNIQUE]: "reward-choice-card--unique", [RARITY.MAGIC]: "reward-choice-card--magic" };
              const rarityClass = RARITY_CLASS_MAP[choiceRarity] || "";
              const category = getCategoryTag(choice);
              const deltaLines = getCompactDeltaLines(choice, run, appState.content);
              return `
                <button class="reward-choice-card ${rarityClass}" data-action="claim-reward-choice" data-choice-id="${escapeHtml(choice.id)}">
                  <div class="reward-choice-card__top">
                    <span class="reward-choice-card__category">${category}</span>
                    <span class="reward-choice-card__icons">${icons.join(" ")}</span>
                  </div>
                  <div class="reward-choice-card__name">${escapeHtml(choice.title)}</div>
                  <div class="reward-choice-card__sub">${escapeHtml(choice.subtitle)}</div>
                  <div class="reward-choice-card__desc">${escapeHtml(choice.description)}</div>
                  ${deltaLines.length > 0 ? `<div class="reward-choice-card__deltas">${deltaLines.map((l) => `<span class="reward-choice-card__delta">${escapeHtml(l)}</span>`).join("")}</div>` : ""}
                </button>
              `;
            }).join("")}
          </div>
        </div>
      </div>

      <details class="town-operations-details">
        <summary class="town-operations-toggle">Reward Details</summary>
        <div style="padding: 12px 16px;">
          ${common.renderRunStatus(run, "Reward", services.renderUtils)}
          <section class="battle-grid">
            <article class="panel battle-panel">
              <div class="panel-head">
                <h2>Before &amp; After</h2>
                <p>How each choice changes the expedition.</p>
              </div>
              ${continuity.buildChoiceDeltaMarkup(reward.choices, reward, run, appState.content, services.renderUtils)}
            </article>

            <article class="panel battle-panel">
              <div class="panel-head">
                <h2>Party State</h2>
                <p>Current expedition values before the reward is applied.</p>
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
                  <strong>Progression</strong>
                  <div class="entity-stat-grid">
                    ${buildStat("Skill Pts", run.progression.skillPointsAvailable)}
                    ${buildStat("Training", trainingRanks)}
                    ${buildStat("Trophies", run.progression.bossTrophies.length)}
                    ${buildStat("Runewords", derivedParty.activeRunewords.length)}
                  </div>
                </article>
                <article class="feature-card">
                  <strong>Loadout</strong>
                  ${
                    derivedParty.loadoutLines.length > 0
                      ? buildStringList(derivedParty.loadoutLines, "log-list reward-list reward-preview-list")
                      : '<p class="flow-copy">No equipped loadout lines active.</p>'
                  }
                </article>
              </div>
            </article>

            <article class="panel battle-panel">
              <div class="panel-head">
                <h2>After Claim</h2>
                <p>${escapeHtml(buttonLabel)} \u2014 ${escapeHtml(reward.clearsZone ? `${reward.zoneTitle} clears` : `${reward.zoneTitle} continues`)}</p>
              </div>
              ${continuity.buildRewardContinuityMarkup(appState, services, run, reward, derivedParty, trainingRanks)}
              ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
                copy: "Account-level pressure and convergence state for this expedition.",
              })}
              ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
                copy: "Charter and convergence drilldowns for the current expedition.",
              })}
            </article>
          </section>
        </div>
      </details>
    `;
  }

  runtimeWindow.ROUGE_REWARD_VIEW = {
    render,
  };
})();
