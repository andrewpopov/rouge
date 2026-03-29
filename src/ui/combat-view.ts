(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { getCardElement, ELEMENT_LABELS, renderExploration } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;

  function svgIcon(src: string, cls: string, alt: string): string {
    return `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  const TRAIT_BADGE: Record<string, { icon: string; label: string; css: string }> = {
    swift: { icon: "\u{1F4A8}", label: "Swift", css: "trait--swift" },
    frenzy: { icon: "\u{1F4A2}", label: "Frenzy", css: "trait--frenzy" },
    thorns: { icon: "\u{1FAB6}", label: "Thorns", css: "trait--thorns" },
    regeneration: { icon: "\u{1F49A}", label: "Regen", css: "trait--regen" },
    death_explosion: { icon: "\u{1F4A5}", label: "Volatile", css: "trait--death" },
    death_poison: { icon: "\u2620", label: "Toxic Death", css: "trait--death" },
    death_spawn: { icon: "\u{1F95A}", label: "Spawner", css: "trait--death" },
    flee_on_ally_death: { icon: "\u{1F4A8}", label: "Cowardly", css: "trait--flee" },
    extra_fast: { icon: "\u26A1", label: "Extra Fast", css: "trait--fast" },
    extra_strong: { icon: "\u{1F4AA}", label: "Extra Strong", css: "trait--strong" },
    cursed: { icon: "\u{1F480}", label: "Cursed", css: "trait--cursed" },
    cold_enchanted: { icon: "\u2744", label: "Cold Enchanted", css: "trait--cold" },
    fire_enchanted: { icon: "\u{1F525}", label: "Fire Enchanted", css: "trait--fire" },
    lightning_enchanted: { icon: "\u26A1", label: "Lightning", css: "trait--lightning" },
    stone_skin: { icon: "\u{1F6E1}", label: "Stone Skin", css: "trait--stone" },
    mana_burn: { icon: "\u{1F50B}", label: "Mana Burn", css: "trait--mana" },
  };

  function renderTraitBadges(traits: MonsterTraitKind[] | undefined): string {
    if (!traits || traits.length === 0) { return ""; }
    return traits
      .map((t) => TRAIT_BADGE[t])
      .filter(Boolean)
      .map((b) => `<span class="sprite__trait ${b.css}" title="${b.label}">${b.icon}</span>`)
      .join("");
  }

  function getEffectiveCardCost(
    combat: CombatState,
    content: GameContent,
    instance: { cardId: string },
    card: CardDefinition
  ): number {
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    const reduction = evo ? evo.getTreeCostReduction(instance.cardId, combat.deckCardIds, content.cardCatalog) : 0;
    return Math.max(0, card.cost - reduction);
  }

  function getCardPreviewAttackValue(combat: CombatState, instance: { cardId: string }, effectValue: number): number {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    const synergy = evo ? evo.getSynergyDamageBonus(instance.cardId, combat.deckCardIds) : 0;
    const weaponBonus = turns?.getWeaponAttackBonus?.(combat, instance.cardId) || 0;
    let amount = Math.max(0, effectValue + combat.hero.damageBonus + synergy + weaponBonus);
    if (combat.hero.weaken > 0) {
      amount = Math.max(1, Math.floor(amount * 0.7));
    }
    return amount;
  }

  function getCardPreviewSupportValue(combat: CombatState, instance: { cardId: string }, effect: CardEffect): number {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
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

  function buildCardPreviewOutcome(
    combat: CombatState,
    instance: { cardId: string },
    card: CardDefinition,
    selectedEnemy: CombatEnemyState | null
  ): string {
    const targetPreview = selectedEnemy ? { guard: selectedEnemy.guard, life: selectedEnemy.life } : null;
    const linePreview = combat.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({ id: enemy.id, guard: enemy.guard, life: enemy.life }));

    let singleDamage = 0;
    let singleGuardDamage = 0;
    let lineDamage = 0;
    let lineGuardDamage = 0;
    let selfGuard = 0;
    let partyGuard = 0;
    let heroHeal = 0;
    let mercHeal = 0;
    let drawCount = 0;
    let markBonus = 0;
    let mercBuff = 0;
    let burn = 0;
    let burnAll = 0;
    let poison = 0;
    let poisonAll = 0;
    let slow = 0;
    let slowAll = 0;
    let freeze = 0;
    let freezeAll = 0;
    let stun = 0;
    let stunAll = 0;
    let paralyze = 0;
    let paralyzeAll = 0;

    let heroLife = combat.hero.life;
    let mercLife = combat.mercenary.life;

    card.effects.forEach((effect) => {
      switch (effect.kind) {
        case "damage": {
          const amount = getCardPreviewAttackValue(combat, instance, effect.value);
          if (targetPreview) {
            const resolved = applyPreviewEnemyDamage(targetPreview, amount);
            singleDamage += resolved.life;
            singleGuardDamage += resolved.guard;
          } else {
            singleDamage += amount;
          }
          break;
        }
        case "damage_all": {
          const amount = getCardPreviewAttackValue(combat, instance, effect.value);
          linePreview.forEach((enemy) => {
            const resolved = applyPreviewEnemyDamage(enemy, amount);
            lineDamage += resolved.life;
            lineGuardDamage += resolved.guard;
          });
          break;
        }
        case "gain_guard_self":
          selfGuard += getCardPreviewSupportValue(combat, instance, effect) + combat.hero.guardBonus;
          break;
        case "gain_guard_party":
          partyGuard += getCardPreviewSupportValue(combat, instance, effect) + combat.hero.guardBonus;
          break;
        case "heal_hero": {
          const amount = getCardPreviewSupportValue(combat, instance, effect);
          const healed = Math.min(combat.hero.maxLife - heroLife, amount);
          heroHeal += Math.max(0, healed);
          heroLife = Math.min(combat.hero.maxLife, heroLife + amount);
          break;
        }
        case "heal_mercenary": {
          if (!combat.mercenary.alive) { break; }
          const amount = getCardPreviewSupportValue(combat, instance, effect);
          const healed = Math.min(combat.mercenary.maxLife - mercLife, amount);
          mercHeal += Math.max(0, healed);
          mercLife = Math.min(combat.mercenary.maxLife, mercLife + amount);
          break;
        }
        case "draw":
          drawCount += effect.value;
          break;
        case "mark_enemy_for_mercenary":
          markBonus += getCardPreviewSupportValue(combat, instance, effect);
          break;
        case "buff_mercenary_next_attack":
          mercBuff += getCardPreviewSupportValue(combat, instance, effect);
          break;
        case "apply_burn":
          burn += Math.max(0, effect.value + combat.hero.burnBonus);
          break;
        case "apply_burn_all":
          burnAll += Math.max(0, effect.value + combat.hero.burnBonus);
          break;
        case "apply_poison":
          poison += effect.value;
          break;
        case "apply_poison_all":
          poisonAll += effect.value;
          break;
        case "apply_slow":
          slow += effect.value;
          break;
        case "apply_slow_all":
          slowAll += effect.value;
          break;
        case "apply_freeze":
          freeze += effect.value;
          break;
        case "apply_freeze_all":
          freezeAll += effect.value;
          break;
        case "apply_stun":
          stun = 1;
          break;
        case "apply_stun_all":
          stunAll = 1;
          break;
        case "apply_paralyze":
          paralyze += effect.value;
          break;
        case "apply_paralyze_all":
          paralyzeAll += effect.value;
          break;
        default:
          break;
      }
    });

    const parts: string[] = [];
    if (singleDamage > 0) { parts.push(`${singleDamage} dmg`); }
    if (singleGuardDamage > 0) { parts.push(`${singleGuardDamage} guard`); }
    if (lineDamage > 0) { parts.push(`${lineDamage} dmg line`); }
    if (lineGuardDamage > 0) { parts.push(`${lineGuardDamage} guard line`); }
    if (selfGuard > 0) { parts.push(`Guard ${selfGuard}`); }
    if (partyGuard > 0) { parts.push(`Guard ${partyGuard} party`); }
    if (heroHeal > 0) { parts.push(`Heal ${heroHeal}`); }
    if (mercHeal > 0) { parts.push(`Merc heal ${mercHeal}`); }
    if (drawCount > 0) { parts.push(`Draw ${drawCount}`); }
    if (markBonus > 0) { parts.push(`Mark +${markBonus}`); }
    if (mercBuff > 0) { parts.push(`Merc +${mercBuff}`); }
    if (burn > 0) { parts.push(`Burn ${burn}`); }
    if (burnAll > 0) { parts.push(`Burn ${burnAll} line`); }
    if (poison > 0) { parts.push(`Poison ${poison}`); }
    if (poisonAll > 0) { parts.push(`Poison ${poisonAll} line`); }
    if (slow > 0) { parts.push(`Slow ${slow}`); }
    if (slowAll > 0) { parts.push(`Slow ${slowAll} line`); }
    if (freeze > 0) { parts.push(`Freeze ${freeze}`); }
    if (freezeAll > 0) { parts.push(`Freeze ${freezeAll} line`); }
    if (stun > 0) { parts.push("Stun"); }
    if (stunAll > 0) { parts.push("Stun line"); }
    if (paralyze > 0) { parts.push(`Paralyze ${paralyze}`); }
    if (paralyzeAll > 0) { parts.push(`Paralyze ${paralyzeAll} line`); }

    return parts.join(" + ") || "Resolve";
  }

  function buildMeleePreviewOutcome(combat: CombatState, selectedEnemy: CombatEnemyState | null): string {
    if (!combat.weaponDamageBonus) {
      return "No strike";
    }

    const preferred = Array.isArray(combat.classPreferredFamilies) ? combat.classPreferredFamilies : [];
    const familyMatch = preferred.includes(combat.weaponFamily || "");
    let damage = familyMatch ? combat.weaponDamageBonus + 4 : combat.weaponDamageBonus;
    if (combat.hero.weaken > 0) {
      damage = Math.max(1, Math.floor(damage * 0.7));
    }

    if (!selectedEnemy) {
      return `${damage} strike`;
    }

    const blocked = Math.min(selectedEnemy.guard, damage);
    const dealt = Math.max(0, damage - blocked);
    return [dealt > 0 ? `${dealt} strike` : "", blocked > 0 ? `${blocked} guard` : ""].filter(Boolean).join(" + ");
  }

  function derivePreviewScopes(card: CardDefinition): string[] {
    const scopes = new Set<string>();
    if (card.target === "enemy") {
      scopes.add("selected_enemy");
    }

    card.effects.forEach((effect) => {
      switch (effect.kind) {
        case "damage_all":
        case "apply_burn_all":
        case "apply_poison_all":
        case "apply_slow_all":
        case "apply_freeze_all":
        case "apply_stun_all":
        case "apply_paralyze_all":
          scopes.add("enemy_line");
          break;
        case "gain_guard_self":
        case "heal_hero":
        case "draw":
          scopes.add("hero");
          break;
        case "heal_mercenary":
        case "buff_mercenary_next_attack":
          scopes.add("mercenary");
          break;
        case "gain_guard_party":
          scopes.add("party");
          break;
        default:
          break;
      }
    });

    return Array.from(scopes);
  }

  function describePreviewScopes(scopes: string[]): string {
    const normalized = new Set(scopes);
    if (normalized.has("party")) {
      normalized.delete("hero");
      normalized.delete("mercenary");
    }

    const labels = Array.from(normalized).map((scope) => {
      switch (scope) {
        case "selected_enemy": return "Target";
        case "enemy_line": return "Enemy Line";
        case "hero": return "Self";
        case "mercenary": return "Mercenary";
        case "party": return "Party";
        default: return scope;
      }
    });

    return labels.join(" + ") || "Effect";
  }

  function summarizePreviewOutcome(previewOutcome: string): string {
    const parts = previewOutcome
      .split(" + ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return "Resolve";
    }

    const summary = parts.slice(0, 2).join(" · ");
    return parts.length > 2 ? `${summary} +` : summary;
  }

  function renderEffectStrip(
    effects: Array<{ css: string; icon: string; value: string; label: string }>
  ): string {
    if (effects.length === 0) {
      return `<div class="sprite__effect-strip sprite__effect-strip--empty" aria-hidden="true"></div>`;
    }
    return `
      <div class="sprite__effect-strip">
        ${effects.map((effect) => `
          <span class="sprite__effect ${effect.css}" title="${effect.label}">
            <span class="sprite__effect-icon">${effect.icon}</span>
            <span class="sprite__effect-value">${effect.value}</span>
          </span>
        `).join("")}
      </div>
    `;
  }

  interface IncomingPressureSummary {
    attackers: number;
    damage: number;
    tags: string[];
    lineThreat: boolean;
  }

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

  function renderAllySprite({
    unit,
    figureClass,
    portraitHtml,
    potionAction,
    potionDisabled,
    extraStatusHtml,
    incomingPressureHtml,
    threatened,
    escapeHtml,
  }: {
    unit: { alive: boolean; life: number; maxLife: number; guard: number; name: string };
    figureClass: string;
    portraitHtml: string;
    potionAction: string;
    potionDisabled: boolean;
    extraStatusHtml: string;
    incomingPressureHtml: string;
    threatened: boolean;
    escapeHtml: (s: string) => string;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const hpPct = Math.round((unit.life / unit.maxLife) * 100);
    const lowHp = hpPct > 0 && hpPct <= 25;
    return `
      <div class="sprite ${unit.alive ? "" : "sprite--dead"} ${threatened ? "sprite--incoming-threat" : ""}">
        <div class="sprite__figure ${figureClass}">${portraitHtml}</div>
        <div class="sprite__bars">
          <div class="sprite__hp-bar">
            <div class="sprite__hp-fill sprite__hp-fill--${figureClass === "sprite__figure--hero" ? "hero" : "merc"} ${lowHp ? "sprite__hp-fill--low" : ""}" style="width:${hpPct}%"></div>
            <span class="sprite__hp-text">${unit.life}/${unit.maxLife}</span>
          </div>
          ${unit.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${unit.guard}</div>` : ""}
          ${extraStatusHtml}
        </div>
        <div class="sprite__meta-row">${incomingPressureHtml}</div>
        <div class="sprite__label-row"><div class="sprite__label">${escapeHtml(unit.name)}</div></div>
        <div class="sprite__action-row">
          <button class="sprite__potion" data-action="${potionAction}"
            ${potionDisabled ? "disabled" : ""}>\u{1F9EA}</button>
        </div>
      </div>
    `;
  }

  function renderEnemySprite(
    combat: CombatState,
    enemy: CombatEnemyState,
    isSelected: boolean,
    isMarked: boolean,
    hasOutcome: boolean,
    intentDesc: string,
    escapeHtml: (s: string) => string
  ): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const isDead = !enemy.alive;
    const isBoss = enemy.role === "boss" || enemy.templateId.endsWith("_boss");
    const isElite = !isBoss && enemy.templateId.includes("_elite");
    let enemyTierClass = "";
    if (isBoss) {
      enemyTierClass = "sprite--boss";
    } else if (isElite) {
      enemyTierClass = "sprite--elite";
    }
    const enemyStageClass = getEnemyStageProfile(enemy);
    const enemyHpPct = Math.round((enemy.life / enemy.maxLife) * 100);
    const enemyIcon = assets ? assets.getEnemyIcon(enemy.templateId || enemy.id) : "";
    const intentSvg = assets ? svgIcon(assets.getIntentIcon(intentDesc), "intent-icon", intentDesc) : "";
    const lowerIntent = intentDesc.toLowerCase();
    let intentTone = "";
    if (lowerIntent.includes("dmg") || lowerIntent.includes("sunder")) { intentTone = "sprite__intent--damage"; }
    else if (lowerIntent.includes("guard") || lowerIntent.includes("heal")) { intentTone = "sprite__intent--defend"; }
    else if (lowerIntent.includes("summon") || lowerIntent.includes("resurrect") || lowerIntent.includes("amplify")) { intentTone = "sprite__intent--special"; }
    const heavyIntentKinds = new Set(["attack_all", "attack_burn_all", "attack_lightning_all", "attack_poison_all", "charge", "corpse_explosion"]);
    if (!isDead && (heavyIntentKinds.has(enemy.currentIntent?.kind) || ((enemy.currentIntent?.value || 0) >= 7 && intentTone === "sprite__intent--damage"))) {
      intentTone = `${intentTone} sprite__intent--heavy`.trim();
    }
    const intentPresentation = buildEnemyIntentPresentation(combat, enemy.currentIntent);
    const intentClasses = [intentTone, intentPresentation.intentClass].filter(Boolean).join(" ");
    let threatBadge = "";
    if (isBoss) {
      threatBadge = `<span class="sprite__threat-badge sprite__threat-badge--boss">Boss</span>`;
    } else if (isElite) {
      threatBadge = `<span class="sprite__threat-badge sprite__threat-badge--elite">Elite</span>`;
    }
    const effectItems = [
      enemy.guard > 0 ? { css: "sprite__effect--guard", icon: assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}", value: String(enemy.guard), label: `Guard ${enemy.guard}` } : null,
      enemy.burn > 0 ? { css: "sprite__effect--burn", icon: "\u{1F525}", value: String(enemy.burn), label: `Burn ${enemy.burn}` } : null,
      enemy.poison > 0 ? { css: "sprite__effect--poison", icon: "\u2620", value: String(enemy.poison), label: `Poison ${enemy.poison}` } : null,
      enemy.slow > 0 ? { css: "sprite__effect--slow", icon: "\u{1F422}", value: String(enemy.slow), label: `Slow ${enemy.slow}` } : null,
      enemy.freeze > 0 ? { css: "sprite__effect--freeze", icon: "\u2744", value: String(enemy.freeze), label: `Freeze ${enemy.freeze}` } : null,
      enemy.stun > 0 ? { css: "sprite__effect--stun", icon: "\u26A1", value: String(enemy.stun), label: `Stun ${enemy.stun}` } : null,
      enemy.paralyze > 0 ? { css: "sprite__effect--paralyze", icon: "\u{1F50C}", value: String(enemy.paralyze), label: `Paralyze ${enemy.paralyze}` } : null,
    ].filter(Boolean) as Array<{ css: string; icon: string; value: string; label: string }>;
    const effectStrip = effectItems.length > 0 ? renderEffectStrip(effectItems) : "";
    const traitsContent = [
      threatBadge,
      isMarked && !isDead ? `<span class="sprite__mark-badge">Marked</span>` : "",
      renderTraitBadges(enemy.traits),
    ].filter(Boolean).join("");
    const enemyFooter = [effectStrip, traitsContent ? `<div class="sprite__traits">${traitsContent}</div>` : ""]
      .filter(Boolean)
      .join("");
    return `
      <button class="sprite sprite--enemy ${enemyTierClass} ${enemyStageClass} ${isSelected ? "sprite--targeted" : ""} ${isMarked ? "sprite--marked" : ""} ${isDead ? "sprite--dead" : ""}"
              data-action="select-enemy" data-enemy-id="${escapeHtml(enemy.id)}" data-enemy-name="${escapeHtml(enemy.name)}"
              ${isDead || hasOutcome ? "disabled" : ""}>
        ${!isDead && !hasOutcome ? `<div class="sprite__intent ${intentClasses}"><span class="sprite__intent-icon">${intentSvg || "\u2753"}</span><span class="sprite__intent-label">${escapeHtml(intentDesc)}</span>${intentPresentation.targetLabel ? `<span class="sprite__intent-target">${escapeHtml(intentPresentation.targetLabel)}</span>` : ""}</div>` : ""}
        ${isSelected && !isDead ? `<div class="sprite__selection-badge">Locked</div>` : ""}
        <div class="sprite__figure sprite__figure--enemy">${assets ? svgIcon(enemyIcon, "sprite__portrait sprite__portrait--enemy", enemy.name) : escapeHtml(enemy.name.charAt(0))}</div>
        <div class="sprite__bars">
          <div class="sprite__hp-bar">
            <div class="sprite__hp-fill sprite__hp-fill--enemy" style="width:${enemyHpPct}%"></div>
            <span class="sprite__hp-text">${enemy.life}/${enemy.maxLife}</span>
          </div>
        </div>
        <div class="sprite__label-row"><div class="sprite__label">${escapeHtml(enemy.name)}</div></div>
        <div class="sprite__action-row sprite__action-row--enemy">
          ${enemyFooter ? `<div class="sprite__enemy-footer">${enemyFooter}</div>` : '<span class="sprite__action-spacer" aria-hidden="true"></span>'}
        </div>
      </button>
    `;
  }

  function getEnemyStageProfile(enemy: CombatEnemyState): string {
    const haystack = [
      enemy.family || "",
      enemy.templateId || "",
      enemy.name || "",
      enemy.role || "",
    ]
      .join(" ")
      .toLowerCase();

    const matches = (patterns: readonly string[]): boolean => patterns.some((pattern) => haystack.includes(pattern));

    if (matches(["quill_rat", "spike_fiend", "scarab", "sand_maggot", "rock worm", "devourer", "pain_worm", "beetle", "maggot"])) {
      return "enemy-stage--crawler";
    }

    if (matches(["claw_viper", "pit viper", "tomb_viper", "serpent", "salamander", "viper"])) {
      return "enemy-stage--serpentine";
    }

    if (matches(["wraith", "ghost", "specter", "apparition", "willowisp", "gloam", "burning soul", "black soul"])) {
      return "enemy-stage--spectral";
    }

    if (
      (enemy.role || "").toLowerCase() === "brute" ||
      matches(["thorned_hulk", "balrog", "frozen_horror", "grave_brute", "corrupted_knight", "wendigo", "yeti", "mauler", "hulk", "brute"])
    ) {
      return "enemy-stage--brute";
    }

    if (
      (enemy.role || "").toLowerCase() === "support" ||
      matches(["fallen_shaman", "fetish_shaman", "greater_mummy", "oblivion_knight", "overseer", "vampire", "succubus"])
    ) {
      return "enemy-stage--caster";
    }

    if (
      (enemy.role || "").toLowerCase() === "ranged" ||
      matches(["archer", "slinger", "rogue_archer", "mage"])
    ) {
      return "enemy-stage--ranged";
    }

    if (
      (enemy.role || "").toLowerCase() === "raider" ||
      matches(["fallen", "fetish", "bone_fetish", "rat man"])
    ) {
      return "enemy-stage--skirmisher";
    }

    return "enemy-stage--standard";
  }

  function renderHandCard({
    instance,
    index,
    cardCount,
    card,
    effectiveCost,
    previewOutcome,
    stateClass,
    stateLabel,
    cantPlay,
    escapeHtml,
  }: {
    instance: { instanceId: string; cardId: string };
    index: number;
    cardCount: number;
    card: CardDefinition;
    effectiveCost: number;
    previewOutcome: string;
    stateClass: string;
    stateLabel: string;
    cantPlay: boolean;
    escapeHtml: (s: string) => string;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const element = getCardElement(card);
    const isUpgraded = instance.cardId.endsWith("_plus");
    const previewScopes = derivePreviewScopes(card);
    const previewLabel = describePreviewScopes(previewScopes);
    const previewSummary = summarizePreviewOutcome(previewOutcome);
    const mid = (cardCount - 1) / 2;
    const offset = index - mid;
    const rotation = offset * 1.4;
    const translateY = Math.abs(offset) * 2;
    return `
      <button class="fan-card ${cantPlay ? "fan-card--disabled" : "fan-card--playable"} ${stateClass} fan-card--${element}${isUpgraded ? " fan-card--upgraded" : ""}"
              data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}"
              data-card-title="${escapeHtml(card.title)}"
              data-card-target="${escapeHtml(card.target)}"
              data-card-playable="${cantPlay ? "false" : "true"}"
              data-preview-scope="${escapeHtml(previewScopes.join(","))}"
              data-preview-label="${escapeHtml(previewLabel)}"
              data-preview-outcome="${escapeHtml(previewOutcome)}"
              title="${escapeHtml(stateLabel || card.text)}"
              style="--fan-rotate:${rotation}deg; --fan-lift:${translateY}px; --fan-index:${index}">
        <div class="fan-card__cost ${effectiveCost < card.cost ? "fan-card__cost--discounted" : ""}">${effectiveCost}</div>
        <div class="fan-card__art">${(() => { if (assets) { return svgIcon(assets.getCardIcon(instance.cardId, card.effects), `fan-card__icon fan-card__icon--${element}`, card.title); } return card.target === "enemy" ? "\u2694" : "\u{1F6E1}"; })()}</div>
        <div class="fan-card__name">${escapeHtml(card.title)}</div>
        <div class="fan-card__desc">${escapeHtml(card.text)}</div>
        <div class="fan-card__intel">
          <span class="fan-card__intel-scope">${escapeHtml(previewLabel)}</span>
          <strong class="fan-card__intel-outcome">${escapeHtml(previewSummary)}</strong>
        </div>
        <div class="fan-card__footer">
          <div class="fan-card__type">${ELEMENT_LABELS[element] || "Skill"}</div>
          ${stateLabel ? `<div class="fan-card__state">${escapeHtml(stateLabel)}</div>` : ""}
        </div>
      </button>
    `;
  }

  type CombatLogTone = "strike" | "status" | "surge" | "summon" | "loss" | "maneuver" | "report";

  function classifyCombatLogEntry(entry: string): { tone: CombatLogTone; icon: string; label: string } {
    const lower = entry.toLowerCase();
    if (lower.includes("encounter lost") || lower.includes(" falls") || lower.includes("falls.")) {
      return { tone: "loss", icon: "\u2620", label: "Loss" };
    }
    if (lower.includes("explodes") || lower.includes("erupts in flame") || lower.includes("frost nova")) {
      return { tone: "loss", icon: "\u2739", label: "Burst" };
    }
    if (lower.includes("resurrect") || lower.includes("spawn") || lower.includes("summon")) {
      return { tone: "summon", icon: "\u2726", label: "Summon" };
    }
    if (
      lower.includes("burn") ||
      lower.includes("poison") ||
      lower.includes("chill") ||
      lower.includes("freeze") ||
      lower.includes("stun") ||
      lower.includes("paralyze") ||
      lower.includes("amplifies") ||
      lower.includes("drains")
    ) {
      return { tone: "status", icon: "\u2727", label: "Affliction" };
    }
    if (lower.includes("guard") || lower.includes("heal") || lower.includes("heals") || lower.includes("gains")) {
      return { tone: "surge", icon: "\u26E8", label: "Surge" };
    }
    if (lower.includes("charging") || lower.includes("flees") || lower.includes("blinking") || lower.includes("teleport")) {
      return { tone: "maneuver", icon: "\u21BB", label: "Shift" };
    }
    if (lower.includes("uses") || lower.includes("attacks") || lower.includes("deals") || lower.includes("zaps")) {
      return { tone: "strike", icon: "\u2694", label: "Strike" };
    }
    return { tone: "report", icon: "\u2022", label: "Report" };
  }

  function formatCombatLogEntryText(entry: string, escapeHtml: (s: string) => string): string {
    return escapeHtml(entry)
      .replace(/(\d+)/g, '<span class="combat-log-entry__value">$1</span>')
      .replace(
        /\b(Burn|Poison|Chill|Freeze|Stun|Paralyze|Slow|Guard|damage|fire|lightning|cold|energy|heals?|drains?|spawns?|resurrects?)\b/gi,
        '<span class="combat-log-entry__keyword">$1</span>'
      );
  }

  function renderCombatLogPanel(combat: CombatState, escapeHtml: (s: string) => string): string {
    const latestEntry = combat.log[0] || "No exchanges yet.";
    const latestMeta = classifyCombatLogEntry(latestEntry);

    return `
      <details class="combat-log" aria-label="Battle Log">
        <summary class="combat-log__toggle">
          <span class="combat-log__toggle-label">Battle Log</span>
          <span class="combat-log__toggle-latest">
            <span class="combat-log__toggle-icon" aria-hidden="true">${latestMeta.icon}</span>
            <span class="combat-log__toggle-text">${escapeHtml(latestEntry)}</span>
          </span>
          <span class="combat-log__toggle-count">${combat.log.length} event${combat.log.length === 1 ? "" : "s"}</span>
        </summary>
        ${combat.log.length > 0 ? `
          <ol class="log-list combat-log-list">
            ${combat.log.map((entry, index) => {
              const { tone, icon, label } = classifyCombatLogEntry(entry);
              return `
                <li class="combat-log-entry combat-log-entry--${tone}${index === 0 ? " combat-log-entry--latest" : ""}">
                  <div class="combat-log-entry__meta">
                    <span class="combat-log-entry__when">${index === 0 ? "Latest" : `${index} beat${index === 1 ? "" : "s"} ago`}</span>
                    <span class="combat-log-entry__tag">${escapeHtml(label)}</span>
                  </div>
                  <div class="combat-log-entry__line">
                    <span class="combat-log-entry__icon" aria-hidden="true">${icon}</span>
                    <p class="combat-log-entry__text">${formatCombatLogEntryText(entry, escapeHtml)}</p>
                  </div>
                </li>
              `;
            }).join("")}
          </ol>
        ` : `
          <div class="combat-log__empty">No exchanges yet. The field is still holding its breath.</div>
        `}
      </details>
    `;
  }

  function deriveCombatViewModel(appState: AppState, services: UiRenderServices) {
    const { COMBAT_PHASE, COMBAT_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
    const run = appState.run;
    const combat = appState.combat;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;

    let phaseText = "Enemy Turn";
    if (combat.outcome === COMBAT_OUTCOME.VICTORY) {
      phaseText = "Victory";
    } else if (combat.outcome === COMBAT_OUTCOME.DEFEAT) {
      phaseText = "Defeat";
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      phaseText = "Your Turn";
    }

    const zoneName = zone?.title || combat.encounter.name;
    const zoneFlavor = runtimeWindow.__ROUGE_ZONE_FLAVOR;
    const zoneEnv = zoneFlavor?.resolveZoneEnv?.(zoneName) || "moor";
    const encounterNum = (zone?.encountersCleared || 0) + 1;
    const encounterTotal = zone?.encounterTotal || 1;
    const cardCount = combat.hand.length;
    const drawPileCount = combat.drawPile.length;
    const discardPileCount = combat.discardPile.length;
    const markedEnemy = combat.enemies.find((enemy) => enemy.id === combat.mercenary.markedEnemyId && enemy.alive) || null;
    const weaponEquip = run.loadout?.weapon;
    const weaponItem = weaponEquip ? appState.content.itemCatalog?.[weaponEquip.itemId] : null;
    const { RARITY } = runtimeWindow.ROUGE_ITEM_CATALOG;
    const weaponRarity = weaponEquip?.rarity || RARITY.WHITE;
    let rarityColor = "#aaa";
    if (weaponRarity === RARITY.UNIQUE) { rarityColor = "#c59a46"; }
    else if (weaponRarity === RARITY.RARE) { rarityColor = "#ddc63b"; }
    else if (weaponRarity === RARITY.MAGIC) { rarityColor = "#7db3ff"; }
    const canMelee = combat.phase === COMBAT_PHASE.PLAYER && !combat.outcome && !combat.meleeUsed && (combat.weaponDamageBonus || 0) > 0;
    const hasOutcome = Boolean(combat.outcome);

    return {
      run, combat, zone, selectedEnemy, markedEnemy, phaseText,
      zoneName, zoneEnv, encounterNum, encounterTotal,
      cardCount, drawPileCount, discardPileCount, weaponItem, rarityColor, canMelee, hasOutcome,
    };
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    if (appState.ui.exploring) {
      renderExploration(root, appState, services);
      return;
    }

    const common = runtimeWindow.ROUGE_UI_COMMON;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const { escapeHtml } = services.renderUtils;
    const vm = deriveCombatViewModel(appState, services);
    const { COMBAT_PHASE, COMBAT_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
    const { run, combat, selectedEnemy, markedEnemy, phaseText, zoneName, zoneEnv, encounterNum, encounterTotal, cardCount, drawPileCount, discardPileCount, weaponItem, rarityColor, canMelee, hasOutcome } = vm;
    const incomingPressure = !hasOutcome && combat.phase === COMBAT_PHASE.PLAYER ? buildIncomingPressure(combat) : { hero: buildEmptyPressureSummary(), mercenary: buildEmptyPressureSummary() };

    const heroPortrait = assets ? svgIcon(assets.getClassSprite(run.classId) || assets.getClassPortrait(run.classId) || "", "sprite__portrait", run.className) : escapeHtml(run.className.charAt(0));
    const mercPortrait = assets ? svgIcon(assets.getMercenarySprite(combat.mercenary.id) || "", "sprite__portrait", combat.mercenary.role) : escapeHtml(combat.mercenary.role.charAt(0));
    const selectedEnemyIntent = selectedEnemy ? services.combatEngine.describeIntent(selectedEnemy.currentIntent) : "";
    const handNeedsTarget = combat.hand.some((instance) => {
      const card = appState.content.cardCatalog[instance.cardId];
      if (!card || card.target !== "enemy") { return false; }
      const effectiveCost = getEffectiveCardCost(combat, appState.content, instance, card);
      return effectiveCost <= combat.hero.energy;
    });
    let headerStatus = "Enemy pressure rising";
    if (hasOutcome) {
      headerStatus = combat.outcome === COMBAT_OUTCOME.VICTORY ? "Field secured" : "The line has fallen";
    } else if (selectedEnemy) {
      headerStatus = markedEnemy?.id === selectedEnemy.id
        ? `Mercenary mark · ${selectedEnemy.name}`
        : `Target locked · ${selectedEnemy.name}`;
    } else if (markedEnemy) {
      headerStatus = `Mercenary mark · ${markedEnemy.name}`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      headerStatus = handNeedsTarget ? "Choose a target" : "Choose your opening line";
    }

    let briefTitle = "Enemy Pressure";
    if (hasOutcome) {
      briefTitle = combat.outcome === COMBAT_OUTCOME.VICTORY ? "Field Secured" : "Line Broken";
    } else if (selectedEnemy) {
      briefTitle = `Target Locked: ${selectedEnemy.name}`;
    } else if (markedEnemy) {
      briefTitle = `Mercenary Mark: ${markedEnemy.name}`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      briefTitle = "No Target Locked";
    }

    let briefCopy = "Read the enemy intents, preserve the party, and prepare your next hand.";
    if (hasOutcome) {
      briefCopy = combat.outcome === COMBAT_OUTCOME.VICTORY
        ? "Your war hand will stand down once the reward is claimed."
        : "No further commands remain.";
    } else if (selectedEnemy) {
      const guardSuffix = selectedEnemy.guard > 0 ? `, ${selectedEnemy.guard} guard` : "";
      const commitmentSuffix = markedEnemy?.id === selectedEnemy.id ? ", mercenary committed." : ".";
      briefCopy = `${selectedEnemyIntent}. ${selectedEnemy.life}/${selectedEnemy.maxLife} life${guardSuffix}${commitmentSuffix}`;
    } else if (markedEnemy) {
      briefCopy = `${markedEnemy.name} is marked for the mercenary. Lock a target or keep shaping the hand.`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      briefCopy = "Click a monster to mark it, or use non-targeted skills to shape the opening exchange.";
    }
    const weaponMarkup = weaponItem
      ? `<span class="combat-command__weapon-value" style="color:${rarityColor}">${escapeHtml(weaponItem.name)}</span>`
      : `<span class="combat-command__weapon-value combat-command__weapon-value--none">No weapon equipped</span>`;
    let deckTargetChip = "Enemy phase";
    if (hasOutcome) {
      deckTargetChip = "No commands";
    } else if (selectedEnemy) {
      deckTargetChip = `Locked · ${selectedEnemy.name}`;
    } else if (markedEnemy) {
      deckTargetChip = `Merc mark · ${markedEnemy.name}`;
    } else if (combat.phase === COMBAT_PHASE.PLAYER) {
      deckTargetChip = handNeedsTarget ? "Mark a target" : "Hand ready";
    }

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="combat-screen">
        <div class="combat-shell">
          <header class="combat-header">
            <div class="combat-header__title">
              <span class="combat-header__eyebrow">${escapeHtml(zoneName)} · Encounter ${encounterNum} of ${encounterTotal}</span>
              <div class="combat-header__phase-row">
                <h1 class="combat-header__phase combat-header__phase--${combat.outcome || combat.phase}">${escapeHtml(phaseText)}</h1>
                <span class="combat-header__status">${escapeHtml(headerStatus)}</span>
              </div>
            </div>
          </header>

          <section class="combat-board">
            <div class="combat-board__frame">
              <div class="stage" data-env="${zoneEnv}">
                <div class="combat-bg-image" style="background-image:url('${runtimeWindow.__ROUGE_COMBAT_BG?.getCombatBackground(zoneName) || ""}')"></div>
                <div class="stage__backdrop"></div>
                <div class="stage__particles"></div>
                <div class="stage__floor"></div>

                <div class="stage__allies">
                  ${renderAllySprite({
                    unit: combat.hero,
                    figureClass: "sprite__figure--hero",
                    portraitHtml: heroPortrait,
                    potionAction: "use-potion-hero",
                    potionDisabled: combat.potions <= 0 || combat.hero.life >= combat.hero.maxLife || hasOutcome,
                    extraStatusHtml: [
                      combat.hero.heroBurn > 0 ? `<div class="sprite__status sprite__status--burn">\u{1F525} ${combat.hero.heroBurn}</div>` : "",
                      combat.hero.heroPoison > 0 ? `<div class="sprite__status sprite__status--poison">\u2620 ${combat.hero.heroPoison}</div>` : "",
                      combat.hero.chill > 0 ? `<div class="sprite__status sprite__status--chill">\u2744 Chill</div>` : "",
                      combat.hero.amplify > 0 ? `<div class="sprite__status sprite__status--amplify">\u{1F53A} Amp ${combat.hero.amplify}t</div>` : "",
                      combat.hero.weaken > 0 ? `<div class="sprite__status sprite__status--weaken">\u{1F53B} Weak ${combat.hero.weaken}t</div>` : "",
                      combat.hero.energyDrain > 0 ? `<div class="sprite__status sprite__status--drain">\u{1F50C} -${combat.hero.energyDrain} Energy</div>` : "",
                    ].join(""),
                    incomingPressureHtml: renderIncomingPressure(incomingPressure.hero, escapeHtml),
                    threatened: incomingPressure.hero.attackers > 0,
                    escapeHtml,
                  })}
                  ${renderAllySprite({
                    unit: combat.mercenary,
                    figureClass: "sprite__figure--merc",
                    portraitHtml: mercPortrait,
                    potionAction: "use-potion-mercenary",
                    potionDisabled: combat.potions <= 0 || !combat.mercenary.alive || combat.mercenary.life >= combat.mercenary.maxLife || hasOutcome,
                    extraStatusHtml: "",
                    incomingPressureHtml: renderIncomingPressure(incomingPressure.mercenary, escapeHtml),
                    threatened: incomingPressure.mercenary.attackers > 0,
                    escapeHtml,
                  })}
                </div>

                <div class="stage__enemies">
                  ${combat.enemies.map((enemy) =>
                    renderEnemySprite(
                      combat,
                      enemy,
                      selectedEnemy?.id === enemy.id,
                      markedEnemy?.id === enemy.id,
                      hasOutcome,
                      services.combatEngine.describeIntent(enemy.currentIntent),
                      escapeHtml
                    )
                  ).join("")}
                </div>

                ${combat.outcome ? `
                  <div class="stage__outcome stage__outcome--${combat.outcome}">
                    <div class="stage__outcome-title">${combat.outcome === COMBAT_OUTCOME.VICTORY ? "\u2694 Victory!" : "\u{1F480} Defeat"}</div>
                    <div class="stage__outcome-sub">${combat.outcome === COMBAT_OUTCOME.VICTORY
                      ? "The enemies fall. Claim your reward."
                      : "Your expedition ends here."}</div>
                  </div>
                ` : ""}
              </div>
            </div>
          </section>

          <section class="combat-command">
            <div class="combat-command__summary">
              <div class="energy-orb ${combat.hero.energy > 0 ? "energy-orb--active" : "energy-orb--empty"}" title="Energy: play cards that cost this much or less">
                <div class="energy-orb__value">${combat.hero.energy}</div>
                <div class="energy-orb__max">/${combat.hero.maxEnergy}</div>
                <div class="energy-orb__label">Energy</div>
              </div>

              <div class="combat-command__brief">
                <span class="combat-command__brief-label">Battle Read</span>
                <strong class="combat-command__brief-title">${escapeHtml(briefTitle)}</strong>
                <p class="combat-command__brief-copy">${escapeHtml(briefCopy)}</p>
                <div class="combat-command__resource-strip">
                  <div class="combat-command__resource">
                    <span class="combat-command__resource-label">Vitality</span>
                    <strong class="combat-command__resource-value">${assets ? svgIcon(assets.getUiIcon("hp") || "", "hud-icon", "HP") : "\u2764"} ${combat.hero.life}/${combat.hero.maxLife}</strong>
                  </div>
                  <div class="combat-command__resource">
                    <span class="combat-command__resource-label">Potions</span>
                    <strong class="combat-command__resource-value">\u{1F9EA} ${combat.potions}</strong>
                  </div>
                  <div class="combat-command__resource">
                    <span class="combat-command__resource-label">Treasury</span>
                    <strong class="combat-command__resource-value">\u{1F4B0} ${run.gold}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="combat-command__deck-shell">
              <div class="combat-command__deck-head">
                <div class="combat-command__deck-meta">
                  <span class="combat-command__deck-label">War Hand</span>
                  <span class="combat-command__deck-count">${cardCount} card${cardCount === 1 ? "" : "s"} ready</span>
                </div>
                <div class="combat-command__deck-piles" aria-label="Deck state">
                  <span class="combat-command__pile combat-command__pile--ready" data-combat-pile="ready" title="Cards in hand">
                    <span class="combat-command__pile-label">Ready</span>
                    <strong class="combat-command__pile-value">${cardCount}</strong>
                  </span>
                  <span class="combat-command__pile combat-command__pile--draw" data-combat-pile="draw" title="Cards left in draw pile">
                    <span class="combat-command__pile-label">Draw</span>
                    <strong class="combat-command__pile-value">${drawPileCount}</strong>
                  </span>
                  <span class="combat-command__pile combat-command__pile--discard" data-combat-pile="discard" title="Cards in discard pile">
                    <span class="combat-command__pile-label">Discard</span>
                    <strong class="combat-command__pile-value">${discardPileCount}</strong>
                  </span>
                </div>
                <span class="combat-command__deck-target" data-default-chip="${escapeHtml(deckTargetChip)}">${escapeHtml(deckTargetChip)}</span>
              </div>
              <div class="card-fan" style="--card-count:${cardCount}">
                ${combat.hand.map((instance, i) => {
                  const card = appState.content.cardCatalog[instance.cardId];
                  const effectiveCost = getEffectiveCardCost(combat, appState.content, instance, card);
                  const previewOutcome = buildCardPreviewOutcome(combat, instance, card, selectedEnemy);
                  const requiresTarget = card.target === "enemy";
                  const cantPlay = hasOutcome || combat.phase !== COMBAT_PHASE.PLAYER || combat.hero.energy < effectiveCost || (requiresTarget && !selectedEnemy);
                  let stateClass = "";
                  let stateLabel = "";
                  if (hasOutcome) {
                    stateClass = "fan-card--spent";
                    stateLabel = "Spent";
                  } else if (combat.phase !== COMBAT_PHASE.PLAYER) {
                    stateClass = "fan-card--waiting";
                    stateLabel = "Wait";
                  } else if (combat.hero.energy < effectiveCost) {
                    stateClass = "fan-card--unpowered";
                    stateLabel = "No energy";
                  } else if (requiresTarget && !selectedEnemy) {
                    stateClass = "fan-card--needs-target";
                    stateLabel = "Need target";
                  } else if (requiresTarget && selectedEnemy) {
                    stateClass = "fan-card--target-ready";
                  }
                  return renderHandCard({
                    instance,
                    index: i,
                    cardCount,
                    card,
                    effectiveCost,
                    previewOutcome,
                    stateClass,
                    stateLabel,
                    cantPlay,
                    escapeHtml,
                  });
                }).join("")}
              </div>
            </div>

            <div class="combat-command__actions">
              <div class="combat-command__weapon-card">
                <span class="combat-command__weapon-label">Weapon</span>
                <strong class="combat-command__weapon-copy">${weaponMarkup}</strong>
                <span class="combat-command__weapon-meta">Wave ${encounterNum} · ${combat.weaponDamageBonus || 0} bonus strike</span>
              </div>
              ${canMelee ? `<button class="combat-action-btn combat-action-btn--melee" data-action="melee-strike" data-preview-target="enemy" data-preview-title="Melee Strike" data-preview-outcome="${escapeHtml(buildMeleePreviewOutcome(combat, selectedEnemy))}">\u2694 Melee Strike (${combat.weaponDamageBonus})</button>` : ""}
              <button class="end-turn-btn combat-action-btn combat-action-btn--end-turn" data-action="end-turn"
                ${combat.phase !== COMBAT_PHASE.PLAYER || combat.outcome ? "disabled" : ""}>
                End Turn
              </button>
            </div>
          </section>

          ${renderCombatLogPanel(combat, escapeHtml)}
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
