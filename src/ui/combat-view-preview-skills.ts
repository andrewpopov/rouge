(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const previewData = runtimeWindow.__ROUGE_SKILL_PREVIEW_DATA;

  function getSkillTierScale(skill: CombatEquippedSkillState): number {
    if (skill.slot === 3 || skill.tier === "capstone") { return 3; }
    if (skill.slot === 2 || skill.tier === "bridge") { return 2; }
    return 1;
  }

  function createSkillSummonEffect(combat: CombatState, skill: CombatEquippedSkillState): CardEffect | null {
    if (skill.skillType !== "summon") { return null; }
    const scale = getSkillTierScale(skill);
    const powerBonus = Math.max(0, combat.summonPowerBonus || 0);
    const secondaryBonus = Math.max(0, combat.summonSecondaryBonus || 0);
    const build = (minionId: string, value: number, secondaryValue = 0, duration = 3): CardEffect => ({
      kind: "summon_minion",
      minionId,
      value: Math.max(1, value + powerBonus),
      secondaryValue: Math.max(0, secondaryValue + secondaryBonus),
      duration,
    });
    switch (skill.skillId) {
      case "amazon_decoy": return build("amazon_decoy", 2 + scale, 2 + scale);
      case "amazon_valkyrie": return build("amazon_valkyrie", 3 + scale, 2 + scale);
      case "assassin_shadow_master": return build("assassin_shadow_master", 3 + scale, 1 + scale);
      case "assassin_shadow_warrior": return build("assassin_shadow_master", 2 + scale, 1 + scale);
      case "assassin_lightning_sentry": return build("assassin_lightning_sentry", 2 + scale, 1 + scale, 4);
      case "assassin_wake_of_inferno": return build("assassin_wake_of_fire", 2 + scale, 1 + scale, 4);
      case "assassin_death_sentry": return build("assassin_death_sentry", 3 + scale, 1 + scale, 4);
      case "druid_raven": return build("druid_raven", 2 + scale, 1 + scale);
      case "druid_poison_creeper": return build("druid_poison_creeper", 2 + scale, 1 + scale);
      case "druid_carrion_vine": return build("druid_carrion_vine", 2 + scale);
      case "druid_oak_sage": return build("druid_oak_sage", 2 + scale);
      case "druid_summon_spirit_wolf": return build("druid_spirit_wolf", 2 + scale, 0, 2);
      case "druid_heart_of_wolverine": return build("druid_heart_of_wolverine", 2 + scale, 1 + scale);
      case "druid_summon_dire_wolf": return build("druid_dire_wolf", 3 + scale, 1 + scale, 2);
      case "druid_solar_creeper": return build("druid_solar_creeper", 2 + scale, 1 + scale);
      case "druid_spirit_of_barbs": return build("druid_spirit_of_barbs", 2 + scale, 2 + scale);
      case "druid_summon_grizzly": return build("druid_grizzly", 3 + scale, 2 + scale);
      case "necromancer_raise_skeleton": return build("necromancer_skeleton", 2 + scale);
      case "necromancer_skeletal_mage": return build("necromancer_skeletal_mage", 2 + scale, 1 + scale);
      case "necromancer_clay_golem": return build("necromancer_clay_golem", 2 + scale, 1 + scale);
      case "necromancer_blood_golem": return build("necromancer_blood_golem", 3 + scale, 2 + scale);
      case "necromancer_iron_golem": return build("necromancer_iron_golem", 3 + scale, 2 + scale);
      case "necromancer_fire_golem": return build("necromancer_fire_golem", 3 + scale, 2 + scale);
      case "necromancer_revive": return build("necromancer_revive", 3 + scale, 2 + scale);
      case "sorceress_hydra": return build("sorceress_hydra", 3 + scale, 2 + scale);
      default: return null;
    }
  }

  // ── Skill modifier preview (data-driven) ──────────────────────────────────

  const BARBARIAN_WEAPON_MASTERIES = [
    "barbarian_sword_mastery", "barbarian_axe_mastery", "barbarian_mace_mastery",
    "barbarian_polearm_mastery", "barbarian_spear_mastery", "barbarian_throwing_mastery",
  ];

  function getExactSkillModifierPreviewParts(skill: CombatEquippedSkillState, combat?: CombatState | null): string[] {
    const scale = getSkillTierScale(skill);

    // Barbarian weapon masteries: runtime weapon family check
    if (BARBARIAN_WEAPON_MASTERIES.includes(skill.skillId)) {
      const weaponFamily = String(combat?.weaponFamily || "").toLowerCase();
      const token = skill.skillId.replace("barbarian_", "").replace("_mastery", "").replace("throwing", "throw");
      return weaponFamily.includes(token) ? [`Next card +${scale + 1} damage`] : ["Next card Guard 1"];
    }

    // Data-driven lookup
    const parts = previewData.SKILL_MODIFIER_MAP[skill.skillId];
    if (parts) {
      return parts.map((part: Record<string, unknown>) => previewData.renderModPart(part, scale));
    }
    return [];
  }

  // ── Passive skill opening preview (data-driven) ───────────────────────────

  function buildPassiveSkillOpeningPreview(
    combat: CombatState,
    skill: CombatEquippedSkillState
  ): { hero: string[]; mercenary: string[]; deck: string[] } {
    const scale = getSkillTierScale(skill);
    const hero: string[] = [];
    const mercenary: string[] = [];
    const deck = getExactSkillModifierPreviewParts(skill, combat);
    const add = (parts: string[], text: string) => {
      if (text && !parts.includes(text)) { parts.push(text); }
    };

    // Barbarian weapon masteries: runtime check
    if (BARBARIAN_WEAPON_MASTERIES.includes(skill.skillId)) {
      const weaponFamily = String(combat.weaponFamily || "").toLowerCase();
      const token = skill.skillId.replace("barbarian_", "").replace("_mastery", "").replace("throwing", "throw");
      add(hero, `Damage +${weaponFamily.includes(token) ? scale + 2 : scale + 1}`);
      return { hero, mercenary, deck };
    }

    // Data-driven lookup
    const passiveParts = previewData.SKILL_PASSIVE_MAP[skill.skillId];
    if (passiveParts) {
      for (const part of passiveParts) {
        const target = (part as { target: string }).target;
        if (target === "mercenary" && !combat.mercenary.alive) { continue; }
        const text = previewData.renderPassivePart(part, scale);
        if (target === "hero") { add(hero, text); }
        else if (target === "mercenary") { add(mercenary, text); }
        else if (target === "deck") { add(deck, text); }
      }
    }

    return { hero, mercenary, deck };
  }

  // ── Active skill preview outcome ──────────────────────────────────────────

  function joinPreviewOutcome(baseParts: string[], modifierParts: string[]): string {
    return [...baseParts, ...modifierParts].filter(Boolean).join(" + ") || "Resolve";
  }

  function buildSkillPreviewOutcome(
    combat: CombatState,
    skill: CombatEquippedSkillState,
    _selectedEnemy: CombatEnemyState | null
  ): string {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const exactModifierParts = getExactSkillModifierPreviewParts(skill, combat);
    const summonEffect = createSkillSummonEffect(combat, skill);
    if (summonEffect) {
      return joinPreviewOutcome([turns?.getSummonPreview?.(combat, summonEffect) || "Summon"], exactModifierParts);
    }

    const scale = getSkillTierScale(skill);
    if (!skill.active) {
      const passive = buildPassiveSkillOpeningPreview(combat, skill);
      const openingParts = [...passive.hero, ...passive.mercenary];
      if (passive.deck.some((part) => part.startsWith("Summon "))) {
        openingParts.push(...passive.deck.filter((part) => part.startsWith("Summon ")));
      }
      return joinPreviewOutcome(openingParts, passive.deck.filter((part) => !part.startsWith("Summon ")));
    }

    const staticOutcome = previewData.getStaticActiveSkillPreview?.(skill.skillId, combat);
    if (staticOutcome) {
      return staticOutcome;
    }

    // Skill-specific active outcomes (complex logic that can't be data-driven)
    switch (skill.skillId) {
      case "amazon_call_the_shot":
        return joinPreviewOutcome([`Merc mark +${3 + scale}`], exactModifierParts);
      case "assassin_shadow_feint":
        return joinPreviewOutcome([`Guard ${4 + scale}`], exactModifierParts);
      case "barbarian_core_bash":
        return `${5 + scale} dmg + Guard 2 if wounded`;
      case "druid_primal_attunement":
        return joinPreviewOutcome(
          [`Guard ${3 + scale}`, combat.minions.length > 0 ? "Reinforce summon +1" : ""].filter(Boolean),
          exactModifierParts
        );
      case "necromancer_raise_servant": {
        if (combat.minions.length > 0) {
          return `Reinforce summon +${scale + 1}`;
        }
        const servantEffect: CardEffect = {
          kind: "summon_minion", minionId: "necromancer_servant",
          value: 1 + scale, secondaryValue: 0, duration: 2,
        };
        return joinPreviewOutcome([turns?.getSummonPreview?.(combat, servantEffect) || "Summon Servant"], exactModifierParts);
      }
      case "druid_pack_call": {
        if (combat.minions.length > 0) {
          return "Reinforce summon +2";
        }
        const wolfEffect: CardEffect = {
          kind: "summon_minion", minionId: "druid_spirit_wolf",
          value: 2 + scale, secondaryValue: 0, duration: 2,
        };
        return joinPreviewOutcome([turns?.getSummonPreview?.(combat, wolfEffect) || "Summon Spirit Wolf"], exactModifierParts);
      }
      case "druid_spirit_shepherd":
        return combat.minions.length > 0 ? "Heal 4 + Summons +2 power +1 turn" : "Heal 4 + Summons +2 power";
      case "druid_wild_convergence": {
        if (combat.minions.length > 0) {
          return "All summons +2 power +1 turn";
        }
        const grizzlyEffect: CardEffect = {
          kind: "summon_minion", minionId: "druid_grizzly",
          value: 3 + scale, secondaryValue: 2 + scale, duration: 2,
        };
        return joinPreviewOutcome([turns?.getSummonPreview?.(combat, grizzlyEffect) || "Summon Grizzly"], exactModifierParts);
      }
      case "necromancer_corpse_explosion":
        return joinPreviewOutcome([`${2 + scale} fire dmg line`, `Burn ${scale} line`], exactModifierParts);
      case "paladin_sanctify":
        return joinPreviewOutcome([`Guard ${3 + scale} party`], exactModifierParts);
      case "sorceress_core_fire_bolt":
        return joinPreviewOutcome([`${3 + scale} dmg`], exactModifierParts);
      case "sorceress_frost_nova":
        return joinPreviewOutcome([`${2 + scale * 2} cold dmg line`, `Freeze ${scale + 1} line`, `Slow ${scale + 1} line`], exactModifierParts);
      case "sorceress_inferno":
        return joinPreviewOutcome([`${2 + scale} fire dmg line`, `Burn ${scale + 1} line`], exactModifierParts);
      case "sorceress_fire_wall":
        return "6 fire dmg line + Burn 4 line + Next card Burn 2";
      case "sorceress_static_field":
        return joinPreviewOutcome([`${2 + scale} lightning dmg line`, `Paralyze ${scale + 1} line`], exactModifierParts);
      case "amazon_strafe":
        return `${(2 + scale) * Math.max(1, combat.enemies.filter((enemy) => enemy.alive).length)} dmg line + Draw 1`;
      case "amazon_lightning_fury":
        return joinPreviewOutcome([`${3 + scale} dmg line`, `Paralyze ${scale + 1} line`], exactModifierParts);
      case "amazon_lightning_strike":
        return joinPreviewOutcome([`${6 + scale} dmg`, `Paralyze ${scale + 2}`, `arc ${2 + scale}`, `Paralyze ${scale}`], exactModifierParts);
      case "amazon_freezing_arrow":
        return joinPreviewOutcome([`${4 + scale} dmg`, `Freeze ${scale + 1} line`, `Slow ${scale + 1} line`], exactModifierParts);
      case "amazon_magic_arrow":
        return "7 dmg + ignore 4 guard + Draw 1";
      case "amazon_fire_arrow":
        return "5 dmg + Burn 2 + Next ranged Burn 1";
      case "amazon_cold_arrow":
        return "6 dmg + Slow 2";
      case "amazon_multiple_shot":
        return "4 dmg line + Slow 1 line";
      case "amazon_exploding_arrow":
        return "7 dmg + Burn 2 line";
      case "amazon_guided_arrow":
        return "10 dmg + ignore 6 guard + Draw 1";
      case "amazon_ice_arrow":
        return "7 dmg + Freeze 1 + Slow 1";
      case "amazon_immolation_arrow":
        return "8 dmg + Burn 4 + Burn 2 line + Next ranged Burn 2";
      case "amazon_jab":
        return "9 dmg";
      case "amazon_poison_javelin":
        return "4 dmg + Poison 4 + Poison 2 line";
      case "amazon_power_strike":
        return "9 dmg + Paralyze 1 + Guard 4 if attacking";
      case "amazon_impale":
        return "11 dmg + ignore 3 guard + 5 more if slowed/paralyzed";
      case "amazon_lightning_bolt":
        return "7 dmg + Paralyze 1 + Paralyze 1 others";
      case "amazon_charged_strike":
        return "8 dmg + Paralyze 2 + 3 dmg others";
      case "amazon_plague_javelin":
        return "5 dmg + Poison 4 line";
      case "amazon_fend":
        return "18 dmg split + Energy next turn 1 if slowed/paralyzed";
      case "amazon_inner_sight":
        return "Slow 1 + Merc +6 + Next 2 hits vs target +3 dmg + ignore 3 guard";
      case "amazon_slow_missiles":
        return combat.enemies.some((enemy) => enemy.alive && ["ranged", "support"].includes(enemy.role))
          ? "Slow 2 line + Guard 5 + Ranged/support -6 next turn"
          : "Slow 2 line + Guard 5 + Next enemy attack -4";
      case "assassin_tiger_strike":
        return "7 dmg + Next Assassin melee +3";
      case "assassin_dragon_talon":
        return "5 dmg x3";
      case "assassin_fists_of_fire":
        return "8 fire dmg + Burn 3 + Draw 1";
      case "assassin_dragon_claw":
        return "7 dmg x2 + 3 more per hit if burned, poisoned, or paralyzed";
      case "assassin_cobra_strike":
        return "10 dmg + Draw 1";
      case "assassin_claws_of_thunder":
        return "17 lightning dmg + Paralyze 1 + Draw 1";
      case "assassin_dragon_tail":
        return "12 fire dmg line + Burn 3 line + 5 more line if melee earlier";
      case "assassin_blades_of_ice":
        return "15 cold dmg + Freeze 1 + Slow 1 + Draw 1";
      case "assassin_dragon_flight":
        return "20 dmg + 10 more if melee earlier";
      case "assassin_psychic_hammer":
        return "4 dmg + Paralyze 1 + Merc mark 8";
      case "assassin_burst_of_speed":
        return "Guard 7 + Merc +10 + Draw 2";
      case "assassin_cloak_of_shadows":
        return "Guard 7 + Draw 1";
      case "assassin_fade":
        return "Guard 24 party + Heal 8 + Slow 1 line + Draw 1";
      case "assassin_mind_blast":
        return "Stun non-boss line + Enemies -3 next turn + Guard 6";
      case "assassin_venom":
        return "6 dmg + Poison 4 + Next melee +4 + Draw 1";
      case "assassin_fire_blast":
        return "6 fire dmg + Burn 5";
      case "assassin_blade_sentinel": {
        const effect: CardEffect = {
          kind: "summon_minion",
          minionId: "assassin_blade_sentinel",
          value: 5,
          secondaryValue: 0,
          duration: 3,
        };
        return `4 dmg line + ${turns?.getSummonPreview?.(combat, effect) || "Summon Blade Sentinel"}`;
      }
      case "assassin_charged_bolt_sentry": {
        const effect: CardEffect = {
          kind: "summon_minion",
          minionId: "assassin_charged_bolt_sentry",
          value: 5,
          secondaryValue: 1,
          duration: 3,
        };
        return `4 lightning dmg line + ${turns?.getSummonPreview?.(combat, effect) || "Summon Charged Bolt Sentry"}`;
      }
      case "assassin_wake_of_fire": {
        const effect: CardEffect = {
          kind: "summon_minion",
          minionId: "assassin_wake_of_fire",
          value: 7,
          secondaryValue: 4,
          duration: 4,
        };
        return `6 fire dmg line + Burn 3 line + ${turns?.getSummonPreview?.(combat, effect) || "Summon Wake of Fire"}`;
      }
      case "assassin_blade_fury":
        return "12 dmg random split";
      case "assassin_blade_shield":
        return "6 dmg line + Slow 1 line + Merc +8 + Draw 1";
      case "assassin_phoenix_strike":
        return joinPreviewOutcome([`${5 + scale} dmg`, `Burn ${scale + 1} line`], exactModifierParts);
      case "assassin_shock_web":
        return `Slow ${scale + 1} line + Paralyze ${scale} line`;
      case "barbarian_whirlwind":
        return joinPreviewOutcome([`${3 + scale} dmg line`], exactModifierParts);
      case "barbarian_war_cry":
        return joinPreviewOutcome([`${2 + scale} dmg line`, `Slow ${scale + 1} line`, "Stun line"], exactModifierParts);
      case "barbarian_grim_ward":
        return joinPreviewOutcome([`Slow ${scale + 2} line`, "Stun line", `Guard ${3 + scale}`], exactModifierParts);
      case "barbarian_battle_command":
        return joinPreviewOutcome(["Draw 1", `Merc +${scale + 3}`], exactModifierParts);
      case "druid_shock_wave":
        return joinPreviewOutcome([`${4 + scale} dmg`, `Slow ${scale + 1} line`, "Stun line", `Guard ${scale}`], exactModifierParts);
      case "druid_volcano":
        return joinPreviewOutcome([`${5 + scale} dmg`, `Burn ${2 + scale}`, `Slow ${scale + 1}`, `Burn ${scale} line`], exactModifierParts);
      case "druid_armageddon":
        return joinPreviewOutcome([`${3 + scale} dmg line`, `Burn ${scale + 2} line`], exactModifierParts);
      case "druid_hurricane":
        return joinPreviewOutcome([`${2 + scale} dmg line`, `Freeze ${scale + 1} line`, `Slow ${scale + 1} line`], exactModifierParts);
      case "necromancer_decrepify":
        return joinPreviewOutcome([`Slow ${scale + 2} line`, `Freeze ${scale + 1} line`], exactModifierParts);
      case "necromancer_poison_nova":
        return joinPreviewOutcome([`${1 + scale} dmg line`, `Poison ${scale + 2} line`], exactModifierParts);
      case "necromancer_lower_resist":
        return joinPreviewOutcome([`Burn ${scale} line`, `Poison ${scale} line`, `Paralyze ${scale} line`], exactModifierParts);
      case "necromancer_bone_prison":
        return joinPreviewOutcome([`Freeze ${scale + 2}`, `Slow ${scale + 2}`, `Guard ${4 + scale}`], exactModifierParts);
      case "paladin_conviction":
        return joinPreviewOutcome([`Slow ${scale + 1} line`, `Paralyze ${scale} line`], exactModifierParts);
      case "paladin_fist_of_the_heavens":
        return joinPreviewOutcome([`${6 + scale} dmg`, `Paralyze ${scale + 1} line`], exactModifierParts);
      case "paladin_holy_shock":
        return joinPreviewOutcome([`${2 + scale} dmg line`, `Paralyze ${scale + 1} line`], exactModifierParts);
      case "paladin_meditation":
        return joinPreviewOutcome([`Heal ${3 + scale} party`, "Draw 1"], exactModifierParts);
      case "paladin_redemption":
        return joinPreviewOutcome([`Heal ${4 + scale} party`, `Guard ${3 + scale} party`], exactModifierParts);
      case "paladin_salvation":
        return joinPreviewOutcome([`Guard ${5 + scale} party`, "Draw 1"], exactModifierParts);
      case "paladin_sanctuary":
        return joinPreviewOutcome([`${4 + scale} dmg`, `Slow ${scale + 1}`, `Guard ${4 + scale} party`], exactModifierParts);
      case "paladin_fanaticism":
        return joinPreviewOutcome([`Merc +${scale + 3}`], exactModifierParts);
      case "sorceress_blizzard":
        return joinPreviewOutcome([`${3 + scale} dmg line`, `Freeze ${scale + 1} line`, `Slow ${scale + 1} line`], exactModifierParts);
      case "sorceress_frozen_orb":
        return joinPreviewOutcome([`${3 + scale} dmg line`, `Freeze ${scale + 1} line`], exactModifierParts);
      case "sorceress_meteor":
        return joinPreviewOutcome([`${6 + scale} dmg`, `Burn ${3 + scale}`, "splash fire"], exactModifierParts);
      case "sorceress_chilling_armor":
        return joinPreviewOutcome([`Guard ${5 + scale}`], exactModifierParts);
      case "sorceress_energy_shield":
        return joinPreviewOutcome([`Guard ${6 + scale}`, `Heal ${2 + scale}`], exactModifierParts);
      case "sorceress_thunder_storm":
        return joinPreviewOutcome([`Paralyze ${scale + 1} line`], exactModifierParts);
      default:
        break;
    }

    // Generic fallback for skills without specific outcome data
    const preview = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
    const scopes = preview.deriveSkillPreviewScopes(skill);
    const parts: string[] = [];
    if (scopes.includes("enemy_line")) {
      if (skill.skillType === "attack" || skill.skillType === "spell") {
        parts.push(`${2 + scale} dmg line`);
      }
      if (skill.damageType === "fire") { parts.push(`Burn ${scale + 1} line`); }
      if (skill.damageType === "cold") { parts.push(`Freeze ${scale + 1} line`); }
      if (skill.damageType === "lightning") { parts.push(`Paralyze ${scale + 1} line`); }
      if (skill.damageType === "poison") { parts.push(`Poison ${scale + 1} line`); }
    }
    if (scopes.includes("selected_enemy")) {
      if (skill.skillType === "attack" || skill.skillType === "spell" || skill.skillType === "debuff") {
        parts.push(`${skill.skillType === "spell" ? 2 + scale * 2 : 3 + scale * 2} dmg`);
      }
      if (skill.damageType === "fire") { parts.push(`Burn ${scale + 1}`); }
      if (skill.damageType === "cold") { parts.push(`Freeze ${scale + 1}`); }
      if (skill.damageType === "lightning") { parts.push(`Paralyze ${scale + 1}`); }
      if (skill.damageType === "poison") { parts.push(`Poison ${scale + 1}`); }
    }
    if (scopes.includes("party")) {
      parts.push(`Guard ${3 + scale} party`);
    } else {
      if (scopes.includes("hero")) { parts.push(`Guard ${3 + scale}`); }
      if (scopes.includes("mercenary")) { parts.push(`Merc +${scale + 2}`); }
    }
    if (exactModifierParts.length > 0) {
      parts.push(...exactModifierParts);
    } else if (skill.family === "trigger_arming" || skill.family === "state" || skill.family === "commitment") {
      if (skill.skillType === "spell" || skill.skillType === "buff" || skill.skillType === "aura") {
        parts.push("Next card cost -1");
      }
      if (skill.damageType !== "none") {
        parts.push(`Next card +${scale} damage`);
      }
    }
    return parts.join(" + ") || skill.summary || "Resolve";
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS = {
    buildSkillPreviewOutcome,
    buildPassiveSkillOpeningPreview,
    getExactSkillModifierPreviewParts,
  };
})();
