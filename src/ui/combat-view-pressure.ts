(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function buildEmptyPressureSummary(): IncomingPressureSummary {
    return {
      attackers: 0,
      damage: 0,
      tags: [],
      lineThreat: false,
    };
  }

  function appendPressureTag(summary: IncomingPressureSummary, tag: string): void {
    if (!tag || summary.tags.includes(tag)) {
      return;
    }
    summary.tags.push(tag);
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

  function getIntentPressureDamage(combat: CombatState, intent: EnemyIntent): number {
    switch (intent.kind) {
      case "attack":
      case "attack_all":
      case "attack_and_guard":
      case "drain_attack":
      case "sunder_attack":
      case "charge":
      case "attack_burn":
      case "attack_burn_all":
      case "attack_lightning":
      case "attack_lightning_all":
      case "attack_poison":
      case "attack_poison_all":
      case "attack_chill":
      case "drain_energy":
        return Math.max(0, intent.value);
      case "corpse_explosion": {
        const deadEnemies = combat.enemies.filter((enemy) => !enemy.alive && !enemy.consumed).length;
        return deadEnemies > 0 ? Math.max(2, deadEnemies * intent.value) : Math.max(0, intent.value);
      }
      case "consume_corpse":
        return Math.max(0, intent.value);
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
      case "corpse_explosion":
        return "Blast";
      default:
        return "";
    }
  }

  function buildIncomingPressure(combat: CombatState): { hero: IncomingPressureSummary; mercenary: IncomingPressureSummary } {
    const hero = buildEmptyPressureSummary();
    const mercenary = buildEmptyPressureSummary();

    combat.enemies.filter((enemy) => enemy.alive && enemy.currentIntent).forEach((enemy) => {
      const targets = getIntentPressureTargets(combat, enemy.currentIntent);
      if (targets.length === 0) {
        return;
      }

      const damage = getIntentPressureDamage(combat, enemy.currentIntent);
      const tag = getIntentPressureTag(enemy.currentIntent);
      const lineThreat = targets.length > 1;

      targets.forEach((target) => {
        const summary = target === "hero" ? hero : mercenary;
        summary.attackers += 1;
        summary.damage += damage;
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

  function buildEnemyIntentPresentation(combat: CombatState, intent: EnemyIntent | null): { targetLabel: string; intentClass: string } {
    if (!intent) {
      return { targetLabel: "", intentClass: "" };
    }

    switch (intent.kind) {
      case "guard":
      case "teleport":
        return { targetLabel: "Self", intentClass: "sprite__intent--self" };
      case "guard_allies":
      case "heal_allies":
      case "buff_allies_attack":
        return { targetLabel: "Enemy Line", intentClass: "sprite__intent--line-support" };
      case "heal_ally":
      case "resurrect_ally":
        return { targetLabel: "Ally", intentClass: "sprite__intent--line-support" };
      case "summon_minion":
        return { targetLabel: "Summon", intentClass: "sprite__intent--line-support" };
      case "consume_corpse":
        return { targetLabel: "Corpse", intentClass: "sprite__intent--line-support" };
      default:
        break;
    }

    const pressureTargets = getIntentPressureTargets(combat, intent);
    if (pressureTargets.length > 1) {
      return { targetLabel: "Party", intentClass: "sprite__intent--party" };
    }
    if (pressureTargets[0] === "mercenary") {
      return { targetLabel: "Merc", intentClass: "sprite__intent--merc" };
    }
    if (pressureTargets[0] === "hero") {
      return { targetLabel: "Hero", intentClass: "sprite__intent--hero" };
    }

    return { targetLabel: "", intentClass: "" };
  }

  function renderIncomingPressure(summary: IncomingPressureSummary, escapeHtml: (s: string) => string): string {
    if (summary.attackers <= 0) {
      return `<span class="sprite__meta-spacer" aria-hidden="true"></span>`;
    }

    const detailParts: string[] = [];
    if (summary.damage > 0) {
      detailParts.push(`${summary.damage} dmg`);
    }
    if (summary.lineThreat) {
      detailParts.push("line");
    }
    detailParts.push(...summary.tags.slice(0, 2));

    let label = "Incoming";
    if (summary.lineThreat) {
      label = "Line Fire";
    } else if (summary.attackers > 1) {
      label = `${summary.attackers} Incoming`;
    }
    const detail = detailParts.join(" · ") || "Pressure";

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
