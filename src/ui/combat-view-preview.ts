(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

    const damage = runtimeWindow.__ROUGE_COMBAT_WEAPON_SCALING?.getMeleeDamage?.(combat) || Math.max(1, combat.weaponDamageBonus || 0);
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

  runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW = {
    getEffectiveCardCost,
    buildCardPreviewOutcome,
    buildMeleePreviewOutcome,
    derivePreviewScopes,
    describePreviewScopes,
    summarizePreviewOutcome,
  };
})();
