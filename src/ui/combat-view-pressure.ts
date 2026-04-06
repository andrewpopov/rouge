(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ATTACK_INTENT_KINDS } = runtimeWindow.ROUGE_COMBAT_MODIFIERS || {
    ATTACK_INTENT_KINDS: new Set<EnemyIntentKind>([
      "attack",
      "attack_all",
      "attack_and_guard",
      "drain_attack",
      "sunder_attack",
      "attack_burn",
      "attack_burn_all",
      "attack_lightning",
      "attack_lightning_all",
      "attack_poison",
      "attack_poison_all",
      "attack_chill",
      "drain_energy",
    ]),
  };

  function buildEmptyPressureSummary(): IncomingPressureSummary {
    return {
      attackers: 0,
      suppressedAttackers: 0,
      damage: 0,
      lifeDamage: 0,
      guardBlocked: 0,
      tags: [],
      suppressedTags: [],
      lineThreat: false,
    };
  }

  function appendUniqueTag(target: string[], tag: string): void {
    if (!tag || target.includes(tag)) {
      return;
    }
    target.push(tag);
  }

  function appendPressureTag(summary: IncomingPressureSummary, tag: string): void {
    appendUniqueTag(summary.tags, tag);
  }

  function appendSuppressedPressureTag(summary: IncomingPressureSummary, tag: string): void {
    appendUniqueTag(summary.suppressedTags, tag);
  }

  function getIntentPressureTargets(combat: CombatState, intent: EnemyIntent): Array<"hero" | "mercenary"> {
    const partyTargets = [combat.hero.alive ? "hero" : null, combat.mercenary.alive ? "mercenary" : null].filter(Boolean) as Array<"hero" | "mercenary">;
    if (partyTargets.length === 0) {
      return [];
    }

    switch (intent.kind) {
      case "attack_all":
      case "attack_burn_all":
      case "attack_lightning_all":
      case "attack_poison_all":
      case "corpse_explosion":
        return partyTargets;
      case "curse_amplify":
      case "curse_weaken":
        if (combat.hero.alive) {
          return ["hero"];
        }
        if (combat.mercenary.alive) {
          return ["mercenary"];
        }
        return [];
      default:
        break;
    }

    if (intent.target === "all_allies") {
      return partyTargets;
    }
    if (intent.target === "mercenary" && combat.mercenary.alive) {
      return ["mercenary"];
    }
    if (intent.target === "lowest_life" && combat.mercenary.alive && combat.mercenary.life < combat.hero.life) {
      return ["mercenary"];
    }
    if (combat.hero.alive) {
      return ["hero"];
    }
    if (combat.mercenary.alive) {
      return ["mercenary"];
    }
    return [];
  }

  function hasEnemyTrait(enemy: CombatEnemyState, trait: MonsterTraitKind): boolean {
    return Array.isArray(enemy.traits) && enemy.traits.includes(trait);
  }

  function isIntentSuppressed(enemy: CombatEnemyState, intent: EnemyIntent): boolean {
    if (intent.kind === "teleport") {
      return false;
    }
    return enemy.freeze > 0 || enemy.stun > 0;
  }

  function getIntentDamageType(intent: EnemyIntent): DamageType {
    if (intent.damageType) {
      return intent.damageType;
    }
    switch (intent.kind) {
      case "attack_burn":
      case "attack_burn_all":
        return "fire";
      case "attack_lightning":
      case "attack_lightning_all":
        return "lightning";
      case "attack_poison":
      case "attack_poison_all":
        return "poison";
      case "attack_chill":
        return "cold";
      default:
        return "physical";
    }
  }

  function getHeroResistance(combat: CombatState, damageType: DamageType): number {
    return (combat.armorProfile?.resistances || [])
      .filter((entry) => entry.type === damageType)
      .reduce((total, entry) => {
        const amount = Number(entry.amount);
        return total + (Number.isFinite(amount) ? amount : 0);
      }, 0);
  }

  function getMitigatedIncomingDamage(
    combat: CombatState,
    target: CombatHeroState | CombatMercenaryState,
    amount: number,
    damageType: DamageType
  ): number {
    let finalAmount = Math.max(0, Math.floor(amount));
    if (target === combat.hero && combat.hero.amplify > 0) {
      finalAmount = Math.floor(finalAmount * 1.5);
      if (Array.isArray(combat.armorProfile?.immunities) && combat.armorProfile.immunities.includes(damageType)) {
        return 0;
      }
      finalAmount = Math.max(0, finalAmount - getHeroResistance(combat, damageType));
    }
    return Math.max(0, finalAmount);
  }

  function getIntentPressureDamage(combat: CombatState, enemy: CombatEnemyState, intent: EnemyIntent): number {
    let intentValue = Math.max(0, intent.value);
    if (enemy.buffedAttack && enemy.buffedAttack > 0 && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue += enemy.buffedAttack;
    }
    if (hasEnemyTrait(enemy, "frenzy") && enemy.life <= Math.ceil(enemy.maxLife / 2) && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
    }
    if (hasEnemyTrait(enemy, "extra_strong") && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
    }
    if (enemy.paralyze > 0 && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.max(1, Math.floor(intentValue / 2));
    }

    switch (intent.kind) {
      case "attack":
      case "attack_all":
      case "attack_and_guard":
      case "drain_attack":
      case "sunder_attack":
      case "attack_burn":
      case "attack_burn_all":
      case "attack_lightning":
      case "attack_lightning_all":
      case "attack_poison":
      case "attack_poison_all":
      case "attack_chill":
      case "drain_energy":
        return intentValue;
      case "corpse_explosion": {
        const deadEnemies = combat.enemies.filter((corpse) => !corpse.alive && !corpse.consumed).length;
        return deadEnemies > 0 ? Math.max(2, deadEnemies * intentValue) : intentValue;
      }
      case "consume_corpse":
        return intentValue;
      default:
        return 0;
    }
  }

  function getIntentPressureTag(intent: EnemyIntent): string {
    switch (intent.kind) {
      case "attack_burn":
      case "attack_burn_all":
        return "Burn";
      case "attack_poison":
      case "attack_poison_all":
        return "Poison";
      case "attack_chill":
        return "Chill";
      case "attack_lightning":
      case "attack_lightning_all":
        return "Shock";
      case "drain_energy":
        return "Drain";
      case "curse_amplify":
        return "Amp";
      case "curse_weaken":
        return "Weak";
      case "sunder_attack":
        return "Break";
      case "drain_attack":
        return "Leech";
      case "charge":
        return "Charge";
      case "attack_and_guard":
        return "Guard";
      case "corpse_explosion":
        return "Blast";
      default:
        return "";
    }
  }

  function intentCreatesImmediatePressure(intent: EnemyIntent, damage: number): boolean {
    if (damage > 0) {
      return true;
    }
    return intent.kind === "curse_amplify" || intent.kind === "curse_weaken";
  }

  function buildIncomingPressure(combat: CombatState): { hero: IncomingPressureSummary; mercenary: IncomingPressureSummary } {
    const hero = buildEmptyPressureSummary();
    const mercenary = buildEmptyPressureSummary();

    combat.enemies.filter((enemy) => enemy.alive && enemy.currentIntent).forEach((enemy) => {
      const targets = getIntentPressureTargets(combat, enemy.currentIntent);
      if (targets.length === 0) {
        return;
      }

      const suppressed = isIntentSuppressed(enemy, enemy.currentIntent);
      const damage = getIntentPressureDamage(combat, enemy, enemy.currentIntent);
      const damageType = getIntentDamageType(enemy.currentIntent);
      const tag = getIntentPressureTag(enemy.currentIntent);
      const lineThreat = targets.length > 1;
      const immediatePressure = intentCreatesImmediatePressure(enemy.currentIntent, damage);

      targets.forEach((target) => {
        const summary = target === "hero" ? hero : mercenary;
        const targetState = target === "hero" ? combat.hero : combat.mercenary;
        const mitigatedDamage = damage > 0 ? getMitigatedIncomingDamage(combat, targetState, damage, damageType) : 0;
        const blockedDamage = Math.min(targetState.guard, mitigatedDamage);
        const lifeDamage = Math.max(0, mitigatedDamage - blockedDamage);

        if (suppressed) {
          if (immediatePressure) {
            summary.suppressedAttackers += 1;
          }
          if (tag) {
            appendSuppressedPressureTag(summary, tag);
          }
          if (lineThreat) {
            summary.lineThreat = true;
          }
          return;
        }

        if (immediatePressure) {
          summary.attackers += 1;
          summary.damage += mitigatedDamage;
          summary.guardBlocked += blockedDamage;
          summary.lifeDamage += lifeDamage;
        }
        if (tag) {
          appendPressureTag(summary, tag);
        }
        if (lineThreat) {
          summary.lineThreat = true;
        }
      });
    });

    return { hero, mercenary };
  }

  function buildEnemyIntentPresentation(
    combat: CombatState,
    enemy: CombatEnemyState | null
  ): { targetLabel: string; intentClass: string; stateLabel: string } {
    const intent = enemy?.currentIntent || null;
    if (!intent) {
      return { targetLabel: "", intentClass: "", stateLabel: "" };
    }

    const isHardControlled = Boolean(enemy) && intent.kind !== "teleport" && (enemy.freeze > 0 || enemy.stun > 0);
    const isParalyzedAttack = Boolean(enemy) && enemy.paralyze > 0 && ATTACK_INTENT_KINDS.has(intent.kind);
    const isChargeSetup = intent.kind === "charge";

    switch (intent.kind) {
      case "guard":
      case "teleport":
        return { targetLabel: "Self", intentClass: "sprite__intent--self", stateLabel: "" };
      case "guard_allies":
      case "heal_allies":
      case "buff_allies_attack":
        return { targetLabel: "Enemy Line", intentClass: "sprite__intent--line-support", stateLabel: "" };
      case "heal_ally":
      case "resurrect_ally":
        return { targetLabel: "Ally", intentClass: "sprite__intent--line-support", stateLabel: "" };
      case "summon_minion":
        return { targetLabel: "Summon", intentClass: "sprite__intent--line-support", stateLabel: "" };
      case "consume_corpse":
        return { targetLabel: "Corpse", intentClass: "sprite__intent--line-support", stateLabel: "" };
      default:
        break;
    }

    const pressureTargets = getIntentPressureTargets(combat, intent);
    const baseIntentClasses: string[] = [];
    let targetLabel = "";
    if (pressureTargets.length > 1) {
      targetLabel = "Party";
      baseIntentClasses.push("sprite__intent--party");
    } else if (pressureTargets[0] === "mercenary") {
      targetLabel = "Merc";
      baseIntentClasses.push("sprite__intent--merc");
    } else if (pressureTargets[0] === "hero") {
      targetLabel = "Hero";
      baseIntentClasses.push("sprite__intent--hero");
    }

    let stateLabel = "";
    if (isHardControlled) {
      baseIntentClasses.push("sprite__intent--controlled");
      stateLabel = enemy?.freeze > 0 ? "Frozen" : "Stunned";
    } else if (isParalyzedAttack) {
      baseIntentClasses.push("sprite__intent--hindered");
      stateLabel = "Paralyzed";
    } else if (isChargeSetup) {
      baseIntentClasses.push("sprite__intent--setup");
      stateLabel = "Next Turn";
    }

    return { targetLabel, intentClass: baseIntentClasses.join(" "), stateLabel };
  }

  function renderIncomingPressure(summary: IncomingPressureSummary, escapeHtml: (s: string) => string): string {
    const hasSignals = summary.attackers > 0 || summary.suppressedAttackers > 0 || summary.tags.length > 0 || summary.suppressedTags.length > 0;
    if (!hasSignals) {
      return `<span class="sprite__meta-spacer" aria-hidden="true"></span>`;
    }

    const detailParts: string[] = [];
    if (summary.attackers > 0) {
      if (summary.lifeDamage > 0) {
        detailParts.push(`${summary.lifeDamage} dmg`);
      }
      if (summary.guardBlocked > 0) {
        detailParts.push(summary.lifeDamage > 0 ? `${summary.guardBlocked} blocked` : "guard holds");
      }
    }
    if (summary.suppressedAttackers > 0) {
      detailParts.push(`${summary.suppressedAttackers} controlled`);
    }
    detailParts.push(...summary.tags.slice(0, 2));
    if (summary.tags.length === 0) {
      detailParts.push(...summary.suppressedTags.slice(0, 2));
    }

    let label = "Watch";
    if (summary.attackers > 0) {
      label = "Incoming";
      if (summary.lineThreat) {
        label = "Line Fire";
      } else if (summary.attackers > 1) {
        label = `${summary.attackers} Incoming`;
      }
    } else if (summary.suppressedAttackers > 0) {
      label = summary.lineThreat ? "Line Controlled" : "Controlled";
    } else if (summary.lineThreat) {
      label = "Watch Line";
    }
    const detail = detailParts.join(" · ") || (summary.attackers > 0 ? "Pressure" : "Setup");

    return `
      <div class="sprite__incoming ${summary.lineThreat ? "sprite__incoming--line" : ""}">
        <span class="sprite__incoming-label">${escapeHtml(label)}</span>
        <span class="sprite__incoming-detail">${escapeHtml(detail)}</span>
      </div>
    `;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_PRESSURE = {
    buildEmptyPressureSummary,
    buildIncomingPressure,
    buildEnemyIntentPresentation,
    renderIncomingPressure,
  };
})();
