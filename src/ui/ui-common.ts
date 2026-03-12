(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getAccountMeta(): UiAccountMetaApi {
    return runtimeWindow.ROUGE_UI_ACCOUNT_META;
  }

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
        title: "The Account Hall Failed To Open",
        copy: bootState.error || "Rouge could not finish loading the seed data bundle required to build the shell.",
        body: `
          <section class="panel flow-panel">
            <div class="panel-head">
              <h2>Boot Failure</h2>
              <p>The shell cannot initialize without class, route, and content registries.</p>
            </div>
            <p class="flow-copy">${escapeHtml(bootState.error)}</p>
          </section>
        `,
      });
      return;
    }

    renderUtils.buildShell(root, {
      eyebrow: "Boot",
      title: "Opening The Account Hall",
      copy: "Initializing the seed bundle, class registry, run factory, and the phase-driven shell that carries the run from front door to archive.",
      body: `
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Starting Up</h2>
            <p>The live shell will move through front door, character select, town, world map, encounter, reward, and run-end review once the registries are ready.</p>
          </div>
          <p class="flow-copy">Loading classes, zones, monsters, items, runes, runewords, bosses, and world-node hooks from the seed bundle.</p>
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

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 3): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  runtimeWindow.ROUGE_UI_COMMON = {
    getPreviewLabel,
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
    getTownFeatureLabel: (...args) => getAccountMeta().getTownFeatureLabel(...args),
    getTutorialLabel: (...args) => getAccountMeta().getTutorialLabel(...args),
    createDefaultPlanningSummary: () => getAccountMeta().createDefaultPlanningSummary(),
    getPlanningCharterStageLines: (...args) => getAccountMeta().getPlanningCharterStageLines(...args),
    buildAccountMetaContinuityMarkup: (...args) => getAccountMeta().buildAccountMetaContinuityMarkup(...args),
    buildAccountMetaDrilldownMarkup: (...args) => getAccountMeta().buildAccountMetaDrilldownMarkup(...args),
    buildExpeditionLaunchFlowMarkup: () => "",
    buildAccountTreeReviewMarkup: (...args) => getAccountMeta().buildAccountTreeReviewMarkup(...args),
  };
})();
