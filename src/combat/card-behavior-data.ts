(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Condition descriptors ─────────────────────────────────────────────────────
  type BehaviorCondition =
    | { type: "targetHasStatus"; statuses: string[] }
    | { type: "targetHasStatusAtLeast"; statuses: string[] }
    | { type: "playedMeleeEarlier" }
    | { type: "playedSpellEarlier" }
    | { type: "enemyDiedLastTurn" }
    | { type: "heroGuardMin"; min: number }
    | { type: "enemyWillAttack" }
    | { type: "always" };

  // ── Behavior descriptors ──────────────────────────────────────────────────────
  interface CardBehavior {
    [key: string]: unknown;
    window?: {
      summary: string;
      remainingUses: number;
      damageBonus?: number;
      guardBonus?: number;
      costReduction?: number;
      requireKindsAny?: string[];
      requireKindsAll?: string[];
    };
    conditionalDamage?: {
      amount: number;
      reason: string;
      condition: BehaviorCondition;
    };
    conditionalAoeDamage?: {
      amount: number;
      reason: string;
      condition: BehaviorCondition;
    };
    statusFilteredAoeDamage?: {
      amount: number;
      reason: string;
      statusFilter: string[];
      statusMinimum?: number;
      useSnapshot?: boolean;
    };
    attackReduction?: {
      amount: number;
      heroOnly: boolean;
      summary: string;
      slow?: number;
      freeze?: number;
    };
    stateMods?: {
      tempHeroDamageBonus?: number;
      tempMercenaryDamageBonus?: number;
      tempSummonPowerBonus?: number;
      tempTrapPowerBonus?: number;
    };
    conditionalDraw?: {
      amount: number;
      reason: string;
      condition: BehaviorCondition;
    };
  }

  // ── Card behavior catalog ─────────────────────────────────────────────────────
  // Each entry replaces one case in the applyCardSpecificEffects switch.

  const CARD_BEHAVIORS: Record<string, CardBehavior> = {
    // ── Amazon ──
    amazon_amazonian_guard: {
      attackReduction: { amount: 6, heroOnly: false, summary: "the next enemy attack against you or your mercenary deals 6 less damage" },
    },
    amazon_inner_calm: {
      window: { summary: "arms the next ranged card for +3 damage", remainingUses: 1, requireKindsAny: ["ranged"], damageBonus: 3 },
    },
    amazon_impale: {
      conditionalDamage: { amount: 5, reason: "Impale follows through", condition: { type: "targetHasStatus", statuses: ["slow", "paralyze"] } },
    },
    amazon_precision: {
      conditionalDamage: { amount: 5, reason: "Precision cashes in", condition: { type: "targetHasStatus", statuses: ["slow", "paralyze"] } },
      conditionalDraw: { amount: 1, reason: "Precision stays in motion", condition: { type: "targetHasStatus", statuses: ["slow", "paralyze"] } },
    },
    amazon_javelin_rush: {
      conditionalDamage: { amount: 5, reason: "Javelin Rush bursts through the opening", condition: { type: "targetHasStatusAtLeast", statuses: ["paralyze"] } },
    },
    amazon_storm_javelin: {
      conditionalDamage: { amount: 8, reason: "Storm Javelin detonates the paralyzed target", condition: { type: "targetHasStatusAtLeast", statuses: ["paralyze"] } },
    },
    amazon_thunder_volley: {
      window: { summary: "arms the next ranged card for +6 damage", remainingUses: 1, requireKindsAny: ["ranged"], damageBonus: 6 },
    },
    amazon_fury_of_the_hunt: {
      conditionalDamage: { amount: 12, reason: "Fury of the Hunt tears through the opening", condition: { type: "targetHasStatusAtLeast", statuses: ["slow", "paralyze"] } },
    },

    // ── Assassin ──
    assassin_tiger_strike: {
      window: { summary: "arms the next Assassin melee card for +3 damage", remainingUses: 1, requireKindsAll: ["assassin", "melee"], damageBonus: 3 },
    },
    assassin_venom: {
      window: { summary: "arms the next melee card for +4 damage", remainingUses: 1, requireKindsAny: ["melee"], damageBonus: 4 },
    },
    assassin_weapon_block: {
      attackReduction: { amount: 5, heroOnly: true, summary: "the next enemy attack against you deals 5 less damage" },
    },
    assassin_shadow_shroud: {
      window: { summary: "the next Assassin card costs 1 less this turn", remainingUses: 1, requireKindsAll: ["assassin"], costReduction: 1 },
    },
    assassin_dragon_tail: {
      conditionalAoeDamage: { amount: 5, reason: "Dragon Tail detonates after the combo", condition: { type: "playedMeleeEarlier" } },
    },
    assassin_dragon_claw: {
      conditionalDamage: { amount: 6, reason: "Dragon Claw cashes in the status opening", condition: { type: "targetHasStatusAtLeast", statuses: ["burn", "poison", "paralyze"] } },
    },
    assassin_shadow_veil: {
      window: { summary: "the next 2 Assassin cards cost 1 less this turn", remainingUses: 2, requireKindsAll: ["assassin"], costReduction: 1 },
    },
    assassin_dragon_flight: {
      conditionalDamage: { amount: 10, reason: "Dragon Flight lands with momentum", condition: { type: "playedMeleeEarlier" } },
    },
    assassin_natalyas_guard: {
      attackReduction: { amount: 6, heroOnly: false, summary: "the next enemy attack against you or your mercenary deals 6 less damage" },
    },
    assassin_fatal_cascade: {
      conditionalDamage: { amount: 6, reason: "Fatal Cascade spikes the marked target", condition: { type: "targetHasStatusAtLeast", statuses: ["burn", "poison"] } },
    },
    assassin_death_blossom: {
      conditionalDamage: { amount: 12, reason: "Death Blossom cashes in the status spread", condition: { type: "targetHasStatusAtLeast", statuses: ["burn", "poison", "paralyze"] } },
    },
    assassin_shadow_storm: {
      stateMods: { tempTrapPowerBonus: 4 },
    },

    // ── Sorceress ──
    sorceress_enchant: {
      window: { summary: "arms the next 2 spells for +4 damage", remainingUses: 2, requireKindsAny: ["spell"], damageBonus: 4 },
    },
    sorceress_nova: {
      conditionalDraw: { amount: 1, reason: "Nova chains off the earlier spell", condition: { type: "playedSpellEarlier" } },
    },
    sorceress_arcane_focus: {
      window: { summary: "the next spell costs 1 less this turn", remainingUses: 1, requireKindsAny: ["spell"], costReduction: 1 },
    },
    sorceress_ice_blast: {
      conditionalDamage: { amount: 6, reason: "Ice Blast shatters the slowed target", condition: { type: "targetHasStatusAtLeast", statuses: ["slow"] } },
    },
    sorceress_thunder_storm: {
      window: { summary: "the next spell deals +5 damage this turn", remainingUses: 1, requireKindsAny: ["spell"], damageBonus: 5 },
    },
    sorceress_spell_surge: {
      window: { summary: "the next spell deals +6 damage this turn", remainingUses: 1, requireKindsAny: ["spell"], damageBonus: 6 },
    },
    sorceress_overcharge: {
      conditionalAoeDamage: { amount: 6, reason: "Overcharge surges across the line", condition: { type: "playedSpellEarlier" } },
    },
    sorceress_chilling_armor: {
      attackReduction: { amount: 0, heroOnly: true, summary: "the next enemy that attacks you this turn gains 2 Freeze", freeze: 2 },
    },
    sorceress_tempest: {
      window: { summary: "the next spell deals +8 damage this turn", remainingUses: 1, requireKindsAny: ["spell"], damageBonus: 8 },
    },
    sorceress_elemental_mastery: {
      statusFilteredAoeDamage: { amount: 5, reason: "is struck by the elemental backlash", statusFilter: ["paralyze"] },
    },
    sorceress_conflagration: {
      statusFilteredAoeDamage: { amount: 8, reason: "is engulfed by Conflagration", statusFilter: ["burn"], statusMinimum: 4, useSnapshot: true },
    },

    // ── Barbarian ──
    barbarian_axe_mastery: {
      window: { summary: "the next Attack deals +3 damage this turn", remainingUses: 1, requireKindsAny: ["attack"], damageBonus: 3 },
    },
    barbarian_increased_speed: {
      window: { summary: "the next Attack costs 1 less this turn", remainingUses: 1, requireKindsAny: ["attack"], costReduction: 1 },
    },
    barbarian_increased_stamina: {
      window: { summary: "the next 2 Attacks each deal +3 damage this turn", remainingUses: 2, requireKindsAny: ["attack"], damageBonus: 3 },
    },
    barbarian_fury_howl: {
      window: { summary: "the next 2 Attacks each deal +4 damage this turn", remainingUses: 2, requireKindsAny: ["attack"], damageBonus: 4 },
    },
    barbarian_war_stance: {
      attackReduction: { amount: 5, heroOnly: true, summary: "the next enemy attack against you deals 5 less damage" },
    },
    barbarian_bulwark: {
      attackReduction: { amount: 6, heroOnly: false, summary: "the next enemy attack against you or your mercenary deals 6 less damage" },
    },
    barbarian_raging_cleave: {
      conditionalAoeDamage: { amount: 5, reason: "Raging Cleave converts Guard into pressure", condition: { type: "heroGuardMin", min: 10 } },
    },
    barbarian_fury_mastery: {
      conditionalDamage: { amount: 12, reason: "Fury Mastery punishes the staggered target", condition: { type: "targetHasStatusAtLeast", statuses: ["slow", "stun"] } },
    },
    barbarian_ancient_vow: {
      window: { summary: "the next 3 Attacks each deal +4 damage this turn", remainingUses: 3, requireKindsAny: ["attack"], damageBonus: 4 },
    },

    // ── Druid ──
    druid_feral_rage: {
      window: { summary: "the next melee card deals +3 damage this turn", remainingUses: 1, requireKindsAny: ["melee"], damageBonus: 3 },
    },
    druid_hunger: {
      conditionalDamage: { amount: 6, reason: "Hunger devours the slowed target", condition: { type: "targetHasStatusAtLeast", statuses: ["slow"] } },
    },
    druid_natures_guardian: {
      attackReduction: { amount: 6, heroOnly: false, summary: "the next enemy attack against you or your mercenary deals 6 less damage" },
    },
    druid_tornado: {
      statusFilteredAoeDamage: { amount: 4, reason: "is battered by the slowed funnel", statusFilter: ["slow"], useSnapshot: true },
    },
    druid_gale_force: {
      statusFilteredAoeDamage: { amount: 3, reason: "is clipped by Gale Force", statusFilter: ["slow"], useSnapshot: true },
    },

    // ── Necromancer ──
    necromancer_corpse_explosion: {
      conditionalAoeDamage: { amount: 6, reason: "Corpse Explosion chains off last turn's kill", condition: { type: "enemyDiedLastTurn" } },
    },
    necromancer_skeleton_mastery: {
      stateMods: { tempSummonPowerBonus: 4 },
    },
    necromancer_bone_spear: {
      conditionalDamage: { amount: 6, reason: "Bone Spear tears through poisoned flesh", condition: { type: "targetHasStatusAtLeast", statuses: ["poison"] } },
    },
    necromancer_dark_ward: {
      attackReduction: { amount: 6, heroOnly: false, summary: "the next enemy attack against you or your mercenary deals 6 less damage" },
    },
    necromancer_plague_wind: {
      stateMods: { tempSummonPowerBonus: 3 },
    },
    necromancer_poison_nova: {
      statusFilteredAoeDamage: { amount: 4, reason: "buckles under the toxic surge", statusFilter: ["poison"], useSnapshot: true },
    },

    // ── Paladin ──
    paladin_charge: {
      window: { summary: "the next Attack deals +3 damage this turn", remainingUses: 1, requireKindsAny: ["attack"], damageBonus: 3 },
    },
    paladin_blessed_aim: {
      window: { summary: "the next 2 Attacks each deal +4 damage this turn", remainingUses: 2, requireKindsAny: ["attack"], damageBonus: 4 },
    },
    paladin_concentration: {
      window: { summary: "the next Aura or Attack card deals +5 damage this turn", remainingUses: 1, requireKindsAny: ["aura_card", "attack"], damageBonus: 5 },
    },
    paladin_vigor: {
      window: { summary: "the next card costs 1 less this turn", remainingUses: 1, costReduction: 1 },
    },
    paladin_conversion: {
      conditionalDamage: { amount: 5, reason: "Conversion punishes the telegraphed strike", condition: { type: "enemyWillAttack" } },
    },
    paladin_holy_strike: {
      conditionalDamage: { amount: 9, reason: "Holy Strike flares against the afflicted", condition: { type: "targetHasStatusAtLeast", statuses: ["burn", "slow"] } },
    },
    paladin_divine_shield: {
      window: { summary: "the next attack deals +5 damage this turn", remainingUses: 1, requireKindsAny: ["attack"], damageBonus: 5 },
    },
    paladin_blessed_hammer_storm: {
      statusFilteredAoeDamage: { amount: 5, reason: "is battered by the empowered hammers", statusFilter: ["burn", "slow"], useSnapshot: true },
    },
    paladin_blessed_ward: {
      attackReduction: { amount: 6, heroOnly: false, summary: "the next enemy attack against you or your mercenary deals 6 less damage" },
    },
    paladin_righteous_wrath: {
      conditionalDamage: { amount: 10, reason: "Righteous Wrath finds the opening", condition: { type: "targetHasStatusAtLeast", statuses: ["burn", "slow"] } },
    },
    paladin_crusade: {
      stateMods: { tempHeroDamageBonus: 5, tempMercenaryDamageBonus: 5 },
    },
  };

  // Segment text for state mods
  const STATE_MOD_MESSAGES: Record<string, string> = {
    tempSummonPowerBonus: "your summons gain +{N} damage on their next hit",
    tempTrapPowerBonus: "active traps gain +{N} damage this turn",
    tempHeroDamageBonus: "you and your mercenary gain +{N} damage this turn",
  };

  runtimeWindow.__ROUGE_CARD_BEHAVIOR_DATA = {
    CARD_BEHAVIORS,
    STATE_MOD_MESSAGES,
  };
})();
