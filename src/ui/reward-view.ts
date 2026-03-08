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
