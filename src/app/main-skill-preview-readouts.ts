(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getSkillTierScale(skill: CombatEquippedSkillState): number {
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
    skill: CombatEquippedSkillState,
    helpers: {
      appendPreviewPart: (parts: string[], text: string) => void;
      formatPreviewParts: (parts: string[]) => string;
      applyPreviewEnemyDamage: (enemy: { guard: number; life: number }, damage: number) => { life: number; guard: number };
    }
  ): {
    targetEnemyId: string;
    selectedEnemy: string;
    hero: string;
    mercenary: string;
    enemyLine: Record<string, string>;
    deck: string;
    } | null {
    const { appendPreviewPart, formatPreviewParts, applyPreviewEnemyDamage } = helpers;
    if (!skill.active) {
      const passive = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS?.buildPassiveSkillOpeningPreview?.(combat, skill);
      if (!passive) {
        return null;
      }
      return {
        targetEnemyId: "",
        selectedEnemy: "",
        hero: formatPreviewParts(passive.hero || []),
        mercenary: formatPreviewParts(passive.mercenary || []),
        enemyLine: {},
        deck: formatPreviewParts(passive.deck || []),
      };
    }
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;
    const targetPreview = selectedEnemy ? { guard: selectedEnemy.guard, life: selectedEnemy.life } : null;
    const linePreview = combat.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({ id: enemy.id, guard: enemy.guard, life: enemy.life }));

    const targetParts: string[] = [];
    const heroParts: string[] = [];
    const mercParts: string[] = [];
    const deckParts = (runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW?.getExactSkillModifierPreviewParts?.(skill) || []) as string[];
    const lineParts = new Map<string, string[]>();
    const scale = getSkillTierScale(skill);

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
      if (resolved.life > 0) {
        appendPreviewPart(targetParts, `${resolved.life} dmg`);
      }
      if (resolved.guard > 0) {
        appendPreviewPart(targetParts, `${resolved.guard} guard`);
      }
    };

    const addLineDamage = (amount: number) => {
      linePreview.forEach((enemy) => {
        const resolved = applyPreviewEnemyDamage(enemy, amount);
        if (resolved.life > 0) {
          addLinePart(enemy.id, `${resolved.life} dmg`);
        }
        if (resolved.guard > 0) {
          addLinePart(enemy.id, `${resolved.guard} guard`);
        }
      });
    };

    switch (skill.skillId) {
      case "amazon_lightning_strike": {
        addTargetDamage(6 + scale);
        appendPreviewPart(targetParts, `Paralyze ${scale + 2}`);
        const otherEnemy = linePreview.find((enemy) => enemy.id !== selectedEnemy?.id) || null;
        if (otherEnemy) {
          const resolved = applyPreviewEnemyDamage(otherEnemy, 2 + scale);
          if (resolved.life > 0) { addLinePart(otherEnemy.id, `${resolved.life} dmg`); }
          if (resolved.guard > 0) { addLinePart(otherEnemy.id, `${resolved.guard} guard`); }
          addLinePart(otherEnemy.id, `Paralyze ${scale}`);
        }
        break;
      }
      case "amazon_freezing_arrow":
        addTargetDamage(4 + scale);
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Freeze ${scale + 1}`);
          addLinePart(enemy.id, `Slow ${scale + 1}`);
        });
        break;
      case "assassin_phoenix_strike":
        addTargetDamage(5 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Burn ${scale + 1}`));
        break;
      case "barbarian_whirlwind":
        addLineDamage(3 + scale);
        break;
      case "barbarian_grim_ward":
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Slow ${scale + 2}`);
          addLinePart(enemy.id, "Stun");
        });
        appendPreviewPart(heroParts, `Guard +${3 + scale}`);
        break;
      case "barbarian_battle_command":
        appendPreviewPart(heroParts, "Draw 1");
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Atk +${scale + 3}`);
        }
        break;
      case "barbarian_war_cry":
        addLineDamage(2 + scale);
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Slow ${scale + 1}`);
          addLinePart(enemy.id, "Stun");
        });
        break;
      case "paladin_conviction":
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Slow ${scale + 1}`);
          addLinePart(enemy.id, `Paralyze ${scale}`);
        });
        break;
      case "paladin_fist_of_the_heavens":
        addTargetDamage(6 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Paralyze ${scale + 1}`));
        break;
      case "paladin_holy_shock":
        addLineDamage(2 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Paralyze ${scale + 1}`));
        break;
      case "sorceress_meteor": {
        addTargetDamage(6 + scale);
        appendPreviewPart(targetParts, `Burn ${3 + scale}`);
        const splashEnemy = linePreview.find((enemy) => enemy.id !== selectedEnemy?.id) || null;
        if (splashEnemy) {
          const resolved = applyPreviewEnemyDamage(splashEnemy, 2 + scale);
          if (resolved.life > 0) { addLinePart(splashEnemy.id, `${resolved.life} dmg`); }
          if (resolved.guard > 0) { addLinePart(splashEnemy.id, `${resolved.guard} guard`); }
          addLinePart(splashEnemy.id, `Burn ${scale + 1}`);
        }
        break;
      }
      case "amazon_lightning_fury":
        addLineDamage(3 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Paralyze ${scale + 1}`));
        break;
      case "druid_shock_wave":
        addTargetDamage(4 + scale);
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Slow ${scale + 1}`);
          addLinePart(enemy.id, "Stun");
        });
        appendPreviewPart(heroParts, `Guard +${scale}`);
        break;
      case "sorceress_frozen_orb":
        addLineDamage(3 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Freeze ${scale + 1}`));
        break;
      case "sorceress_blizzard":
        addLineDamage(3 + scale);
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Freeze ${scale + 1}`);
          addLinePart(enemy.id, `Slow ${scale + 1}`);
        });
        break;
      case "druid_volcano":
        addTargetDamage(5 + scale);
        appendPreviewPart(targetParts, `Burn ${2 + scale}`);
        appendPreviewPart(targetParts, `Slow ${scale + 1}`);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Burn ${scale}`));
        break;
      case "druid_armageddon":
        addLineDamage(3 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Burn ${scale + 2}`));
        break;
      case "druid_hurricane":
        addLineDamage(2 + scale);
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Freeze ${scale + 1}`);
          addLinePart(enemy.id, `Slow ${scale + 1}`);
        });
        break;
      case "necromancer_decrepify":
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Slow ${scale + 2}`);
          addLinePart(enemy.id, `Freeze ${scale + 1}`);
        });
        break;
      case "necromancer_poison_nova":
        addLineDamage(1 + scale);
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Poison ${scale + 2}`));
        break;
      case "necromancer_lower_resist":
        linePreview.forEach((enemy) => {
          addLinePart(enemy.id, `Burn ${scale}`);
          addLinePart(enemy.id, `Poison ${scale}`);
          addLinePart(enemy.id, `Paralyze ${scale}`);
        });
        break;
      case "necromancer_bone_prison":
        appendPreviewPart(heroParts, `Guard +${4 + scale}`);
        appendPreviewPart(targetParts, `Freeze ${scale + 2}`);
        appendPreviewPart(targetParts, `Slow ${scale + 2}`);
        break;
      case "paladin_meditation":
        appendPreviewPart(heroParts, `Heal ${3 + scale}`);
        appendPreviewPart(heroParts, "Draw 1");
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Heal ${3 + scale}`);
          appendPreviewPart(mercParts, "Draw 1");
        }
        break;
      case "paladin_redemption":
        appendPreviewPart(heroParts, `Heal ${4 + scale}`);
        appendPreviewPart(heroParts, `Guard +${3 + scale}`);
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Heal ${4 + scale}`);
          appendPreviewPart(mercParts, `Guard +${2 + scale}`);
        }
        break;
      case "paladin_salvation":
        appendPreviewPart(heroParts, `Guard +${5 + scale}`);
        appendPreviewPart(heroParts, "Draw 1");
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Guard +${4 + scale}`);
          appendPreviewPart(mercParts, "Draw 1");
        }
        break;
      case "barbarian_battle_orders":
        appendPreviewPart(heroParts, `Heal ${3 + scale}`);
        appendPreviewPart(heroParts, `Guard +${4 + scale}`);
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Heal ${3 + scale}`);
          appendPreviewPart(mercParts, `Guard +${3 + scale}`);
        }
        break;
      case "paladin_sanctuary":
        addTargetDamage(4 + scale);
        appendPreviewPart(targetParts, `Slow ${scale + 1}`);
        appendPreviewPart(heroParts, `Guard +${4 + scale}`);
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Guard +${3 + scale}`);
        }
        break;
      case "paladin_fanaticism":
        if (combat.mercenary.alive) {
          appendPreviewPart(mercParts, `Atk +${scale + 3}`);
        }
        break;
      case "sorceress_chilling_armor":
        appendPreviewPart(heroParts, `Guard +${5 + scale}`);
        break;
      case "sorceress_energy_shield":
        appendPreviewPart(heroParts, `Guard +${6 + scale}`);
        appendPreviewPart(heroParts, `Heal ${2 + scale}`);
        break;
      case "sorceress_thunder_storm":
        linePreview.forEach((enemy) => addLinePart(enemy.id, `Paralyze ${scale + 1}`));
        break;
      default:
        return null;
    }

    return {
      targetEnemyId: selectedEnemy?.id || "",
      selectedEnemy: formatPreviewParts(targetParts),
      hero: formatPreviewParts(heroParts),
      mercenary: formatPreviewParts(mercParts),
      enemyLine: Object.fromEntries(Array.from(lineParts.entries()).map(([enemyId, parts]) => [enemyId, formatPreviewParts(parts)])),
      deck: formatPreviewParts(deckParts),
    };
  }

  runtimeWindow.__ROUGE_MAIN_SKILL_PREVIEW_READOUTS = {
    buildExactSkillPreviewReadouts,
  };
})();
