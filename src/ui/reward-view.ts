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
          "This choice writes a quest outcome into the run ledger.",
          "Quest rewards clear the node immediately and can unlock an aftermath node later in the act.",
          "No combat restarts after you choose an outcome here.",
        ],
      };
    }

    if (reward.kind === "shrine") {
      return {
        title: "Shrine Blessing",
        lines: [
          "This choice applies a persistent blessing to the current run.",
          "Shrine rewards resolve immediately through the shared reward surface.",
          "No combat restarts after the blessing is chosen.",
        ],
      };
    }

    if (reward.kind === "event") {
      return {
        title: "Aftermath Follow-Up",
        lines: [
          linkedQuestRecord
            ? `Triggered by ${linkedQuestRecord.title}: ${linkedQuestRecord.outcomeTitle}.`
            : "Triggered by an earlier quest outcome on the same act route.",
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
          "Opportunity rewards still resolve immediately through the shared reward surface.",
        ],
      };
    }

    return {
      title: "Combat Reward",
      lines: [
        reward.clearsZone
          ? "This choice clears the current area before the route resumes."
          : "This area still has more encounters after the reward resolves.",
        "Combat rewards can mutate deck, loadout, progression, or run inventory state.",
        "Choose one reward, then continue the route from the world map.",
      ],
    };
  }

  function getAdvanceGuideLines(reward: RunReward): string[] {
    if (reward.endsRun) {
      return [
        "Choose one reward effect.",
        "Finish the run summary after the permanent mutation is applied.",
      ];
    }

    if (reward.endsAct) {
      return [
        "Choose one reward effect.",
        "Advance into the next act wrapper after the mutation is applied.",
      ];
    }

    return [
      "Choose one reward effect.",
      "The reward mutates the current run immediately.",
      "Return to the world map or next route state after the choice resolves.",
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

    services.renderUtils.buildShell(root, {
      eyebrow: "Reward",
      title: reward.title,
      copy:
        "The reward phase is the seam between one encounter and the next. It applies run-state changes before the loop returns to the world map.",
      body: `
        ${common.renderRunStatus(run, "Reward", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="battle-grid">
          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Reward Summary</h2>
              <p>${escapeHtml(reward.zoneTitle)}</p>
            </div>
            ${buildStringList(reward.lines)}
            <div class="feature-grid reward-metadata-grid">
              <article class="feature-card">
                <div class="entity-name-row">
                  <strong>Reward Kind</strong>
                  ${buildBadge(reward.kind, "available")}
                </div>
                <p>${escapeHtml(buttonLabel)} after choosing a reward.</p>
              </article>
              <article class="feature-card">
                <strong>Grant Preview</strong>
                <p>${escapeHtml(`+${reward.grants.gold} gold, +${reward.grants.xp} XP, +${reward.grants.potions} potions.`)}</p>
              </article>
              <article class="feature-card">
                <strong>Permanent Run Mutation</strong>
                <p>Choice effects mutate deck, loadout, progression, or quest ledger state before the route resumes.</p>
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
              <h2>Current Loadout</h2>
              <p>Equipped gear and runes already feed the next combat state.</p>
            </div>
            ${buildStringList(derivedParty.loadoutLines)}
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Choose One Reward</h2>
              <p>${escapeHtml(`${buttonLabel} after selecting a reward. Preview badges call out the permanent mutation seam for each option.`)}</p>
            </div>
            ${buildChoiceList(reward.choices)}
          </article>

          <article class="panel battle-panel">
            <div class="panel-head">
              <h2>Party State</h2>
              <p>These values persist into the next encounter after your reward choice is applied.</p>
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
            <div class="feature-grid reward-state-grid">
              <article class="feature-card">
                <strong>Progression State</strong>
                <div class="entity-stat-grid">
                  ${buildStat("Skill Pts", run.progression.skillPointsAvailable)}
                  ${buildStat("Training", trainingRanks)}
                  ${buildStat("Trophies", run.progression.bossTrophies.length)}
                  ${buildStat("Runewords", derivedParty.activeRunewords.length)}
                </div>
                <p>These run-facing values persist through the next node after your reward choice resolves.</p>
              </article>
              <article class="feature-card">
                <strong>Quest And Loadout Hooks</strong>
                <p>${escapeHtml(`${questOutcomeCount} resolved quest outcomes and ${derivedParty.loadoutLines.length} loadout lines are already active on this run.`)}</p>
                ${buildStringList(
                  [
                    "Reward previews can add deck growth, equipment swaps, rune insertion, or quest outcomes.",
                    "Shrine and special-event rewards can plug into this surface without changing the phase model.",
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
