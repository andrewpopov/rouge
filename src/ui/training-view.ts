(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const FAMILY_LABELS: Record<SkillFamilyId, string> = {
    state: "State",
    command: "Command",
    answer: "Answer",
    trigger_arming: "Trigger-Arming",
    conversion: "Conversion",
    recovery: "Recovery",
    commitment: "Commitment",
  };

  const STATE_LABELS: Record<TrainingSkillStateId, string> = {
    starter: "Starter",
    equipped: "Equipped",
    unlocked: "Learned",
    eligible: "Eligible",
    locked: "Locked",
  };

  function getSourceLabel(source: TrainingViewSource, phase: AppPhase) {
    if (source === "act_transition" || phase === "act_transition") {
      return "Act Transition Training";
    }
    return "Safe Zone Training";
  }

  function buildSlotMarkup(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    return model.slots.map((slot) => {
      return `
        <button
          class="training-slot ${slot.unlocked ? "training-slot--unlocked" : "training-slot--locked"} ${model.selectedSlot === slot.slotKey ? "training-slot--selected" : ""}"
          data-action="select-training-slot"
          data-slot-key="${escapeHtml(slot.slotKey)}"
        >
          <span class="training-slot__eyebrow">Slot ${slot.slotNumber}</span>
          <strong class="training-slot__title">${escapeHtml(slot.roleLabel)}</strong>
          <span class="training-slot__skill">${escapeHtml(slot.equippedSkillName || "Empty")}</span>
          <span class="training-slot__gate">${escapeHtml(slot.gateLabel)}</span>
        </button>
      `;
    }).join("");
  }

  function buildTreeMarkup(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    return model.trees.map((tree) => {
      return `
        <button
          class="training-tree-tab ${model.selectedTreeId === tree.treeId ? "training-tree-tab--selected" : ""}"
          data-action="select-training-tree"
          data-tree-id="${escapeHtml(tree.treeId)}"
        >
          <span class="training-tree-tab__title">${escapeHtml(tree.treeName)}</span>
          <span class="training-tree-tab__meta">Rank ${tree.rank}/${tree.maxRank}</span>
          <span class="training-tree-tab__meta">${tree.bridgeReady ? "Bridge ready" : "Bridge locked"} · ${tree.capstoneReady ? "Capstone ready" : "Capstone locked"}</span>
        </button>
      `;
    }).join("");
  }

  function buildSkillCard(model: TrainingScreenModel, skill: TrainingSkillViewModel, escapeHtml: (value: unknown) => string) {
    return `
      <button
        class="training-skill-card training-skill-card--${escapeHtml(skill.state)} ${model.selectedSkillId === skill.skillId ? "training-skill-card--selected" : ""}"
        data-action="select-training-skill"
        data-skill-id="${escapeHtml(skill.skillId)}"
      >
        <div class="training-skill-card__head">
          <div>
            <span class="training-skill-card__eyebrow">${escapeHtml(skill.treeName)}</span>
            <strong class="training-skill-card__title">${escapeHtml(skill.name)}</strong>
          </div>
          <span class="training-skill-card__badge">${escapeHtml(STATE_LABELS[skill.state])}</span>
        </div>
        <div class="training-skill-card__meta">
          <span>Slot ${skill.slot}</span>
          <span>${escapeHtml(FAMILY_LABELS[skill.family])}</span>
          <span>Lv ${skill.requiredLevel}</span>
          <span>CD ${skill.cooldown}</span>
        </div>
        <p class="training-skill-card__summary">${escapeHtml(skill.summary)}</p>
        <p class="training-skill-card__gate">${escapeHtml(skill.gateLabel)}</p>
      </button>
    `;
  }

  function buildSkillGrid(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    const selectedTree = model.trees.find((tree) => tree.treeId === model.selectedTreeId) || model.trees[0] || null;
    if (!selectedTree) {
      return `<div class="training-empty-state">No class trees are available for this run.</div>`;
    }

    return `
      <div class="training-skill-grid">
        ${selectedTree.skills.map((skill) => buildSkillCard(model, skill, escapeHtml)).join("")}
      </div>
    `;
  }

  function buildDetailActions(model: TrainingScreenModel, selectedSkill: TrainingSkillViewModel, escapeHtml: (value: unknown) => string) {
    const actions: string[] = [];
    if (selectedSkill.state === "eligible") {
      actions.push(`
        <button class="primary-btn" data-action="unlock-training-skill" data-skill-id="${escapeHtml(selectedSkill.skillId)}">
          Learn Skill
        </button>
      `);
    }

    if ((selectedSkill.state === "starter" || selectedSkill.state === "unlocked" || selectedSkill.state === "equipped") && model.selectedSlot) {
      let slotNumber: number;
      if (model.selectedSlot === "slot1") {
        slotNumber = 1;
      } else if (model.selectedSlot === "slot2") {
        slotNumber = 2;
      } else {
        slotNumber = 3;
      }
      if (selectedSkill.slot === slotNumber) {
        actions.push(`
          <button
            class="primary-btn"
            data-action="equip-training-skill"
            data-slot-key="${escapeHtml(model.selectedSlot)}"
            data-skill-id="${escapeHtml(selectedSkill.skillId)}"
          >
            Equip To Slot ${slotNumber}
          </button>
        `);
      }
    }

    if (model.compareSkillId === selectedSkill.skillId) {
      actions.push(`<button class="neutral-btn" data-action="clear-training-compare">Clear Compare</button>`);
    } else {
      actions.push(`
        <button class="neutral-btn" data-action="set-training-compare" data-skill-id="${escapeHtml(selectedSkill.skillId)}">
          Compare
        </button>
      `);
    }

    return actions.join("");
  }

  function buildDetailPanel(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    const selectedSkill = model.selectedSkill;
    if (!selectedSkill) {
      return `
        <aside class="training-detail">
          <div class="training-empty-state">Choose a skill to inspect its gates, text, and equip options.</div>
        </aside>
      `;
    }

    const compareBlock = model.compareSkill ? `
      <div class="training-compare">
        <span class="training-detail__eyebrow">Compare</span>
        <strong class="training-detail__compare-title">${escapeHtml(model.compareSkill.name)}</strong>
        <p class="training-detail__compare-copy">${escapeHtml(model.compareSkill.summary)}</p>
        <p class="training-detail__gate">${escapeHtml(model.compareSkill.gateLabel)}</p>
      </div>
    ` : "";

    return `
      <aside class="training-detail">
        <span class="training-detail__eyebrow">${escapeHtml(selectedSkill.treeName)} · Slot ${selectedSkill.slot}</span>
        <h3 class="training-detail__title">${escapeHtml(selectedSkill.name)}</h3>
        <div class="training-detail__meta">
          <span>${escapeHtml(FAMILY_LABELS[selectedSkill.family])}</span>
          <span>${escapeHtml(STATE_LABELS[selectedSkill.state])}</span>
          <span>Cost ${selectedSkill.cost}</span>
          <span>Cooldown ${selectedSkill.cooldown}</span>
          ${selectedSkill.oncePerBattle ? "<span>Once / Battle</span>" : ""}
          ${selectedSkill.chargeCount > 0 ? `<span>${selectedSkill.chargeCount} charges</span>` : ""}
        </div>
        <p class="training-detail__summary">${escapeHtml(selectedSkill.summary)}</p>
        <p class="training-detail__text">${escapeHtml(selectedSkill.exactText)}</p>
        <p class="training-detail__gate">${escapeHtml(selectedSkill.gateLabel)}</p>
        <div class="training-detail__actions">
          ${buildDetailActions(model, selectedSkill, escapeHtml)}
        </div>
        ${compareBlock}
      </aside>
    `;
  }

  function buildProgressionActions(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    return model.progressionActions.map((action) => {
      return `
        <button
          class="training-progression-action ${action.disabled ? "training-progression-action--disabled" : ""}"
          data-action="use-town-action"
          data-town-action-id="${escapeHtml(action.id)}"
          ${action.disabled ? "disabled" : ""}
        >
          <strong>${escapeHtml(action.title)}</strong>
          <span>${escapeHtml(action.subtitle || "Progression")}</span>
        </button>
      `;
    }).join("");
  }

  function buildTrainingOverlay(appState: AppState, services: UiRenderServices) {
    if (!appState.ui.trainingView.open) {
      return "";
    }

    const model = runtimeWindow.ROUGE_RUN_PROGRESSION.buildTrainingScreenModel(appState, appState.content);
    if (!model) {
      return "";
    }

    const { escapeHtml } = services.renderUtils;
    return `
      <div class="training-overlay" data-action="close-training-view">
        <div class="training-overlay__panel" data-action="noop">
          <div class="training-overlay__head">
            <div>
              <p class="eyebrow">${escapeHtml(getSourceLabel(appState.ui.trainingView.source, appState.phase))}</p>
              <h2 class="training-overlay__title">${escapeHtml(model.className)} Skill Training</h2>
              <p class="training-overlay__copy">Learn, compare, and equip class skills without leaving the current run state.</p>
            </div>
            <button class="neutral-btn" data-action="close-training-view" aria-label="Close Training">Close</button>
          </div>

          <div class="training-slot-rail">
            ${buildSlotMarkup(model, escapeHtml)}
          </div>

          <div class="training-overlay__body">
            <aside class="training-tree-rail">
              <div class="training-tree-rail__head">
                <span class="training-tree-rail__eyebrow">Skill Trees</span>
                <strong>Level ${model.level} · Favored ${escapeHtml(model.favoredTreeId || "None")}</strong>
              </div>
              ${buildTreeMarkup(model, escapeHtml)}
            </aside>

            <section class="training-main">
              <div class="training-main__head">
                <div>
                  <span class="training-main__eyebrow">Tree Skills</span>
                  <strong>${escapeHtml(model.trees.find((tree) => tree.treeId === model.selectedTreeId)?.treeName || "")}</strong>
                </div>
                <div class="training-main__mode-row">
                  <button class="neutral-btn" data-action="set-training-mode" data-training-mode="browse">Browse</button>
                  <button class="neutral-btn" data-action="set-training-mode" data-training-mode="unlock">Unlock</button>
                  <button class="neutral-btn" data-action="set-training-mode" data-training-mode="equip">Equip</button>
                </div>
              </div>
              ${buildSkillGrid(model, escapeHtml)}
              <div class="training-progression">
                <div class="training-progression__head">
                  <span class="training-main__eyebrow">Run Progression</span>
                  <strong>Spend training and class points here</strong>
                </div>
                <div class="training-progression__grid">
                  ${buildProgressionActions(model, escapeHtml)}
                </div>
              </div>
            </section>

            ${buildDetailPanel(model, escapeHtml)}
          </div>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_TRAINING_VIEW = {
    buildTrainingOverlay,
  };
})();
