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
    unlocked: "Unlocked",
    eligible: "Ready",
    locked: "Locked",
  };

  const TIER_LABELS: Record<ClassSkillTier, string> = {
    starter: "Starter",
    bridge: "Bridge",
    capstone: "Capstone",
  };

  function getSourceLabel(source: TrainingViewSource, phase: AppPhase) {
    if (source === "act_transition" || phase === "act_transition") {
      return "Act Transition Training";
    }
    return "Safe Zone Training";
  }

  function getSkillStatusLabel(model: TrainingScreenModel, skill: TrainingSkillViewModel) {
    if (skill.state === "unlocked" && skill.slot > 1 && model.slots.some((slot) => slot.slotNumber === skill.slot && slot.unlocked)) {
      return "Can Equip";
    }
    return STATE_LABELS[skill.state];
  }

  function buildSkillCardImpactLabel(model: TrainingScreenModel, skill: TrainingSkillViewModel) {
    if (skill.slot === 1) {
      return "Starter slot is fixed for this run.";
    }
    const targetSlot = model.slots.find((slot) => slot.slotNumber === skill.slot) || null;
    if (!targetSlot?.unlocked) {
      return `Targets Slot ${skill.slot}. ${targetSlot?.gateLabel || "Slot is still locked."}`;
    }
    if (!targetSlot.equippedSkillId) {
      return `Would fill empty Slot ${skill.slot}.`;
    }
    if (targetSlot.equippedSkillId === skill.skillId) {
      return `Currently equipped in Slot ${skill.slot}.`;
    }
    return `Would replace ${targetSlot.equippedSkillName} in Slot ${skill.slot}.`;
  }

  function buildHeaderSummary(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    return `
      <div class="training-summary">
        <div class="training-summary__headline">
          <div class="training-summary__copy">
            <span class="training-summary__eyebrow">Current Build Summary</span>
            <strong>${escapeHtml(model.className)} · Level ${model.level}</strong>
            <span>Favored tree: ${escapeHtml(model.favoredTreeId || "None")}</span>
          </div>
          <div class="training-summary__chips">
            <span class="training-summary__chip">${model.skillPointsAvailable} Skill</span>
            <span class="training-summary__chip">${model.classPointsAvailable} Class</span>
            <span class="training-summary__chip">${model.attributePointsAvailable} Attribute</span>
            <span class="training-summary__chip">${escapeHtml(model.slotStateLabel)} Slots</span>
          </div>
        </div>
        <p class="training-summary__gate">${escapeHtml(model.nextSlotGateLabel)}</p>
      </div>
    `;
  }

  function buildSlotMarkup(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    return model.slots.map((slot) => {
      const familyLabel = slot.family ? FAMILY_LABELS[slot.family] : "";
      const detailLine = slot.equippedSkillName
        ? `
          <div class="training-slot__meta">
            <span>${escapeHtml(familyLabel)}</span>
            <span>Cost ${slot.cost}</span>
            <span>CD ${slot.cooldown}</span>
          </div>
          <p class="training-slot__summary">${escapeHtml(slot.shortRuleText)}</p>
        `
        : `<p class="training-slot__summary">${escapeHtml(slot.shortRuleText)}</p>`;
      return `
        <button
          class="training-slot ${slot.unlocked ? "training-slot--unlocked" : "training-slot--locked"} ${model.selectedSlot === slot.slotKey ? "training-slot--selected" : ""}"
          data-action="select-training-slot"
          data-slot-key="${escapeHtml(slot.slotKey)}"
        >
          <div class="training-slot__head">
            <div>
              <span class="training-slot__eyebrow">Slot ${slot.slotNumber}</span>
              <strong class="training-slot__title">${escapeHtml(slot.roleLabel)}</strong>
            </div>
            <span class="training-slot__badge">${escapeHtml(slot.statusLabel)}</span>
          </div>
          <span class="training-slot__skill">${escapeHtml(slot.equippedSkillName || "Empty")}</span>
          ${detailLine}
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
          <div class="training-tree-tab__badge-row">
            ${tree.commitmentBadgeLabels.map((badge) => `<span class="training-tree-tab__badge">${escapeHtml(badge)}</span>`).join("")}
          </div>
          <span class="training-tree-tab__meta">${escapeHtml(tree.nextMilestoneLabel)}</span>
        </button>
      `;
    }).join("");
  }

  function buildSkillCard(model: TrainingScreenModel, skill: TrainingSkillViewModel, escapeHtml: (value: unknown) => string) {
    const impactLabel = buildSkillCardImpactLabel(model, skill);
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
          <span class="training-skill-card__badge">${escapeHtml(getSkillStatusLabel(model, skill))}</span>
        </div>
        <div class="training-skill-card__meta">
          <span>${escapeHtml(TIER_LABELS[skill.tier])}</span>
          <span>Slot ${skill.slot}</span>
          <span>${escapeHtml(FAMILY_LABELS[skill.family])}</span>
          <span>Lv ${skill.requiredLevel}</span>
          <span>CD ${skill.cooldown}</span>
        </div>
        <p class="training-skill-card__summary">${escapeHtml(skill.summary)}</p>
        <p class="training-skill-card__impact">${escapeHtml(impactLabel)}</p>
        <p class="training-skill-card__gate">${escapeHtml(skill.gateLabel)}</p>
      </button>
    `;
  }

  function buildSkillGrid(model: TrainingScreenModel, escapeHtml: (value: unknown) => string) {
    const selectedTree = model.trees.find((tree) => tree.treeId === model.selectedTreeId) || model.trees[0] || null;
    if (!selectedTree) {
      return `<div class="training-empty-state">No class trees are available for this run.</div>`;
    }

    let selectedSlotNumber = 0;
    if (model.selectedSlot === "slot1") { selectedSlotNumber = 1; }
    else if (model.selectedSlot === "slot2") { selectedSlotNumber = 2; }
    else if (model.selectedSlot === "slot3") { selectedSlotNumber = 3; }
    const selectedSlotModel = model.selectedSlot
      ? model.slots.find((slot) => slot.slotKey === model.selectedSlot) || null
      : null;
    const filteredSkills = selectedTree.skills.filter((skill) => {
      if (model.mode === "unlock") {
        return skill.slot === 1 || skill.state === "eligible" || skill.state === "locked";
      }
      if (model.mode === "equip") {
        if (!(skill.state === "starter" || skill.state === "unlocked" || skill.state === "equipped")) {
          return false;
        }
        return selectedSlotNumber === 0 || skill.slot === selectedSlotNumber;
      }
      if (model.mode === "swap") {
        if (!selectedSlotModel?.equippedSkillId) {
          return false;
        }
        if (!(skill.state === "unlocked" || skill.state === "equipped")) {
          return false;
        }
        return selectedSlotNumber === 0 || skill.slot === selectedSlotNumber;
      }
      return true;
    });

    const groups: Array<{ tier: ClassSkillTier; skills: TrainingSkillViewModel[] }> = [
      { tier: "starter" as const, skills: filteredSkills.filter((skill) => skill.tier === "starter") },
      { tier: "bridge" as const, skills: filteredSkills.filter((skill) => skill.tier === "bridge") },
      { tier: "capstone" as const, skills: filteredSkills.filter((skill) => skill.tier === "capstone") },
    ].filter((group) => group.skills.length > 0);

    if (groups.length === 0) {
      let message = "No skills are available for the current training filter.";
      if (model.mode === "swap") {
        message = "Select an occupied Slot 2 or Slot 3 to review swap candidates for this tree.";
      } else if (model.mode === "equip") {
        message = "No learned skills in this tree match the current slot focus yet.";
      } else if (model.mode === "unlock") {
        message = "No unlock candidates are available in this tree right now.";
      }
      return `<div class="training-empty-state">${escapeHtml(message)}</div>`;
    }

    return `
      <div class="training-skill-groups">
        ${groups.map((group) => `
          <section class="training-skill-group">
            <div class="training-skill-group__head">
              <span class="training-main__eyebrow">Unlock Candidates</span>
              <strong>${escapeHtml(TIER_LABELS[group.tier])}</strong>
            </div>
            <div class="training-skill-grid">
              ${group.skills.map((skill) => buildSkillCard(model, skill, escapeHtml)).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

  function getFlattenedSkills(model: TrainingScreenModel) {
    return model.trees.flatMap((tree) => tree.skills);
  }

  function getEquippedSkillForSlot(model: TrainingScreenModel, slotNumber: ClassSkillSlotNumber) {
    const flattenedSkills = getFlattenedSkills(model);
    const slotModel = model.slots.find((slot) => slot.slotNumber === slotNumber) || null;
    if (!slotModel?.equippedSkillId) {
      return null;
    }
    return flattenedSkills.find((skill) => skill.skillId === slotModel.equippedSkillId) || null;
  }

  function buildWhyThisExists(skill: TrainingSkillViewModel) {
    if (skill.family === "state") {
      return `This establishes a ${skill.treeName} baseline before your deck takes over the fight.`;
    }
    if (skill.family === "command") {
      return `This lets the bar coordinate your allies so your cards can spend turns on payoff instead of setup.`;
    }
    if (skill.family === "answer") {
      return `This gives ${skill.treeName} a reliable tactical answer even when the right card is not in hand.`;
    }
    if (skill.family === "trigger_arming") {
      return `This primes a timing window so the next card can convert setup into real payoff.`;
    }
    if (skill.family === "conversion") {
      return `This turns one kind of advantage into another so the build can pivot mid-fight.`;
    }
    if (skill.family === "recovery") {
      return `This stabilizes the run when the board, hero, or mercenary falls behind.`;
    }
    return `This is a commitment skill that signals how ${skill.treeName} intends to close fights.`;
  }

  function buildComparedToEquippedNote(model: TrainingScreenModel, skill: TrainingSkillViewModel) {
    if (skill.slot === 1) {
      return "Slot 1 is fixed to the starter skill for this run.";
    }
    const currentEquipped = getEquippedSkillForSlot(model, skill.slot);
    if (!currentEquipped) {
      return `Equipping ${skill.name} would fill Slot ${skill.slot} with a ${FAMILY_LABELS[skill.family].toLowerCase()} tool.`;
    }
    if (currentEquipped.skillId === skill.skillId) {
      return `${skill.name} is already equipped in Slot ${skill.slot}.`;
    }
    return `Swapping from ${currentEquipped.name} to ${skill.name} gives up "${currentEquipped.summary}" and shifts Slot ${skill.slot} toward ${FAMILY_LABELS[skill.family].toLowerCase()} play.`;
  }

  function buildDetailActions(model: TrainingScreenModel, selectedSkill: TrainingSkillViewModel, escapeHtml: (value: unknown) => string) {
    const actions: string[] = [];
    if (selectedSkill.state === "eligible" && selectedSkill.slot !== 1) {
      actions.push(`
        <button class="primary-btn" data-action="unlock-training-skill" data-skill-id="${escapeHtml(selectedSkill.skillId)}">
          Learn Skill
        </button>
      `);
    }

    let targetSlotKey: RunSkillBarSlotKey = "slot3";
    if (selectedSkill.slot === 1) { targetSlotKey = "slot1"; }
    else if (selectedSkill.slot === 2) { targetSlotKey = "slot2"; }
    const targetSlot = model.slots.find((slot) => slot.slotNumber === selectedSkill.slot) || null;
    const alreadyEquipped = targetSlot?.equippedSkillId === selectedSkill.skillId;
    if ((selectedSkill.state === "unlocked" || selectedSkill.state === "equipped") && selectedSkill.slot !== 1 && targetSlot?.unlocked && !alreadyEquipped) {
      const swapMode = Boolean(targetSlot?.equippedSkillId) && model.mode === "swap";
      const actionName = swapMode ? "swap-training-skill" : "equip-training-skill";
      let actionLabel = `Equip To Slot ${selectedSkill.slot}`;
      if (targetSlot?.equippedSkillId) {
        actionLabel = swapMode ? `Swap Into Slot ${selectedSkill.slot}` : `Replace Slot ${selectedSkill.slot}`;
      }
        actions.push(`
          <button
            class="primary-btn"
            data-action="${actionName}"
            data-slot-key="${escapeHtml(targetSlotKey)}"
            data-skill-id="${escapeHtml(selectedSkill.skillId)}"
          >
            ${actionLabel}
          </button>
        `);
    }

    if (model.compareSkillId === selectedSkill.skillId) {
      actions.push(`<button class="neutral-btn" data-action="clear-training-compare">Clear Compare</button>`);
      } else {
        actions.push(`
        <button class="neutral-btn" data-action="set-training-compare" data-compare-skill-id="${escapeHtml(selectedSkill.skillId)}">
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

    const whyThisExists = buildWhyThisExists(selectedSkill);
    const comparedToEquipped = buildComparedToEquippedNote(model, selectedSkill);

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
          <span>${escapeHtml(getSkillStatusLabel(model, selectedSkill))}</span>
          <span>Cost ${selectedSkill.cost}</span>
          <span>Cooldown ${selectedSkill.cooldown}</span>
          ${selectedSkill.oncePerBattle ? "<span>Once / Battle</span>" : ""}
          ${selectedSkill.chargeCount > 0 ? `<span>${selectedSkill.chargeCount} charges</span>` : ""}
        </div>
        <p class="training-detail__summary">${escapeHtml(selectedSkill.summary)}</p>
        <p class="training-detail__text">${escapeHtml(selectedSkill.exactText)}</p>
        <p class="training-detail__gate">${escapeHtml(selectedSkill.gateLabel)}</p>
        <div class="training-detail__note-block">
          <span class="training-detail__eyebrow">Why This Exists</span>
          <p class="training-detail__text">${escapeHtml(whyThisExists)}</p>
        </div>
        <div class="training-detail__note-block">
          <span class="training-detail__eyebrow">Compared To Equipped Skill</span>
          <p class="training-detail__text">${escapeHtml(comparedToEquipped)}</p>
        </div>
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

          ${buildHeaderSummary(model, escapeHtml)}

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
                  <button class="neutral-btn ${model.mode === "browse" ? "training-mode-btn--active" : ""}" data-action="set-training-mode" data-training-mode="browse">Browse</button>
                  <button class="neutral-btn ${model.mode === "unlock" ? "training-mode-btn--active" : ""}" data-action="set-training-mode" data-training-mode="unlock">Unlock</button>
                  <button class="neutral-btn ${model.mode === "equip" ? "training-mode-btn--active" : ""}" data-action="set-training-mode" data-training-mode="equip">Equip</button>
                  <button class="neutral-btn ${model.mode === "swap" ? "training-mode-btn--active" : ""}" data-action="set-training-mode" data-training-mode="swap">Swap</button>
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
