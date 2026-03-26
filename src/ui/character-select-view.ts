(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

  const ARCHETYPE_LABELS = {
    martial: { label: "Martial", tone: "danger" },
    arcane: { label: "Arcane", tone: "arcane" },
    support: { label: "Support", tone: "support" },
    command: { label: "Command", tone: "command" },
  };

  const CLASS_FLAVORS = {
    amazon: "Versatile ranged warrior who commands javelin and bow with deadly precision.",
    assassin: "Shadow operative blending martial arts, traps, and psychic discipline.",
    barbarian: "Relentless frontline fighter who overwhelms with raw strength and war shouts.",
    druid: "Shape-shifting guardian who channels elemental fury and summons nature's allies.",
    necromancer: "Master of death who curses foes, shatters bone, and raises undead armies.",
    paladin: "Holy warrior who radiates auras of might and protection in combat.",
    sorceress: "Elemental prodigy who unleashes devastating cold, fire, and lightning spells.",
  };

  function humanize(id: string): string {
    return String(id || "")
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

  function buildTreeCard(
    treeName: string,
    archetypeId: string,
    skills: { id: string; name: string; requiredLevel: number }[],
    escapeHtml: (s: unknown) => string,
    buildBadge: (label: string, tone: string) => string
  ): string {
    const archInfo = (ARCHETYPE_LABELS as Record<string, { label: string; tone: string }>)[archetypeId] || ARCHETYPE_LABELS.martial;
    const orderedSkills = [...skills].sort((a, b) => a.requiredLevel - b.requiredLevel);
    const openingSkill = orderedSkills[0]?.name || "";
    const summary = openingSkill
      ? `First rite: ${openingSkill}.`
      : "Ancient techniques carried into the dark beyond the gate.";

    return `
      <div class="class-tree-card class-tree-card--${escapeHtml(archetypeId)}">
        <div class="class-tree-card__header">
          <strong class="class-tree-card__name">${escapeHtml(treeName)}</strong>
          ${buildBadge(archInfo.label, archInfo.tone)}
        </div>
        <p class="class-tree-card__summary">${escapeHtml(summary)}</p>
        <div class="class-tree-card__depth">${escapeHtml(orderedSkills.length)} skills</div>
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
    const heroSprites = appState.registries.classes
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

          const preferredWeapons = services.classRegistry.getPreferredWeaponFamilies(selectedClass.id);
          const weaponBadges = preferredWeapons.length > 0
            ? preferredWeapons.map((w) => buildBadge(w, "cleared")).join("")
            : buildBadge("General", "locked");

          const flavor = (CLASS_FLAVORS as Record<string, string>)[selectedClass.id] || "";

          return `
            <div class="campfire-detail campfire-detail--expanded">
              <div class="campfire-detail__header">
                <h2 class="campfire-detail__name">${escapeHtml(selectedClass.name)}</h2>
                ${buildBadge(humanize(deckProfileId), "cleared")}
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
                    ${trees
                      .map((tree) => buildTreeCard(tree.name, tree.archetypeId, tree.skills, escapeHtml, buildBadge))
                      .join("")}
                    ${trees.length === 0
                      ? selectedClass.skillTrees
                          .map((treeId) => `<div class="class-tree-card"><strong class="class-tree-card__name">${escapeHtml(humanize(treeId))}</strong></div>`)
                          .join("")
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          `;
        })()
      : `<div class="campfire-detail campfire-detail--empty">
           <p class="campfire-detail__prompt">Choose the bloodline that will carry your name through the gate.</p>
         </div>`;

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="campfire-screen">
        <div class="campfire-screen__veil" aria-hidden="true"></div>
        <div class="campfire-sky">
          <img class="campfire-logo" src="./assets/curated/title-screen/blood-rogue-logo.png" alt="Blood Rogue" />
          <p class="eyebrow">Before The Black Gate</p>
          <h1 class="campfire-title">Choose Your Hero</h1>
          <p class="campfire-intro">
            Seven bloodlines gather beneath the eclipse. Choose the oath beyond the gate.
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
          <div class="campfire-actions">
            <button class="neutral-btn campfire-back-btn" data-action="return-front-door">Back</button>
            <button class="primary-btn campfire-enter-btn" data-action="start-run" ${selectedClass ? "" : "disabled"}>
              <span class="campfire-enter-btn__label">Begin Hunt</span>
            </button>
          </div>
          ${selectedPanel}
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_CHARACTER_SELECT_VIEW = {
    render,
  };
})();
