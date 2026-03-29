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
  const bootState: BootState = {
    status: "loading",
    error: "",
  };

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

  /* ── Card 3D tilt on hover (event delegation) ── */

  let currentTiltCard: HTMLElement | null = null;
  let currentTargetPreviewSource: HTMLElement | null = null;

  function appendPreviewPart(parts: string[], text: string): void {
    if (!text || parts.includes(text)) {
      return;
    }
    parts.push(text);
  }

  function formatPreviewParts(parts: string[]): string {
    if (parts.length === 0) {
      return "";
    }
    const summary = parts.slice(0, 2).join(" · ");
    return parts.length > 2 ? `${summary} +` : summary;
  }

  function getCardPreviewAttackValue(combat: CombatState, instance: CardInstance, effectValue: number): number {
    const turns = window.__ROUGE_COMBAT_ENGINE_TURNS;
    const evo = window.__ROUGE_SKILL_EVOLUTION;
    const synergy = evo ? evo.getSynergyDamageBonus(instance.cardId, combat.deckCardIds) : 0;
    const weaponBonus = turns?.getWeaponAttackBonus?.(combat, instance.cardId) || 0;
    let amount = Math.max(0, effectValue + combat.hero.damageBonus + synergy + weaponBonus);
    if (combat.hero.weaken > 0) {
      amount = Math.max(1, Math.floor(amount * 0.7));
    }
    return amount;
  }

  function getCardPreviewSupportValue(combat: CombatState, instance: CardInstance, effect: CardEffect): number {
    const turns = window.__ROUGE_COMBAT_ENGINE_TURNS;
    const weaponBonus = turns?.getWeaponSupportBonus?.(combat, instance.cardId) || 0;
    return Math.max(0, effect.value + weaponBonus);
  }

  function applyPreviewEnemyDamage(enemy: { guard: number; life: number }, damage: number): { life: number; guard: number } {
    const blocked = Math.min(enemy.guard, damage);
    enemy.guard = Math.max(0, enemy.guard - blocked);
    const dealt = Math.max(0, damage - blocked);
    enemy.life = Math.max(0, enemy.life - dealt);
    return { life: dealt, guard: blocked };
  }

  function buildCardUnitPreviewReadouts(
    combat: CombatState,
    content: GameContent,
    instanceId: string
  ): {
    selectedEnemy: string;
    hero: string;
    mercenary: string;
    enemyLine: Record<string, string>;
  } {
    const instance = combat.hand.find((entry) => entry.instanceId === instanceId);
    const card = instance ? content.cardCatalog[instance.cardId] : null;
    if (!instance || !card) {
      return { selectedEnemy: "", hero: "", mercenary: "", enemyLine: {} };
    }

    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
    const targetPreview = selectedEnemy ? { guard: selectedEnemy.guard, life: selectedEnemy.life } : null;
    const linePreview = combat.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({ id: enemy.id, guard: enemy.guard, life: enemy.life }));

    const targetParts: string[] = [];
    const heroParts: string[] = [];
    const mercParts: string[] = [];
    const lineParts = new Map<string, string[]>();
    let heroLife = combat.hero.life;
    let mercLife = combat.mercenary.life;

    const addLinePart = (enemyId: string, text: string) => {
      if (!lineParts.has(enemyId)) {
        lineParts.set(enemyId, []);
      }
      appendPreviewPart(lineParts.get(enemyId)!, text);
    };

    card.effects.forEach((effect) => {
      switch (effect.kind) {
        case "damage": {
          const amount = getCardPreviewAttackValue(combat, instance, effect.value);
          if (targetPreview) {
            const resolved = applyPreviewEnemyDamage(targetPreview, amount);
            if (resolved.life > 0) { appendPreviewPart(targetParts, `${resolved.life} dmg`); }
            if (resolved.guard > 0) { appendPreviewPart(targetParts, `${resolved.guard} guard`); }
          }
          break;
        }
        case "damage_all": {
          const amount = getCardPreviewAttackValue(combat, instance, effect.value);
          linePreview.forEach((enemy) => {
            const resolved = applyPreviewEnemyDamage(enemy, amount);
            if (resolved.life > 0) { addLinePart(enemy.id, `${resolved.life} dmg`); }
            if (resolved.guard > 0) { addLinePart(enemy.id, `${resolved.guard} guard`); }
          });
          break;
        }
        case "gain_guard_self":
          appendPreviewPart(heroParts, `Guard +${getCardPreviewSupportValue(combat, instance, effect) + combat.hero.guardBonus}`);
          break;
        case "gain_guard_party": {
          const amount = getCardPreviewSupportValue(combat, instance, effect) + combat.hero.guardBonus;
          appendPreviewPart(heroParts, `Guard +${amount}`);
          if (combat.mercenary.alive) {
            appendPreviewPart(mercParts, `Guard +${amount}`);
          }
          break;
        }
        case "heal_hero": {
          const amount = getCardPreviewSupportValue(combat, instance, effect);
          const healed = Math.max(0, Math.min(combat.hero.maxLife - heroLife, amount));
          if (healed > 0) {
            appendPreviewPart(heroParts, `Heal ${healed}`);
            heroLife = Math.min(combat.hero.maxLife, heroLife + amount);
          }
          break;
        }
        case "heal_mercenary": {
          if (!combat.mercenary.alive) { break; }
          const amount = getCardPreviewSupportValue(combat, instance, effect);
          const healed = Math.max(0, Math.min(combat.mercenary.maxLife - mercLife, amount));
          if (healed > 0) {
            appendPreviewPart(mercParts, `Heal ${healed}`);
            mercLife = Math.min(combat.mercenary.maxLife, mercLife + amount);
          }
          break;
        }
        case "draw":
          appendPreviewPart(heroParts, `Draw ${effect.value}`);
          break;
        case "mark_enemy_for_mercenary":
          appendPreviewPart(targetParts, `Mark +${getCardPreviewSupportValue(combat, instance, effect)}`);
          break;
        case "buff_mercenary_next_attack":
          appendPreviewPart(mercParts, `Atk +${getCardPreviewSupportValue(combat, instance, effect)}`);
          break;
        case "apply_burn":
          appendPreviewPart(targetParts, `Burn ${Math.max(0, effect.value + combat.hero.burnBonus)}`);
          break;
        case "apply_burn_all":
          linePreview.forEach((enemy) => addLinePart(enemy.id, `Burn ${Math.max(0, effect.value + combat.hero.burnBonus)}`));
          break;
        case "apply_poison":
          appendPreviewPart(targetParts, `Poison ${effect.value}`);
          break;
        case "apply_poison_all":
          linePreview.forEach((enemy) => addLinePart(enemy.id, `Poison ${effect.value}`));
          break;
        case "apply_slow":
          appendPreviewPart(targetParts, `Slow ${effect.value}`);
          break;
        case "apply_slow_all":
          linePreview.forEach((enemy) => addLinePart(enemy.id, `Slow ${effect.value}`));
          break;
        case "apply_freeze":
          appendPreviewPart(targetParts, `Freeze ${effect.value}`);
          break;
        case "apply_freeze_all":
          linePreview.forEach((enemy) => addLinePart(enemy.id, `Freeze ${effect.value}`));
          break;
        case "apply_stun":
          appendPreviewPart(targetParts, "Stun");
          break;
        case "apply_stun_all":
          linePreview.forEach((enemy) => addLinePart(enemy.id, "Stun"));
          break;
        case "apply_paralyze":
          appendPreviewPart(targetParts, `Paralyze ${effect.value}`);
          break;
        case "apply_paralyze_all":
          linePreview.forEach((enemy) => addLinePart(enemy.id, `Paralyze ${effect.value}`));
          break;
        default:
          break;
      }
    });

    return {
      selectedEnemy: formatPreviewParts(targetParts),
      hero: formatPreviewParts(heroParts),
      mercenary: formatPreviewParts(mercParts),
      enemyLine: Object.fromEntries(Array.from(lineParts.entries()).map(([enemyId, parts]) => [enemyId, formatPreviewParts(parts)])),
    };
  }

  function buildMeleePreviewReadouts(combat: CombatState) {
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
    if (!selectedEnemy || !combat.weaponDamageBonus) {
      return { selectedEnemy: "" };
    }
    const preferred = Array.isArray(combat.classPreferredFamilies) ? combat.classPreferredFamilies : [];
    const familyMatch = preferred.includes(combat.weaponFamily || "");
    let damage = familyMatch ? combat.weaponDamageBonus + 4 : combat.weaponDamageBonus;
    if (combat.hero.weaken > 0) {
      damage = Math.max(1, Math.floor(damage * 0.7));
    }

    const blocked = Math.min(selectedEnemy.guard, damage);
    const dealt = Math.max(0, damage - blocked);
    return {
      selectedEnemy: formatPreviewParts([
        dealt > 0 ? `${dealt} strike` : "",
        blocked > 0 ? `${blocked} guard` : "",
      ].filter(Boolean)),
    };
  }

  function clearSpritePreviewReadouts(): void {
    root.querySelectorAll(".sprite__preview-readout").forEach((el) => el.remove());
  }

  function setSpritePreviewReadout(spriteEl: HTMLElement, text: string, toneClass: string): void {
    if (!text) {
      return;
    }
    const bars = spriteEl.querySelector(".sprite__bars") as HTMLElement | null;
    if (!bars) {
      return;
    }
    const readout = document.createElement("div");
    readout.className = `sprite__preview-readout ${toneClass}`;
    readout.textContent = text;
    bars.appendChild(readout);
  }

  function clearTilt(): void {
    if (currentTiltCard) {
      currentTiltCard.style.removeProperty("transform");
      currentTiltCard = null;
    }
  }

  function clearCombatTargetPreview(): void {
    root.querySelectorAll(".sprite--preview-target").forEach((el) => el.classList.remove("sprite--preview-target"));
    root.querySelectorAll(".sprite--preview-support").forEach((el) => el.classList.remove("sprite--preview-support"));
    root.querySelectorAll(".sprite--preview-line").forEach((el) => el.classList.remove("sprite--preview-line"));
    clearSpritePreviewReadouts();
    const deckChip = root.querySelector(".combat-command__deck-target") as HTMLElement | null;
    if (deckChip) {
      deckChip.classList.remove("combat-command__deck-target--hot");
      const defaultChip = deckChip.dataset.defaultChip || "";
      if (defaultChip) {
        deckChip.textContent = defaultChip;
      }
    }
    currentTargetPreviewSource = null;
  }

  function applyCombatTargetPreview(sourceEl: HTMLElement | null): void {
    if (!sourceEl || sourceEl === currentTargetPreviewSource) {
      return;
    }

    clearCombatTargetPreview();

    const previewScopes = (sourceEl.dataset.previewScope || "").split(",").map((scope) => scope.trim()).filter(Boolean);
    const isPlayable = (sourceEl.dataset.cardPlayable || "true") !== "false" && !sourceEl.hasAttribute("disabled");
    if (previewScopes.length === 0 && sourceEl.dataset.previewTarget === "enemy") {
      previewScopes.push("selected_enemy");
    }
    if (previewScopes.length === 0 || !isPlayable) {
      return;
    }

    const selectedEnemy = root.querySelector(".sprite--enemy.sprite--targeted") as HTMLElement | null;
    const enemySprites = Array.from(root.querySelectorAll(".sprite--enemy:not(.sprite--dead)")) as HTMLElement[];
    const allySprites = Array.from(root.querySelectorAll(".stage__allies .sprite:not(.sprite--dead)")) as HTMLElement[];
    const heroSprite = allySprites[0] || null;
    const mercSprite = allySprites[1] || null;
    const deckChip = root.querySelector(".combat-command__deck-target") as HTMLElement | null;
    if (!deckChip) {
      return;
    }
    let readouts = { selectedEnemy: "", hero: "", mercenary: "", enemyLine: {} as Record<string, string> };
    if (appState?.combat) {
      if (sourceEl.dataset.action === "melee-strike") {
        readouts = { ...buildMeleePreviewReadouts(appState.combat), hero: "", mercenary: "", enemyLine: {} as Record<string, string> };
      } else {
        readouts = buildCardUnitPreviewReadouts(appState.combat, appState.content, sourceEl.dataset.instanceId || "");
      }
    }

    const previewTitle = sourceEl.dataset.cardTitle || sourceEl.dataset.previewTitle || "Targeted Skill";
    const previewLabel = sourceEl.dataset.previewLabel || "Effect";
    const previewOutcome = sourceEl.dataset.previewOutcome || "";
    const needsSelectedEnemy = previewScopes.includes("selected_enemy");
    if (needsSelectedEnemy && !selectedEnemy) {
      deckChip.classList.add("combat-command__deck-target--hot");
      deckChip.textContent = previewOutcome
        ? `${previewTitle} -> Choose Target · ${previewOutcome}`
        : `${previewTitle} -> Choose Target`;
      currentTargetPreviewSource = sourceEl;
      return;
    }

    if (previewScopes.includes("selected_enemy") && selectedEnemy) {
      selectedEnemy.classList.add("sprite--preview-target");
      setSpritePreviewReadout(selectedEnemy, readouts.selectedEnemy, "sprite__preview-readout--target");
    }
    if (previewScopes.includes("enemy_line")) {
      enemySprites.forEach((sprite) => {
        sprite.classList.add("sprite--preview-line");
        setSpritePreviewReadout(
          sprite,
          readouts.enemyLine[sprite.dataset.enemyId || ""] || "",
          "sprite__preview-readout--line"
        );
      });
    }
    if (previewScopes.includes("party")) {
      if (heroSprite) {
        heroSprite.classList.add("sprite--preview-support");
        setSpritePreviewReadout(heroSprite, readouts.hero, "sprite__preview-readout--support");
      }
      if (mercSprite) {
        mercSprite.classList.add("sprite--preview-support");
        setSpritePreviewReadout(mercSprite, readouts.mercenary, "sprite__preview-readout--support");
      }
    } else {
      if (previewScopes.includes("hero") && heroSprite) {
        heroSprite.classList.add("sprite--preview-support");
        setSpritePreviewReadout(heroSprite, readouts.hero, "sprite__preview-readout--support");
      }
      if (previewScopes.includes("mercenary") && mercSprite) {
        mercSprite.classList.add("sprite--preview-support");
        setSpritePreviewReadout(mercSprite, readouts.mercenary, "sprite__preview-readout--support");
      }
    }

    deckChip.classList.add("combat-command__deck-target--hot");
    if (previewScopes.length === 1 && previewScopes[0] === "selected_enemy" && selectedEnemy) {
      const enemyName = selectedEnemy.dataset.enemyName || "Target";
      deckChip.textContent = previewOutcome
        ? `${previewTitle} -> ${enemyName} · ${previewOutcome}`
        : `${previewTitle} -> ${enemyName}`;
    } else {
      deckChip.textContent = previewOutcome
        ? `${previewTitle} -> ${previewLabel} · ${previewOutcome}`
        : `${previewTitle} -> ${previewLabel}`;
    }
    currentTargetPreviewSource = sourceEl;
  }

  root.addEventListener("mousemove", (event) => {
    const card = (event.target as Element).closest?.(".fan-card") as HTMLElement | null;
    if (!card || card.classList.contains("fan-card--disabled")) {
      clearTilt();
      return;
    }
    if (card !== currentTiltCard) {
      clearTilt();
      currentTiltCard = card;
    }
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * 14;
    const tiltY = (x - 0.5) * 14;
    card.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-10px) scale(1.08)`;
  });

  root.addEventListener("mousemove", (event) => {
    const previewSource = (event.target as Element).closest?.(".fan-card,[data-preview-target]") as HTMLElement | null;
    if (!previewSource) {
      clearCombatTargetPreview();
      return;
    }
    applyCombatTargetPreview(previewSource);
  });

  root.addEventListener("mouseleave", () => {
    clearTilt();
    clearCombatTargetPreview();
  }, true);

  /* ── Parallax backdrop on mouse ── */

  root.addEventListener("mousemove", (event) => {
    const backdrop = root.querySelector(".stage__backdrop") as HTMLElement | null;
    if (!backdrop) { return; }
    const x = (event.clientX / window.innerWidth - 0.5) * 6;
    const y = (event.clientY / window.innerHeight - 0.5) * 4;
    backdrop.style.transform = `translate(${x}px, ${y}px) scale(1.02)`;
  });

  if (window.ROGUE_AUTH) {
    window.ROGUE_AUTH.initializeGoogleAuth();
    window.ROGUE_AUTH.onAuthChange(() => render());
  }

  render();

  seedLoader
    .loadSeedBundle()
    .then((seedBundle) => {
      const classRuntimeContent = classRegistry.createRuntimeContent(baseContent, seedBundle);
      const itemizedContent = itemSystem.createRuntimeContent(classRuntimeContent, seedBundle);
      const runtimeContent = encounterRegistry.createRuntimeContent(itemizedContent, seedBundle);
      appState = appEngine.createAppState({
        content: runtimeContent,
        seedBundle,
        combatEngine,
      });
      bootState.status = "ready";
      render();
    })
    .catch((error) => {
      bootState.status = "error";
      bootState.error = error instanceof Error ? error.message : String(error);
      render();
    });
})();
