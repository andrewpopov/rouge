(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;
  const {
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
  } = runtimeWindow.__ROUGE_CHARACTER_SELECT_VIEW_DETAILS;

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
        const portraitSrc = assets?.getClassPortrait(entry.id) || `./assets/curated/rouge-art/portraits/${entry.id}.webp`;
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
          const footerFlavor = selectorGuide?.footerFlavor || flavor;
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
          const progressionSkills = normalizedTrees.flatMap((tree) => tree.skills || []);
          const starterSkill = progressionSkills.find((skill) => {
            return skill.id === progression?.starterSkillId || skill.isStarter || (skill.slot === 1 && skill.tier === "starter");
          }) || null;
          const starterSkillSummary = starterSkill?.summary
            || "Open with a fixed identity skill, then unlock a tactical slot at Level 6 and a commitment slot at Level 12.";
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
          const selectorTabs = [
            { id: "overview", label: "Overview", detail: "pitch and identity" },
            { id: "kit", label: "Kit", detail: "stats and starter bar" },
            { id: "playstyle", label: "Playstyle", detail: "ratings and hook" },
            { id: "paths", label: "Paths", detail: "lane guides" },
          ] as const;
          const activeSelectorTab = selectorTabs.some((tab) => tab.id === appState.ui.characterSelectTab)
            ? appState.ui.characterSelectTab
            : "overview";
          const selectorTabIndex = Math.max(0, selectorTabs.findIndex((tab) => tab.id === activeSelectorTab));
          const activeSelectorTabDef = selectorTabs[selectorTabIndex] || selectorTabs[0];
          const prevSelectorTab = selectorTabs[(selectorTabIndex - 1 + selectorTabs.length) % selectorTabs.length];
          const nextSelectorTab = selectorTabs[(selectorTabIndex + 1) % selectorTabs.length];
          const selectorTabNav = `
            <div class="campfire-selection-shell__tab-nav" aria-label="Character details tabs">
              <div class="campfire-selection-shell__tab-status">
                <span class="campfire-selection-shell__tab-status-count">Detail ${selectorTabIndex + 1} / ${selectorTabs.length}</span>
                <span class="campfire-selection-shell__tab-status-copy">Swipe through the bloodline brief with the arrows.</span>
              </div>
              <div class="campfire-selection-shell__tab-controls">
                <button
                  class="campfire-selection-shell__tab-shift"
                  data-action="shift-character-select-tab"
                  data-direction="backward"
                  aria-label="Previous detail tab"
                >
                  &larr; ${escapeHtml(prevSelectorTab.label)}
                </button>
                <button
                  class="campfire-selection-shell__tab-active-card"
                  data-action="select-character-select-tab"
                  data-character-select-tab="${escapeHtml(activeSelectorTabDef.id)}"
                  aria-pressed="true"
                >
                  <span class="campfire-selection-shell__tab-label">${escapeHtml(activeSelectorTabDef.label)}</span>
                  <span class="campfire-selection-shell__tab-detail">${escapeHtml(activeSelectorTabDef.detail)}</span>
                </button>
                <button
                  class="campfire-selection-shell__tab-shift"
                  data-action="shift-character-select-tab"
                  data-direction="forward"
                  aria-label="Next detail tab"
                >
                  ${escapeHtml(nextSelectorTab.label)} &rarr;
                </button>
              </div>
              <div class="campfire-selection-shell__tab-strip" aria-label="Character detail list">
                ${selectorTabs.map((tab) => `
                  <button
                    class="campfire-selection-shell__tab ${tab.id === activeSelectorTab ? "campfire-selection-shell__tab--active" : ""}"
                    data-action="select-character-select-tab"
                    data-character-select-tab="${escapeHtml(tab.id)}"
                    aria-pressed="${tab.id === activeSelectorTab ? "true" : "false"}"
                  >
                    <span class="campfire-selection-shell__tab-label">${escapeHtml(tab.label)}</span>
                    <span class="campfire-selection-shell__tab-detail">${escapeHtml(tab.detail)}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          `;
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
            <div class="campfire-selection-shell__support-block">
              <p class="campfire-section-label">Starter Skill Bar</p>
              <div class="campfire-selection-shell__support-row campfire-selection-shell__support-row--three-up">
                ${buildSupportChip("Identity", starterSkill?.name || "Starter Skill", escapeHtml)}
                ${buildSupportChip("Tactical", "Level 6", escapeHtml)}
                ${buildSupportChip("Commitment", "Level 12", escapeHtml)}
              </div>
              <p class="campfire-selection-shell__support-copy">
                ${escapeHtml(starterSkillSummary)} Tactical opens once a tree reaches 3 points. Commitment opens once a favored tree reaches 6 points and you have learned a bridge skill.
              </p>
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
              ${selectorTabNav}

              <section class="campfire-selection-shell__panel ${activeSelectorTab === "overview" ? "campfire-selection-shell__panel--active" : ""}" data-character-panel="overview">
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
              </section>

              <section class="campfire-selection-shell__panel ${activeSelectorTab === "kit" ? "campfire-selection-shell__panel--active" : ""}" data-character-panel="kit">
                <div class="campfire-selection-shell__support-card">
                  ${supportInfoMarkup}
                </div>
              </section>

              <section class="campfire-selection-shell__panel ${activeSelectorTab === "playstyle" ? "campfire-selection-shell__panel--active" : ""}" data-character-panel="playstyle">
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
                </div>
              </section>

              <section class="campfire-selection-shell__panel ${activeSelectorTab === "paths" ? "campfire-selection-shell__panel--active" : ""}" data-character-panel="paths">
                <div class="campfire-selection-shell__paths-band">
                  <div class="campfire-selection-shell__paths-header">
                    <p class="campfire-section-label">Signature Paths</p>
                    <p class="campfire-selection-shell__paths-note">Open any lane for the full guide.</p>
                  </div>
                  <div class="class-tree-list class-tree-list--selector">
                    ${pathCards}
                  </div>
                </div>
              </section>

              <div class="campfire-selection-shell__footer-row">
                <div class="campfire-selection-shell__support-footer">
                  <p class="campfire-selection-shell__support-label">Campfire Reading</p>
                  <p class="campfire-selection-shell__support-note">${escapeHtml(footerFlavor)}</p>
                </div>

                <div class="campfire-selection-shell__actions-card">
                  <p class="campfire-selection-shell__actions-label">Expedition Orders</p>
                  <div class="campfire-selection-shell__action-cluster">
                    <button class="neutral-btn campfire-back-btn" data-action="return-front-door">Back</button>
                    <button class="neutral-btn campfire-record-btn" data-action="open-bloodline-record">Bloodline Record</button>
                    <button class="primary-btn campfire-enter-btn" data-action="start-run">
                      <span class="campfire-enter-btn__label">Begin Hunt</span>
                    </button>
                  </div>
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

    const unlockedClasses = appState.registries.classes.filter((entry) => !unlockRules || unlockRules.isClassUnlocked(appState.profile, entry.id));
    const activeClassIndex = Math.max(0, unlockedClasses.findIndex((entry) => entry.id === appState.ui.selectedClassId));
    const activeCycleClass = unlockedClasses[activeClassIndex] || unlockedClasses[0] || null;
    const prevCycleClass = unlockedClasses.length > 1
      ? unlockedClasses[(activeClassIndex - 1 + unlockedClasses.length) % unlockedClasses.length]
      : activeCycleClass;
    const nextCycleClass = unlockedClasses.length > 1
      ? unlockedClasses[(activeClassIndex + 1) % unlockedClasses.length]
      : activeCycleClass;
    const mobileHeroNav = activeCycleClass ? `
      <div class="campfire-lineup-mobile-nav" aria-label="Choose your hero">
        <button
          class="campfire-lineup-mobile-nav__btn"
          data-action="select-class"
          data-class-id="${escapeHtml(prevCycleClass?.id || activeCycleClass.id)}"
          ${unlockedClasses.length <= 1 ? "disabled" : ""}
        >
          &larr; ${escapeHtml(prevCycleClass?.name || activeCycleClass.name)}
        </button>
        <div class="campfire-lineup-mobile-nav__status">
          <span class="campfire-lineup-mobile-nav__count">Bloodline ${activeClassIndex + 1} / ${unlockedClasses.length}</span>
          <strong class="campfire-lineup-mobile-nav__name">${escapeHtml(activeCycleClass.name)}</strong>
        </div>
        <button
          class="campfire-lineup-mobile-nav__btn"
          data-action="select-class"
          data-class-id="${escapeHtml(nextCycleClass?.id || activeCycleClass.id)}"
          ${unlockedClasses.length <= 1 ? "disabled" : ""}
        >
          ${escapeHtml(nextCycleClass?.name || activeCycleClass.name)} &rarr;
        </button>
      </div>
    ` : "";

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
                ${mobileHeroNav}
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
