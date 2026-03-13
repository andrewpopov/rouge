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
        "Apply the reward.",
        "Move directly into the run-end review.",
      ];
    }

    if (reward.endsAct) {
      return [
        "Choose one reward effect.",
        "Apply the reward.",
        "Move into the act transition wrapper and then the next town.",
      ];
    }

    return [
      "Choose one reward effect.",
      "Apply the reward immediately to the current expedition.",
      "Return to the world map or next route state after the claim resolves.",
    ];
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

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const continuity = runtimeWindow.__ROUGE_REWARD_VIEW_CONTINUITY;
    const { escapeHtml, buildStat, buildStringList, buildBadge, buildChoiceList } = services.renderUtils;
    const run = appState.run;
    const reward = run.pendingReward;
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
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
            <span class="reward-grant">\u{1F4B0} +${reward.grants.gold}</span>
            <span class="reward-grant">\u2B50 +${reward.grants.xp} XP</span>
            <span class="reward-grant">\u{1F9EA} +${reward.grants.potions}</span>
            <span class="reward-grant">\u2764 ${run.hero.currentLife}/${run.hero.maxLife}</span>
          </div>

          <h2 class="reward-popup__choose-label">Choose Your Reward</h2>

          <div class="reward-popup__choices">
            ${reward.choices.map((choice) => {
              const icons = getEffectIcons(choice);
              return `
                <button class="reward-choice-card" data-action="claim-reward-choice" data-choice-id="${escapeHtml(choice.id)}">
                  <div class="reward-choice-card__icons">${icons.join(" ")}</div>
                  <div class="reward-choice-card__name">${escapeHtml(choice.title)}</div>
                  <div class="reward-choice-card__sub">${escapeHtml(choice.subtitle)}</div>
                  <div class="reward-choice-card__desc">${escapeHtml(choice.description)}</div>
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
                <h2>Reward Ledger</h2>
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
                  <strong>Permanent Effect</strong>
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
              ${continuity.buildRewardContinuityMarkup(appState, services, run, reward, derivedParty, trainingRanks)}
              ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
                copy:
                  "Reward claims change the run, but the same account-meta board stays visible here so archive pressure, charter staging, mastery focus, and convergence readiness never disappear behind the reward choice.",
              })}
              ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
                copy:
                  "The reward surface now keeps pinned charter slots and the next convergence lane explicit before you commit to a choice that hands the run back to map, transition, or archive review.",
                charterFollowThrough:
                  "If the claim does not solve the pinned charter pressure, use the next shell handoff to route back toward town or the hall with that slot target still in mind.",
                convergenceFollowThrough:
                  "If convergence pressure is waiting behind this claim, use the next shell handoff to decide whether the account-side lane matters more than another route push.",
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
                <h2>Choose Your Reward</h2>
                <p>${escapeHtml(`${buttonLabel} only after selecting one choice. The preview badges call out the systems each option will change.`)}</p>
              </div>
              ${buildChoiceList(reward.choices)}
              <div class="panel-head panel-head-compact">
                <h3>Before And After</h3>
                <p>Every card below turns the live reward effects into explicit expedition deltas before you commit to one claim.</p>
              </div>
              ${continuity.buildChoiceDeltaMarkup(reward.choices, reward, run, appState.content, services.renderUtils)}
            </article>

            <article class="panel battle-panel">
              <div class="panel-head">
                <h2>Carry Forward State</h2>
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
        </div>
      </details>
    `;
  }

  runtimeWindow.ROUGE_REWARD_VIEW = {
    render,
  };
})();
