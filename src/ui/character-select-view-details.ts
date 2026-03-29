(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

  const ARCHETYPE_LABELS = {
    martial: { label: "Martial", tone: "danger" },
    arcane: { label: "Arcane", tone: "arcane" },
    support: { label: "Support", tone: "support" },
    command: { label: "Command", tone: "command" },
  };

  const PROFILE_RATING_ORDER: Array<keyof ClassSelectorProfileRatings> = [
    "damage",
    "control",
    "survivability",
    "speed",
    "setup",
  ];

  const PROFILE_RATING_LABELS: Record<keyof ClassSelectorProfileRatings, string> = {
    damage: "Damage",
    control: "Control",
    survivability: "Survivability",
    speed: "Speed",
    setup: "Setup",
  };

  function humanize(id: string): string {
    return String(id || "")
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function buildLineup(entries: ClassDefinition[], selectedClassId: string | null | undefined): ClassDefinition[] {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    const selectedIndex = entries.findIndex((entry) => entry.id === selectedClassId);
    if (selectedIndex < 0) {
      return entries;
    }

    const centerIndex = Math.floor(entries.length / 2);
    return Array.from({ length: entries.length }, (_, slotIndex) => {
      const sourceIndex = (selectedIndex + slotIndex - centerIndex + entries.length) % entries.length;
      return entries[sourceIndex];
    });
  }

  function buildSelectorChip(
    label: string,
    modifier: string,
    escapeHtml: (s: unknown) => string
  ): string {
    return `<span class="class-selector-chip class-selector-chip--${escapeHtml(modifier)}">${escapeHtml(label)}</span>`;
  }

  function buildStatBar(label: string, value: number, max: number, escapeHtml: (s: unknown) => string): string {
    const pct = Math.round((value / max) * 100);
    return `
      <div class="class-stat-bar">
        <span class="class-stat-bar__label">${escapeHtml(label)}</span>
        <div class="class-stat-bar__track">
          <div class="class-stat-bar__fill" style="width: ${pct}%"></div>
        </div>
        <span class="class-stat-bar__value">${escapeHtml(value)}</span>
      </div>
    `;
  }

  function buildSupportChip(label: string, value: string | number, escapeHtml: (s: unknown) => string): string {
    return `
      <div class="class-support-chip">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function buildProfileRating(
    label: string,
    value: number,
    escapeHtml: (s: unknown) => string
  ): string {
    const dots = Array.from({ length: 5 }, (_, index) => {
      const filled = index < Math.max(0, Math.min(5, value));
      return `<span class="class-profile-rating__dot ${filled ? "class-profile-rating__dot--filled" : ""}" aria-hidden="true"></span>`;
    }).join("");

    return `
      <div class="class-profile-rating">
        <span class="class-profile-rating__label">${escapeHtml(label)}</span>
        <span class="class-profile-rating__track" aria-hidden="true">${dots}</span>
      </div>
    `;
  }

  function buildTreeCard(
    tree: RuntimeClassTreeDefinition,
    treeGuide: ClassSelectorPathGuideDefinition | null,
    escapeHtml: (s: unknown) => string,
    buildBadge: (label: string, tone: string) => string
  ): string {
    const archInfo = (ARCHETYPE_LABELS as Record<string, { label: string; tone: string }>)[tree.archetypeId] || ARCHETYPE_LABELS.martial;
    const laneIdentity = treeGuide?.laneIdentity || tree.summary || "A bloodline lane waiting for its first real commitment.";
    const emphasisLine = treeGuide?.emphasisLine || "Open the full guide to see how this lane grows once ranks and unlocks start landing.";

    return `
      <button class="class-tree-card class-tree-card--compact class-tree-card--${escapeHtml(tree.archetypeId)}"
              data-action="open-class-path"
              data-path-modal-id="class-path-${escapeHtml(tree.id)}">
        <div class="class-tree-card__header">
          <div class="class-tree-card__title-block">
            <strong class="class-tree-card__name">${escapeHtml(tree.name)}</strong>
          </div>
          ${buildBadge(archInfo.label, archInfo.tone)}
        </div>
        <p class="class-tree-card__summary">${escapeHtml(laneIdentity)}</p>
        <p class="class-tree-card__emphasis">${escapeHtml(emphasisLine)}</p>
      </button>
    `;
  }

  function describeBonusSetLines(bonuses: ItemBonusSet | null | undefined): string[] {
    const lines: string[] = [];
    if (toNumber(bonuses?.heroDamageBonus, 0) > 0) {
      lines.push(`Hero card damage +${toNumber(bonuses?.heroDamageBonus, 0)}.`);
    }
    if (toNumber(bonuses?.heroGuardBonus, 0) > 0) {
      lines.push(`Guard skills +${toNumber(bonuses?.heroGuardBonus, 0)}.`);
    }
    if (toNumber(bonuses?.heroBurnBonus, 0) > 0) {
      lines.push(`Burn application +${toNumber(bonuses?.heroBurnBonus, 0)}.`);
    }
    if (toNumber(bonuses?.heroMaxLife, 0) > 0) {
      lines.push(`Hero max Life +${toNumber(bonuses?.heroMaxLife, 0)}.`);
    }
    if (toNumber(bonuses?.heroMaxEnergy, 0) > 0) {
      lines.push(`Hero max Energy +${toNumber(bonuses?.heroMaxEnergy, 0)}.`);
    }
    if (toNumber(bonuses?.heroHandSize, 0) > 0) {
      lines.push(`Hero hand size +${toNumber(bonuses?.heroHandSize, 0)}.`);
    }
    if (toNumber(bonuses?.heroPotionHeal, 0) > 0) {
      lines.push(`Potion healing +${toNumber(bonuses?.heroPotionHeal, 0)}.`);
    }
    if (toNumber(bonuses?.mercenaryAttack, 0) > 0) {
      lines.push(`Mercenary attack +${toNumber(bonuses?.mercenaryAttack, 0)}.`);
    }
    if (toNumber(bonuses?.mercenaryMaxLife, 0) > 0) {
      lines.push(`Mercenary max Life +${toNumber(bonuses?.mercenaryMaxLife, 0)}.`);
    }
    return lines;
  }

  function buildTreeDetailModal(
    tree: RuntimeClassTreeDefinition,
    classGuide: {
      className: string;
      deckProfileLabel: string;
      roleLabel: string;
      complexity: string;
      selectionPitch: string;
      flavor: string;
      coreHook: string;
      attributeSummaryMarkup: string;
      vitalsMarkup: string;
      weaponBadgesMarkup: string;
      pathGuide: ClassSelectorPathGuideDefinition | null;
    },
    escapeHtml: (s: unknown) => string,
    buildBadge: (label: string, tone: string) => string
  ): string {
    const archInfo = (ARCHETYPE_LABELS as Record<string, { label: string; tone: string }>)[tree.archetypeId] || ARCHETYPE_LABELS.martial;
    const rankBonusLines = describeBonusSetLines(tree.bonusPerRank);
    const thresholdBonusLines = describeBonusSetLines(tree.unlockBonusPerThreshold);
    const laneIdentity = classGuide.pathGuide?.laneIdentity || tree.summary || "Ancient disciplines waiting to unfold once the expedition begins.";
    const emphasisLine = classGuide.pathGuide?.emphasisLine || "This lane sharpens once ranks, thresholds, and unlock timing start to matter.";
    const skillLines = [...(tree.skills || [])]
      .sort((left, right) => left.requiredLevel - right.requiredLevel)
      .map(
        (skill) => `
          <li class="class-path-modal__skill">
            <span class="class-path-modal__skill-level">Lv ${escapeHtml(skill.requiredLevel)}</span>
            <strong class="class-path-modal__skill-name">${escapeHtml(skill.name)}</strong>
          </li>
        `
      )
      .join("");

    return `
      <div class="class-path-modal" id="class-path-${escapeHtml(tree.id)}" data-path-modal hidden data-action="close-class-path">
        <div class="class-path-modal__panel" data-action="noop">
          <div class="class-path-modal__chrome">
            <div class="class-path-modal__heading">
              <p class="class-path-modal__eyebrow">${escapeHtml(classGuide.className)} Class Guide</p>
              <h3 class="class-path-modal__name">${escapeHtml(tree.name)}</h3>
            </div>
            <div class="class-path-modal__chrome-actions">
              <button class="class-path-modal__close" data-action="close-class-path" aria-label="Close Path">Close</button>
            </div>
          </div>

          <div class="class-path-modal__guide">
            <aside class="class-path-modal__sidebar">
              <div class="class-path-modal__guide-card class-path-modal__guide-card--identity">
                <div class="class-path-modal__guide-badges">
                  ${buildBadge(classGuide.deckProfileLabel, "cleared")}
                  ${buildSelectorChip(classGuide.roleLabel, "role", escapeHtml)}
                  ${buildSelectorChip(`${classGuide.complexity} Complexity`, "complexity", escapeHtml)}
                  ${buildBadge(archInfo.label, archInfo.tone)}
                </div>
                <p class="class-path-modal__guide-pick">${escapeHtml(classGuide.selectionPitch)}</p>
                <p class="class-path-modal__guide-flavor">${escapeHtml(classGuide.flavor)}</p>
              </div>

              <div class="class-path-modal__guide-card">
                <p class="campfire-section-label">Base Attributes</p>
                <div class="class-path-modal__stats">
                  ${classGuide.attributeSummaryMarkup}
                </div>
              </div>

              <div class="class-path-modal__guide-card">
                <p class="campfire-section-label">Opening Vitals</p>
                <div class="class-path-modal__vitals">
                  ${classGuide.vitalsMarkup}
                </div>
              </div>
            </aside>

            <div class="class-path-modal__content">
              <div class="class-path-modal__support-strip">
                <p class="campfire-section-label">Favored Arms</p>
                <div class="class-path-modal__weapons">
                  ${classGuide.weaponBadgesMarkup}
                </div>
              </div>

              <div class="class-path-modal__summary-card">
                <p class="campfire-section-label">Path Brief</p>
                <p class="class-path-modal__summary">${escapeHtml(laneIdentity)}</p>
                <p class="class-path-modal__emphasis">${escapeHtml(emphasisLine)}</p>
                <p class="class-path-modal__hook">${escapeHtml(classGuide.coreHook)}</p>
              </div>

              <div class="class-path-modal__body">
                <div class="class-path-modal__section">
                  <p class="campfire-section-label">Bonus Per Rank</p>
                  <ul class="class-path-modal__list">
                    ${(rankBonusLines.length > 0
                      ? rankBonusLines
                      : ["No passive rank bonuses recorded for this path."])
                        .map((line) => `<li>${escapeHtml(line)}</li>`)
                        .join("")}
                  </ul>
                </div>

                <div class="class-path-modal__section">
                  <p class="campfire-section-label">Threshold Bonus</p>
                  <p class="class-path-modal__threshold">Every ${escapeHtml(tree.unlockThreshold)} ranks</p>
                  <ul class="class-path-modal__list">
                    ${(thresholdBonusLines.length > 0
                      ? thresholdBonusLines
                      : ["No threshold bonus recorded for this path."])
                        .map((line) => `<li>${escapeHtml(line)}</li>`)
                        .join("")}
                  </ul>
                </div>

                <div class="class-path-modal__section class-path-modal__section--skills">
                  <p class="campfire-section-label">Skill Unlocks</p>
                  <ul class="class-path-modal__skills">
                    ${skillLines}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  runtimeWindow.__ROUGE_CHARACTER_SELECT_VIEW_DETAILS = {
    PROFILE_RATING_ORDER,
    PROFILE_RATING_LABELS,
    humanize,
    buildLineup,
    buildSelectorChip,
    buildStatBar,
    buildSupportChip,
    buildProfileRating,
    buildTreeCard,
    buildTreeDetailModal,
  };
})();
