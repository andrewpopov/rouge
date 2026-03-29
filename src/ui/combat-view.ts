(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { renderExploration } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;
  const preview = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const pressure = runtimeWindow.__ROUGE_COMBAT_VIEW_PRESSURE;
  const renderers = runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS;

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
    const drawPileCount = combat.drawPile.length;
    const discardPileCount = combat.discardPile.length;
    const markedEnemy = combat.enemies.find((enemy) => enemy.id === combat.mercenary.markedEnemyId && enemy.alive) || null;
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
      run, combat, zone, selectedEnemy, markedEnemy, phaseText,
      zoneName, zoneEnv, encounterNum, encounterTotal,
      cardCount, drawPileCount, discardPileCount, weaponItem, rarityColor, canMelee, hasOutcome,
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
    const { run, combat, selectedEnemy, markedEnemy, phaseText, zoneName, zoneEnv, encounterNum, encounterTotal, cardCount, drawPileCount, discardPileCount, weaponItem, rarityColor, canMelee, hasOutcome } = vm;
    const incomingPressure = !hasOutcome && combat.phase === COMBAT_PHASE.PLAYER
      ? pressure.buildIncomingPressure(combat)
      : { hero: pressure.buildEmptyPressureSummary(), mercenary: pressure.buildEmptyPressureSummary() };

    const heroPortrait = assets ? `<img src="${assets.getClassSprite(run.classId) || assets.getClassPortrait(run.classId) || ""}" class="sprite__portrait" alt="${escapeHtml(run.className)}" loading="lazy" onerror="this.style.display='none'" />` : escapeHtml(run.className.charAt(0));
    const mercPortrait = assets ? `<img src="${assets.getMercenarySprite(combat.mercenary.id) || ""}" class="sprite__portrait" alt="${escapeHtml(combat.mercenary.role)}" loading="lazy" onerror="this.style.display='none'" />` : escapeHtml(combat.mercenary.role.charAt(0));
    const selectedEnemyIntent = selectedEnemy ? services.combatEngine.describeIntent(selectedEnemy.currentIntent) : "";
    const handNeedsTarget = combat.hand.some((instance) => {
      const card = appState.content.cardCatalog[instance.cardId];
      if (!card || card.target !== "enemy") { return false; }
      const effectiveCost = preview.getEffectiveCardCost(combat, appState.content, instance, card);
      return effectiveCost <= combat.hero.energy;
    });
    let headerStatus = "Enemy pressure rising";
    if (hasOutcome) {
      headerStatus = combat.outcome === COMBAT_OUTCOME.VICTORY ? "Field secured" : "The line has fallen";
    } else if (selectedEnemy) {
      headerStatus = markedEnemy?.id === selectedEnemy.id
        ? `Mercenary mark · ${selectedEnemy.name}`
        : `Target locked · ${selectedEnemy.name}`;
    } else if (markedEnemy) {
      headerStatus = `Mercenary mark · ${markedEnemy.name}`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      headerStatus = handNeedsTarget ? "Choose a target" : "Choose your opening line";
    }

    let briefTitle = "Enemy Pressure";
    if (hasOutcome) {
      briefTitle = combat.outcome === COMBAT_OUTCOME.VICTORY ? "Field Secured" : "Line Broken";
    } else if (selectedEnemy) {
      briefTitle = `Target Locked: ${selectedEnemy.name}`;
    } else if (markedEnemy) {
      briefTitle = `Mercenary Mark: ${markedEnemy.name}`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      briefTitle = "No Target Locked";
    }

    let briefCopy = "Read the enemy intents, preserve the party, and prepare your next hand.";
    if (hasOutcome) {
      briefCopy = combat.outcome === COMBAT_OUTCOME.VICTORY
        ? "Your war hand will stand down once the reward is claimed."
        : "No further commands remain.";
    } else if (selectedEnemy) {
      const guardSuffix = selectedEnemy.guard > 0 ? `, ${selectedEnemy.guard} guard` : "";
      const commitmentSuffix = markedEnemy?.id === selectedEnemy.id ? ", mercenary committed." : ".";
      briefCopy = `${selectedEnemyIntent}. ${selectedEnemy.life}/${selectedEnemy.maxLife} life${guardSuffix}${commitmentSuffix}`;
    } else if (markedEnemy) {
      briefCopy = `${markedEnemy.name} is marked for the mercenary. Lock a target or keep shaping the hand.`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      briefCopy = "Click a monster to mark it, or use non-targeted skills to shape the opening exchange.";
    }
    const weaponMarkup = weaponItem
      ? `<span class="combat-command__weapon-value" style="color:${rarityColor}">${escapeHtml(weaponItem.name)}</span>`
      : `<span class="combat-command__weapon-value combat-command__weapon-value--none">No weapon equipped</span>`;
    let deckTargetChip = "Enemy phase";
    if (hasOutcome) {
      deckTargetChip = "No commands";
    } else if (selectedEnemy) {
      deckTargetChip = `Locked · ${selectedEnemy.name}`;
    } else if (markedEnemy) {
      deckTargetChip = `Merc mark · ${markedEnemy.name}`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      deckTargetChip = handNeedsTarget ? "Mark a target" : "Hand ready";
    }

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
                  ${renderers.renderAllySprite({
                    unit: combat.hero,
                    figureClass: "sprite__figure--hero",
                    portraitHtml: heroPortrait,
                    potionAction: "use-potion-hero",
                    potionDisabled: combat.potions <= 0 || combat.hero.life >= combat.hero.maxLife || hasOutcome,
                    extraStatusHtml: [
                      combat.hero.heroBurn > 0 ? `<div class="sprite__status sprite__status--burn">\u{1F525} ${combat.hero.heroBurn}</div>` : "",
                      combat.hero.heroPoison > 0 ? `<div class="sprite__status sprite__status--poison">\u2620 ${combat.hero.heroPoison}</div>` : "",
                      combat.hero.chill > 0 ? `<div class="sprite__status sprite__status--chill">\u2744 Chill</div>` : "",
                      combat.hero.amplify > 0 ? `<div class="sprite__status sprite__status--amplify">\u{1F53A} Amp ${combat.hero.amplify}t</div>` : "",
                      combat.hero.weaken > 0 ? `<div class="sprite__status sprite__status--weaken">\u{1F53B} Weak ${combat.hero.weaken}t</div>` : "",
                      combat.hero.energyDrain > 0 ? `<div class="sprite__status sprite__status--drain">\u{1F50C} -${combat.hero.energyDrain} Energy</div>` : "",
                    ].join(""),
                    incomingPressureHtml: pressure.renderIncomingPressure(incomingPressure.hero, escapeHtml),
                    threatened: incomingPressure.hero.attackers > 0,
                    escapeHtml,
                  })}
                  ${renderers.renderAllySprite({
                    unit: combat.mercenary,
                    figureClass: "sprite__figure--merc",
                    portraitHtml: mercPortrait,
                    potionAction: "use-potion-mercenary",
                    potionDisabled: combat.potions <= 0 || !combat.mercenary.alive || combat.mercenary.life >= combat.mercenary.maxLife || hasOutcome,
                    extraStatusHtml: "",
                    incomingPressureHtml: pressure.renderIncomingPressure(incomingPressure.mercenary, escapeHtml),
                    threatened: incomingPressure.mercenary.attackers > 0,
                    escapeHtml,
                  })}
                </div>

                <div class="stage__enemies">
                  ${combat.enemies.map((enemy) =>
                    renderers.renderEnemySprite(
                      combat,
                      enemy,
                      selectedEnemy?.id === enemy.id,
                      markedEnemy?.id === enemy.id,
                      hasOutcome,
                      services.combatEngine.describeIntent(enemy.currentIntent),
                      escapeHtml
                    )
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
                    <strong class="combat-command__resource-value">${assets ? `<img src="${assets.getUiIcon("hp") || ""}" class="hud-icon" alt="HP" loading="lazy" onerror="this.style.display='none'" />` : "\u2764"} ${combat.hero.life}/${combat.hero.maxLife}</strong>
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
                <div class="combat-command__deck-meta">
                  <span class="combat-command__deck-label">War Hand</span>
                  <span class="combat-command__deck-count">${cardCount} card${cardCount === 1 ? "" : "s"} ready</span>
                </div>
                <div class="combat-command__deck-piles" aria-label="Deck state">
                  <span class="combat-command__pile combat-command__pile--ready" data-combat-pile="ready" title="Cards in hand">
                    <span class="combat-command__pile-label">Ready</span>
                    <strong class="combat-command__pile-value">${cardCount}</strong>
                  </span>
                  <span class="combat-command__pile combat-command__pile--draw" data-combat-pile="draw" title="Cards left in draw pile">
                    <span class="combat-command__pile-label">Draw</span>
                    <strong class="combat-command__pile-value">${drawPileCount}</strong>
                  </span>
                  <span class="combat-command__pile combat-command__pile--discard" data-combat-pile="discard" title="Cards in discard pile">
                    <span class="combat-command__pile-label">Discard</span>
                    <strong class="combat-command__pile-value">${discardPileCount}</strong>
                  </span>
                </div>
                <span class="combat-command__deck-target" data-default-chip="${escapeHtml(deckTargetChip)}">${escapeHtml(deckTargetChip)}</span>
              </div>
              <div class="card-fan" style="--card-count:${cardCount}">
                ${combat.hand.map((instance, i) => {
                  const card = appState.content.cardCatalog[instance.cardId];
                  const effectiveCost = preview.getEffectiveCardCost(combat, appState.content, instance, card);
                  const previewOutcome = preview.buildCardPreviewOutcome(combat, instance, card, selectedEnemy);
                  const requiresTarget = card.target === "enemy";
                  const cantPlay = hasOutcome || combat.phase !== COMBAT_PHASE.PLAYER || combat.hero.energy < effectiveCost || (requiresTarget && !selectedEnemy);
                  let stateClass = "";
                  let stateLabel = "";
                  if (hasOutcome) {
                    stateClass = "fan-card--spent";
                    stateLabel = "Spent";
                  } else if (combat.phase !== COMBAT_PHASE.PLAYER) {
                    stateClass = "fan-card--waiting";
                    stateLabel = "Wait";
                  } else if (combat.hero.energy < effectiveCost) {
                    stateClass = "fan-card--unpowered";
                    stateLabel = "No energy";
                  } else if (requiresTarget && !selectedEnemy) {
                    stateClass = "fan-card--needs-target";
                    stateLabel = "Need target";
                  } else if (requiresTarget && selectedEnemy) {
                    stateClass = "fan-card--target-ready";
                  }
                  return renderers.renderHandCard({
                    instance,
                    index: i,
                    cardCount,
                    card,
                    effectiveCost,
                    previewOutcome,
                    stateClass,
                    stateLabel,
                    cantPlay,
                    escapeHtml,
                  });
                }).join("")}
              </div>
            </div>

            <div class="combat-command__actions">
              <div class="combat-command__weapon-card">
                <span class="combat-command__weapon-label">Weapon</span>
                <strong class="combat-command__weapon-copy">${weaponMarkup}</strong>
                <span class="combat-command__weapon-meta">Wave ${encounterNum} · ${combat.weaponDamageBonus || 0} bonus strike</span>
              </div>
              ${canMelee ? `<button class="combat-action-btn combat-action-btn--melee" data-action="melee-strike" data-preview-target="enemy" data-preview-title="Melee Strike" data-preview-outcome="${escapeHtml(preview.buildMeleePreviewOutcome(combat, selectedEnemy))}">\u2694 Melee Strike (${combat.weaponDamageBonus})</button>` : ""}
              <button class="end-turn-btn combat-action-btn combat-action-btn--end-turn" data-action="end-turn"
                ${combat.phase !== COMBAT_PHASE.PLAYER || combat.outcome ? "disabled" : ""}>
                End Turn
              </button>
            </div>
          </section>

          ${renderers.renderCombatLogPanel(combat, escapeHtml)}
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
