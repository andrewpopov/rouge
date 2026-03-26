(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { getCardElement, ELEMENT_LABELS, renderExploration } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;

  function svgIcon(src: string, cls: string, alt: string): string {
    return `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  const TRAIT_BADGE: Record<string, { icon: string; label: string; css: string }> = {
    swift: { icon: "\u{1F4A8}", label: "Swift", css: "trait--swift" },
    frenzy: { icon: "\u{1F4A2}", label: "Frenzy", css: "trait--frenzy" },
    thorns: { icon: "\u{1FAB6}", label: "Thorns", css: "trait--thorns" },
    regeneration: { icon: "\u{1F49A}", label: "Regen", css: "trait--regen" },
    death_explosion: { icon: "\u{1F4A5}", label: "Volatile", css: "trait--death" },
    death_poison: { icon: "\u2620", label: "Toxic Death", css: "trait--death" },
    death_spawn: { icon: "\u{1F95A}", label: "Spawner", css: "trait--death" },
    flee_on_ally_death: { icon: "\u{1F4A8}", label: "Cowardly", css: "trait--flee" },
    extra_fast: { icon: "\u26A1", label: "Extra Fast", css: "trait--fast" },
    extra_strong: { icon: "\u{1F4AA}", label: "Extra Strong", css: "trait--strong" },
    cursed: { icon: "\u{1F480}", label: "Cursed", css: "trait--cursed" },
    cold_enchanted: { icon: "\u2744", label: "Cold Enchanted", css: "trait--cold" },
    fire_enchanted: { icon: "\u{1F525}", label: "Fire Enchanted", css: "trait--fire" },
    lightning_enchanted: { icon: "\u26A1", label: "Lightning", css: "trait--lightning" },
    stone_skin: { icon: "\u{1F6E1}", label: "Stone Skin", css: "trait--stone" },
    mana_burn: { icon: "\u{1F50B}", label: "Mana Burn", css: "trait--mana" },
  };

  function renderTraitBadges(traits: MonsterTraitKind[] | undefined): string {
    if (!traits || traits.length === 0) { return ""; }
    return traits
      .map((t) => TRAIT_BADGE[t])
      .filter(Boolean)
      .map((b) => `<span class="sprite__trait ${b.css}" title="${b.label}">${b.icon}</span>`)
      .join("");
  }

  function renderAllySprite(
    unit: { alive: boolean; life: number; maxLife: number; guard: number; name: string },
    figureClass: string,
    portraitHtml: string,
    potionAction: string,
    potionDisabled: boolean,
    extraStatusHtml: string,
    escapeHtml: (s: string) => string
  ): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const hpPct = Math.round((unit.life / unit.maxLife) * 100);
    const lowHp = hpPct > 0 && hpPct <= 25;
    return `
      <div class="sprite ${unit.alive ? "" : "sprite--dead"}">
        <div class="sprite__figure ${figureClass}">${portraitHtml}</div>
        <div class="sprite__bars">
          <div class="sprite__hp-bar">
            <div class="sprite__hp-fill sprite__hp-fill--${figureClass === "sprite__figure--hero" ? "hero" : "merc"} ${lowHp ? "sprite__hp-fill--low" : ""}" style="width:${hpPct}%"></div>
            <span class="sprite__hp-text">${unit.life}/${unit.maxLife}</span>
          </div>
          ${unit.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${unit.guard}</div>` : ""}
          ${extraStatusHtml}
        </div>
        <div class="sprite__meta-row"><span class="sprite__meta-spacer" aria-hidden="true"></span></div>
        <div class="sprite__label-row"><div class="sprite__label">${escapeHtml(unit.name)}</div></div>
        <div class="sprite__action-row">
          <button class="sprite__potion" data-action="${potionAction}"
            ${potionDisabled ? "disabled" : ""}>\u{1F9EA}</button>
        </div>
      </div>
    `;
  }

  function renderEnemySprite(
    enemy: CombatEnemyState,
    isSelected: boolean,
    hasOutcome: boolean,
    intentDesc: string,
    escapeHtml: (s: string) => string
  ): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const isDead = !enemy.alive;
    const enemyHpPct = Math.round((enemy.life / enemy.maxLife) * 100);
    const enemyIcon = assets ? assets.getEnemyIcon(enemy.templateId || enemy.id) : "";
    const intentSvg = assets ? svgIcon(assets.getIntentIcon(intentDesc), "intent-icon", intentDesc) : "";
    const lowerIntent = intentDesc.toLowerCase();
    let intentTone = "";
    if (lowerIntent.includes("dmg") || lowerIntent.includes("sunder")) { intentTone = "sprite__intent--damage"; }
    else if (lowerIntent.includes("guard") || lowerIntent.includes("heal")) { intentTone = "sprite__intent--defend"; }
    else if (lowerIntent.includes("summon") || lowerIntent.includes("resurrect") || lowerIntent.includes("amplify")) { intentTone = "sprite__intent--special"; }
    const traitsMarkup = !isDead && enemy.traits?.length
      ? `<div class="sprite__traits">${renderTraitBadges(enemy.traits)}</div>`
      : `<div class="sprite__traits sprite__traits--empty" aria-hidden="true"></div>`;
    return `
      <button class="sprite sprite--enemy ${isSelected ? "sprite--targeted" : ""} ${isDead ? "sprite--dead" : ""}"
              data-action="select-enemy" data-enemy-id="${escapeHtml(enemy.id)}"
              ${isDead || hasOutcome ? "disabled" : ""}>
        ${!isDead && !hasOutcome ? `<div class="sprite__intent ${intentTone}"><span class="sprite__intent-icon">${intentSvg || "\u2753"}</span><span class="sprite__intent-label">${escapeHtml(intentDesc)}</span></div>` : ""}
        <div class="sprite__figure sprite__figure--enemy">${assets ? svgIcon(enemyIcon, "sprite__portrait sprite__portrait--enemy", enemy.name) : escapeHtml(enemy.name.charAt(0))}</div>
        <div class="sprite__bars">
          <div class="sprite__hp-bar">
            <div class="sprite__hp-fill sprite__hp-fill--enemy" style="width:${enemyHpPct}%"></div>
            <span class="sprite__hp-text">${enemy.life}/${enemy.maxLife}</span>
          </div>
          ${enemy.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${enemy.guard}</div>` : ""}
          ${enemy.burn > 0 ? `<div class="sprite__status sprite__status--burn">\u{1F525} ${enemy.burn}</div>` : ""}
          ${enemy.poison > 0 ? `<div class="sprite__status sprite__status--poison">\u2620 ${enemy.poison}</div>` : ""}
          ${enemy.slow > 0 ? `<div class="sprite__status sprite__status--slow">\u{1F422} ${enemy.slow}</div>` : ""}
          ${enemy.freeze > 0 ? `<div class="sprite__status sprite__status--freeze">\u2744 ${enemy.freeze}</div>` : ""}
          ${enemy.stun > 0 ? `<div class="sprite__status sprite__status--stun">\u26A1 ${enemy.stun}</div>` : ""}
          ${enemy.paralyze > 0 ? `<div class="sprite__status sprite__status--paralyze">\u{1F50C} ${enemy.paralyze}</div>` : ""}
        </div>
        <div class="sprite__meta-row">${traitsMarkup}</div>
        <div class="sprite__label-row"><div class="sprite__label">${escapeHtml(enemy.name)}</div></div>
        <div class="sprite__action-row"><span class="sprite__action-spacer" aria-hidden="true"></span></div>
      </button>
    `;
  }

  function renderHandCard(
    instance: { instanceId: string; cardId: string },
    index: number,
    cardCount: number,
    card: CardDefinition,
    cantPlay: boolean,
    escapeHtml: (s: string) => string
  ): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const element = getCardElement(card);
    const isUpgraded = instance.cardId.endsWith("_plus");
    const mid = (cardCount - 1) / 2;
    const offset = index - mid;
    const rotation = offset * 4;
    const translateY = Math.abs(offset) * 6;
    return `
      <button class="fan-card ${cantPlay ? "fan-card--disabled" : ""} fan-card--${element}${isUpgraded ? " fan-card--upgraded" : ""}"
              data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}"
              style="--fan-rotate:${rotation}deg; --fan-lift:${translateY}px; --fan-index:${index}">
        <div class="fan-card__cost">${card.cost}</div>
        <div class="fan-card__art">${(() => { if (assets) { return svgIcon(assets.getCardIcon(instance.cardId, card.effects), `fan-card__icon fan-card__icon--${element}`, card.title); } return card.target === "enemy" ? "\u2694" : "\u{1F6E1}"; })()}</div>
        <div class="fan-card__name">${escapeHtml(card.title)}</div>
        <div class="fan-card__desc">${escapeHtml(card.text)}</div>
        <div class="fan-card__type">${ELEMENT_LABELS[element] || "Skill"}</div>
      </button>
    `;
  }

  function deriveCombatViewModel(appState: AppState, services: UiRenderServices) {
    const { COMBAT_PHASE, COMBAT_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
    const run = appState.run;
    const combat = appState.combat;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;

    let phaseText = "Enemy Turn";
    if (combat.outcome === COMBAT_OUTCOME.VICTORY) {
      phaseText = "Victory";
    } else if (combat.outcome === COMBAT_OUTCOME.DEFEAT) {
      phaseText = "Defeat";
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      phaseText = "Your Turn";
    }

    const zoneName = zone?.title || combat.encounter.name;
    const zoneFlavor = runtimeWindow.__ROUGE_ZONE_FLAVOR;
    const zoneEnv = zoneFlavor?.resolveZoneEnv?.(zoneName) || "moor";
    const encounterNum = (zone?.encountersCleared || 0) + 1;
    const encounterTotal = zone?.encounterTotal || 1;
    const cardCount = combat.hand.length;
    const weaponEquip = run.loadout?.weapon;
    const weaponItem = weaponEquip ? appState.content.itemCatalog?.[weaponEquip.itemId] : null;
    const { RARITY } = runtimeWindow.ROUGE_ITEM_CATALOG;
    const weaponRarity = weaponEquip?.rarity || RARITY.WHITE;
    let rarityColor = "#aaa";
    if (weaponRarity === RARITY.UNIQUE) { rarityColor = "#c59a46"; }
    else if (weaponRarity === RARITY.RARE) { rarityColor = "#ddc63b"; }
    else if (weaponRarity === RARITY.MAGIC) { rarityColor = "#7db3ff"; }
    const canMelee = combat.phase === COMBAT_PHASE.PLAYER && !combat.outcome && !combat.meleeUsed && (combat.weaponDamageBonus || 0) > 0;
    const hasOutcome = Boolean(combat.outcome);

    return {
      run, combat, zone, selectedEnemy, phaseText,
      zoneName, zoneEnv, encounterNum, encounterTotal,
      cardCount, weaponItem, rarityColor, canMelee, hasOutcome,
    };
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    if (appState.ui.exploring) {
      renderExploration(root, appState, services);
      return;
    }

    const common = runtimeWindow.ROUGE_UI_COMMON;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const { escapeHtml } = services.renderUtils;
    const vm = deriveCombatViewModel(appState, services);
    const { COMBAT_PHASE, COMBAT_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
    const { run, combat, selectedEnemy, phaseText, zoneName, zoneEnv, encounterNum, encounterTotal, cardCount, weaponItem, rarityColor, canMelee, hasOutcome } = vm;

    const heroPortrait = assets ? svgIcon(assets.getClassSprite(run.classId) || assets.getClassPortrait(run.classId) || "", "sprite__portrait", run.className) : escapeHtml(run.className.charAt(0));
    const mercPortrait = assets ? svgIcon(assets.getMercenarySprite(combat.mercenary.id) || "", "sprite__portrait", combat.mercenary.role) : escapeHtml(combat.mercenary.role.charAt(0));
    const selectedEnemyIntent = selectedEnemy ? services.combatEngine.describeIntent(selectedEnemy.currentIntent) : "";
    const headerStatus = hasOutcome
      ? combat.outcome === COMBAT_OUTCOME.VICTORY
        ? "Field secured"
        : "The line has fallen"
      : selectedEnemy
        ? `Marked target · ${selectedEnemy.name}`
        : combat.phase === COMBAT_PHASE.PLAYER
          ? "Choose your opening line"
          : "Enemy pressure rising";
    const briefTitle = hasOutcome
      ? combat.outcome === COMBAT_OUTCOME.VICTORY ? "Field Secured" : "Line Broken"
      : selectedEnemy
        ? `Marked Target: ${selectedEnemy.name}`
        : combat.phase === COMBAT_PHASE.PLAYER
          ? "No Target Marked"
          : "Enemy Pressure";
    const briefCopy = hasOutcome
      ? combat.outcome === COMBAT_OUTCOME.VICTORY
        ? "Your war hand will stand down once the reward is claimed."
        : "No further commands remain."
      : selectedEnemy
        ? `${selectedEnemyIntent}. ${selectedEnemy.life}/${selectedEnemy.maxLife} life remains${selectedEnemy.guard > 0 ? ` with ${selectedEnemy.guard} guard` : ""}.`
        : combat.phase === COMBAT_PHASE.PLAYER
          ? "Click a monster to mark it, or use non-targeted skills to shape the opening exchange."
          : "Read the enemy intents, preserve the party, and prepare your next hand.";
    const weaponMarkup = weaponItem
      ? `<span class="combat-command__weapon-value" style="color:${rarityColor}">${escapeHtml(weaponItem.name)}</span>`
      : `<span class="combat-command__weapon-value combat-command__weapon-value--none">No weapon equipped</span>`;

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="combat-screen">
        <div class="combat-shell">
          <header class="combat-header">
            <div class="combat-header__title">
              <span class="combat-header__eyebrow">${escapeHtml(zoneName)} · Encounter ${encounterNum} of ${encounterTotal}</span>
              <div class="combat-header__phase-row">
                <h1 class="combat-header__phase combat-header__phase--${combat.outcome || combat.phase}">${escapeHtml(phaseText)}</h1>
                <span class="combat-header__status">${escapeHtml(headerStatus)}</span>
              </div>
            </div>
          </header>

          <section class="combat-board">
            <div class="combat-board__frame">
              <div class="stage" data-env="${zoneEnv}">
                <div class="combat-bg-image" style="background-image:url('${runtimeWindow.__ROUGE_COMBAT_BG?.getCombatBackground(zoneName) || ""}')"></div>
                <div class="stage__backdrop"></div>
                <div class="stage__particles"></div>
                <div class="stage__floor"></div>

                <div class="stage__allies">
                  ${renderAllySprite(
                    combat.hero, "sprite__figure--hero", heroPortrait, "use-potion-hero",
                    combat.potions <= 0 || combat.hero.life >= combat.hero.maxLife || hasOutcome,
                    [
                      combat.hero.heroBurn > 0 ? `<div class="sprite__status sprite__status--burn">\u{1F525} ${combat.hero.heroBurn}</div>` : "",
                      combat.hero.heroPoison > 0 ? `<div class="sprite__status sprite__status--poison">\u2620 ${combat.hero.heroPoison}</div>` : "",
                      combat.hero.chill > 0 ? `<div class="sprite__status sprite__status--chill">\u2744 Chill</div>` : "",
                      combat.hero.amplify > 0 ? `<div class="sprite__status sprite__status--amplify">\u{1F53A} Amp ${combat.hero.amplify}t</div>` : "",
                      combat.hero.weaken > 0 ? `<div class="sprite__status sprite__status--weaken">\u{1F53B} Weak ${combat.hero.weaken}t</div>` : "",
                      combat.hero.energyDrain > 0 ? `<div class="sprite__status sprite__status--drain">\u{1F50C} -${combat.hero.energyDrain} Energy</div>` : "",
                    ].join(""),
                    escapeHtml
                  )}
                  ${renderAllySprite(
                    combat.mercenary, "sprite__figure--merc", mercPortrait, "use-potion-mercenary",
                    combat.potions <= 0 || !combat.mercenary.alive || combat.mercenary.life >= combat.mercenary.maxLife || hasOutcome,
                    "",
                    escapeHtml
                  )}
                </div>

                <div class="stage__enemies">
                  ${combat.enemies.map((enemy) =>
                    renderEnemySprite(enemy, selectedEnemy?.id === enemy.id, hasOutcome, services.combatEngine.describeIntent(enemy.currentIntent), escapeHtml)
                  ).join("")}
                </div>

                ${combat.outcome ? `
                  <div class="stage__outcome stage__outcome--${combat.outcome}">
                    <div class="stage__outcome-title">${combat.outcome === COMBAT_OUTCOME.VICTORY ? "\u2694 Victory!" : "\u{1F480} Defeat"}</div>
                    <div class="stage__outcome-sub">${combat.outcome === COMBAT_OUTCOME.VICTORY
                      ? "The enemies fall. Claim your reward."
                      : "Your expedition ends here."}</div>
                  </div>
                ` : ""}
              </div>
            </div>
          </section>

          <section class="combat-command">
            <div class="combat-command__summary">
              <div class="energy-orb ${combat.hero.energy > 0 ? "energy-orb--active" : "energy-orb--empty"}" title="Energy: play cards that cost this much or less">
                <div class="energy-orb__value">${combat.hero.energy}</div>
                <div class="energy-orb__max">/${combat.hero.maxEnergy}</div>
                <div class="energy-orb__label">Energy</div>
              </div>

              <div class="combat-command__brief">
                <span class="combat-command__brief-label">Battle Read</span>
                <strong class="combat-command__brief-title">${escapeHtml(briefTitle)}</strong>
                <p class="combat-command__brief-copy">${escapeHtml(briefCopy)}</p>
                <div class="combat-command__resource-strip">
                  <div class="combat-command__resource">
                    <span class="combat-command__resource-label">Vitality</span>
                    <strong class="combat-command__resource-value">${assets ? svgIcon(assets.getUiIcon("hp") || "", "hud-icon", "HP") : "\u2764"} ${combat.hero.life}/${combat.hero.maxLife}</strong>
                  </div>
                  <div class="combat-command__resource">
                    <span class="combat-command__resource-label">Potions</span>
                    <strong class="combat-command__resource-value">\u{1F9EA} ${combat.potions}</strong>
                  </div>
                  <div class="combat-command__resource">
                    <span class="combat-command__resource-label">Treasury</span>
                    <strong class="combat-command__resource-value">\u{1F4B0} ${run.gold}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="combat-command__deck-shell">
              <div class="combat-command__deck-head">
                <span class="combat-command__deck-label">War Hand</span>
                <span class="combat-command__deck-count">${cardCount} card${cardCount === 1 ? "" : "s"} ready</span>
              </div>
              <div class="card-fan" style="--card-count:${cardCount}">
                ${combat.hand.map((instance, i) => {
                  const card = appState.content.cardCatalog[instance.cardId];
                  const requiresTarget = card.target === "enemy";
                  const cantPlay = hasOutcome || combat.phase !== COMBAT_PHASE.PLAYER || combat.hero.energy < card.cost || (requiresTarget && !selectedEnemy);
                  return renderHandCard(instance, i, cardCount, card, cantPlay, escapeHtml);
                }).join("")}
              </div>
            </div>

            <div class="combat-command__actions">
              <div class="combat-command__weapon-card">
                <span class="combat-command__weapon-label">Weapon</span>
                <strong class="combat-command__weapon-copy">${weaponMarkup}</strong>
                <span class="combat-command__weapon-meta">Wave ${encounterNum}</span>
              </div>
              ${canMelee ? `<button class="combat-action-btn combat-action-btn--melee" data-action="melee-strike">\u2694 Melee Strike (${combat.weaponDamageBonus})</button>` : ""}
              <button class="end-turn-btn combat-action-btn combat-action-btn--end-turn" data-action="end-turn"
                ${combat.phase !== COMBAT_PHASE.PLAYER || combat.outcome ? "disabled" : ""}>
                End Turn
              </button>
            </div>
          </section>

          <details class="town-operations-details combat-log">
            <summary class="town-operations-toggle">Combat Log</summary>
            <ol class="log-list combat-log-list">
              ${combat.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
            </ol>
          </details>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
