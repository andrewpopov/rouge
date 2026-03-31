const CARD_EFFECT_WEIGHTS: Record<CardEffectKind, number> = {
  damage: 2.2,
  damage_all: 2.8,
  gain_guard_self: 1.3,
  gain_guard_party: 1.6,
  heal_hero: 1.6,
  heal_mercenary: 0.8,
  draw: 3.0,
  mark_enemy_for_mercenary: 3.0,
  buff_mercenary_next_attack: 2.0,
  apply_burn: 2.0,
  apply_burn_all: 2.5,
  apply_poison: 2.0,
  apply_poison_all: 2.5,
  apply_slow: 2.2,
  apply_slow_all: 2.8,
  apply_freeze: 2.6,
  apply_freeze_all: 3.0,
  apply_stun: 2.8,
  apply_stun_all: 3.2,
  apply_paralyze: 2.8,
  apply_paralyze_all: 3.2,
  summon_minion: 3.6,
};

const WEAPON_PROFICIENCIES_BY_FAMILY: Record<string, string[]> = {
  Swords: ["combat_skills", "masteries", "combat"],
  Maces: ["combat_skills", "combat"],
  Polearms: ["combat_skills", "javelin"],
  Spears: ["combat_skills", "javelin"],
  Javelins: ["javelin"],
  Bows: ["bow"],
  Crossbows: ["bow"],
  Wands: ["poison_bone", "curses"],
  Staves: ["fire", "cold", "lightning", "elemental"],
};

const TRAIT_POWER_WEIGHTS: Record<MonsterTraitKind, number> = {
  swift: 4,
  flee_on_ally_death: 1,
  death_explosion: 5,
  death_poison: 4,
  death_spawn: 5,
  frenzy: 7,
  thorns: 6,
  regeneration: 8,
  extra_fast: 6,
  extra_strong: 8,
  cursed: 6,
  cold_enchanted: 5,
  fire_enchanted: 5,
  lightning_enchanted: 5,
  stone_skin: 10,
  mana_burn: 4,
  summon_allies_on_spawn: 6,
};

interface ScoreBreakdown {
  total: number;
  offense: number;
  defense: number;
  sustain: number;
  utility: number;
}

export interface DeckPowerScore extends ScoreBreakdown {
  bloatPenalty: number;
  topCardTitles: string[];
  proficiencyCounts: Record<string, number>;
  matchingProficiencyCount: number;
  preferredFamilyMatch: boolean;
}

export interface PartyPowerScore extends ScoreBreakdown {
  deck: number;
  equipment: number;
  progression: number;
  resources: number;
  topCardTitles: string[];
  proficiencyCounts: Record<string, number>;
  matchingProficiencyCount: number;
  preferredFamilyMatch: boolean;
}

export interface BossReadinessScore {
  total: number;
  offense: number;
  durability: number;
  sustain: number;
  control: number;
  tempo: number;
}

export interface EncounterUnitPowerScore extends ScoreBreakdown {
  name: string;
  traitScore: number;
}

export interface EncounterPowerScore extends ScoreBreakdown {
  enemyCount: number;
  traitScore: number;
  unitCountBonus: number;
  units: EncounterUnitPowerScore[];
}

interface CardScoreOptions {
  matchingProficiencies?: string[];
}

interface DeckScoreOptions {
  matchingProficiencies?: string[];
  preferredFamilyMatch?: boolean;
  topWeight?: number;
  restWeight?: number;
  bloatPenaltyStart?: number;
  bloatPenaltyPerCard?: number;
}

export interface PartyPowerScoreInput {
  content: GameContent;
  deckCardIds: string[];
  heroState: {
    maxLife: number;
    maxEnergy: number;
    handSize?: number;
    potionHeal: number;
    damageBonus?: number;
    guardBonus?: number;
    burnBonus?: number;
    life?: number;
    currentLife?: number;
  };
  mercenaryState: {
    maxLife: number;
    attack: number;
    life?: number;
    currentLife?: number;
  };
  weaponProfile?: WeaponCombatProfile | null;
  armorProfile?: ArmorMitigationProfile | null;
  weaponFamily?: string;
  classPreferredFamilies?: string[];
  gold?: number;
  potions?: number;
  level?: number;
  bankedSkillPoints?: number;
  bankedClassPoints?: number;
  bankedAttributePoints?: number;
  includeCurrentResources?: boolean;
}

interface EnemyPowerSource {
  name: string;
  maxLife: number;
  guard?: number;
  intents: EnemyIntent[];
  traits?: MonsterTraitKind[];
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getCategoryBreakdown(): ScoreBreakdown {
  return {
    total: 0,
    offense: 0,
    defense: 0,
    sustain: 0,
    utility: 0,
  };
}

function withTotal(breakdown: ScoreBreakdown): ScoreBreakdown {
  return {
    ...breakdown,
    total: roundTo(
      breakdown.offense + breakdown.defense + breakdown.sustain + breakdown.utility
    ),
  };
}

function addBreakdowns(left: ScoreBreakdown, right: ScoreBreakdown): ScoreBreakdown {
  return withTotal({
    offense: left.offense + right.offense,
    defense: left.defense + right.defense,
    sustain: left.sustain + right.sustain,
    utility: left.utility + right.utility,
    total: 0,
  });
}

function scaleBreakdown(breakdown: ScoreBreakdown, factor: number): ScoreBreakdown {
  return withTotal({
    offense: breakdown.offense * factor,
    defense: breakdown.defense * factor,
    sustain: breakdown.sustain * factor,
    utility: breakdown.utility * factor,
    total: 0,
  });
}

function getCurrentValue(entity: { life?: number; currentLife?: number; maxLife: number }) {
  const current = Number(entity.currentLife ?? entity.life ?? entity.maxLife);
  return Math.max(0, current);
}

function getBossCardContribution(effect: CardEffect) {
  const value = Number(effect.value || 0);
  switch (effect.kind) {
    case "damage":
      return { offense: value * 1.05, durability: 0, sustain: 0, control: 0, tempo: 0 };
    case "damage_all":
      return { offense: value * 0.8, durability: 0, sustain: 0, control: 0, tempo: 0 };
    case "gain_guard_self":
      return { offense: 0, durability: value * 1.9, sustain: 0, control: 0, tempo: 0 };
    case "gain_guard_party":
      return { offense: 0, durability: value * 2.2, sustain: 0, control: 0, tempo: 0 };
    case "heal_hero":
      return { offense: 0, durability: 0, sustain: value * 2.2, control: 0, tempo: 0 };
    case "heal_mercenary":
      return { offense: 0, durability: 0, sustain: value * 1.3, control: 0, tempo: 0 };
    case "draw":
      return { offense: 0, durability: 0, sustain: 0, control: value * 1.4, tempo: value * 2.2 };
    case "mark_enemy_for_mercenary":
      return { offense: value * 0.7, durability: 0, sustain: 0, control: 0, tempo: value * 1.2 };
    case "buff_mercenary_next_attack":
      return { offense: value * 0.9, durability: 0, sustain: 0, control: 0, tempo: value * 0.7 };
    case "apply_burn":
      return { offense: value * 1.4, durability: 0, sustain: 0, control: 0, tempo: 0 };
    case "apply_burn_all":
      return { offense: Number(value), durability: 0, sustain: 0, control: 0, tempo: 0 };
    case "apply_poison":
      return { offense: value * 1.4, durability: 0, sustain: 0, control: 0, tempo: 0 };
    case "apply_poison_all":
      return { offense: Number(value), durability: 0, sustain: 0, control: 0, tempo: 0 };
    case "apply_slow":
      return { offense: 0, durability: 0, sustain: 0, control: value * 2.8, tempo: 0 };
    case "apply_slow_all":
      return { offense: 0, durability: 0, sustain: 0, control: value * 1.9, tempo: 0 };
    case "apply_freeze":
      return { offense: 0, durability: 0, sustain: 0, control: value * 3.5, tempo: 0 };
    case "apply_freeze_all":
      return { offense: 0, durability: 0, sustain: 0, control: value * 2.2, tempo: 0 };
    case "apply_stun":
      return { offense: 0, durability: 0, sustain: 0, control: value * 3.7, tempo: 0 };
    case "apply_stun_all":
      return { offense: 0, durability: 0, sustain: 0, control: value * 2.4, tempo: 0 };
    case "apply_paralyze":
      return { offense: 0, durability: 0, sustain: 0, control: value * 3.8, tempo: 0 };
    case "apply_paralyze_all":
      return { offense: 0, durability: 0, sustain: 0, control: value * 2.5, tempo: 0 };
    case "summon_minion":
      return { offense: value * 0.5, durability: value * 0.7, sustain: 0, control: value * 1.4, tempo: 0 };
    default:
      return { offense: 0, durability: 0, sustain: 0, control: 0, tempo: 0 };
  }
}

function scoreDeckBossReadiness(deckCardIds: string[], content: GameContent, matchingProficiencies: string[]) {
  const scoredCards = deckCardIds
    .map((cardId) => {
      const card = content.cardCatalog[cardId];
      const proficiencyMultiplier =
        card?.proficiency && matchingProficiencies.includes(card.proficiency) ? 1.18 : 1;
      const base = (card?.effects || []).reduce(
        (sum, effect) => {
          const contribution = getBossCardContribution(effect);
          sum.offense += contribution.offense;
          sum.durability += contribution.durability;
          sum.sustain += contribution.sustain;
          sum.control += contribution.control;
          sum.tempo += contribution.tempo;
          return sum;
        },
        { offense: 0, durability: 0, sustain: 0, control: 0, tempo: 0 }
      );
      const tierBonus = Number(card?.tier || 1) * 1.6;
      base.tempo += card?.target === "none" ? 1 : 0;
      base.control += tierBonus * 0.35;
      base.offense += tierBonus * 0.45;
      base.tempo -= Number(card?.cost || 0) * 1.1;
      return {
        total:
          (base.offense + base.durability + base.sustain + base.control + base.tempo) * proficiencyMultiplier,
        offense: base.offense * proficiencyMultiplier,
        durability: base.durability * proficiencyMultiplier,
        sustain: base.sustain * proficiencyMultiplier,
        control: base.control * proficiencyMultiplier,
        tempo: base.tempo * proficiencyMultiplier,
      };
    })
    .sort((left, right) => right.total - left.total);

  const aggregate = scoredCards.reduce(
    (sum, card, index) => {
      const factor = index < 10 ? 1 : 0.55;
      sum.offense += card.offense * factor;
      sum.durability += card.durability * factor;
      sum.sustain += card.sustain * factor;
      sum.control += card.control * factor;
      sum.tempo += card.tempo * factor;
      return sum;
    },
    { offense: 0, durability: 0, sustain: 0, control: 0, tempo: 0 }
  );

  return {
    offense: roundTo(aggregate.offense),
    durability: roundTo(aggregate.durability),
    sustain: roundTo(aggregate.sustain),
    control: roundTo(aggregate.control),
    tempo: roundTo(aggregate.tempo),
    total: roundTo(
      aggregate.offense +
        aggregate.durability +
        aggregate.sustain +
        aggregate.control +
        aggregate.tempo
    ),
  };
}

function scoreWeaponBossReadiness(profile: WeaponCombatProfile | undefined) {
  if (!profile) {
    return { offense: 0, control: 0, tempo: 0, total: 0 };
  }
  const attackScore = Object.values(profile.attackDamageByProficiency || {}).reduce((sum, value) => sum + Number(value || 0), 0) * 1.05;
  const typedDamageScore = (profile.typedDamage || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 1.15;
  const supportScore = Object.values(profile.supportValueByProficiency || {}).reduce((sum, value) => sum + Number(value || 0), 0) * 1.3;
  const effectScore = (profile.effects || []).reduce((sum, entry) => {
    const amount = Number(entry.amount || 0);
    switch (entry.kind) {
      case "freeze":
      case "shock":
        return sum + amount * 3.2;
      case "burn":
        return sum + amount * 1.5;
      default:
        return sum + amount * 1.2;
    }
  }, 0);
  return {
    offense: roundTo(attackScore + typedDamageScore * 0.75),
    control: roundTo(supportScore + effectScore),
    tempo: roundTo(supportScore * 0.65),
    total: roundTo(attackScore + typedDamageScore * 0.75 + supportScore + effectScore + supportScore * 0.65),
  };
}

export function getMatchingProficienciesForWeapon(weaponFamily = "", weaponProfile?: WeaponCombatProfile | null) {
  const proficiencies = new Set<string>(WEAPON_PROFICIENCIES_BY_FAMILY[weaponFamily] || []);

  Object.keys(weaponProfile?.attackDamageByProficiency || {}).forEach((proficiency) => {
    if (proficiency) {
      proficiencies.add(proficiency);
    }
  });
  Object.keys(weaponProfile?.supportValueByProficiency || {}).forEach((proficiency) => {
    if (proficiency) {
      proficiencies.add(proficiency);
    }
  });
  (weaponProfile?.typedDamage || []).forEach((entry) => {
    if (entry.proficiency) {
      proficiencies.add(entry.proficiency);
    }
  });
  (weaponProfile?.effects || []).forEach((entry) => {
    if (entry.proficiency) {
      proficiencies.add(entry.proficiency);
    }
  });

  return [...proficiencies];
}

export function scoreWeaponProfile(profile: WeaponCombatProfile | undefined) {
  if (!profile) {
    return 0;
  }
  const attackScore = Object.values(profile.attackDamageByProficiency || {}).reduce((sum, value) => sum + Number(value || 0), 0) * 2.5;
  const supportScore = Object.values(profile.supportValueByProficiency || {}).reduce((sum, value) => sum + Number(value || 0), 0) * 1.2;
  const typedDamageScore = (profile.typedDamage || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 2.4;
  const effectScore = (profile.effects || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 1.8;
  return roundTo(attackScore + supportScore + typedDamageScore + effectScore);
}

export function scoreArmorProfile(profile: ArmorMitigationProfile | undefined) {
  if (!profile) {
    return 0;
  }
  const resistanceScore = (profile.resistances || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 1.8;
  const immunityScore = (profile.immunities || []).length * 12;
  return roundTo(resistanceScore + immunityScore);
}

export function scoreCardDefinition(card: CardDefinition | null | undefined, options: CardScoreOptions = {}): ScoreBreakdown {
  if (!card) {
    return getCategoryBreakdown();
  }

  const breakdown = getCategoryBreakdown();
  (card.effects || []).forEach((effect) => {
    const weight = CARD_EFFECT_WEIGHTS[effect.kind] || 0;
    const weightedValue = weight * Number(effect.value || 0);

    if (
      effect.kind === "damage" ||
      effect.kind === "damage_all" ||
      effect.kind === "apply_burn" ||
      effect.kind === "apply_burn_all" ||
      effect.kind === "apply_poison" ||
      effect.kind === "apply_poison_all"
    ) {
      breakdown.offense += weightedValue;
      return;
    }

    if (effect.kind === "gain_guard_self" || effect.kind === "gain_guard_party") {
      breakdown.defense += weightedValue;
      return;
    }

    if (effect.kind === "heal_hero" || effect.kind === "heal_mercenary") {
      breakdown.sustain += weightedValue;
      return;
    }

    breakdown.utility += weightedValue;
  });

  breakdown.utility += Number(card.tier || 1) * 2.2;
  if (card.target === "none") {
    breakdown.utility += 1;
  }
  if (card.proficiency && (options.matchingProficiencies || []).includes(card.proficiency)) {
    breakdown.utility += 2.5;
  }
  breakdown.utility -= card.cost * 2.4;

  return withTotal(breakdown);
}

export function scoreDeckPower(
  deckCardIds: string[],
  content: GameContent,
  options: DeckScoreOptions = {}
): DeckPowerScore {
  const matchingProficiencies = options.matchingProficiencies || [];
  const scoredCards = deckCardIds
    .map((cardId) => {
      const card = content.cardCatalog[cardId];
      return {
        cardId,
        title: card?.title || cardId,
        score: scoreCardDefinition(card, { matchingProficiencies }),
        proficiency: card?.proficiency || "neutral",
      };
    })
    .sort((left, right) => right.score.total - left.score.total);

  const topWeight = options.topWeight ?? 1;
  const restWeight = options.restWeight ?? 0.45;
  const bloatPenaltyStart = options.bloatPenaltyStart ?? 16;
  const bloatPenaltyPerCard = options.bloatPenaltyPerCard ?? 1.6;

  const totalBreakdown = scoredCards.reduce((acc, entry, index) => {
    const factor = index < 10 ? topWeight : restWeight;
    return addBreakdowns(acc, scaleBreakdown(entry.score, factor));
  }, getCategoryBreakdown());

  const bloatPenalty = Math.max(0, deckCardIds.length - bloatPenaltyStart) * bloatPenaltyPerCard;
  const proficiencyCounts = scoredCards.reduce((counts, entry) => {
    counts[entry.proficiency] = (counts[entry.proficiency] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  const matchingProficiencyCount = matchingProficiencies.reduce((sum, proficiency) => {
    return sum + Number(proficiencyCounts[proficiency] || 0);
  }, 0);

  return {
    ...withTotal({
      offense: totalBreakdown.offense,
      defense: totalBreakdown.defense,
      sustain: totalBreakdown.sustain,
      utility: totalBreakdown.utility - bloatPenalty,
      total: 0,
    }),
    bloatPenalty: roundTo(bloatPenalty),
    topCardTitles: scoredCards.slice(0, 5).map((entry) => entry.title),
    proficiencyCounts,
    matchingProficiencyCount,
    preferredFamilyMatch: Boolean(options.preferredFamilyMatch),
  };
}

export function scorePartyPower(input: PartyPowerScoreInput): PartyPowerScore {
  const preferredFamilyMatch = (input.classPreferredFamilies || []).includes(input.weaponFamily || "");
  const matchingProficiencies = getMatchingProficienciesForWeapon(input.weaponFamily || "", input.weaponProfile || undefined);
  const deckScore = scoreDeckPower(input.deckCardIds, input.content, {
    matchingProficiencies,
    preferredFamilyMatch,
  });

  const heroMaxLife = Number(input.heroState.maxLife || 0);
  const heroMaxEnergy = Number(input.heroState.maxEnergy || 0);
  const heroHandSizeBonus = Math.max(0, Number(input.heroState.handSize || 5) - 5);
  const heroPotionHeal = Number(input.heroState.potionHeal || 0);
  const heroDamageBonus = Number(input.heroState.damageBonus || 0);
  const heroGuardBonus = Number(input.heroState.guardBonus || 0);
  const heroBurnBonus = Number(input.heroState.burnBonus || 0);
  const mercenaryMaxLife = Number(input.mercenaryState.maxLife || 0);
  const mercenaryAttack = Number(input.mercenaryState.attack || 0);
  const weaponScore = scoreWeaponProfile(input.weaponProfile || undefined);
  const armorScore = scoreArmorProfile(input.armorProfile || undefined);
  const level = Number(input.level || 0);
  const potions = Number(input.potions || 0);

  const offense = heroDamageBonus * 10 + heroBurnBonus * 4 + mercenaryAttack * 0.9;
  const defense = heroMaxLife * 1.1 + heroGuardBonus * 6 + mercenaryMaxLife * 0.4;
  const sustain = heroPotionHeal * 3.2 + potions * 3.5;
  const utility = heroMaxEnergy * 3 + heroHandSizeBonus * 7 + (preferredFamilyMatch ? 8 : 0) + deckScore.matchingProficiencyCount * 0.75;
  const equipment = weaponScore + armorScore;
  const progression =
    level * 5 +
    Number(input.bankedSkillPoints || 0) * 1.5 +
    Number(input.bankedClassPoints || 0) * 3.5 +
    Number(input.bankedAttributePoints || 0) * 2.5;
  const resources = input.includeCurrentResources
    ? getCurrentValue(input.heroState) * 0.3 + getCurrentValue(input.mercenaryState) * 0.18 + Number(input.gold || 0) * 0.04
    : 0;

  return {
    total: roundTo(offense + defense + sustain + utility + deckScore.total + equipment + progression + resources),
    offense: roundTo(offense),
    defense: roundTo(defense),
    sustain: roundTo(sustain),
    utility: roundTo(utility),
    deck: deckScore.total,
    equipment: roundTo(equipment),
    progression: roundTo(progression),
    resources: roundTo(resources),
    topCardTitles: deckScore.topCardTitles,
    proficiencyCounts: deckScore.proficiencyCounts,
    matchingProficiencyCount: deckScore.matchingProficiencyCount,
    preferredFamilyMatch,
  };
}

export function scoreBossReadiness(input: PartyPowerScoreInput): BossReadinessScore {
  const preferredFamilyMatch = (input.classPreferredFamilies || []).includes(input.weaponFamily || "");
  const matchingProficiencies = getMatchingProficienciesForWeapon(input.weaponFamily || "", input.weaponProfile || undefined);
  const deckBoss = scoreDeckBossReadiness(input.deckCardIds, input.content, matchingProficiencies);
  const armorScore = scoreArmorProfile(input.armorProfile || undefined);
  const weaponBoss = scoreWeaponBossReadiness(input.weaponProfile || undefined);

  const heroMaxLife = Number(input.heroState.maxLife || 0);
  const heroMaxEnergy = Number(input.heroState.maxEnergy || 0);
  const heroHandSizeBonus = Math.max(0, Number(input.heroState.handSize || 5) - 5);
  const heroPotionHeal = Number(input.heroState.potionHeal || 0);
  const heroDamageBonus = Number(input.heroState.damageBonus || 0);
  const heroGuardBonus = Number(input.heroState.guardBonus || 0);
  const heroBurnBonus = Number(input.heroState.burnBonus || 0);
  const mercenaryMaxLife = Number(input.mercenaryState.maxLife || 0);
  const mercenaryAttack = Number(input.mercenaryState.attack || 0);
  const potions = Number(input.potions || 0);

  const offense = roundTo(
    deckBoss.offense + weaponBoss.offense + heroDamageBonus * 4.5 + heroBurnBonus * 1.8 + mercenaryAttack * 0.35
  );
  const durability = roundTo(
    deckBoss.durability + heroMaxLife * 0.42 + heroGuardBonus * 4.6 + mercenaryMaxLife * 0.22 + armorScore * 0.82
  );
  const sustain = roundTo(deckBoss.sustain + heroPotionHeal * 3.4 + potions * 4.1);
  const control = roundTo(deckBoss.control + weaponBoss.control + heroMaxEnergy * 1.1);
  const tempoBase = deckBoss.tempo + weaponBoss.tempo + heroHandSizeBonus * 8.5 + (preferredFamilyMatch ? 12 : 0);
  const resources = input.includeCurrentResources
    ? getCurrentValue(input.heroState) * 0.24 + getCurrentValue(input.mercenaryState) * 0.12
    : 0;
  const tempo = roundTo(tempoBase + resources);

  return {
    total: roundTo(offense + durability + sustain + control + tempo),
    offense,
    durability,
    sustain,
    control,
    tempo,
  };
}

export function scoreBossAdjustedPartyPower(input: PartyPowerScoreInput) {
  const basePower = scorePartyPower(input);
  const bossReadiness = scoreBossReadiness(input);
  return {
    basePower,
    bossReadiness,
    total: roundTo(basePower.total + bossReadiness.total * 0.42),
  };
}

function scoreEnemyIntent(intent: EnemyIntent): ScoreBreakdown {
  const breakdown = getCategoryBreakdown();
  const aoeMultiplier = intent.target === "all_allies" || intent.kind.endsWith("_all") ? 1.35 : 1;

  if (intent.kind === "attack" || intent.kind === "sunder_attack") {
    breakdown.offense += Number(intent.value || 0) * (intent.kind === "sunder_attack" ? 1.25 : 1) * aoeMultiplier;
  } else if (intent.kind === "attack_all") {
    breakdown.offense += Number(intent.value || 0) * 1.35;
  } else if (intent.kind === "attack_and_guard") {
    breakdown.offense += Number(intent.value || 0) * aoeMultiplier;
    breakdown.defense += Number(intent.secondaryValue || 0) * 1.6;
  } else if (intent.kind === "drain_attack") {
    breakdown.offense += Number(intent.value || 0) * 1.15;
    breakdown.sustain += Number(intent.secondaryValue || 0) * 1.6;
  } else if (intent.kind === "charge") {
    breakdown.offense += Number(intent.value || 0) * 1.4 * aoeMultiplier;
    breakdown.utility += Number(intent.secondaryValue || 0) * 0.5 + (intent.damageType ? 3 : 0);
  } else if (intent.kind === "attack_burn" || intent.kind === "attack_burn_all") {
    breakdown.offense += Number(intent.value || 0) * aoeMultiplier;
    breakdown.utility += Number(intent.secondaryValue || 0) * 2.2 + 2;
  } else if (intent.kind === "attack_lightning" || intent.kind === "attack_lightning_all") {
    breakdown.offense += Number(intent.value || 0) * 1.05 * aoeMultiplier;
    breakdown.utility += 4;
  } else if (intent.kind === "attack_poison" || intent.kind === "attack_poison_all") {
    breakdown.offense += Number(intent.value || 0) * aoeMultiplier;
    breakdown.utility += Number(intent.secondaryValue || 0) * 2.1 + 2;
  } else if (intent.kind === "attack_chill") {
    breakdown.offense += Number(intent.value || 0);
    breakdown.utility += 5;
  } else if (intent.kind === "guard" || intent.kind === "guard_allies") {
    breakdown.defense += Number(intent.value || 0) * (intent.kind === "guard_allies" ? 2 : 1.8);
  } else if (intent.kind === "heal_ally" || intent.kind === "heal_allies") {
    breakdown.sustain += Number(intent.value || 0) * (intent.kind === "heal_allies" ? 2.4 : 2.1);
  } else if (intent.kind === "heal_and_guard") {
    breakdown.sustain += Number(intent.value || 0) * 2;
    breakdown.defense += Number(intent.secondaryValue || 0) * 1.6;
  } else if (intent.kind === "resurrect_ally") {
    breakdown.sustain += 14;
  } else if (intent.kind === "summon_minion") {
    breakdown.sustain += Number(intent.secondaryValue || 1) * 4;
    breakdown.utility += 6;
  } else if (intent.kind === "teleport") {
    breakdown.defense += Number(intent.value || 0) * 1.2;
    breakdown.utility += 5;
  } else if (intent.kind === "curse_amplify" || intent.kind === "curse_weaken") {
    breakdown.utility += 7;
  } else if (intent.kind === "drain_energy") {
    breakdown.offense += Number(intent.value || 0) * 0.8;
    breakdown.utility += 6;
  } else if (intent.kind === "buff_allies_attack") {
    breakdown.utility += Number(intent.value || 0) * 1.8;
  } else if (intent.kind === "consume_corpse") {
    breakdown.sustain += 6;
  } else if (intent.kind === "corpse_explosion") {
    breakdown.offense += Number(intent.value || 0) * 1.6;
    breakdown.utility += 4;
  }

  return withTotal(breakdown);
}

function getOpeningGuard(enemy: EnemyPowerSource) {
  if (typeof enemy.guard === "number" && enemy.guard > 0) {
    return enemy.guard;
  }
  if ((enemy.traits || []).includes("stone_skin")) {
    return Math.floor(enemy.maxLife * 0.3);
  }
  return 0;
}

export function scoreEnemyUnitPower(enemy: EnemyPowerSource): EncounterUnitPowerScore {
  const intentScores = (enemy.intents || []).map((intent) => scoreEnemyIntent(intent));
  const intentCount = Math.max(1, intentScores.length);
  const average = intentScores.reduce((acc, score) => addBreakdowns(acc, score), getCategoryBreakdown());
  const peakOffense = intentScores.reduce((max, score) => Math.max(max, score.offense), 0);
  const openingGuard = getOpeningGuard(enemy);
  const traitScore = (enemy.traits || []).reduce((sum, trait) => sum + Number(TRAIT_POWER_WEIGHTS[trait] || 0), 0);

  const offense = average.offense / intentCount + peakOffense * 0.35;
  const defense = enemy.maxLife * 1.25 + openingGuard * 4 + average.defense / intentCount;
  const sustain = average.sustain / intentCount + ((enemy.traits || []).includes("regeneration") ? 4 : 0);
  const utility = average.utility / intentCount;

  return {
    name: enemy.name,
    total: roundTo(offense + defense + sustain + utility + traitScore),
    offense: roundTo(offense),
    defense: roundTo(defense),
    sustain: roundTo(sustain),
    utility: roundTo(utility),
    traitScore: roundTo(traitScore),
  };
}

export function scoreEncounterPowerFromDefinition(content: GameContent, encounterId: string): EncounterPowerScore {
  const encounter = content.encounterCatalog[encounterId];
  if (!encounter) {
    return {
      total: 0,
      offense: 0,
      defense: 0,
      sustain: 0,
      utility: 0,
      enemyCount: 0,
      traitScore: 0,
      unitCountBonus: 0,
      units: [],
    };
  }

  const units = encounter.enemies
    .map((entry) => content.enemyCatalog[entry.templateId])
    .filter(Boolean)
    .map((template) => scoreEnemyUnitPower(template as EnemyTemplate));

  const aggregate = units.reduce((acc, unit) => {
    return {
      total: acc.total + unit.total,
      offense: acc.offense + unit.offense,
      defense: acc.defense + unit.defense,
      sustain: acc.sustain + unit.sustain,
      utility: acc.utility + unit.utility,
      traitScore: acc.traitScore + unit.traitScore,
    };
  }, {
    total: 0,
    offense: 0,
    defense: 0,
    sustain: 0,
    utility: 0,
    traitScore: 0,
  });

  const enemyCount = units.length;
  const unitCountBonus = Math.max(0, enemyCount - 1) * 6;

  return {
    total: roundTo(aggregate.total + unitCountBonus),
    offense: roundTo(aggregate.offense),
    defense: roundTo(aggregate.defense),
    sustain: roundTo(aggregate.sustain),
    utility: roundTo(aggregate.utility),
    enemyCount,
    traitScore: roundTo(aggregate.traitScore),
    unitCountBonus: roundTo(unitCountBonus),
    units,
  };
}
