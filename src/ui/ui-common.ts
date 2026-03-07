(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getServices(): UiRenderServices {
    return {
      appEngine: runtimeWindow.ROUGE_APP_ENGINE,
      classRegistry: runtimeWindow.ROUGE_CLASS_REGISTRY,
      combatEngine: runtimeWindow.ROUGE_COMBAT_ENGINE,
      itemSystem: runtimeWindow.ROUGE_ITEM_SYSTEM,
      renderUtils: runtimeWindow.ROUGE_RENDER_UTILS,
      runFactory: runtimeWindow.ROUGE_RUN_FACTORY,
      townServices: runtimeWindow.ROUGE_TOWN_SERVICES,
    };
  }

  function getBonusValue(value: unknown): number {
    return Number.parseInt(String(value ?? 0), 10) || 0;
  }

  function getDerivedPartyState(run: RunState, content: GameContent, itemSystem: ItemSystemApi): DerivedPartyState {
    const bonuses = runtimeWindow.ROUGE_RUN_FACTORY?.buildCombatBonuses?.(run, content) || itemSystem?.buildCombatBonuses(run, content) || {};
    const heroMaxLife = run.hero.maxLife + getBonusValue(bonuses.heroMaxLife);
    const heroMaxEnergy = run.hero.maxEnergy + getBonusValue(bonuses.heroMaxEnergy);
    const heroPotionHeal = run.hero.potionHeal + getBonusValue(bonuses.heroPotionHeal);
    const mercenaryMaxLife = run.mercenary.maxLife + getBonusValue(bonuses.mercenaryMaxLife);
    const mercenaryAttack = run.mercenary.attack + getBonusValue(bonuses.mercenaryAttack);

    return {
      hero: {
        currentLife: Math.min(run.hero.currentLife, heroMaxLife),
        maxLife: heroMaxLife,
        maxEnergy: heroMaxEnergy,
        potionHeal: heroPotionHeal,
      },
      mercenary: {
        currentLife: Math.min(run.mercenary.currentLife, mercenaryMaxLife),
        maxLife: mercenaryMaxLife,
        attack: mercenaryAttack,
      },
      loadoutLines: itemSystem?.getLoadoutSummary(run, content) || [],
      activeRunewords: itemSystem?.getActiveRunewords(run, content) || [],
      bonuses,
    };
  }

  function renderBootState(root: HTMLElement, bootState: BootState, renderUtils: RenderUtilsApi): void {
    const { escapeHtml } = renderUtils;
    if (bootState.status === "error") {
      renderUtils.buildShell(root, {
        eyebrow: "Boot Error",
        title: "Failed To Load Seed Data",
        copy: bootState.error || "The application could not load its seed data bundle.",
        body: `
          <section class="panel flow-panel">
            <div class="panel-head">
              <h2>Boot Failure</h2>
              <p>The app engine cannot start without class and route data.</p>
            </div>
            <p class="flow-copy">${escapeHtml(bootState.error)}</p>
          </section>
        `,
      });
      return;
    }

    renderUtils.buildShell(root, {
      eyebrow: "Boot",
      title: "Loading Game Registries",
      copy: "Initializing the D2 seed bundle, class registry, run factory, and phase-driven app shell.",
      body: `
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Starting Up</h2>
            <p>The next screens will move through front door, character select, safe zone, world map, encounter, and reward.</p>
          </div>
          <p class="flow-copy">Loading classes, zones, monsters, items, runes, runewords, and bosses from the seed bundle.</p>
        </section>
      `,
    });
  }

  function renderRunStatus(run: RunState, phaseLabel: string, renderUtils: RenderUtilsApi): string {
    const { escapeHtml } = renderUtils;
    if (!run) {
      return "";
    }

    return `
      <section class="status-strip panel status-strip-wide">
        <div class="status-item">
          <span class="status-label">Phase</span>
          <strong>${escapeHtml(phaseLabel)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Class</span>
          <strong>${escapeHtml(run.className)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Act</span>
          <strong>${escapeHtml(run.actTitle)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Gold</span>
          <strong>${escapeHtml(run.gold)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Deck</span>
          <strong>${escapeHtml(run.deck.length)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Level</span>
          <strong>${escapeHtml(run.level)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">XP</span>
          <strong>${escapeHtml(run.xp)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Skill Pts</span>
          <strong>${escapeHtml(run.progression.skillPointsAvailable)}</strong>
        </div>
        <div class="status-item">
          <span class="status-label">Belt</span>
          <strong>${escapeHtml(`${run.belt.current}/${run.belt.max}`)}</strong>
        </div>
      </section>
    `;
  }

  function renderNotice(appState: AppState, renderUtils: RenderUtilsApi): string {
    return renderUtils.buildNoticePanel(appState?.error || "", "Notice");
  }

  function buildSafeZoneSnapshot(run: RunState, runFactory: RunFactoryApi): SafeZoneSnapshot {
    const currentAct = runFactory.getCurrentAct(run);
    const currentZones = runFactory.getCurrentZones(run);
    const reachableZones = runFactory.getReachableZones(run).filter((zone) => zone.status === "available");
    const clearedZones = currentZones.filter((zone) => zone.cleared).length;
    const encountersCleared = currentZones.reduce((total, zone) => total + zone.encountersCleared, 0);
    const encounterTotal = currentZones.reduce((total, zone) => total + zone.encounterTotal, 0);
    const bossZone = currentZones.find((zone) => zone.kind === "boss") || currentZones[currentZones.length - 1] || null;
    const nextZone = reachableZones[0] || null;

    return {
      currentAct,
      currentZones,
      reachableZones,
      clearedZones,
      encountersCleared,
      encounterTotal,
      bossZone,
      nextZone,
    };
  }

  function getBossStatusTone(status: string | undefined): string {
    if (status === "cleared") {
      return "cleared";
    }
    if (status === "available") {
      return "available";
    }
    return "locked";
  }

  function getBossStatusLabel(status: string | undefined): string {
    if (status === "cleared") {
      return "Cleared";
    }
    if (status === "available") {
      return "Unlocked";
    }
    return "Locked";
  }

  function getObjectiveSummary(routeSnapshot: SafeZoneSnapshot): ObjectiveSummary {
    if (routeSnapshot.nextZone) {
      return {
        badgeLabel: `${routeSnapshot.reachableZones.length} open`,
        copy: `${routeSnapshot.nextZone.title} is ready on the world map.`,
      };
    }

    if (routeSnapshot.bossZone?.status === "available") {
      return {
        badgeLabel: "Boss ready",
        copy: `${routeSnapshot.bossZone.title} has unlocked for this act.`,
      };
    }

    return {
      badgeLabel: "Prepare",
      copy: "No new route is unlocked yet. Recover and check supplies before heading out.",
    };
  }

  runtimeWindow.ROUGE_UI_COMMON = {
    getServices,
    getBonusValue,
    getDerivedPartyState,
    renderBootState,
    renderRunStatus,
    renderNotice,
    buildSafeZoneSnapshot,
    getBossStatusTone,
    getBossStatusLabel,
    getObjectiveSummary,
  };
})();
