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

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge, buildStat } = services.renderUtils;
    const selectedClass = services.classRegistry.getClassDefinition(appState.seedBundle, appState.ui.selectedClassId);
    const deckProfileId = services.classRegistry.getDeckProfileId(appState.content, appState.ui.selectedClassId);

    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const unlockRules = runtimeWindow.ROUGE_CLASS_UNLOCK_RULES;
    let recordModalMarkup = "";
    let pathModalsMarkup = "";
    const orderedClasses = buildLineup(appState.registries.classes, appState.ui.selectedClassId);
    const heroSprites = orderedClasses
      .map((entry) => {
        const isSelected = entry.id === appState.ui.selectedClassId;
        const isLocked = unlockRules && !unlockRules.isClassUnlocked(appState.profile, entry.id);
        const hint = isLocked ? unlockRules.getUnlockHint(entry.id) : "";
        const portraitSrc = assets?.getClassPortrait(entry.id) || `./assets/curated/portraits/${entry.id}.png`;
        return `
          <button class="campfire-hero ${isSelected ? "campfire-hero--selected" : ""} ${isLocked ? "campfire-hero--locked" : ""}"
                  ${isLocked ? "" : `data-action="select-class" data-class-id="${escapeHtml(entry.id)}"`}
                  title="${isLocked ? escapeHtml(hint) : escapeHtml(entry.name)}"
                  ${isLocked ? "disabled" : ""}>
            <span class="campfire-hero__frame">
              <img class="campfire-hero__sprite"
                   src="${escapeHtml(portraitSrc)}"
                   alt="${escapeHtml(entry.name)}"
                   draggable="false"
                   ${isLocked ? `style="filter: grayscale(1) brightness(0.5)"` : ""} />
            </span>
            <span class="campfire-hero__name">${escapeHtml(entry.name)}</span>
            ${isLocked ? `<span class="campfire-hero__lock">\u{1F512} ${escapeHtml(hint)}</span>` : ""}
          </button>
        `;
      })
      .join("");

    const selectedPanel = selectedClass
      ? (() => {
          const previewHero = services.classRegistry.createHeroFromClass(
            appState.content,
            selectedClass
          );
          const baseStats = selectedClass.baseStats || {};
          const str = toNumber(baseStats.strength, 0);
          const dex = toNumber(baseStats.dexterity, 0);
          const vit = toNumber(baseStats.vitality, 0);
          const ene = toNumber(baseStats.energy, 0);
          const statMax = 35;

          const progression = services.classRegistry.getClassProgression(appState.content, selectedClass.id);
          const trees = progression?.trees || [];
          const selectorGuide = runtimeWindow.__ROUGE_CHARACTER_SELECT_GUIDE?.getGuide?.(selectedClass.id) || null;

          const preferredWeapons = services.classRegistry.getPreferredWeaponFamilies(selectedClass.id);
          const weaponBadges = preferredWeapons.length > 0
            ? preferredWeapons.map((w) => buildBadge(w, "cleared")).join("")
            : buildBadge("General", "locked");
          const deckProfileLabel = humanize(deckProfileId);
          const selectionPitch = selectorGuide?.selectionPitch
            || "Choose this bloodline for a steady opening and flexible growth across the road ahead.";
          const flavor = selectorGuide?.flavor || "A veteran oath-bearer forged for the long road.";
          const roleLabel = selectorGuide?.roleLabel || "Expedition Specialist";
          const complexity = selectorGuide?.complexity || "Moderate";
          const playstyleTags = selectorGuide?.playstyleTags || [];
          const coreHook = selectorGuide?.coreHook
            || "Built to survive the opener, find its lane quickly, and scale into a cleaner endgame than the average run.";
          const attributeSummary = [
            { label: "STR", value: str },
            { label: "DEX", value: dex },
            { label: "VIT", value: vit },
            { label: "ENE", value: ene },
          ]
            .map(({ label, value }) => buildSupportChip(label, value, escapeHtml))
            .join("");
          const vitalsMarkup = [
            { label: "Life", value: previewHero.maxLife },
            { label: "Energy", value: previewHero.maxEnergy },
            { label: "Hand", value: previewHero.handSize },
            { label: "Potion", value: previewHero.potionHeal },
          ]
            .map(({ label, value }) => buildSupportChip(label, value, escapeHtml))
            .join("");
          const normalizedTrees = trees.length > 0
            ? trees
            : selectedClass.skillTrees.map((treeId) => ({
                id: treeId,
                name: humanize(treeId),
                archetypeId: "martial",
                summary: "Ancient disciplines waiting to unfold once the expedition begins.",
                bonusPerRank: {},
                unlockThreshold: 2,
                unlockBonusPerThreshold: {},
                skills: [] as RuntimeClassSkillDefinition[],
              }));
          const pathCards = normalizedTrees
            .map((tree) =>
              buildTreeCard(
                tree as RuntimeClassTreeDefinition,
                selectorGuide?.pathGuides?.[tree.id] || null,
                escapeHtml,
                buildBadge
              )
            )
            .join("");
          pathModalsMarkup = normalizedTrees
            .map((tree) =>
              buildTreeDetailModal(
                tree as RuntimeClassTreeDefinition,
                {
                  className: selectedClass.name,
                  deckProfileLabel,
                  roleLabel,
                  complexity,
                  selectionPitch,
                  flavor,
                  coreHook,
                  attributeSummaryMarkup: attributeSummary,
                  vitalsMarkup,
                  weaponBadgesMarkup: weaponBadges,
                  pathGuide: selectorGuide?.pathGuides?.[tree.id] || null,
                },
                escapeHtml,
                buildBadge
              )
            )
            .join("");
          const profileRatingsMarkup = PROFILE_RATING_ORDER
            .map((ratingKey) => {
              const value = selectorGuide?.profileRatings?.[ratingKey] ?? 3;
              return buildProfileRating(PROFILE_RATING_LABELS[ratingKey], value, escapeHtml);
            })
            .join("");
          const tagMarkup = playstyleTags.length > 0
            ? playstyleTags.map((tag) => buildSelectorChip(tag, "tag", escapeHtml)).join("")
            : buildSelectorChip("Adaptive", "tag", escapeHtml);
          const supportInfoMarkup = `
            <div class="campfire-selection-shell__support-block">
              <p class="campfire-section-label">Base Attributes</p>
              <div class="campfire-selection-shell__support-row">
                ${attributeSummary}
              </div>
            </div>
            <div class="campfire-selection-shell__support-block">
              <p class="campfire-section-label">Opening Vitals</p>
              <div class="campfire-selection-shell__support-row">
                ${vitalsMarkup}
              </div>
            </div>
            <div class="campfire-selection-shell__support-block">
              <p class="campfire-section-label">Favored Arms</p>
              <div class="campfire-selection-shell__weapon-row">
                ${weaponBadges}
              </div>
            </div>
          `;
          const detailMarkup = `
            <div class="campfire-detail campfire-detail--expanded">
              <div class="campfire-detail__header">
                <h2 class="campfire-detail__name">${escapeHtml(selectedClass.name)}</h2>
                ${buildBadge(deckProfileLabel, "cleared")}
              </div>
              <p class="campfire-detail__flavor">${escapeHtml(flavor)}</p>

              <div class="campfire-detail__columns">
                <div class="campfire-detail__left">
                  <div class="campfire-detail__section">
                    <h3 class="campfire-detail__section-title">Bloodline Attributes</h3>
                    <div class="class-stat-bars">
                      ${buildStatBar("STR", str, statMax, escapeHtml)}
                      ${buildStatBar("DEX", dex, statMax, escapeHtml)}
                      ${buildStatBar("VIT", vit, statMax, escapeHtml)}
                      ${buildStatBar("ENE", ene, statMax, escapeHtml)}
                    </div>
                  </div>
                  <div class="campfire-detail__section">
                    <h3 class="campfire-detail__section-title">Opening Vitals</h3>
                    <div class="campfire-detail__resources">
                      ${buildStat("Life", previewHero.maxLife)}
                      ${buildStat("Energy", previewHero.maxEnergy)}
                      ${buildStat("Hand", previewHero.handSize)}
                      ${buildStat("Potion", previewHero.potionHeal)}
                    </div>
                  </div>
                  <div class="campfire-detail__section">
                    <h3 class="campfire-detail__section-title">Favored Arms</h3>
                    <div class="campfire-detail__weapons">${weaponBadges}</div>
                  </div>
                </div>

                <div class="campfire-detail__right">
                  <h3 class="campfire-detail__section-title">Signature Paths</h3>
                  <div class="class-tree-list">
                    ${pathCards}
                  </div>
                </div>
              </div>
            </div>
          `;

          recordModalMarkup = `
            <div class="campfire-record-modal" data-record-modal hidden data-action="close-bloodline-record">
              <div class="campfire-record-modal__panel" data-action="noop">
                <div class="campfire-record-modal__chrome">
                  <p class="campfire-record-modal__label">Bloodline Record</p>
                  <button class="campfire-record-modal__close" data-action="close-bloodline-record" aria-label="Close Bloodline Record">Close</button>
                </div>
                ${detailMarkup}
              </div>
            </div>
          `;

          return `
            <div class="campfire-selection-shell">
              <div class="campfire-selection-shell__identity-band">
                <div class="campfire-selection-shell__headline">
                  <h2 class="campfire-selection-shell__name">${escapeHtml(selectedClass.name)}</h2>
                  <div class="campfire-selection-shell__badges">
                    ${buildSelectorChip(roleLabel, "role", escapeHtml)}
                    ${buildSelectorChip(`${complexity} Complexity`, "complexity", escapeHtml)}
                    ${buildBadge(deckProfileLabel, "cleared")}
                  </div>
                </div>
                <p class="campfire-selection-shell__decision">${escapeHtml(selectionPitch)}</p>
                <p class="campfire-selection-shell__flavor">${escapeHtml(flavor)}</p>
              </div>

              <div class="campfire-selection-shell__comparison-band">
                <div class="campfire-selection-shell__profile-card">
                  <div class="campfire-selection-shell__profile-header">
                    <p class="campfire-section-label">How It Plays</p>
                    <div class="campfire-selection-shell__tags">
                      ${tagMarkup}
                    </div>
                  </div>
                  <div class="campfire-selection-shell__ratings">
                    ${profileRatingsMarkup}
                  </div>
                  <p class="campfire-selection-shell__hook">${escapeHtml(coreHook)}</p>
                </div>

                <div class="campfire-selection-shell__support-card">
                  ${supportInfoMarkup}
                </div>
              </div>

              <div class="campfire-selection-shell__paths-band">
                <div class="campfire-selection-shell__paths-header">
                  <p class="campfire-section-label">Signature Paths</p>
                  <p class="campfire-selection-shell__paths-note">Open any lane for the full guide.</p>
                </div>
                <div class="class-tree-list class-tree-list--selector">
                  ${pathCards}
                </div>
              </div>

              <div class="campfire-selection-shell__support-footer">
                <p class="campfire-selection-shell__support-label">Selection Brief</p>
                <p class="campfire-selection-shell__support-note">Use the profile strip to compare classes quickly, then open a lane only when you want the full guide.</p>
              </div>

              <div class="campfire-selection-shell__actions">
                <div class="campfire-selection-shell__action-cluster">
                  <button class="neutral-btn campfire-back-btn" data-action="return-front-door">Back</button>
                  <button class="neutral-btn campfire-record-btn" data-action="open-bloodline-record">Bloodline Record</button>
                  <button class="primary-btn campfire-enter-btn" data-action="start-run">
                    <span class="campfire-enter-btn__label">Begin Hunt</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        })()
      : `<div class="campfire-selection-shell campfire-selection-shell--empty">
           <p class="campfire-detail__prompt">Choose the bloodline that will carry your name through the gate.</p>
           <div class="campfire-selection-shell__actions">
             <div class="campfire-selection-shell__action-cluster">
               <button class="neutral-btn campfire-back-btn" data-action="return-front-door">Back</button>
               <button class="neutral-btn campfire-record-btn" disabled>Bloodline Record</button>
               <button class="primary-btn campfire-enter-btn" data-action="start-run" disabled>
                 <span class="campfire-enter-btn__label">Begin Hunt</span>
               </button>
             </div>
           </div>
         </div>`;

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="campfire-screen">
        <div class="campfire-scene">
          <div class="campfire-screen__veil" aria-hidden="true"></div>
          <div class="campfire-sky">
            <h1 class="campfire-title">Choose Your Hero</h1>
            <p class="campfire-intro">
              Seven bloodlines gather beneath the eclipse. Choose the oath you will carry beyond the gate.
            </p>
          </div>
          <div class="campfire-main">
            <div class="campfire-stage">
              <div class="campfire-ground">
                <div class="campfire-lineup">
                  ${heroSprites}
                </div>
              </div>
            </div>
          </div>
        </div>
        ${selectedPanel}
      </div>
      ${recordModalMarkup}
      ${pathModalsMarkup}
    `;
  }

  runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW = {
    render,
  };
})();
