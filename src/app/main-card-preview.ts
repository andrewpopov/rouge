(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function initCardPreview(
    root: HTMLElement,
    getAppState: () => AppState | null
  ): void {
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
      targetEnemyId: string;
      selectedEnemy: string;
      hero: string;
      mercenary: string;
      enemyLine: Record<string, string>;
      deck: string;
      deckLabel: string;
    } {
      const instance = combat.hand.find((entry) => entry.instanceId === instanceId);
      const card = instance ? content.cardCatalog[instance.cardId] : null;
      if (!instance || !card) {
        return { targetEnemyId: "", selectedEnemy: "", hero: "", mercenary: "", enemyLine: {}, deck: "", deckLabel: "" };
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
        targetEnemyId: selectedEnemy?.id || "",
        selectedEnemy: formatPreviewParts(targetParts),
        hero: formatPreviewParts(heroParts),
        mercenary: formatPreviewParts(mercParts),
        enemyLine: Object.fromEntries(Array.from(lineParts.entries()).map(([enemyId, parts]) => [enemyId, formatPreviewParts(parts)])),
        deck: "",
        deckLabel: "",
      };
    }

    function buildMeleePreviewReadouts(combat: CombatState) {
      const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
      if (!selectedEnemy || !combat.weaponDamageBonus) {
        return { targetEnemyId: "", selectedEnemy: "", deck: "", deckLabel: "" };
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
        targetEnemyId: selectedEnemy.id,
        selectedEnemy: formatPreviewParts([
          dealt > 0 ? `${dealt} strike` : "",
          blocked > 0 ? `${blocked} guard` : "",
        ].filter(Boolean)),
        deck: "",
        deckLabel: "",
      };
    }

    function chooseMinionPreviewTarget(combat: CombatState, minion: CombatMinionState) {
      const livingEnemies = combat.enemies.filter((enemy) => enemy.alive);
      if (livingEnemies.length === 0) {
        return null;
      }
      if (minion.targetRule === "lowest_life") {
        return livingEnemies
          .slice()
          .sort((left, right) => {
            if (left.life !== right.life) {
              return left.life - right.life;
            }
            return left.guard - right.guard;
          })[0] || null;
      }
      const selected = livingEnemies.find((enemy) => enemy.id === combat.selectedEnemyId);
      return selected || livingEnemies[0] || null;
    }

    function _getSkillPreviewTierScale(skill: CombatEquippedSkillState): number {
      if (skill.slot === 3 || skill.tier === "capstone") {
        return 3;
      }
      if (skill.slot === 2 || skill.tier === "bridge") {
        return 2;
      }
      return 1;
    }

    function buildExactSkillPreviewReadouts(
      combat: CombatState,
      skill: CombatEquippedSkillState
    ): {
      targetEnemyId: string;
      selectedEnemy: string;
      hero: string;
      mercenary: string;
      enemyLine: Record<string, string>;
      deck: string;
      deckLabel: string;
    } | null {
      const result = runtimeWindow.__ROUGE_MAIN_SKILL_PREVIEW_READOUTS?.buildExactSkillPreviewReadouts?.(
        combat, skill, { appendPreviewPart, formatPreviewParts, applyPreviewEnemyDamage }
      );
      if (!result) {
        return null;
      }
      return { ...(result as unknown as { targetEnemyId: string; selectedEnemy: string; hero: string; mercenary: string; enemyLine: Record<string, string>; deck: string }), deckLabel: "" };
    }

    function buildMinionPreviewReadouts(combat: CombatState, minionId: string) {
      const minion = Array.isArray(combat.minions) ? combat.minions.find((entry) => entry.id === minionId) : null;
      if (!minion) {
        return { targetEnemyId: "", selectedEnemy: "", hero: "", mercenary: "", enemyLine: {} as Record<string, string>, deck: "", deckLabel: "" };
      }

      const targetEnemy = chooseMinionPreviewTarget(combat, minion);
      const targetPreview = targetEnemy ? { guard: targetEnemy.guard, life: targetEnemy.life } : null;
      const targetParts: string[] = [];
      const heroParts: string[] = [];
      const mercParts: string[] = [];
      const lineParts = new Map<string, string[]>();

      const addLinePart = (enemyId: string, text: string) => {
        if (!text) {
          return;
        }
        if (!lineParts.has(enemyId)) {
          lineParts.set(enemyId, []);
        }
        appendPreviewPart(lineParts.get(enemyId)!, text);
      };

      const addTargetDamage = (amount: number) => {
        if (!targetPreview) {
          return;
        }
        const resolved = applyPreviewEnemyDamage(targetPreview, amount);
        if (resolved.life > 0) { appendPreviewPart(targetParts, `${resolved.life} dmg`); }
        if (resolved.guard > 0) { appendPreviewPart(targetParts, `${resolved.guard} guard`); }
      };

      switch (minion.actionKind) {
        case "attack":
          addTargetDamage(minion.power);
          break;
        case "attack_mark":
          addTargetDamage(minion.power);
          appendPreviewPart(targetParts, `Mark +${minion.secondaryValue}`);
          appendPreviewPart(mercParts, `Atk +${minion.secondaryValue}`);
          break;
        case "attack_poison":
          addTargetDamage(minion.power);
          appendPreviewPart(targetParts, `Poison ${minion.secondaryValue}`);
          break;
        case "attack_guard_party":
          addTargetDamage(minion.power);
          appendPreviewPart(heroParts, `Guard +${minion.secondaryValue}`);
          if (combat.mercenary.alive) {
            appendPreviewPart(mercParts, `Guard +${minion.secondaryValue}`);
          }
          break;
        case "attack_heal_hero":
          addTargetDamage(minion.power);
          appendPreviewPart(heroParts, `Heal ${minion.secondaryValue}`);
          break;
        case "heal_party":
          appendPreviewPart(heroParts, `Heal ${minion.power}`);
          if (combat.mercenary.alive) {
            appendPreviewPart(mercParts, `Heal ${minion.power}`);
          }
          break;
        case "buff_mercenary_guard_party":
          appendPreviewPart(heroParts, `Guard +${minion.secondaryValue}`);
          if (combat.mercenary.alive) {
            appendPreviewPart(mercParts, `Atk +${minion.power}`);
            appendPreviewPart(mercParts, `Guard +${minion.secondaryValue}`);
          }
          break;
        case "attack_all_burn":
          combat.enemies
            .filter((enemy) => enemy.alive)
            .forEach((enemy) => {
              const previewEnemy = { guard: enemy.guard, life: enemy.life };
              const resolved = applyPreviewEnemyDamage(previewEnemy, minion.power);
              if (resolved.life > 0) { addLinePart(enemy.id, `${resolved.life} dmg`); }
              if (resolved.guard > 0) { addLinePart(enemy.id, `${resolved.guard} guard`); }
              addLinePart(enemy.id, `Burn ${minion.secondaryValue}`);
            });
          break;
        case "attack_all_paralyze":
          combat.enemies
            .filter((enemy) => enemy.alive)
            .forEach((enemy) => {
              const previewEnemy = { guard: enemy.guard, life: enemy.life };
              const resolved = applyPreviewEnemyDamage(previewEnemy, minion.power);
              if (resolved.life > 0) { addLinePart(enemy.id, `${resolved.life} dmg`); }
              if (resolved.guard > 0) { addLinePart(enemy.id, `${resolved.guard} guard`); }
              addLinePart(enemy.id, `Paralyze ${minion.secondaryValue}`);
            });
          break;
        default:
          break;
      }

      return {
        targetEnemyId: targetEnemy?.id || "",
        selectedEnemy: formatPreviewParts(targetParts),
        hero: formatPreviewParts(heroParts),
        mercenary: formatPreviewParts(mercParts),
        enemyLine: Object.fromEntries(Array.from(lineParts.entries()).map(([enemyId, parts]) => [enemyId, formatPreviewParts(parts)])),
        deck: "",
        deckLabel: "",
      };
    }

    function getDeckLabel(skill: CombatEquippedSkillState): string {
      if (skill.active) { return "Next Card"; }
      if (skill.skillType === "summon") { return "Summon State"; }
      return "Opening State";
    }

    function buildSkillPreviewReadouts(combat: CombatState, slotKey: string) {
      const skill = combat.equippedSkills.find((entry) => entry.slotKey === slotKey);
      if (!skill) {
        return { targetEnemyId: "", selectedEnemy: "", hero: "", mercenary: "", enemyLine: {} as Record<string, string>, deck: "", deckLabel: "" };
      }

      const exactReadouts = buildExactSkillPreviewReadouts(combat, skill);
      if (exactReadouts) {
        return {
          ...exactReadouts,
          deckLabel: exactReadouts.deck ? getDeckLabel(skill) : "",
        };
      }

      const previewApi = window.__ROUGE_COMBAT_VIEW_PREVIEW;
      const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
      const previewScopes = previewApi?.deriveSkillPreviewScopes?.(skill) || [];
      const previewOutcome = previewApi?.buildSkillPreviewOutcome?.(combat, skill, selectedEnemy) || skill.summary || "";
      const summary = previewApi?.summarizePreviewOutcome?.(previewOutcome) || previewOutcome;
      const deck = formatPreviewParts((previewApi?.getExactSkillModifierPreviewParts?.(skill, combat) || []) as string[]);
      const enemyLine: Record<string, string> = {};
      if (previewScopes.includes("enemy_line")) {
        combat.enemies
          .filter((enemy) => enemy.alive)
          .forEach((enemy) => {
            enemyLine[enemy.id] = summary;
          });
      }

      return {
        targetEnemyId: selectedEnemy?.id || "",
        selectedEnemy: previewScopes.includes("selected_enemy") ? summary : "",
        hero: previewScopes.includes("party") || previewScopes.includes("hero") ? summary : "",
        mercenary: previewScopes.includes("party") || previewScopes.includes("mercenary") ? summary : "",
        enemyLine,
        deck,
        deckLabel: deck ? getDeckLabel(skill) : "",
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
      const previewAllowDisabled = sourceEl.dataset.previewAllowDisabled === "true";
      const isPlayable = (sourceEl.dataset.cardPlayable || "true") !== "false" && (previewAllowDisabled || !sourceEl.hasAttribute("disabled"));
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
      let readouts = { targetEnemyId: "", selectedEnemy: "", hero: "", mercenary: "", enemyLine: {} as Record<string, string>, deck: "", deckLabel: "" };
      if (getAppState()?.combat) {
        if (sourceEl.dataset.action === "melee-strike") {
          readouts = { ...buildMeleePreviewReadouts(getAppState().combat), hero: "", mercenary: "", enemyLine: {} as Record<string, string> };
        } else if (sourceEl.dataset.action === "use-combat-skill") {
          readouts = buildSkillPreviewReadouts(getAppState().combat, sourceEl.dataset.slotKey || "");
        } else if (sourceEl.dataset.previewMinionId) {
          readouts = buildMinionPreviewReadouts(getAppState().combat, sourceEl.dataset.previewMinionId);
        } else {
          readouts = buildCardUnitPreviewReadouts(getAppState().combat, getAppState().content, sourceEl.dataset.instanceId || "");
        }
      }

      const previewTitle = sourceEl.dataset.cardTitle || sourceEl.dataset.previewTitle || "Targeted Skill";
      const previewLabel = sourceEl.dataset.previewLabel || "Effect";
      const previewOutcome = sourceEl.dataset.previewOutcome || "";
      const previewEnemyEl = (readouts.targetEnemyId
        ? enemySprites.find((sprite) => sprite.dataset.enemyId === readouts.targetEnemyId) || null
        : selectedEnemy);
      const needsSelectedEnemy = previewScopes.includes("selected_enemy");
      if (needsSelectedEnemy && !previewEnemyEl) {
        deckChip.classList.add("combat-command__deck-target--hot");
        let chipText = `${previewTitle} -> Choose Target`;
        if (readouts.deck) {
          chipText = `${previewTitle} -> ${readouts.deckLabel || "Choose Target"} · ${readouts.deck}`;
        } else if (previewOutcome) {
          chipText = `${previewTitle} -> Choose Target · ${previewOutcome}`;
        }
        deckChip.textContent = chipText;
        currentTargetPreviewSource = sourceEl;
        return;
      }

      if (previewScopes.includes("selected_enemy") && previewEnemyEl) {
        previewEnemyEl.classList.add("sprite--preview-target");
        setSpritePreviewReadout(previewEnemyEl, readouts.selectedEnemy, "sprite__preview-readout--target");
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
      if (readouts.deck) {
        deckChip.textContent = `${previewTitle} -> ${readouts.deckLabel || "Next Card"} · ${readouts.deck}`;
      } else if (previewScopes.length === 1 && previewScopes[0] === "selected_enemy" && previewEnemyEl) {
        const enemyName = previewEnemyEl.dataset.enemyName || "Target";
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
      const previewSource = (event.target as Element).closest?.(".fan-card,[data-preview-target],[data-preview-scope]") as HTMLElement | null;
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
  }

  runtimeWindow.__ROUGE_MAIN_CARD_PREVIEW = { initCardPreview };
})();
