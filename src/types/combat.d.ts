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

interface CombatEnemyState {
  id: string;
  templateId: string;
  name: string;
  role?: string;
  maxLife: number;
  life: number;
  guard: number;
  burn: number;
  alive: boolean;
  intentIndex: number;
  currentIntent: EnemyIntent;
  intents: EnemyIntent[];
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
  enemies: CombatEnemyState[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
  log: string[];
  selectedEnemyId: string;
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
