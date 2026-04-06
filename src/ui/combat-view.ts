(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { renderExploration } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;
  const preview = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const pressure = runtimeWindow.__ROUGE_COMBAT_VIEW_PRESSURE;
  const renderers = runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS;
  const pileRenderers = runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS_PILE;
  const decklistRenderers = runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS_DECKLIST;

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
    const activePileView = appState.ui.combatPileView || "";
    const markedEnemy = combat.enemies.find((enemy) => enemy.id === combat.mercenary.markedEnemyId && enemy.alive) || null;
    const canMelee = combat.phase === COMBAT_PHASE.PLAYER && !combat.outcome && !combat.meleeUsed && (combat.weaponDamageBonus || 0) > 0;
    const hasOutcome = Boolean(combat.outcome);
    const handSizeClass = cardCount <= 5
      ? "card-fan--large"
      : "card-fan--overflow";
    const handOverflowing = cardCount > 5;

    return {
      run, combat, zone, selectedEnemy, markedEnemy, phaseText,
      zoneName, zoneEnv, encounterNum, encounterTotal,
      cardCount, drawPileCount, discardPileCount, activePileView, canMelee, hasOutcome, handSizeClass, handOverflowing,
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
    const { run, combat, selectedEnemy, markedEnemy, phaseText, zoneName, zoneEnv, encounterNum, encounterTotal, cardCount, drawPileCount, discardPileCount, activePileView, canMelee, hasOutcome, handSizeClass, handOverflowing } = vm;
    const activeMinions = Array.isArray(combat.minions) ? combat.minions : [];
    const minionRackMarkup = activeMinions.length > 0
      ? renderers.renderMinionRack(activeMinions, escapeHtml, "command")
      : "";
    const incomingPressure = !hasOutcome && combat.phase === COMBAT_PHASE.PLAYER
      ? pressure.buildIncomingPressure(combat)
      : { hero: pressure.buildEmptyPressureSummary(), mercenary: pressure.buildEmptyPressureSummary() };

    const heroPortrait = assets ? `<img src="${assets.getClassSprite(run.classId) || assets.getClassPortrait(run.classId) || ""}" class="sprite__portrait" alt="${escapeHtml(run.className)}" loading="lazy" onerror="this.style.display='none'" />` : escapeHtml(run.className.charAt(0));
    const mercPortrait = assets ? `<img src="${assets.getMercenarySprite(combat.mercenary.id) || ""}" class="sprite__portrait" alt="${escapeHtml(combat.mercenary.role)}" loading="lazy" onerror="this.style.display='none'" />` : escapeHtml(combat.mercenary.role.charAt(0));
    const selectedEnemyIntent = selectedEnemy ? services.combatEngine.describeIntent(selectedEnemy.currentIntent) : "";
    const selectedEnemyIntentPresentation = selectedEnemy ? pressure.buildEnemyIntentPresentation(combat, selectedEnemy) : null;
    const handNeedsTarget = combat.hand.some((instance) => {
      const card = appState.content.cardCatalog[instance.cardId];
      if (!card || card.target !== "enemy") { return false; }
      const effectiveCost = preview.getEffectiveCardCost(combat, appState.content, instance, card);
      return effectiveCost <= combat.hero.energy;
    });
    let briefTitle = "Enemy Pressure";
    if (hasOutcome) {
      briefTitle = combat.outcome === COMBAT_OUTCOME.VICTORY ? "Field Secured" : "Line Broken";
    } else if (selectedEnemy) {
      briefTitle = selectedEnemy.name;
    } else if (markedEnemy) {
      briefTitle = `Mercenary Mark`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      briefTitle = handNeedsTarget ? "Choose Target" : "Opening Line";
    }

    let briefCopy = "Read the enemy intents, preserve the party, and prepare your next hand.";
    if (hasOutcome) {
      briefCopy = combat.outcome === COMBAT_OUTCOME.VICTORY
        ? "Your war hand will stand down once the reward is claimed."
        : "No further commands remain.";
    } else if (selectedEnemy) {
      const guardSuffix = selectedEnemy.guard > 0 ? `, ${selectedEnemy.guard} guard` : "";
      const commitmentSuffix = markedEnemy?.id === selectedEnemy.id ? ", mercenary committed." : ".";
      const intentFragments = [
        selectedEnemyIntentPresentation?.stateLabel || "",
        selectedEnemyIntent,
        selectedEnemyIntentPresentation?.targetLabel || "",
      ].filter(Boolean);
      briefCopy = `${intentFragments.join(" · ")}. ${selectedEnemy.life}/${selectedEnemy.maxLife} life${guardSuffix}${commitmentSuffix}`;
    } else if (markedEnemy) {
      briefCopy = `${markedEnemy.name} is marked for the mercenary. Lock a target or keep shaping the hand.`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      briefCopy = "Click a monster to mark it, or use non-targeted skills to shape the opening exchange.";
    }
    let deckTargetChip = "";
    if (hasOutcome) {
      deckTargetChip = "No commands";
    } else if (combat.phase !== COMBAT_PHASE.PLAYER) {
      deckTargetChip = "Enemy phase";
    } else if (!selectedEnemy && markedEnemy) {
      deckTargetChip = `Merc mark · ${markedEnemy.name}`;
    } else if (!selectedEnemy && handNeedsTarget) {
      deckTargetChip = "Choose target";
    }
    const energyIconMarkup = assets?.getUiIcon("energy")
      ? `<img src="${assets.getUiIcon("energy") || ""}" class="hud-icon hud-icon--inline" alt="" aria-hidden="true" loading="lazy" onerror="this.style.display='none'" />`
      : "\u26A1";
    const potionIconMarkup = "\u{1F9EA}";
    const goldIconMarkup = "\u{1F4B0}";
    let pileCards: typeof combat.drawPile;
    if (activePileView === "draw") {
      pileCards = combat.drawPile;
    } else if (activePileView === "discard") {
      pileCards = [...combat.discardPile].slice().reverse();
    } else {
      pileCards = [];
    }
    let pileViewerTitle: string;
    if (activePileView === "draw") {
      pileViewerTitle = "Deck";
    } else if (activePileView === "decklist") {
      pileViewerTitle = "Full Decklist";
    } else {
      pileViewerTitle = "Graveyard";
    }
    let pileViewerSubtitle: string;
    if (activePileView === "draw") {
      pileViewerSubtitle = "Top of deck first";
    } else if (activePileView === "decklist") {
      pileViewerSubtitle = "All cards in your combat deck";
    } else {
      pileViewerSubtitle = "Most recently discarded first";
    }
    const pileViewerEmptyCopy = activePileView === "draw"
      ? "The draw pile is empty. Your next refill will come from the graveyard."
      : "Nothing has been discarded yet.";
    const skillPrepParts: string[] = [];
    if ((combat.skillModifiers?.nextCardCostReduction || 0) > 0) {
      skillPrepParts.push(`Next card cost -${combat.skillModifiers.nextCardCostReduction}`);
    }
    if ((combat.skillModifiers?.nextCardDamageBonus || 0) > 0) {
      skillPrepParts.push(`Next card +${combat.skillModifiers.nextCardDamageBonus} damage`);
    }
    if ((combat.skillModifiers?.nextCardGuard || 0) > 0) {
      skillPrepParts.push(`Next card +${combat.skillModifiers.nextCardGuard} guard`);
    }
    if ((combat.skillModifiers?.nextCardDraw || 0) > 0) {
      skillPrepParts.push(`Next card +${combat.skillModifiers.nextCardDraw} draw`);
    }
    if ((combat.skillModifiers?.nextCardBurn || 0) > 0) {
      skillPrepParts.push(`Burn ${combat.skillModifiers.nextCardBurn}`);
    }
    if ((combat.skillModifiers?.nextCardPoison || 0) > 0) {
      skillPrepParts.push(`Poison ${combat.skillModifiers.nextCardPoison}`);
    }
    if ((combat.skillModifiers?.nextCardSlow || 0) > 0) {
      skillPrepParts.push(`Slow ${combat.skillModifiers.nextCardSlow}`);
    }
    if ((combat.skillModifiers?.nextCardFreeze || 0) > 0) {
      skillPrepParts.push(`Freeze ${combat.skillModifiers.nextCardFreeze}`);
    }
    if ((combat.skillModifiers?.nextCardParalyze || 0) > 0) {
      skillPrepParts.push(`Paralyze ${combat.skillModifiers.nextCardParalyze}`);
    }
    if ((combat.summonPowerBonus || 0) > 0) {
      skillPrepParts.push(`Summon power +${combat.summonPowerBonus}`);
    }
    if ((combat.summonSecondaryBonus || 0) > 0) {
      skillPrepParts.push(`Summon riders +${combat.summonSecondaryBonus}`);
    }
    const skillPrepSummary = skillPrepParts.join(" · ");
    const skillButtonsMarkup = combat.equippedSkills.length > 0 ? `
      <div class="combat-skill-rail" aria-label="Combat skills">
        ${combat.equippedSkills.map((skill) => {
          let tierLabel: string;
          if (skill.tier === "capstone") {
            tierLabel = "Capstone";
          } else if (skill.tier === "bridge") {
            tierLabel = "Bridge";
          } else {
            tierLabel = "Starter";
          }
          const ready = combat.phase === COMBAT_PHASE.PLAYER
            && !combat.outcome
            && skill.active
            && skill.remainingCooldown <= 0
            && (!skill.oncePerBattle || !skill.usedThisBattle)
            && (skill.chargeCount <= 0 || skill.chargesRemaining > 0)
            && combat.hero.energy >= skill.cost;
          let status: string;
          if (!skill.active) {
            status = "Passive";
          } else if (skill.remainingCooldown > 0) {
            status = `CD ${skill.remainingCooldown}`;
          } else if (skill.oncePerBattle && skill.usedThisBattle) {
            status = "Spent";
          } else if (skill.chargeCount > 0 && skill.chargesRemaining <= 0) {
            status = "Empty";
          } else if (combat.hero.energy < skill.cost) {
            status = "No energy";
          } else {
            status = "Ready";
          }
          const familyLabel = escapeHtml(skill.family.replace(/_/g, " "));
          const previewScopes = preview.deriveSkillPreviewScopes(skill);
          const previewLabel = preview.describePreviewScopes(previewScopes);
          const previewOutcome = preview.buildSkillPreviewOutcome(combat, skill, selectedEnemy);
          const previewSummary = preview.summarizePreviewOutcome(previewOutcome);
          let tierClass: string;
          if (skill.tier === "capstone") {
            tierClass = " combat-skill--capstone";
          } else if (skill.tier === "bridge") {
            tierClass = " combat-skill--bridge";
          } else {
            tierClass = " combat-skill--starter";
          }
          let slotLabel: string;
          if (skill.slotKey === "slot1") {
            slotLabel = "I";
          } else if (skill.slotKey === "slot2") {
            slotLabel = "II";
          } else {
            slotLabel = "III";
          }
          if (!skill.active) {
            return `
              <div class="combat-skill combat-skill--passive${tierClass}"
                data-preview-scope="${escapeHtml(previewScopes.join(","))}"
                data-preview-label="${escapeHtml(previewLabel)}"
                data-preview-title="${escapeHtml(`${skill.name} · ${tierLabel}`)}"
                data-preview-outcome="${escapeHtml(previewOutcome)}"
                title="${escapeHtml(skill.exactText)}">
                <span class="combat-skill__slot">${slotLabel}</span>
                <div class="combat-skill__body">
                  <div class="combat-skill__name-row">
                    <span class="combat-skill__name">${escapeHtml(skill.name)}</span>
                    <span class="combat-skill__tier">${escapeHtml(tierLabel)}</span>
                  </div>
                  <span class="combat-skill__meta">${familyLabel}</span>
                  <span class="combat-skill__summary">${escapeHtml(skill.summary)}</span>
                  ${previewSummary && previewSummary !== "Resolve" && previewSummary !== skill.summary ? `<span class="combat-skill__preview">${escapeHtml(previewSummary)}</span>` : ""}
                </div>
                <span class="combat-skill__status">${status}</span>
              </div>
            `;
          }
          return `
            <button type="button"
              class="combat-skill${ready ? " combat-skill--ready" : ""}${tierClass}"
              data-action="use-combat-skill"
              data-slot-key="${skill.slotKey}"
              data-preview-scope="${escapeHtml(previewScopes.join(","))}"
              data-preview-label="${escapeHtml(previewLabel)}"
              data-preview-title="${escapeHtml(`${skill.name} · ${tierLabel}`)}"
              data-preview-outcome="${escapeHtml(previewOutcome)}"
              data-preview-allow-disabled="true"
              title="${escapeHtml(skill.exactText)}"
              ${ready ? "" : "disabled"}>
              <span class="combat-skill__slot">${slotLabel}</span>
              <div class="combat-skill__body">
                <div class="combat-skill__name-row">
                  <span class="combat-skill__name">${escapeHtml(skill.name)}</span>
                  <span class="combat-skill__tier">${escapeHtml(tierLabel)}</span>
                </div>
                <span class="combat-skill__meta">${familyLabel} · ${skill.cost}e</span>
                <span class="combat-skill__summary">${escapeHtml(skill.summary)}</span>
                ${previewSummary && previewSummary !== "Resolve" && previewSummary !== skill.summary ? `<span class="combat-skill__preview">${escapeHtml(previewSummary)}</span>` : ""}
              </div>
              <span class="combat-skill__status">${status}</span>
            </button>
          `;
        }).join("")}
      </div>
    ` : "";

    type DecklistEntry = { cardId: string; card: CardDefinition; count: number; locations: string[] };
    const decklistEntries: DecklistEntry[] = [];
    if (activePileView === "decklist") {
      const grouped: Record<string, DecklistEntry> = {};
      const addCards = (cards: CardInstance[], location: string) => {
        for (const inst of cards) {
          const card = appState.content.cardCatalog[inst.cardId];
          if (!card) { continue; }
          if (!grouped[inst.cardId]) {
            grouped[inst.cardId] = { cardId: inst.cardId, card, count: 0, locations: [] };
          }
          grouped[inst.cardId].count++;
          if (!grouped[inst.cardId].locations.includes(location)) {
            grouped[inst.cardId].locations.push(location);
          }
        }
      };
      addCards(combat.hand, "Hand");
      addCards(combat.drawPile, "Deck");
      addCards(combat.discardPile, "Graveyard");
      decklistEntries.push(...Object.values(grouped));
      decklistEntries.sort((a, b) => a.card.cost - b.card.cost || a.card.title.localeCompare(b.card.title));
    }
    const BAND_LABELS: Record<number, string> = { 0: "0 Cost", 1: "1 Cost", 2: "2 Cost", 3: "3 Cost", 4: "4+ Cost" };
    const costBands: Array<{ label: string; costKey: number; entries: typeof decklistEntries }> = [];
    if (activePileView === "decklist") {
      const bandMap = new Map<number, typeof decklistEntries>();
      for (const entry of decklistEntries) {
        const key = entry.card.cost >= 4 ? 4 : entry.card.cost;
        if (!bandMap.has(key)) { bandMap.set(key, []); }
        bandMap.get(key)!.push(entry);
      }
      for (const key of [0, 1, 2, 3, 4]) {
        const entries = bandMap.get(key);
        if (entries && entries.length > 0) {
          costBands.push({ label: BAND_LABELS[key], costKey: key, entries });
        }
      }
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
                <div class="combat-header__phase-side">
                  <div class="combat-header__read">
                    <span class="combat-header__read-label">Battle Read</span>
                    <strong class="combat-header__read-title">${escapeHtml(briefTitle)}</strong>
                    <p class="combat-header__read-copy">${escapeHtml(briefCopy)}</p>
                  </div>
                  <div class="combat-header__resource-strip">
                    <span class="combat-header__resource-chip combat-header__resource-chip--energy">${energyIconMarkup}<strong>${combat.hero.energy}/${combat.hero.maxEnergy}</strong></span>
                    <span class="combat-header__resource-chip combat-header__resource-chip--potions"><span class="combat-header__resource-chip-icon" aria-hidden="true">${potionIconMarkup}</span><strong>${combat.potions}</strong></span>
                    <span class="combat-header__resource-chip combat-header__resource-chip--gold"><span class="combat-header__resource-chip-icon" aria-hidden="true">${goldIconMarkup}</span><strong>${run.gold}</strong></span>
                  </div>
                </div>
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
                  <div class="stage__ally-core">
                    ${renderers.renderAllySprite({
                      unit: combat.hero,
                      figureClass: "sprite__figure--hero",
                      portraitHtml: heroPortrait,
                      potionAction: "use-potion-hero",
                      potionDisabled: combat.potions <= 0 || combat.hero.life >= combat.hero.maxLife || hasOutcome,
                      persistentAfflictions: {
                        burn: combat.hero.heroBurn,
                        poison: combat.hero.heroPoison,
                      },
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
            <div class="combat-command__deck-shell">
              <div class="combat-command__hand-layout">
                <div class="combat-command__hand-rail">
                  <div class="combat-command__hand-identity">
                    <span class="combat-command__hand-label">War Hand</span>
                    <span class="combat-command__hand-count" title="${cardCount} cards ready">${cardCount}</span>
                  </div>
                  ${deckTargetChip ? `<span class="combat-command__hand-target" data-default-chip="${escapeHtml(deckTargetChip)}">${escapeHtml(deckTargetChip)}</span>` : ""}
                  ${skillButtonsMarkup ? `<div class="combat-command__hand-skills">${skillButtonsMarkup}</div>` : ""}
                </div>
                <div class="combat-command__hand-cards${handOverflowing ? " combat-command__hand-cards--scrollable" : ""}">
                  ${handOverflowing ? `<button type="button" class="combat-command__hand-scroll combat-command__hand-scroll--back" data-action="scroll-hand-cards" data-direction="backward" aria-label="Show earlier cards" title="Show earlier cards">\u2190</button>` : ""}
                  <div class="card-fan ${handSizeClass}" style="--card-count:${cardCount}">
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
                        card,
                        effectiveCost,
                        previewOutcome,
                        maxRuleLines: 4,
                        stateClass,
                        stateLabel,
                        cantPlay,
                        escapeHtml,
                      });
                    }).join("")}
                  </div>
                  ${handOverflowing ? `<button type="button" class="combat-command__hand-scroll combat-command__hand-scroll--forward" data-action="scroll-hand-cards" data-direction="forward" aria-label="Show later cards" title="Show later cards">\u2192</button>` : ""}
                </div>
              </div>
            </div>

            <div class="combat-command__actions">
              <div class="combat-command__deck-card" aria-label="Deck state">
                <button type="button" class="combat-command__deck-card-head combat-command__deck-card-head--clickable${activePileView === "decklist" ? " combat-command__deck-card-head--active" : ""}"
                  data-action="open-combat-pile"
                  data-pile-id="decklist"
                  aria-expanded="${activePileView === "decklist" ? "true" : "false"}"
                  title="View full decklist">
                  <span class="combat-command__deck-card-title">Deck</span>
                  <span class="combat-command__deck-card-total">${drawPileCount + discardPileCount + cardCount} cycle</span>
                </button>
                <div class="combat-command__deck-piles">
                  <span class="combat-command__pile combat-command__pile--ready" data-combat-pile="ready" title="Cards in hand">
                    <span class="combat-command__pile-label">Hand</span>
                    <strong class="combat-command__pile-value">${cardCount}</strong>
                  </span>
                  <button type="button"
                    class="combat-command__pile-stack combat-command__pile--draw${activePileView === "draw" ? " combat-command__pile-stack--active" : ""}"
                    data-action="open-combat-pile"
                    data-pile-id="draw"
                    data-combat-pile="draw"
                    aria-expanded="${activePileView === "draw" ? "true" : "false"}"
                    title="View cards left in deck">
                    <span class="combat-command__pile-stack-cards" aria-hidden="true">
                      <span class="combat-command__card-back"></span>
                      <span class="combat-command__card-back"></span>
                      <span class="combat-command__card-back"></span>
                    </span>
                    <span class="combat-command__pile-stack-copy">
                      <span class="combat-command__pile-stack-label">Deck</span>
                      <strong class="combat-command__pile-stack-value">${drawPileCount}</strong>
                    </span>
                  </button>
                  <button type="button"
                    class="combat-command__pile-stack combat-command__pile--discard${activePileView === "discard" ? " combat-command__pile-stack--active" : ""}"
                    data-action="open-combat-pile"
                    data-pile-id="discard"
                    data-combat-pile="discard"
                    aria-expanded="${activePileView === "discard" ? "true" : "false"}"
                    title="View cards in graveyard">
                    <span class="combat-command__pile-stack-cards combat-command__pile-stack-cards--discard" aria-hidden="true">
                      <span class="combat-command__card-back"></span>
                      <span class="combat-command__card-back"></span>
                      <span class="combat-command__card-back"></span>
                    </span>
                    <span class="combat-command__pile-stack-copy">
                      <span class="combat-command__pile-stack-label">Graveyard</span>
                      <strong class="combat-command__pile-stack-value">${discardPileCount}</strong>
                    </span>
                  </button>
                </div>
              </div>
              ${minionRackMarkup ? minionRackMarkup : ""}
              ${canMelee ? `<button class="combat-action-btn combat-action-btn--melee" data-action="melee-strike" data-preview-target="enemy" data-preview-title="Melee Strike" data-preview-outcome="${escapeHtml(preview.buildMeleePreviewOutcome(combat, selectedEnemy))}">\u2694 Strike (${combat.weaponDamageBonus})</button>` : ""}
              <button class="end-turn-btn combat-action-btn combat-action-btn--end-turn" data-action="end-turn"
                ${combat.phase !== COMBAT_PHASE.PLAYER || combat.outcome ? "disabled" : ""}>
                End Turn
              </button>
              ${skillPrepSummary ? `<div class="combat-skill-prep">${escapeHtml(skillPrepSummary)}</div>` : ""}
            </div>
          </section>

          ${activePileView && activePileView !== "decklist" ? `
            <section class="combat-pile-viewer" aria-label="${escapeHtml(pileViewerTitle)} cards">
              <div class="combat-pile-viewer__head">
                <div class="combat-pile-viewer__meta">
                  <span class="combat-pile-viewer__eyebrow">${escapeHtml(pileViewerTitle)}</span>
                  <h3 class="combat-pile-viewer__title">${escapeHtml(pileCards.length.toString())} card${pileCards.length === 1 ? "" : "s"}</h3>
                  <p class="combat-pile-viewer__copy">${escapeHtml(pileViewerSubtitle)}</p>
                </div>
                <button type="button" class="neutral-btn combat-pile-viewer__close" data-action="close-combat-pile">Close</button>
              </div>
              ${pileCards.length > 0 ? `
                <div class="combat-pile-viewer__grid">
                  ${pileCards.map((instance, index) => {
                    const card = appState.content.cardCatalog[instance.cardId];
                    if (!card) { return ""; }
                    const effectiveCost = preview.getEffectiveCardCost(combat, appState.content, instance, card);
                    let orderLabel: string;
                    if (activePileView === "draw") {
                      orderLabel = index === 0 ? "Top" : `Draw ${index + 1}`;
                    } else {
                      orderLabel = index === 0 ? "Latest" : `Discard ${index + 1}`;
                    }
                    return pileRenderers.renderPileCard({
                      instance,
                      card,
                      effectiveCost,
                      stateLabel: orderLabel,
                      escapeHtml,
                    });
                  }).join("")}
                </div>
              ` : `
                <div class="combat-pile-viewer__empty">${escapeHtml(pileViewerEmptyCopy)}</div>
              `}
            </section>
          ` : ""}

          ${pileRenderers.renderCombatLogPanel(combat, appState.ui.combatLogOpen, escapeHtml)}
        </div>
      </div>

      ${activePileView === "decklist" ? `
        <div class="decklist-overlay" data-action="close-combat-pile">
          <div class="decklist-overlay__panel" data-action="noop">
            <div class="decklist-overlay__head">
              <div class="decklist-overlay__meta">
                <span class="decklist-overlay__eyebrow">Full Decklist</span>
                <h3 class="decklist-overlay__title">${decklistEntries.reduce((sum, e) => sum + e.count, 0)} cards \u00b7 ${decklistEntries.length} unique</h3>
                <div class="decklist-overlay__composition">
                  ${decklistRenderers.buildCompositionPills(decklistEntries, escapeHtml)}
                </div>
              </div>
              <button type="button" class="neutral-btn decklist-overlay__close" data-action="close-combat-pile">Close</button>
            </div>
            <div class="decklist-overlay__body">
              ${costBands.map((band) => decklistRenderers.renderDecklistGroup(band, escapeHtml)).join("")}
            </div>
          </div>
        </div>
      ` : ""}
    `;
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
