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
  MAX_ACTIVE_CREATURES: number;
  MAX_ACTIVE_TRAPS: number;
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
  getMinionStackCount(minion: CombatMinionState): number;
  getMinionArtTier(minion: CombatMinionState, maxTier?: number): number;
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
  dealDamageIgnoringGuard(
    state: CombatState,
    entity: CombatEnemyState,
    amount: number,
    ignoreGuard: number,
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
  getMinionStackCount(minion: CombatMinionState): number;
  getMinionArtTier(minion: CombatMinionState, maxTier?: number): number;
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
  resolveCardEffect(
    state: CombatState,
    effect: CardEffect,
    targetEnemy: CombatEnemyState | null,
    cardId: string,
    card?: CardDefinition | null
  ): string;
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

interface CombatViewRenderersModuleApi {
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
  renderEnemyInspectPanel(
    combat: CombatState,
    enemy: CombatEnemyState,
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
  renderCombatCardComponent(config: {
    shellClass: string;
    rootTag: "article" | "button";
    rootAttrs?: string;
    rootStyle?: string;
    extraRootClasses?: string;
    headerRightHtml?: string;
    cardId: string;
    card: CardDefinition;
    effectiveCost: number;
    escapeHtml: (s: string) => string;
    maxRuleLines?: number;
  }): string;
  svgIcon(src: string, cls: string, alt: string): string;
  getCardElement(card: CardDefinition): string;
  isTemplatedIllustrationSrc(src: string | null | undefined): boolean;
  deriveCombatCardRole(card: CardDefinition): { key: string; label: string };
  deriveCombatCardFamily(card: CardDefinition, role: { key: string }): { key: string; label: string };
  getCardTitleFitClass(shellClass: string, title: string): string;
  getHandCardTitleFitClass(title: string): string;
  getDisplayCardTitle(cardId: string, title: string): string;
  describeCompactEffect(effect: CardEffect): { short: string; full: string };
  formatCompactRuleLine(line: string, escapeHtml: (s: string) => string, valueClass: string, keywordClass: string): string;
}

interface CombatViewRenderersPileApi {
  renderPileCard(config: {
    instance: { instanceId: string; cardId: string };
    card: CardDefinition;
    effectiveCost: number;
    stateLabel?: string;
    escapeHtml: (s: string) => string;
  }): string;
  renderCombatLogPanel(combat: CombatState, logOpen: boolean, escapeHtml: (s: string) => string): string;
}

interface CombatViewRenderersDecklistApi {
  renderDecklistCard(entry: unknown, escapeHtml: (s: string) => string): string;
  renderDecklistGroup(band: unknown, escapeHtml: (s: string) => string): string;
  buildCompositionPills(entries: unknown[], escapeHtml: (s: string) => string): string;
}

interface CombatEngineHelpersApi {
  getSkillTierScale(skill: CombatEquippedSkillState): number;
  addSkillModifiers(state: CombatState, modifiers: Partial<CombatSkillModifierState>): void;
  applyEnemyStatus(targetEnemy: CombatEnemyState | null, status: StatusEffectKind, amount: number): string;
  applyStatusToAllEnemies(state: CombatState, status: StatusEffectKind, amount: number): number;
  dealDamageToAllEnemies(state: CombatState, amount: number, damageType: DamageType): number;
  applyGuardToParty(state: CombatState, heroGuard: number, mercenaryGuard?: number): void;
  healParty(state: CombatState, amount: number): { heroHealed: number; mercenaryHealed: number };
  addDamageTypeRider(modifiers: Partial<CombatSkillModifierState>, damageType: SkillDamageTypeId, amount: number): void;
  applyEnemySkillRider(enemy: CombatEnemyState | null, damageType: SkillDamageTypeId, amount: number): string;
  createSummonSkillEffect(state: CombatState, minionId: string, value: number, secondaryValue?: number, duration?: number): CardEffect;
  getSelectedEnemy(state: CombatState, targetId?: string): CombatEnemyState | null;
  getOtherLivingEnemy(state: CombatState, excludedId?: string): CombatEnemyState | null;
  applyGuard(entity: { guard: number; alive: boolean }, amount: number): number;
  healEntity(entity: { life: number; maxLife: number; alive: boolean }, amount: number): number;
  drawCards(state: CombatState, count: number): number;
  dealDamage(state: CombatState, entity: CombatEnemyState | null, amount: number, damageType?: DamageType): number;
  appendLog(state: CombatState, message: string): void;
  clearSkillModifiers(state: CombatState): void;
  applySpecificPassiveSkill(state: CombatState, skill: CombatEquippedSkillState): void;
  describeIntent(intent: EnemyIntent | null): string;
  createEmptySkillModifiers(): CombatSkillModifierState;
  hasSkillModifiers(state: CombatState): boolean;
  makeCardInstance(state: CombatState, cardId: string): CardInstance;
  createHero(content: GameContent, heroState?: Record<string, unknown> | null): CombatHeroState;
  createMercenary(content: GameContent, mercenaryId: string, mercenaryState?: Record<string, unknown> | null): CombatMercenaryState;
  createEnemy(content: GameContent, enemyEntry: EncounterEnemyEntry): CombatEnemyState;
  parseActNumber(encounterId: string): number;
  applyRandomAffixes(state: CombatState, randomFn: RandomFn, encounterId: string): void;
  createDeck(state: CombatState, content: GameContent, starterDeck?: string[] | null): CardInstance[];
  getCardDefinition(content: GameContent, cardId: string): CardDefinition | null;
  summonMinion(state: CombatState, effect: CardEffect): string;
  getSkillPreparationSummary(modifiers: CombatSkillModifierState): string;
  applyPassiveSkill(state: CombatState, skill: CombatEquippedSkillState): void;
  addSkillWindow(state: CombatState, window: Partial<CombatSkillWindowState>): void;
  getSkillWindowSummaries(state: CombatState): string[];
  getMatchingSkillWindows(state: CombatState, cardId: string, card?: CardDefinition | null, targetEnemy?: CombatEnemyState | null): CombatSkillWindowState[];
  getSkillWindowModifierPatch(state: CombatState, cardId: string, card: CardDefinition, targetEnemy: CombatEnemyState | null): Partial<CombatSkillModifierState>;
  getCardSkillKinds(cardId: string, card: CardDefinition | null): Set<string>;
}

interface CombatEngineSkillsApi {
  useSpecificActiveSkill(state: CombatState, skill: CombatEquippedSkillState, targetEnemy: CombatEnemyState | null): { ok: boolean; message: string } | null;
}

interface CombatMonsterActionsApi {
  TRAIT: Record<string, MonsterTraitKind>;
  AFFIX_COUNT_BY_ACT: Record<number, [number, number, number, number]>;
  rollRandomAffixes(actNumber: number, variant: string, existingTraits: MonsterTraitKind[], randomFn: RandomFn): { traits: MonsterTraitKind[]; lifeBonus: number; attackBonus: number; guardBonus: number };
  applyHeroBurn(state: CombatState, amount: number): void;
  applyHeroPoison(state: CombatState, amount: number): void;
  applyHeroChill(state: CombatState, amount: number): void;
  applyHeroAmplify(state: CombatState, amount: number): void;
  applyHeroWeaken(state: CombatState, amount: number): void;
  applyHeroEnergyDrain(state: CombatState, amount: number): void;
  processDeathTraits(state: CombatState, enemy: CombatEnemyState): void;
  processSpawnTraits(state: CombatState, enemy: CombatEnemyState): void;
  processHeroDebuffs(state: CombatState): void;
  processModifierOnAttack(state: CombatState, enemy: CombatEnemyState): void;
  processModifierOnHit(state: CombatState, enemy: CombatEnemyState): void;
  isIntentOnCooldown(enemy: CombatEnemyState): boolean;
  putIntentOnCooldown(enemy: CombatEnemyState): void;
  tickCooldowns(enemy: CombatEnemyState): void;
  resolveMonsterIntent(
    state: CombatState, enemy: CombatEnemyState, intent: EnemyIntent, intentValue: number,
    chooseTarget: (state: CombatState, rule: EnemyIntentTarget | undefined) => CombatHeroState | CombatMercenaryState | CombatMinionState | null,
    dealDamage: (state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number, damageType?: DamageType) => number,
    healEntity: (entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number
  ): boolean;
}

interface MonsterTraitsApi {
  TRAIT: Record<string, MonsterTraitKind>;
  AFFIX_COUNT_BY_ACT: Record<number, [number, number, number, number]>;
  rollRandomAffixes(actNumber: number, variant: string, existingTraits: MonsterTraitKind[], randomFn: RandomFn): { traits: MonsterTraitKind[]; lifeBonus: number; attackBonus: number; guardBonus: number };
  applyHeroBurn(state: CombatState, amount: number): void;
  applyHeroPoison(state: CombatState, amount: number): void;
  applyHeroChill(state: CombatState, amount: number): void;
  applyHeroAmplify(state: CombatState, amount: number): void;
  applyHeroWeaken(state: CombatState, amount: number): void;
  applyHeroEnergyDrain(state: CombatState, amount: number): void;
  processDeathTraits(state: CombatState, enemy: CombatEnemyState): void;
  processSpawnTraits(state: CombatState, enemy: CombatEnemyState): void;
  processHeroDebuffs(state: CombatState): void;
  isIntentOnCooldown(enemy: CombatEnemyState): boolean;
  putIntentOnCooldown(enemy: CombatEnemyState): void;
  tickCooldowns(enemy: CombatEnemyState): void;
}

type CardBehaviorCondition =
  | { type: "targetHasStatus"; statuses: string[] }
  | { type: "targetHasStatusAtLeast"; statuses: string[] }
  | { type: "playedMeleeEarlier" }
  | { type: "playedSpellEarlier" }
  | { type: "enemyDiedLastTurn" }
  | { type: "heroGuardMin"; min: number }
  | { type: "enemyWillAttack" }
  | { type: "always" };

interface CardBehaviorDefinition {
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
    condition: CardBehaviorCondition;
  };
  conditionalAoeDamage?: {
    amount: number;
    reason: string;
    condition: CardBehaviorCondition;
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
    condition: CardBehaviorCondition;
  };
}

interface CardBehaviorDataApi {
  CARD_BEHAVIORS: Record<string, CardBehaviorDefinition>;
  STATE_MOD_MESSAGES: Record<string, string>;
}

interface CombatUtilsApi {
  isTrapTemplate(template: { actionKind: string; id: string }): boolean;
  isSupportTemplate(template: { actionKind: string }): boolean;
  isTankTemplate(template: { actionKind: string }): boolean;
  isDeviceTemplate(template: { actionKind: string; id: string }): boolean;
  isTrapLikeMinion(minion: { invulnerable?: boolean; actionKind: string; templateId: string }): boolean;
  ALL_STATUSES: readonly string[];
  applyStatus(enemy: CombatEnemyState, status: string, amount: number): void;
  clearAllStatuses(enemy: CombatEnemyState): void;
  clearCrowdControl(enemy: CombatEnemyState): void;
  calculateIntentGuard(intentValue: number, secondaryValue: number | undefined, divisor?: number): number;
  calculateIntentHeal(dealt: number, secondaryValue: number | undefined): number;
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
