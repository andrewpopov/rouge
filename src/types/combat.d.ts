type CombatLogAction =
  | "card_play"
  | "skill_use"
  | "melee"
  | "potion"
  | "intent"
  | "trait"
  | "status_tick"
  | "summon"
  | "death"
  | "modifier"
  | "approach"
  | "setup"
  | "turn_start"
  | "turn_end";

type CombatLogTone = "strike" | "status" | "surge" | "summon" | "loss" | "maneuver" | "report";

interface CombatLogEffect {
  target: "hero" | "mercenary" | "enemy" | "minion";
  targetId?: string;
  targetName: string;
  damage?: number;
  guardDamage?: number;
  healing?: number;
  guardApplied?: number;
  statusApplied?: { kind: string; stacks: number };
  killed?: boolean;
  lifeAfter: number;
  guardAfter: number;
}

interface CombatLogEntry {
  turn: number;
  phase: "setup" | "player" | "enemy";
  actor: "hero" | "mercenary" | "minion" | "enemy" | "environment";
  actorId?: string;
  actorName: string;
  action: CombatLogAction;
  actionId?: string;
  tone: CombatLogTone;
  message: string;
  effects: CombatLogEffect[];
}

type CombatLogDefeatCause = "burst" | "attrition" | "merc_collapse" | "timeout" | "unknown";

interface CombatLogSummary {
  totalEntries: number;
  totalTurns: number;
  outcome: string;
  defeatCause: CombatLogDefeatCause | null;
  byActor: Record<string, number>;
  byAction: Record<string, number>;
  byTone: Record<string, number>;
  heroActions: number;
  mercenaryActions: number;
  enemyActions: number;
  cardsPlayed: number;
  skillsUsed: number;
  potionsUsed: number;
  enemyIntents: number;
  deaths: number;
  statusEffects: number;
}

interface CombatLogApi {
  createLogEntry(state: CombatState, params: {
    actor: CombatLogEntry["actor"];
    actorName: string;
    actorId?: string;
    action: CombatLogAction;
    actionId?: string;
    tone?: CombatLogTone;
    message: string;
    effects?: CombatLogEffect[];
  }): CombatLogEntry;
  appendLogEntry(state: CombatState, entry: CombatLogEntry): void;
  appendLog(state: CombatState, message: string): void;
  summarizeCombatLog(state: CombatState): CombatLogSummary;
}

interface CardInstance {
  instanceId: string;
  cardId: string;
}

interface CombatHeroState extends HeroDefinition {
  life: number;
  guard: number;
  energy: number;
  alive: boolean;
  damageBonus: number;
  guardBonus: number;
  burnBonus: number;
  // Hero debuffs (applied by enemies)
  heroBurn: number;
  heroPoison: number;
  chill: number;
  amplify: number;
  weaken: number;
  energyDrain: number;
}

interface CombatMercenaryState extends MercenaryDefinition {
  life: number;
  guard: number;
  alive: boolean;
  nextAttackBonus: number;
  markedEnemyId: string;
  markBonus: number;
  contractAttackBonus: number;
  contractBehaviorBonus: number;
  contractStartGuard: number;
  contractHeroDamageBonus: number;
  contractHeroStartGuard: number;
  contractOpeningDraw: number;
  contractPerkLabels: string[];
}

type CombatMinionActionKind =
  | "attack"
  | "attack_mark"
  | "attack_poison"
  | "attack_guard_party"
  | "attack_heal_hero"
  | "heal_party"
  | "buff_mercenary_guard_party"
  | "attack_all_burn"
  | "attack_all_paralyze";

type CombatMinionTargetRule = "selected_enemy" | "lowest_life" | "all_enemies";

interface CombatMinionState {
  id: string;
  templateId: string;
  name: string;
  skillLabel: string;
  actionKind: CombatMinionActionKind;
  targetRule: CombatMinionTargetRule;
  power: number;
  secondaryValue: number;
  remainingTurns: number;
  persistent: boolean;
}

interface CombatEnemyState {
  id: string;
  templateId: string;
  name: string;
  role?: string;
  maxLife: number;
  life: number;
  guard: number;
  burn: number;
  poison: number;
  slow: number;
  freeze: number;
  stun: number;
  paralyze: number;
  alive: boolean;
  intentIndex: number;
  currentIntent: EnemyIntent;
  intents: EnemyIntent[];
  traits?: MonsterTraitKind[];
  family?: string;
  summonTemplateId?: string;
  spawnConfig?: SpawnConfig;
  consumed?: boolean;
  buffedAttack?: number;
  cooldowns?: Record<number, number>;
}

interface CombatSkillModifierState {
  nextCardCostReduction: number;
  nextCardDamageBonus: number;
  nextCardBurn: number;
  nextCardPoison: number;
  nextCardSlow: number;
  nextCardFreeze: number;
  nextCardParalyze: number;
  nextCardDraw: number;
  nextCardGuard: number;
}

interface CombatSkillLoadoutEntry {
  slotKey: RunSkillBarSlotKey;
  skill: RuntimeClassSkillDefinition;
}

interface CombatEquippedSkillState {
  slotKey: RunSkillBarSlotKey;
  skillId: string;
  name: string;
  family: SkillFamilyId;
  slot: ClassSkillSlotNumber;
  tier: ClassSkillTier;
  cost: number;
  cooldown: number;
  remainingCooldown: number;
  chargeCount: number;
  chargesRemaining: number;
  oncePerBattle: boolean;
  usedThisBattle: boolean;
  summary: string;
  exactText: string;
  active: boolean;
  skillType: SkillTypeId;
  damageType: SkillDamageTypeId;
}

interface CombatState {
  encounter: EncounterDefinition;
  randomFn: RandomFn;
  nextCardInstanceId: number;
  turn: number;
  phase: CombatPhase;
  outcome: CombatOutcome | null;
  potions: number;
  hero: CombatHeroState;
  mercenary: CombatMercenaryState;
  minions: CombatMinionState[];
  enemies: CombatEnemyState[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
  equippedSkills: CombatEquippedSkillState[];
  skillModifiers: CombatSkillModifierState;
  log: CombatLogEntry[];
  selectedEnemyId: string;
  meleeUsed?: boolean;
  weaponFamily?: string;
  weaponName?: string;
  weaponDamageBonus?: number;
  weaponProfile?: WeaponCombatProfile | null;
  armorProfile?: ArmorMitigationProfile | null;
  classPreferredFamilies?: string[];
  summonPowerBonus: number;
  summonSecondaryBonus: number;
  deckCardIds: string[];
  cardsPlayed: number;
  potionsUsed: number;
  lowestHeroLife: number;
  lowestMercenaryLife: number;
}

interface CombatMercenaryRouteBonusState {
  contractAttackBonus?: number;
  contractBehaviorBonus?: number;
  contractStartGuard?: number;
  contractHeroDamageBonus?: number;
  contractHeroStartGuard?: number;
  contractOpeningDraw?: number;
  contractPerkLabels?: string[];
}

interface CombatOverrides {
  heroState: HeroDefinition & {
    life: number;
    damageBonus: number;
    guardBonus: number;
    burnBonus: number;
  };
  mercenaryState: MercenaryDefinition & CombatMercenaryRouteBonusState & { life: number };
  starterDeck: string[];
  initialPotions: number;
}
