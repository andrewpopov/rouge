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
        <div class="sprite__label">${escapeHtml(unit.name)}</div>
        <button class="sprite__potion" data-action="${potionAction}"
          ${potionDisabled ? "disabled" : ""}>\u{1F9EA}</button>
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
        ${!isDead && enemy.traits?.length ? `<div class="sprite__traits">${renderTraitBadges(enemy.traits)}</div>` : ""}
        <div class="sprite__label">${escapeHtml(enemy.name)}</div>
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
    else if (weaponRarity === RARITY.MAGIC) { rarityColor = "#ddc63b"; }
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

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="combat-screen">

        <div class="combat-hud">
          <div class="combat-hud__left">
            <span class="combat-hud__hp">${assets ? svgIcon(assets.getUiIcon("hp") || "", "hud-icon", "HP") : "\u2764"} ${combat.hero.life}/${combat.hero.maxLife}</span>
            <span class="combat-hud__gold">\u{1F4B0} ${run.gold}</span>
            <span class="combat-hud__potions">\u{1F9EA} ${combat.potions}</span>
          </div>
          <div class="combat-hud__center">
            <span class="combat-hud__phase combat-hud__phase--${combat.outcome || combat.phase}">${escapeHtml(phaseText)}</span>
            <span class="combat-hud__zone">${escapeHtml(zoneName)} \u00b7 ${encounterNum}/${encounterTotal}</span>
          </div>
          <div class="combat-hud__right">
            <span class="combat-hud__floor">Wave ${encounterNum}</span>
            ${weaponItem ? `<span style="color:${rarityColor};font-weight:bold;font-size:0.8em">${escapeHtml(weaponItem.name)}</span>` : ""}
          </div>
        </div>

        ${combat.phase === COMBAT_PHASE.PLAYER && !combat.outcome && combat.turn > 1 ? `<div class="turn-banner"><span class="turn-banner__text">Your Turn</span></div>` : ""}

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

        <div class="combat-tray">
          <div class="energy-orb ${combat.hero.energy > 0 ? "energy-orb--active" : "energy-orb--empty"}" title="Energy: play cards that cost this much or less">
            <div class="energy-orb__value">${combat.hero.energy}</div>
            <div class="energy-orb__max">/${combat.hero.maxEnergy}</div>
            <div class="energy-orb__label">Energy</div>
          </div>

          <div class="card-fan" style="--card-count:${cardCount}">
            ${combat.hand.map((instance, i) => {
              const card = appState.content.cardCatalog[instance.cardId];
              const requiresTarget = card.target === "enemy";
              const cantPlay = hasOutcome || combat.phase !== COMBAT_PHASE.PLAYER || combat.hero.energy < card.cost || (requiresTarget && !selectedEnemy);
              return renderHandCard(instance, i, cardCount, card, cantPlay, escapeHtml);
            }).join("")}
          </div>

          ${canMelee ? `<button class="end-turn-btn" data-action="melee-strike" style="background:#754;margin-bottom:4px">\u2694 Melee Strike (${combat.weaponDamageBonus})</button>` : ""}

          <button class="end-turn-btn" data-action="end-turn"
            ${combat.phase !== COMBAT_PHASE.PLAYER || combat.outcome ? "disabled" : ""}>
            End Turn
          </button>
        </div>

        <details class="town-operations-details">
          <summary class="town-operations-toggle">Combat Log</summary>
          <ol class="log-list combat-log-list">
            ${combat.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
          </ol>
        </details>
      </div>
    `;
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
