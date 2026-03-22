(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface CombatSnapshot {
    heroLife: number;
    heroGuard: number;
    mercLife: number;
    mercGuard: number;
    mercAlive: boolean;
    enemies: Array<{ id: string; life: number; guard: number; alive: boolean }>;
  }

  function captureCombatSnapshot(combat: CombatState): CombatSnapshot {
    return {
      heroLife: combat.hero.life,
      heroGuard: combat.hero.guard,
      mercLife: combat.mercenary.life,
      mercGuard: combat.mercenary.guard,
      mercAlive: combat.mercenary.alive,
      enemies: combat.enemies.map((e) => ({
        id: e.id,
        life: e.life,
        guard: e.guard,
        alive: e.alive,
      })),
    };
  }

  function spawnDamageNumber(spriteEl: HTMLElement, text: string, cssClass: string): void {
    const el = document.createElement("div");
    el.className = `damage-number ${cssClass}`;
    el.textContent = text;
    spriteEl.style.position = "relative";
    spriteEl.appendChild(el);
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => el.remove(), 1200);
  }

  function addTempClass(el: HTMLElement, cls: string, durationMs: number): void {
    el.classList.add(cls);
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedTimeout(() => el.classList.remove(cls), durationMs);
  }

  function applyCombatFx(before: CombatSnapshot, after: CombatState): void {
    runtimeWindow.ROUGE_VIEW_LIFECYCLE.managedRAF(() => {
      const stage = document.querySelector(".stage") as HTMLElement | null;
      const screen = document.querySelector(".combat-screen") as HTMLElement | null;
      if (!stage) { return; }

      let totalDamageDealt = 0;
      let anyEnemyKilled = false;

      // Check enemy damage
      const enemySprites = stage.querySelectorAll(".sprite--enemy");
      for (const enemy of after.enemies) {
        const old = before.enemies.find((e) => e.id === enemy.id);
        if (!old) { continue; }

        const spriteEl = Array.from(enemySprites).find(
          (el) => (el as HTMLElement).dataset.enemyId === enemy.id
        ) as HTMLElement | undefined;
        if (!spriteEl) { continue; }

        const lifeLost = old.life - enemy.life;
        const guardLost = old.guard - enemy.guard;

        if (lifeLost > 0) {
          totalDamageDealt += lifeLost;
          const isBig = lifeLost >= enemy.maxLife * 0.3;
          spawnDamageNumber(spriteEl, `-${lifeLost}`, isBig ? "damage-number--big-damage" : "damage-number--damage");
          addTempClass(spriteEl, "sprite--hit", 400);
          addTempClass(spriteEl, "sprite--shake", 350);
        } else if (guardLost > 0) {
          spawnDamageNumber(spriteEl, `-${guardLost}`, "damage-number--guard");
          addTempClass(spriteEl, "sprite--shake", 350);
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
          const heroLifeLost = before.heroLife - after.hero.life;
          const heroGuardGain = after.hero.guard - before.heroGuard;
          if (heroLifeLost > 0) {
            spawnDamageNumber(heroSprite, `-${heroLifeLost}`, "damage-number--damage");
            addTempClass(heroSprite, "sprite--hit", 400);
            addTempClass(heroSprite, "sprite--shake", 350);
          }
          if (heroGuardGain > 0) {
            spawnDamageNumber(heroSprite, `+${heroGuardGain}`, "damage-number--guard");
          }
          const heroHealAmt = after.hero.life - before.heroLife;
          if (heroHealAmt > 0) {
            spawnDamageNumber(heroSprite, `+${heroHealAmt}`, "damage-number--heal");
            addTempClass(heroSprite, "sprite--healed", 500);
          }
        }

        if (mercSprite) {
          const mercLifeLost = before.mercLife - after.mercenary.life;
          const mercGuardGain = after.mercenary.guard - before.mercGuard;
          if (mercLifeLost > 0) {
            spawnDamageNumber(mercSprite, `-${mercLifeLost}`, "damage-number--damage");
            addTempClass(mercSprite, "sprite--hit", 400);
            addTempClass(mercSprite, "sprite--shake", 350);
          }
          if (mercGuardGain > 0) {
            spawnDamageNumber(mercSprite, `+${mercGuardGain}`, "damage-number--guard");
          }
          const mercHealAmt = after.mercenary.life - before.mercLife;
          if (mercHealAmt > 0) {
            spawnDamageNumber(mercSprite, `+${mercHealAmt}`, "damage-number--heal");
            addTempClass(mercSprite, "sprite--healed", 500);
          }
        }
      }

      // Screen shake on big hits or kills
      if (screen && (totalDamageDealt >= 15 || anyEnemyKilled)) {
        addTempClass(screen, "combat-screen--shake", 350);
      }
    });
  }

  function doCombatAction(combat: CombatState, action: () => void, syncAndRender: () => void): void {
    const snapshot = captureCombatSnapshot(combat);
    action();
    syncAndRender();
    applyCombatFx(snapshot, combat);
  }

  runtimeWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX = {
    doCombatAction,
    addTempClass,
  };
})();
