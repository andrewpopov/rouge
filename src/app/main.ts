(() => {
  const root = document.getElementById("appRoot");
  if (!root) {
    throw new Error("Missing #appRoot container.");
  }

  const {
    ROUGE_ACTION_DISPATCHER: actionDispatcher,
    ROUGE_APP_ENGINE: appEngine,
    ROUGE_APP_SHELL: appShell,
    ROUGE_CLASS_REGISTRY: classRegistry,
    ROUGE_COMBAT_ENGINE: combatEngine,
    ROUGE_ENCOUNTER_REGISTRY: encounterRegistry,
    ROUGE_GAME_CONTENT: baseContent,
    ROUGE_ITEM_SYSTEM: itemSystem,
    ROUGE_SEED_LOADER: seedLoader,
  } = window;

  let appState: AppState | null = null;
  let runtimeContent: GameContent | null = null;
  let runtimeSeedBundle: SeedBundle | null = null;
  const bootState: BootState = {
    status: "loading",
    error: "",
  };

  function buildCombatSkillLoadout(run: RunState | null, content: GameContent): CombatSkillLoadoutEntry[] {
    if (!run) {
      return [];
    }
    const classProgression = window.ROUGE_CLASS_REGISTRY?.getClassProgression?.(content, run.classId) || null;
    if (!classProgression) {
      return [];
    }
    const allSkills = classProgression.trees.flatMap((tree: RuntimeClassTreeDefinition) => tree.skills);
    const equippedSkillBar = run.progression?.classProgression?.equippedSkillBar || {
      slot1SkillId: "",
      slot2SkillId: "",
      slot3SkillId: "",
    };
    return (["slot1", "slot2", "slot3"] as RunSkillBarSlotKey[])
      .map((slotKey) => {
        const skillId = equippedSkillBar[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] || "";
        const skill = allSkills.find((entry: RuntimeClassSkillDefinition) => entry.id === skillId) || null;
        return skill ? { slotKey, skill } : null;
      })
      .filter(Boolean) as CombatSkillLoadoutEntry[];
  }

  function buildScreenshotCombatState(options?: ScreenshotCombatFixtureOptions): AppState | null {
    if (!runtimeContent || !runtimeSeedBundle) {
      return null;
    }

    const config = options || {};
    const classId = config.classId || "amazon";
    const mercenaryId = config.mercenaryId || "rogue_scout";
    const handSize = Math.max(1, Math.floor(config.handSize || 7));
    const runFactory = window.ROUGE_RUN_FACTORY;

    const nextState = appEngine.createAppState({
      content: runtimeContent,
      seedBundle: runtimeSeedBundle,
      combatEngine,
      randomFn: () => 0,
    });

    appEngine.startCharacterSelect(nextState);
    appEngine.setSelectedClass(nextState, classId);
    appEngine.setSelectedMercenary(nextState, mercenaryId);
    if (!appEngine.startRun(nextState).ok) {
      return null;
    }

    if (config.boss) {
      const bossZone = runFactory.getCurrentZones(nextState.run!).find((zone) => zone.kind === "boss");
      const encounterId = bossZone?.encounterIds?.[0] || "act_1_boss";
      const overrides = runFactory.createCombatOverrides(nextState.run!, nextState.content, nextState.profile);
      overrides.heroState.handSize = Math.max(overrides.heroState.handSize, handSize);
      const mercenaryRouteBonuses = window.__ROUGE_APP_ENGINE_RUN?.buildMercenaryRouteCombatBonuses?.(nextState.run, nextState.content) || {};
      const combatBonuses = window.ROUGE_ITEM_SYSTEM?.buildCombatBonuses?.(nextState.run, nextState.content) || {};
      const armorProfile = window.ROUGE_ITEM_SYSTEM?.buildCombatMitigationProfile?.(nextState.run, nextState.content) || null;
      const weaponEquipment = nextState.run?.loadout?.weapon || null;
      const weaponItemId = weaponEquipment?.itemId || "";
      const weaponItem = window.ROUGE_ITEM_CATALOG?.getItemDefinition?.(nextState.content, weaponItemId) || null;
      const weaponProfile = window.ROUGE_ITEM_CATALOG?.buildEquipmentWeaponProfile?.(weaponEquipment, nextState.content) || null;
      const weaponFamily = window.ROUGE_ITEM_CATALOG?.getWeaponFamily?.(weaponItemId, nextState.content) || "";
      const classPreferred = window.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(nextState.run?.classId || "") || [];
      const equippedSkills = buildCombatSkillLoadout(nextState.run, nextState.content);

      nextState.run!.activeZoneId = bossZone?.id || nextState.run!.activeZoneId;
      nextState.run!.activeEncounterId = encounterId;
      nextState.combat = nextState.combatEngine.createCombatState({
        content: { ...nextState.content, hero: overrides.heroState },
        encounterId,
        mercenaryId: nextState.run!.mercenary.id,
        heroState: overrides.heroState,
        mercenaryState: { ...overrides.mercenaryState, ...mercenaryRouteBonuses },
        starterDeck: overrides.starterDeck,
        initialPotions: overrides.initialPotions,
        randomFn: nextState.randomFn,
        weaponFamily,
        weaponName: weaponItem?.name || "",
        weaponDamageBonus: combatBonuses.heroDamageBonus || 0,
        weaponProfile,
        armorProfile,
        classPreferredFamilies: classPreferred,
        equippedSkills,
      });
      nextState.phase = appEngine.PHASES.ENCOUNTER;
      nextState.ui.exploring = false;
    } else {
      if (!appEngine.leaveSafeZone(nextState).ok) {
        return null;
      }
      const openingZoneId = runFactory.getCurrentZones(nextState.run!)[0]?.id;
      if (!openingZoneId || !appEngine.selectZone(nextState, openingZoneId).ok || !nextState.combat) {
        return null;
      }
      nextState.ui.exploring = false;
      nextState.combat.hero.handSize = Math.max(nextState.combat.hero.handSize, handSize);
    }

    while (nextState.combat && nextState.combat.hand.length < handSize && nextState.combat.drawPile.length > 0) {
      const nextCard = nextState.combat.drawPile.shift();
      if (nextCard) {
        nextState.combat.hand.push(nextCard);
      }
    }

    if (nextState.combat) {
      const selectedEnemy = config.boss
        ? nextState.combat.enemies.find((enemy) => enemy.templateId.endsWith("_boss") && enemy.alive) || nextState.combat.enemies.find((enemy) => enemy.alive) || null
        : nextState.combat.enemies.find((enemy) => enemy.alive) || null;
      if (selectedEnemy) {
        nextState.combat.selectedEnemyId = selectedEnemy.id;
        nextState.combat.mercenary.markedEnemyId = selectedEnemy.id;
      }
    }

    nextState.ui.combatPileView = config.openPile === "draw" || config.openPile === "discard" || config.openPile === "decklist"
      ? config.openPile
      : "";

    return nextState;
  }

  function render(): void {
    appShell.render(root, {
      appState,
      baseContent,
      bootState,
    });
  }

  function syncCombatResultAndRender(): void {
    if (appState) {
      appEngine.syncEncounterOutcome(appState);
    }
    render();
  }

  window.__ROUGE_SCREENSHOT_HELPERS = {
    ready: false,
    loadCombatFixture(options?: ScreenshotCombatFixtureOptions): boolean {
      const nextState = buildScreenshotCombatState(options);
      if (!nextState) {
        return false;
      }
      appState = nextState;
      render();
      return true;
    },
  };

  root.addEventListener("click", (event) => {
    actionDispatcher.handleClick({
      target: event.target,
      appState,
      appEngine,
      combatEngine,
      render,
      syncCombatResultAndRender,
    });
  });

  document.addEventListener("keydown", (event) => {
    actionDispatcher.handleKeydown({
      event,
      target: event.target,
      appState,
      appEngine,
      combatEngine,
      render,
      syncCombatResultAndRender,
    });
  });


  window.__ROUGE_MAIN_CARD_PREVIEW.initCardPreview(root, () => appState);

  /* ── Parallax backdrop on mouse ── */

  root.addEventListener("mousemove", (event) => {
    const backdrop = root.querySelector(".stage__backdrop") as HTMLElement | null;
    if (!backdrop) { return; }
    const x = (event.clientX / window.innerWidth - 0.5) * 6;
    const y = (event.clientY / window.innerHeight - 0.5) * 4;
    backdrop.style.transform = `translate(${x}px, ${y}px) scale(1.02)`;
  });

  async function syncProfileAfterAuthChange(): Promise<void> {
    if (!runtimeContent) {
      render();
      return;
    }
    await window.ROUGE_PERSISTENCE?.initializeProfileStore?.(runtimeContent);
    if (appState) {
      const nextProfile = window.ROUGE_PERSISTENCE?.loadProfileFromStorage?.(undefined, runtimeContent) || appState.profile;
      appState.profile = nextProfile;
      appState.ui.selectedClassId = window.__ROUGE_APP_ENGINE_RUN.getPreferredClassId(appState.registries.classes, nextProfile);
    }
    render();
  }

  if (window.ROGUE_AUTH) {
    window.ROGUE_AUTH.initializeGoogleAuth();
    window.ROGUE_AUTH.onAuthChange(() => {
      void syncProfileAfterAuthChange();
    });
  }

  render();

  seedLoader
    .loadSeedBundle()
    .then(async (seedBundle) => {
      const classRuntimeContent = classRegistry.createRuntimeContent(baseContent, seedBundle);
      const itemizedContent = itemSystem.createRuntimeContent(classRuntimeContent, seedBundle);
      runtimeContent = encounterRegistry.createRuntimeContent(itemizedContent, seedBundle);
      runtimeSeedBundle = seedBundle;
      await window.ROGUE_AUTH?.waitUntilReady?.();
      await window.ROUGE_PERSISTENCE?.initializeProfileStore?.(runtimeContent);
      appState = appEngine.createAppState({
        content: runtimeContent,
        seedBundle,
        combatEngine,
      });
      window.__ROUGE_SCREENSHOT_HELPERS.ready = true;
      bootState.status = "ready";
      render();
    })
    .catch((error) => {
      window.__ROUGE_SCREENSHOT_HELPERS.ready = false;
      bootState.status = "error";
      bootState.error = error instanceof Error ? error.message : String(error);
      render();
    });
})();
