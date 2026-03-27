(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface CombatFxActionOptions {
    playedCardEl?: HTMLElement | null;
    sequenceEnemyPhase?: boolean;
  }

  interface HeroStatusSnapshot {
    burn: number;
    poison: number;
    chill: number;
    amplify: number;
    weaken: number;
    drain: number;
  }

  interface EnemySnapshot {
    id: string;
    life: number;
    guard: number;
    alive: boolean;
    burn: number;
    poison: number;
    slow: number;
    freeze: number;
    stun: number;
    paralyze: number;
  }

  interface CombatSnapshot {
    turn: number;
    phase: CombatPhase;
    outcome: CombatOutcome | null;
    log: string[];
    handCount: number;
    drawPileCount: number;
    discardPileCount: number;
    heroLife: number;
    heroGuard: number;
    heroStatus: HeroStatusSnapshot;
    mercLife: number;
    mercGuard: number;
    mercAlive: boolean;
    enemies: EnemySnapshot[];
  }

  function captureCombatSnapshot(combat: CombatState): CombatSnapshot {
    return {
      turn: combat.turn,
      phase: combat.phase,
      outcome: combat.outcome,
      log: [...combat.log],
      handCount: combat.hand.length,
      drawPileCount: combat.drawPile.length,
      discardPileCount: combat.discardPile.length,
      heroLife: combat.hero.life,
      heroGuard: combat.hero.guard,
      heroStatus: {
        burn: combat.hero.heroBurn,
        poison: combat.hero.heroPoison,
        chill: combat.hero.chill,
        amplify: combat.hero.amplify,
        weaken: combat.hero.weaken,
        drain: combat.hero.energyDrain,
      },
      mercLife: combat.mercenary.life,
      mercGuard: combat.mercenary.guard,
      mercAlive: combat.mercenary.alive,
      enemies: combat.enemies.map((e) => ({
        id: e.id,
        life: e.life,
        guard: e.guard,
        alive: e.alive,
        burn: e.burn,
        poison: e.poison,
        slow: e.slow,
        freeze: e.freeze,
        stun: e.stun,
        paralyze: e.paralyze,
      })),
    };
  }

  function spawnDamageNumber(spriteEl: HTMLElement, text: string, cssClass: string, delayMs = 0): void {
    const spawn = () => {
      const el = document.createElement("div");
      el.className = `damage-number ${cssClass}`;
      el.textContent = text;
      spriteEl.style.position = "relative";
      spriteEl.appendChild(el);
      runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => el.remove(), 1200);
    };

    if (delayMs > 0) {
      runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(spawn, delayMs);
      return;
    }

    spawn();
  }

  function spawnImpactStamp(spriteEl: HTMLElement, text: string, cssClass: string, delayMs = 0): void {
    const spawn = () => {
      const stamp = document.createElement("div");
      stamp.className = `sprite__impact-stamp ${cssClass}`;
      stamp.textContent = text;
      spriteEl.style.position = "relative";
      spriteEl.appendChild(stamp);
      runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => stamp.remove(), 980);
    };

    if (delayMs > 0) {
      runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(spawn, delayMs);
      return;
    }

    spawn();
  }

  function addTempClass(el: HTMLElement, cls: string, durationMs: number): void {
    el.classList.add(cls);
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => el.classList.remove(cls), durationMs);
  }

  function addStaggeredTempClass(elements: HTMLElement[], cls: string, durationMs: number, stepMs: number): void {
    elements.forEach((el, index) => {
      runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => addTempClass(el, cls, durationMs), index * stepMs);
    });
  }

  function spawnQueuedCallouts(
    spriteEl: HTMLElement,
    callouts: Array<{ text: string; cssClass: string }>
  ): void {
    callouts.forEach((callout, index) => {
      spawnDamageNumber(spriteEl, callout.text, callout.cssClass, index * 120);
    });
  }

  function spawnQueuedImpactStamps(
    spriteEl: HTMLElement,
    stamps: Array<{ text: string; cssClass: string }>
  ): void {
    stamps.slice(0, 2).forEach((stamp, index) => {
      spawnImpactStamp(spriteEl, stamp.text, stamp.cssClass, 180 + (index * 140));
    });
  }

  function spawnPlayedCardFx(cardEl: HTMLElement | null | undefined): void {
    if (!cardEl) { return; }

    const rect = cardEl.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) { return; }

    const clone = cardEl.cloneNode(true) as HTMLElement;
    clone.classList.add("fan-card--fx-clone");
    clone.removeAttribute("data-action");
    clone.removeAttribute("data-instance-id");
    clone.setAttribute("aria-hidden", "true");
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.margin = "0";
    clone.style.setProperty("--fan-rotate", "0deg");
    clone.style.setProperty("--fan-lift", "0px");
    document.body.appendChild(clone);

    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedRAF(() => clone.classList.add("fan-card--playing"));
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => clone.remove(), 420);
  }

  function spawnTurnBanner(screen: HTMLElement, text: string): void {
    const existing = screen.querySelector(".turn-banner");
    if (existing) {
      existing.remove();
    }
    const banner = document.createElement("div");
    banner.className = "turn-banner";
    banner.innerHTML = `<div class="turn-banner__text">${text}</div>`;
    screen.appendChild(banner);
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => banner.remove(), 1300);
  }

  function spawnSequenceBanner(screen: HTMLElement, title: string, detail: string): void {
    const existing = screen.querySelector(".combat-sequence-banner");
    if (existing) {
      existing.remove();
    }
    const banner = document.createElement("div");
    banner.className = "combat-sequence-banner";
    banner.innerHTML = `
      <div class="combat-sequence-banner__title">${title}</div>
      <div class="combat-sequence-banner__detail">${detail}</div>
    `;
    screen.appendChild(banner);
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => banner.remove(), 520);
  }

  function spawnDeckFlowNotice(deckShell: HTMLElement, text: string, toneClass: string): void {
    const existing = deckShell.querySelector(".combat-command__deck-flow");
    if (existing) {
      existing.remove();
    }

    const notice = document.createElement("div");
    notice.className = `combat-command__deck-flow ${toneClass}`;
    notice.textContent = text;
    deckShell.appendChild(notice);
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => notice.remove(), 980);
  }

  function getNewLogEntries(beforeLog: string[], afterLog: string[]): string[] {
    if (beforeLog.length === 0) {
      return [...afterLog];
    }

    let boundary = afterLog.length;
    for (let index = 0; index < afterLog.length; index += 1) {
      if (afterLog[index] !== beforeLog[0]) {
        continue;
      }

      let matches = true;
      for (let offset = 0; offset < beforeLog.length && index + offset < afterLog.length; offset += 1) {
        if (afterLog[index + offset] !== beforeLog[offset]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        boundary = index;
        break;
      }
    }

    return afterLog.slice(0, boundary);
  }

  function trimActionLabel(label: string): string {
    return label.replace(/\.$/, "").trim();
  }

  function parseEnemyActionStep(
    entry: string,
    enemy: CombatEnemyState,
    after: CombatState
  ): { actorId: string; title: string; detail: string; targetKey: string | null } | null {
    if (!entry.startsWith(`${enemy.name} `)) {
      return null;
    }

    if (
      entry.includes(" falls.") ||
      entry.includes(" takes ") ||
      entry.includes(" is in a FRENZY!") ||
      entry.includes(" hits with Extra Strong force!") ||
      entry.includes(" is Paralyzed")
    ) {
      return null;
    }

    let detail = "Acts";
    if (entry.includes(" attacks ")) {
      detail = "Attack";
    } else if (entry.includes(" regenerates ")) {
      detail = "Recover";
    } else if (entry.includes(" is Frozen")) {
      detail = "Frozen";
    } else if (entry.includes(" is Stunned")) {
      detail = "Stunned";
    } else if (entry.includes(" panics and flees")) {
      detail = "Flee";
    } else {
      const usesMatch = entry.match(/ uses ([^.]+?)(?: on |,| and |\.)/);
      if (usesMatch?.[1]) {
        detail = trimActionLabel(usesMatch[1]);
      }
    }

    let targetKey: string | null = null;
    if (entry.includes(after.hero.name)) {
      targetKey = "hero";
    } else if (entry.includes(after.mercenary.name)) {
      targetKey = "mercenary";
    } else {
      const allyEnemy = after.enemies.find((candidate) => candidate.id !== enemy.id && entry.includes(candidate.name));
      if (allyEnemy) {
        targetKey = `enemy:${allyEnemy.id}`;
      }
    }

    return {
      actorId: enemy.id,
      title: enemy.name,
      detail,
      targetKey,
    };
  }

  function getEnemyActionSequence(before: CombatSnapshot, after: CombatState) {
    const newEntries = getNewLogEntries(before.log, after.log).reverse();
    const steps = [];

    for (const entry of newEntries) {
      const actor = after.enemies.find((enemy) => parseEnemyActionStep(entry, enemy, after));
      if (!actor) { continue; }
      const parsed = parseEnemyActionStep(entry, actor, after);
      if (!parsed) { continue; }
      steps.push(parsed);
    }

    return steps;
  }

  function playEnemyActionSequence(before: CombatSnapshot, after: CombatState, stage: HTMLElement, screen: HTMLElement | null): void {
    const steps = getEnemyActionSequence(before, after);
    if (steps.length === 0) {
      return;
    }

    const enemySprites = Array.from(stage.querySelectorAll(".sprite--enemy")) as HTMLElement[];
    const allySprites = Array.from(stage.querySelectorAll(".stage__allies .sprite")) as HTMLElement[];
    const heroSprite = allySprites[0] || null;
    const mercSprite = allySprites[1] || null;

    steps.forEach((step, index) => {
      runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => {
        const actorEl = enemySprites.find((el) => el.dataset.enemyId === step.actorId) || null;
        const targetEl = step.targetKey === "hero"
          ? heroSprite
          : step.targetKey === "mercenary"
            ? mercSprite
            : step.targetKey?.startsWith("enemy:")
              ? enemySprites.find((el) => el.dataset.enemyId === step.targetKey?.slice(6)) || null
              : null;

        if (actorEl) {
          addTempClass(actorEl, "sprite--acting", 380);
        }
        if (targetEl) {
          addTempClass(targetEl, "sprite--under-pressure", 380);
        }
        if (screen) {
          spawnSequenceBanner(screen, step.title, step.detail);
        }
      }, 180 + (index * 280));
    });
  }

  function makeStatusCallout(label: string, delta: number, cssClass: string) {
    return { text: `${label} +${delta}`, cssClass };
  }

  function getHeroStatusCallouts(before: CombatSnapshot, after: CombatState) {
    const callouts = [];
    const burnGain = after.hero.heroBurn - before.heroStatus.burn;
    const poisonGain = after.hero.heroPoison - before.heroStatus.poison;
    const chillGain = after.hero.chill - before.heroStatus.chill;
    const amplifyGain = after.hero.amplify - before.heroStatus.amplify;
    const weakenGain = after.hero.weaken - before.heroStatus.weaken;
    const drainGain = after.hero.energyDrain - before.heroStatus.drain;

    if (burnGain > 0) { callouts.push(makeStatusCallout("Burn", burnGain, "damage-number--burn")); }
    if (poisonGain > 0) { callouts.push(makeStatusCallout("Poison", poisonGain, "damage-number--poison")); }
    if (chillGain > 0) { callouts.push(makeStatusCallout("Chill", chillGain, "damage-number--frost")); }
    if (amplifyGain > 0) { callouts.push(makeStatusCallout("Amp", amplifyGain, "damage-number--status")); }
    if (weakenGain > 0) { callouts.push(makeStatusCallout("Weak", weakenGain, "damage-number--status")); }
    if (drainGain > 0) { callouts.push(makeStatusCallout("Drain", drainGain, "damage-number--drain")); }

    return callouts;
  }

  function getEnemyStatusCallouts(before: EnemySnapshot, after: CombatEnemyState) {
    const callouts = [];
    const burnGain = after.burn - before.burn;
    const poisonGain = after.poison - before.poison;
    const slowGain = after.slow - before.slow;
    const freezeGain = after.freeze - before.freeze;
    const stunGain = after.stun - before.stun;
    const paralyzeGain = after.paralyze - before.paralyze;

    if (burnGain > 0) { callouts.push(makeStatusCallout("Burn", burnGain, "damage-number--burn")); }
    if (poisonGain > 0) { callouts.push(makeStatusCallout("Poison", poisonGain, "damage-number--poison")); }
    if (slowGain > 0) { callouts.push(makeStatusCallout("Slow", slowGain, "damage-number--frost")); }
    if (freezeGain > 0) { callouts.push(makeStatusCallout("Freeze", freezeGain, "damage-number--frost")); }
    if (stunGain > 0) { callouts.push(makeStatusCallout("Stun", stunGain, "damage-number--stun")); }
    if (paralyzeGain > 0) { callouts.push(makeStatusCallout("Paralyze", paralyzeGain, "damage-number--stun")); }

    return callouts;
  }

  function getEnemyStatusStamp(before: EnemySnapshot, after: CombatEnemyState): { text: string; cssClass: string } | null {
    if (after.burn > before.burn) { return { text: "Burned", cssClass: "sprite__impact-stamp--status" }; }
    if (after.poison > before.poison) { return { text: "Poisoned", cssClass: "sprite__impact-stamp--status" }; }
    if (after.freeze > before.freeze) { return { text: "Frozen", cssClass: "sprite__impact-stamp--status" }; }
    if (after.stun > before.stun) { return { text: "Stunned", cssClass: "sprite__impact-stamp--status" }; }
    if (after.paralyze > before.paralyze) { return { text: "Paralyzed", cssClass: "sprite__impact-stamp--status" }; }
    if (after.slow > before.slow) { return { text: "Slowed", cssClass: "sprite__impact-stamp--status" }; }
    return null;
  }

  function applyResolutionBanner(before: CombatSnapshot, after: CombatState, screen: HTMLElement | null): void {
    if (!screen) { return; }

    const phaseEl = screen.querySelector(".combat-header__phase") as HTMLElement | null;
    if (after.outcome && before.outcome !== after.outcome) {
      spawnTurnBanner(screen, after.outcome === "victory" ? "Victory" : "Defeat");
      if (phaseEl) { addTempClass(phaseEl, "combat-header__phase--pulse", 500); }
      return;
    }

    if (after.turn !== before.turn) {
      spawnTurnBanner(screen, `Turn ${after.turn}`);
      if (phaseEl) { addTempClass(phaseEl, "combat-header__phase--pulse", 500); }
      return;
    }

    if (after.phase !== before.phase) {
      const label = after.phase === "player" ? "Your Turn" : "Enemy Turn";
      spawnTurnBanner(screen, label);
      if (phaseEl) { addTempClass(phaseEl, "combat-header__phase--pulse", 500); }
    }
  }

  function applyDeckFlowFx(before: CombatSnapshot, after: CombatState, options: CombatFxActionOptions): void {
    const deckShell = document.querySelector(".combat-command__deck-shell") as HTMLElement | null;
    if (!deckShell) { return; }

    const cardFan = deckShell.querySelector(".card-fan") as HTMLElement | null;
    const readyPile = deckShell.querySelector("[data-combat-pile='ready']") as HTMLElement | null;
    const drawPile = deckShell.querySelector("[data-combat-pile='draw']") as HTMLElement | null;
    const discardPile = deckShell.querySelector("[data-combat-pile='discard']") as HTMLElement | null;

    const readyDelta = after.hand.length - before.handCount;
    const drawChanged = before.drawPileCount !== after.drawPile.length;
    const discardChanged = before.discardPileCount !== after.discardPile.length;
    const handChanged = before.handCount !== after.hand.length;
    const cardCommitted = Boolean(options.playedCardEl);
    const reshuffled = after.drawPile.length > before.drawPileCount && after.discardPile.length < before.discardPileCount;
    const newHandReadied = after.turn > before.turn && after.phase === "player" && !after.outcome;

    if (handChanged && cardFan) {
      addTempClass(cardFan, "card-fan--settle", 420);
    }
    if (readyPile && handChanged) {
      addTempClass(readyPile, "combat-command__pile--pulse", 640);
    }
    if (drawPile && (drawChanged || newHandReadied)) {
      addTempClass(drawPile, "combat-command__pile--pulse", 640);
    }
    if (discardPile && (discardChanged || cardCommitted)) {
      addTempClass(discardPile, "combat-command__pile--pulse", 640);
    }

    if (newHandReadied) {
      addTempClass(deckShell, reshuffled ? "combat-command__deck-shell--cycle" : "combat-command__deck-shell--ready", 760);
      spawnDeckFlowNotice(
        deckShell,
        `${reshuffled ? "Deck recycled" : "Fresh hand"} · ${after.hand.length} ready`,
        reshuffled ? "combat-command__deck-flow--cycle" : "combat-command__deck-flow--ready"
      );
      return;
    }

    if (cardCommitted) {
      addTempClass(deckShell, "combat-command__deck-shell--resolve", 620);
      if (readyDelta > 0) {
        spawnDeckFlowNotice(deckShell, `Hand refilled · +${readyDelta} ready`, "combat-command__deck-flow--ready");
      } else if (readyDelta === 0) {
        spawnDeckFlowNotice(deckShell, "Card cycled cleanly", "combat-command__deck-flow--resolve");
      } else {
        spawnDeckFlowNotice(deckShell, "Card committed to discard", "combat-command__deck-flow--resolve");
      }
      return;
    }

    if (reshuffled) {
      addTempClass(deckShell, "combat-command__deck-shell--cycle", 760);
      spawnDeckFlowNotice(deckShell, "Deck recycled", "combat-command__deck-flow--cycle");
      return;
    }

    if (discardChanged && before.handCount > after.hand.length) {
      addTempClass(deckShell, "combat-command__deck-shell--resolve", 620);
      spawnDeckFlowNotice(deckShell, "Hand stood down", "combat-command__deck-flow--resolve");
    }
  }

  function applyPlayerReturnFx(before: CombatSnapshot, after: CombatState, stage: HTMLElement, screen: HTMLElement | null): void {
    const returnedToPlayer = after.phase === "player" && !after.outcome && (after.phase !== before.phase || after.turn !== before.turn);
    if (!returnedToPlayer) {
      return;
    }

    const deckShell = document.querySelector(".combat-command__deck-shell") as HTMLElement | null;
    const cardFan = deckShell?.querySelector(".card-fan") as HTMLElement | null;
    const allySprites = Array.from(stage.querySelectorAll(".stage__allies .sprite:not(.sprite--dead)")) as HTMLElement[];
    const enemySprites = Array.from(stage.querySelectorAll(".sprite--enemy:not(.sprite--dead)")) as HTMLElement[];
    const handCards = Array.from(stage.ownerDocument.querySelectorAll(".card-fan .fan-card")) as HTMLElement[];

    addTempClass(stage, "stage--player-return", 820);
    if (screen) {
      addTempClass(screen, "combat-screen--player-return", 760);
    }
    if (deckShell) {
      addTempClass(deckShell, "combat-command__deck-shell--return", 820);
    }
    if (cardFan) {
      addTempClass(cardFan, "card-fan--readying", 760);
    }

    addStaggeredTempClass(allySprites, "sprite--turn-ready", 620, 90);
    addStaggeredTempClass(enemySprites, "sprite--enemy-reset", 520, 70);
    addStaggeredTempClass(handCards, "fan-card--wake", 560, 45);
  }

  function applyCombatFx(before: CombatSnapshot, after: CombatState, options: CombatFxActionOptions = {}): void {
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedRAF(() => {
      const stage = document.querySelector(".stage") as HTMLElement | null;
      const screen = document.querySelector(".combat-screen") as HTMLElement | null;
      if (!stage) { return; }

      let totalDamageDealt = 0;
      let totalDamageTaken = 0;
      let anyEnemyKilled = false;

      // Check enemy damage
      const enemySprites = Array.from(stage.querySelectorAll(".sprite--enemy")) as HTMLElement[];
      for (const enemy of after.enemies) {
        const old = before.enemies.find((e) => e.id === enemy.id);
        if (!old) { continue; }

        const spriteEl = enemySprites.find((el) => el.dataset.enemyId === enemy.id);
        if (!spriteEl) { continue; }

        const callouts = [];
        const lifeLost = old.life - enemy.life;
        const lifeGain = enemy.life - old.life;
        const guardLost = old.guard - enemy.guard;
        const guardGain = enemy.guard - old.guard;
        const guardBroken = old.guard > 0 && enemy.guard === 0 && guardLost > 0;
        const statusCallouts = getEnemyStatusCallouts(old, enemy);
        const enemyImpactStamps = [];
        const statusStamp = getEnemyStatusStamp(old, enemy);

        if (lifeLost > 0) {
          totalDamageDealt += lifeLost;
          const isBig = lifeLost >= enemy.maxLife * 0.3;
          callouts.push({ text: `-${lifeLost}`, cssClass: isBig ? "damage-number--big-damage" : "damage-number--damage" });
          addTempClass(spriteEl, "sprite--hit", 400);
          addTempClass(spriteEl, "sprite--shake", 350);
        } else if (guardLost > 0) {
          callouts.push({ text: `-${guardLost}`, cssClass: "damage-number--guard" });
          addTempClass(spriteEl, "sprite--shake", 350);
        }

        if (guardGain > 0) {
          callouts.push({ text: `+${guardGain}`, cssClass: "damage-number--guard" });
          addTempClass(spriteEl, "sprite--status-surge", 500);
        }

        if (lifeGain > 0) {
          callouts.push({ text: `+${lifeGain}`, cssClass: "damage-number--heal" });
          addTempClass(spriteEl, "sprite--healed", 500);
        }

        if (guardBroken) {
          callouts.push({ text: "Break", cssClass: "damage-number--break" });
          addTempClass(spriteEl, "sprite--guard-broken", 500);
        }

        if (!old.alive && enemy.alive) {
          callouts.push({ text: "Rise", cssClass: "damage-number--status" });
          addTempClass(spriteEl, "sprite--status-surge", 500);
        }

        if (statusCallouts.length > 0) {
          callouts.push(...statusCallouts);
          addTempClass(spriteEl, "sprite--status-surge", 550);
        }

        spawnQueuedCallouts(spriteEl, callouts);

        if (options.playedCardEl) {
          if (old.alive && !enemy.alive) {
            enemyImpactStamps.push({ text: "Finished", cssClass: "sprite__impact-stamp--finisher" });
          } else {
            if (lifeLost > 0) {
              enemyImpactStamps.push({ text: lifeLost >= enemy.maxLife * 0.3 ? "Crushed" : "Hit", cssClass: "sprite__impact-stamp--hit" });
            } else if (guardLost > 0) {
              enemyImpactStamps.push({ text: "Guard Shaved", cssClass: "sprite__impact-stamp--break" });
            }
            if (guardBroken) {
              enemyImpactStamps.push({ text: "Broken", cssClass: "sprite__impact-stamp--break" });
            } else if (statusStamp) {
              enemyImpactStamps.push(statusStamp);
            }
          }
          if (enemyImpactStamps.length > 0) {
            spawnQueuedImpactStamps(spriteEl, enemyImpactStamps);
          }
        }

        if (old.alive && !enemy.alive) {
          anyEnemyKilled = true;
        }
      }

      // Check hero/merc damage (from end-turn enemy attacks)
      const allies = stage.querySelector(".stage__allies");
      if (allies) {
        const allySprites = allies.querySelectorAll(".sprite");
        const heroSprite = allySprites[0] as HTMLElement | undefined;
        const mercSprite = allySprites[1] as HTMLElement | undefined;

        if (heroSprite) {
          const heroCallouts = [];
          const heroImpactStamps = [];
          const heroLifeLost = before.heroLife - after.hero.life;
          const heroGuardLost = before.heroGuard - after.hero.guard;
          const heroGuardGain = after.hero.guard - before.heroGuard;
          if (heroLifeLost > 0) {
            totalDamageTaken += heroLifeLost;
            heroCallouts.push({ text: `-${heroLifeLost}`, cssClass: "damage-number--damage" });
            addTempClass(heroSprite, "sprite--hit", 400);
            addTempClass(heroSprite, "sprite--shake", 350);
          } else if (heroGuardLost > 0) {
            heroCallouts.push({ text: `-${heroGuardLost}`, cssClass: "damage-number--guard" });
            addTempClass(heroSprite, "sprite--shake", 350);
          }
          if (heroGuardGain > 0) {
            heroCallouts.push({ text: `+${heroGuardGain}`, cssClass: "damage-number--guard" });
          }
          const heroHealAmt = after.hero.life - before.heroLife;
          if (heroHealAmt > 0) {
            heroCallouts.push({ text: `+${heroHealAmt}`, cssClass: "damage-number--heal" });
            addTempClass(heroSprite, "sprite--healed", 500);
          }
          if (before.heroGuard > 0 && after.hero.guard === 0 && heroGuardLost > 0) {
            heroCallouts.push({ text: "Break", cssClass: "damage-number--break" });
            addTempClass(heroSprite, "sprite--guard-broken", 500);
          }
          const heroStatusCallouts = getHeroStatusCallouts(before, after);
          if (heroStatusCallouts.length > 0) {
            heroCallouts.push(...heroStatusCallouts);
            addTempClass(heroSprite, "sprite--status-surge", 550);
          }
          spawnQueuedCallouts(heroSprite, heroCallouts);
          if (options.playedCardEl) {
            if (heroHealAmt > 0) {
              heroImpactStamps.push({ text: "Recovered", cssClass: "sprite__impact-stamp--heal" });
            } else if (heroGuardGain > 0) {
              heroImpactStamps.push({ text: "Guarded", cssClass: "sprite__impact-stamp--guard" });
            }
            if (heroImpactStamps.length > 0) {
              spawnQueuedImpactStamps(heroSprite, heroImpactStamps);
            }
          }
        }

        if (mercSprite) {
          const mercCallouts = [];
          const mercImpactStamps = [];
          const mercLifeLost = before.mercLife - after.mercenary.life;
          const mercGuardLost = before.mercGuard - after.mercenary.guard;
          const mercGuardGain = after.mercenary.guard - before.mercGuard;
          if (mercLifeLost > 0) {
            totalDamageTaken += mercLifeLost;
            mercCallouts.push({ text: `-${mercLifeLost}`, cssClass: "damage-number--damage" });
            addTempClass(mercSprite, "sprite--hit", 400);
            addTempClass(mercSprite, "sprite--shake", 350);
          } else if (mercGuardLost > 0) {
            mercCallouts.push({ text: `-${mercGuardLost}`, cssClass: "damage-number--guard" });
            addTempClass(mercSprite, "sprite--shake", 350);
          }
          if (mercGuardGain > 0) {
            mercCallouts.push({ text: `+${mercGuardGain}`, cssClass: "damage-number--guard" });
          }
          const mercHealAmt = after.mercenary.life - before.mercLife;
          if (mercHealAmt > 0) {
            mercCallouts.push({ text: `+${mercHealAmt}`, cssClass: "damage-number--heal" });
            addTempClass(mercSprite, "sprite--healed", 500);
          }
          if (before.mercGuard > 0 && after.mercenary.guard === 0 && mercGuardLost > 0) {
            mercCallouts.push({ text: "Break", cssClass: "damage-number--break" });
            addTempClass(mercSprite, "sprite--guard-broken", 500);
          }
          spawnQueuedCallouts(mercSprite, mercCallouts);
          if (options.playedCardEl) {
            if (mercHealAmt > 0) {
              mercImpactStamps.push({ text: "Recovered", cssClass: "sprite__impact-stamp--heal" });
            } else if (mercGuardGain > 0) {
              mercImpactStamps.push({ text: "Guarded", cssClass: "sprite__impact-stamp--guard" });
            }
            if (mercImpactStamps.length > 0) {
              spawnQueuedImpactStamps(mercSprite, mercImpactStamps);
            }
          }
        }
      }

      // Screen shake on big hits or kills
      if (screen && (totalDamageDealt + totalDamageTaken >= 15 || anyEnemyKilled)) {
        addTempClass(screen, "combat-screen--shake", 350);
      }

      applyResolutionBanner(before, after, screen);
      applyDeckFlowFx(before, after, options);
      applyPlayerReturnFx(before, after, stage, screen);
      if (options.sequenceEnemyPhase) {
        playEnemyActionSequence(before, after, stage, screen);
      }
    });
  }

  function doCombatAction(
    combat: CombatState,
    action: () => void,
    syncAndRender: () => void,
    options: CombatFxActionOptions = {}
  ): void {
    const snapshot = captureCombatSnapshot(combat);
    if (options.playedCardEl) {
      spawnPlayedCardFx(options.playedCardEl);
    }
    action();
    syncAndRender();
    applyCombatFx(snapshot, combat, options);
  }

  runtimeWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX = {
    doCombatAction,
    addTempClass,
  };
})();
