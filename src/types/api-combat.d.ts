interface CombatEngineApi {
  createCombatState(config: {
    content: GameContent;
    encounterId: string;
    mercenaryId: string;
    randomFn?: RandomFn;
    heroState?: Partial<HeroDefinition> | null;
    mercenaryState?: Partial<MercenaryDefinition & CombatMercenaryRouteBonusState> | null;
    starterDeck?: string[] | null;
    initialPotions?: number;
    weaponFamily?: string;
    weaponName?: string;
    weaponDamageBonus?: number;
    weaponProfile?: WeaponCombatProfile | null;
    armorProfile?: ArmorMitigationProfile | null;
    classPreferredFamilies?: string[];
    equippedSkills?: CombatSkillLoadoutEntry[] | null;
  }): CombatState;
  playCard(state: CombatState, content: GameContent, instanceId: string, targetId?: string): ActionResult;
  useSkill(state: CombatState, slotKey: RunSkillBarSlotKey, targetId?: string): ActionResult;
  endTurn(state: CombatState): ActionResult;
  usePotion(state: CombatState, targetId: "hero" | "mercenary"): ActionResult;
  meleeStrike(state: CombatState, content: GameContent): ActionResult;
  describeIntent(intent: EnemyIntent | null): string;
  getLivingEnemies(state: CombatState): CombatEnemyState[];
  getFirstLivingEnemyId(state: CombatState): string;
}

interface CombatWeaponScalingPolicy {
  preferredWeaponCardBonus: number;
  weaponSupportBaselineBonus: number;
  preferredWeaponEffectBonus: number;
  preferredWeaponMeleeBonus: number;
}

interface CombatWeaponScalingApi {
  WEAPON_SCALING_POLICY: CombatWeaponScalingPolicy;
  getCardProficiency(cardId: string): string;
  hasPreferredWeaponFamily(state: CombatState): boolean;
  getWeaponAttackBonus(state: CombatState, cardId: string): number;
  getWeaponSupportBonus(state: CombatState, cardId: string): number;
  getWeaponTypedDamageAmount(state: CombatState, entry: WeaponDamageDefinition, cardId: string): number;
  getWeaponEffectAmount(state: CombatState, effect: WeaponEffectDefinition): number;
  getMeleeDamage(state: CombatState): number;
}

interface CombatMinionsApi {
  MAX_ACTIVE_MINIONS: number;
  getActiveMinions(state: CombatState): CombatMinionState[];
  getMinionTemplate(templateId: string): {
    id: string;
    name: string;
    skillLabel: string;
    actionKind: CombatMinionActionKind;
    targetRule: CombatMinionTargetRule;
    persistent: boolean;
  } | null;
  getMinionDuration(effect: CardEffect, template: {
    id: string;
    name: string;
    skillLabel: string;
    actionKind: CombatMinionActionKind;
    targetRule: CombatMinionTargetRule;
    persistent: boolean;
  }): number;
  getMinionPrimaryValue(effect: CardEffect): number;
  getMinionSecondaryValue(effect: CardEffect): number;
  getMinionReinforcementValue(amount: number): number;
  buildMinionActionSummary(actionKind: CombatMinionActionKind, power: number, secondaryValue: number): string;
  getMinionSkillSummary(minion: CombatMinionState): string;
  getSummonPreview(state: CombatState | null, effect: CardEffect): string;
}

interface CombatWeaponEffectsApi {
  applyWeaponTypedDamage(state: CombatState, targets: CombatEnemyState[], cardId: string): string[];
  applyWeaponEffects(state: CombatState, targets: CombatEnemyState[], cardId: string): string[];
}

interface CombatTurnsApi {
  MAX_ACTIVE_MINIONS: number;
  healEntity(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number): number;
  applyGuard(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number): number;
  dealDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType?: DamageType
  ): number;
  dealDirectDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType?: DamageType
  ): number;
  dealLifeDamage(state: CombatState, entity: CombatEnemyState, amount: number): number;
  checkOutcome(state: CombatState): boolean;
  getLivingEnemies(state: CombatState): CombatEnemyState[];
  getFirstLivingEnemyId(state: CombatState): string;
  getActiveMinions(state: CombatState): CombatMinionState[];
  getMinionTemplate(templateId: string): {
    id: string;
    name: string;
    skillLabel: string;
    actionKind: CombatMinionActionKind;
    targetRule: CombatMinionTargetRule;
    persistent: boolean;
  } | null;
  getMinionSkillSummary(minion: CombatMinionState): string;
  getSummonPreview(state: CombatState | null, effect: CardEffect): string;
  appendLog(state: CombatState, message: string | CombatLogEntry): void;
  drawCards(state: CombatState, count: number): number;
  discardHand(state: CombatState): void;
  getWeaponAttackBonus(state: CombatState, cardId: string): number;
  getWeaponSupportBonus(state: CombatState, cardId: string): number;
  applyWeaponTypedDamage(state: CombatState, targets: CombatEnemyState[], cardId: string): string[];
  applyWeaponEffects(state: CombatState, targets: CombatEnemyState[], cardId: string): string[];
  meleeStrike(state: CombatState, content: GameContent): ActionResult;
  summonMinion(state: CombatState, effect: CardEffect): string;
  startPlayerTurn(state: CombatState): void;
  endTurn(state: CombatState): ActionResult;
  usePotion(state: CombatState, targetId: "hero" | "mercenary"): ActionResult;
  resolveMinionPhase(state: CombatState): void;
  resolveMercenaryAction(state: CombatState): void;
  resolveEnemyAction(state: CombatState, enemy: CombatEnemyState): void;
  advanceEnemyIntents(state: CombatState): void;
  _shuffleInPlace<T>(items: T[], randomFn: RandomFn): T[];
}

interface CombatMercenaryApi {
  chooseMercenaryTarget(state: CombatState): CombatEnemyState | null;
  resolveMercenaryAction(
    state: CombatState,
    appendLog: (state: CombatState, message: string) => void,
    dealDamage: (state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    applyGuard: (entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    getFirstLivingEnemyId: (state: CombatState) => string,
  ): void;
}

interface CombatCardEffectsApi {
  resolveCardEffect(state: CombatState, effect: CardEffect, targetEnemy: CombatEnemyState | null, cardId: string): string;
  summarizeCardEffect(card: CardDefinition, segments: string[]): string;
}

interface IncomingPressureSummary {
  attackers: number;
  suppressedAttackers: number;
  damage: number;
  lifeDamage: number;
  guardBlocked: number;
  tags: string[];
  suppressedTags: string[];
  lineThreat: boolean;
}

interface CombatViewPreviewApi {
  getEffectiveCardCost(
    combat: CombatState,
    content: GameContent,
    instance: { cardId: string },
    card: CardDefinition
  ): number;
  buildCardPreviewOutcome(
    combat: CombatState,
    instance: { cardId: string },
    card: CardDefinition,
    selectedEnemy: CombatEnemyState | null
  ): string;
  buildMeleePreviewOutcome(combat: CombatState, selectedEnemy: CombatEnemyState | null): string;
  derivePreviewScopes(card: CardDefinition): string[];
  deriveSkillPreviewScopes(skill: CombatEquippedSkillState): string[];
  getExactSkillModifierPreviewParts(skill: CombatEquippedSkillState, combat?: CombatState | null): string[];
  describePreviewScopes(scopes: string[]): string;
  buildSkillPreviewOutcome(
    combat: CombatState,
    skill: CombatEquippedSkillState,
    selectedEnemy: CombatEnemyState | null
  ): string;
  summarizePreviewOutcome(previewOutcome: string): string;
}

interface CombatViewPressureApi {
  buildEmptyPressureSummary(): IncomingPressureSummary;
  buildIncomingPressure(combat: CombatState): { hero: IncomingPressureSummary; mercenary: IncomingPressureSummary };
  buildEnemyIntentPresentation(combat: CombatState, enemy: CombatEnemyState | null): { targetLabel: string; intentClass: string; stateLabel: string };
  renderIncomingPressure(summary: IncomingPressureSummary, escapeHtml: (s: string) => string): string;
}

interface CombatViewRenderersApi {
  renderAllySprite(config: {
    unit: { alive: boolean; life: number; maxLife: number; guard: number; name: string };
    figureClass: string;
    portraitHtml: string;
    potionAction: string;
    potionDisabled: boolean;
    extraStatusHtml: string;
    incomingPressureHtml: string;
    threatened: boolean;
    persistentAfflictions?: { burn?: number; poison?: number };
    escapeHtml: (s: string) => string;
  }): string;
  renderMinionRack(minions: CombatMinionState[], escapeHtml: (s: string) => string, variant?: "stage" | "command"): string;
  renderEnemySprite(
    combat: CombatState,
    enemy: CombatEnemyState,
    isSelected: boolean,
    isMarked: boolean,
    hasOutcome: boolean,
    intentDesc: string,
    escapeHtml: (s: string) => string
  ): string;
  renderHandCard(config: {
    instance: { instanceId: string; cardId: string };
    index: number;
    card: CardDefinition;
    effectiveCost: number;
    previewOutcome: string;
    maxRuleLines?: number;
    stateClass: string;
    stateLabel: string;
    cantPlay: boolean;
    escapeHtml: (s: string) => string;
  }): string;
  renderPileCard(config: {
    instance: { instanceId: string; cardId: string };
    card: CardDefinition;
    effectiveCost: number;
    stateLabel: string;
    escapeHtml: (s: string) => string;
  }): string;
  renderCombatLogPanel(combat: CombatState, escapeHtml: (s: string) => string): string;
}

interface CombatModifiersApi {
  INTENT: Record<string, string>;
  MODIFIER_KIND: Record<string, string>;
  ATTACK_INTENT_KINDS: Set<string>;
  HEALING_INTENT_KINDS: Set<string>;
  LINEBREAKER_INTENT_KINDS: Set<string>;
  RITUAL_INTENT_KINDS: Set<string>;
  applyEncounterModifiers(state: CombatState): void;
}
