interface EventFollowUpResult {
  eventDefinition: EventNodeDefinition;
  questRecord: QuestOutcomeRecord;
  followUp: WorldNodeRewardDefinition;
}

interface OpportunityVariantResult {
  opportunityDefinition: OpportunityNodeDefinition;
  questRecord: QuestOutcomeRecord;
  variant: OpportunityNodeVariantDefinition;
}

interface CrossroadVariantResult {
  crossroadOpportunityDefinition: CrossroadOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  shrineRecord: WorldNodeOutcomeRecord;
  variant: OpportunityNodeVariantDefinition;
}

interface ShrineVariantResult {
  shrineOpportunityDefinition: ShrineOpportunityDefinition;
  shrineRecord: WorldNodeOutcomeRecord;
  variant: ShrineOpportunityVariantDefinition;
}

interface ReserveVariantResult {
  reserveOpportunityDefinition: ReserveOpportunityDefinition;
  opportunityRecord: WorldNodeOutcomeRecord;
  shrineOpportunityRecord: WorldNodeOutcomeRecord;
  crossroadOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface RelayVariantResult {
  relayOpportunityDefinition: RelayOpportunityDefinition;
  reserveOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface CulminationVariantResult {
  culminationOpportunityDefinition: CulminationOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  relayOpportunityRecord: WorldNodeOutcomeRecord;
  variant: OpportunityNodeVariantDefinition;
}

interface LegacyVariantResult {
  legacyOpportunityDefinition: LegacyOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  culminationOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface ReckoningVariantResult {
  reckoningOpportunityDefinition: ReckoningOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  reserveOpportunityRecord: WorldNodeOutcomeRecord;
  culminationOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface RecoveryVariantResult {
  recoveryOpportunityDefinition: RecoveryOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  shrineOpportunityRecord: WorldNodeOutcomeRecord;
  culminationOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface AccordVariantResult {
  accordOpportunityDefinition: AccordOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  shrineOpportunityRecord: WorldNodeOutcomeRecord;
  crossroadOpportunityRecord: WorldNodeOutcomeRecord;
  culminationOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface CovenantVariantResult {
  covenantOpportunityDefinition: CovenantOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  legacyOpportunityRecord: WorldNodeOutcomeRecord;
  reckoningOpportunityRecord: WorldNodeOutcomeRecord;
  recoveryOpportunityRecord: WorldNodeOutcomeRecord;
  accordOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface DetourVariantResult {
  detourOpportunityDefinition: DetourOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  recoveryOpportunityRecord: WorldNodeOutcomeRecord;
  accordOpportunityRecord: WorldNodeOutcomeRecord;
  covenantOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface EscalationVariantResult {
  escalationOpportunityDefinition: EscalationOpportunityDefinition;
  questRecord: QuestOutcomeRecord;
  legacyOpportunityRecord: WorldNodeOutcomeRecord;
  reckoningOpportunityRecord: WorldNodeOutcomeRecord;
  covenantOpportunityRecord: WorldNodeOutcomeRecord;
  variant: ReserveOpportunityVariantDefinition;
}

interface WorldNodeVariantsApi {
  resolveEventFollowUp(run: RunState, actNumber: number): EventFollowUpResult;
  resolveOpportunityVariant(run: RunState, actNumber: number): OpportunityVariantResult;
  resolveCrossroadOpportunityVariant(run: RunState, actNumber: number): CrossroadVariantResult;
  resolveShrineOpportunityVariant(run: RunState, actNumber: number): ShrineVariantResult;
  resolveReserveOpportunityVariant(run: RunState, actNumber: number): ReserveVariantResult;
  resolveRelayOpportunityVariant(run: RunState, actNumber: number): RelayVariantResult;
  resolveCulminationOpportunityVariant(run: RunState, actNumber: number): CulminationVariantResult;
  resolveLegacyOpportunityVariant(run: RunState, actNumber: number): LegacyVariantResult;
  resolveReckoningOpportunityVariant(run: RunState, actNumber: number): ReckoningVariantResult;
  resolveRecoveryOpportunityVariant(run: RunState, actNumber: number): RecoveryVariantResult;
  resolveAccordOpportunityVariant(run: RunState, actNumber: number): AccordVariantResult;
  resolveCovenantOpportunityVariant(run: RunState, actNumber: number): CovenantVariantResult;
  resolveDetourOpportunityVariant(run: RunState, actNumber: number): DetourVariantResult;
  resolveEscalationOpportunityVariant(run: RunState, actNumber: number): EscalationVariantResult;
}

type WorldNodeCatalogValue<K extends keyof WorldNodeCatalog> = WorldNodeCatalog[K][number];

interface WorldNodeZonesApi {
  buildChoice(kind: string, choiceDefinition: WorldNodeChoiceDefinition): RewardChoice;
  getCatalogEntry<K extends keyof WorldNodeCatalog>(key: K, actNumber: number): WorldNodeCatalogValue<K>;
  getQuestDefinition(actNumber: number): QuestNodeDefinition;
  getShrineDefinition(actNumber: number): ShrineNodeDefinition;
  getEventDefinition(actNumber: number): EventNodeDefinition;
  getOpportunityDefinition(actNumber: number): OpportunityNodeDefinition;
  getCrossroadOpportunityDefinition(actNumber: number): CrossroadOpportunityDefinition;
  getShrineOpportunityDefinition(actNumber: number): ShrineOpportunityDefinition;
  getReserveOpportunityDefinition(actNumber: number): ReserveOpportunityDefinition;
  getRelayOpportunityDefinition(actNumber: number): RelayOpportunityDefinition;
  getCulminationOpportunityDefinition(actNumber: number): CulminationOpportunityDefinition;
  getLegacyOpportunityDefinition(actNumber: number): LegacyOpportunityDefinition;
  getReckoningOpportunityDefinition(actNumber: number): ReckoningOpportunityDefinition;
  getRecoveryOpportunityDefinition(actNumber: number): RecoveryOpportunityDefinition;
  getAccordOpportunityDefinition(actNumber: number): AccordOpportunityDefinition;
  getCovenantOpportunityDefinition(actNumber: number): CovenantOpportunityDefinition;
  getDetourOpportunityDefinition(actNumber: number): DetourOpportunityDefinition;
  getEscalationOpportunityDefinition(actNumber: number): EscalationOpportunityDefinition;
  isShrineOpportunityNodeId(nodeId: string): boolean;
  createQuestZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createShrineZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createEventZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCrossroadOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createShrineOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createReserveOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createRelayOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCulminationOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createLegacyOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createReckoningOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createRecoveryOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createAccordOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCovenantOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createDetourOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createEscalationOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createActWorldNodes(config: { actSeed: ActSeed; openingZoneId: string }): ZoneState[];
  isWorldNodeZone(zone: ZoneState): boolean;
}

interface ContentValidatorLateRouteOpportunityValidationArgs {
  actKey: string;
  errors: string[];
  referenceState: ContentValidatorActReferenceState;
  questDefinition: QuestNodeDefinition | null | undefined;
  shrineDefinition: ShrineNodeDefinition | null | undefined;
  opportunityDefinition: OpportunityNodeDefinition | null | undefined;
  crossroadOpportunityDefinition: CrossroadOpportunityDefinition | null | undefined;
  shrineOpportunityDefinition: ShrineOpportunityDefinition | null | undefined;
  reserveOpportunityDefinition: ReserveOpportunityDefinition | null | undefined;
  relayOpportunityDefinition: RelayOpportunityDefinition | null | undefined;
  culminationOpportunityDefinition: CulminationOpportunityDefinition | null | undefined;
  legacyOpportunityDefinition: LegacyOpportunityDefinition | null | undefined;
  reckoningOpportunityDefinition: ReckoningOpportunityDefinition | null | undefined;
  recoveryOpportunityDefinition: RecoveryOpportunityDefinition | null | undefined;
  accordOpportunityDefinition: AccordOpportunityDefinition | null | undefined;
  covenantOpportunityDefinition: CovenantOpportunityDefinition | null | undefined;
  detourOpportunityDefinition: DetourOpportunityDefinition | null | undefined;
  escalationOpportunityDefinition: EscalationOpportunityDefinition | null | undefined;
}

interface ContentValidatorWorldOpportunitiesApi {
  validateGrants(grants: RewardGrants | null | undefined, label: string, errors: string[]): void;
  validateKnownStringIds(
    values: string[] | null | undefined,
    knownValues: Set<string>,
    label: string,
    errors: string[],
    referenceType: string
  ): void;
  validateLateRouteOpportunityFamilies(options: ContentValidatorLateRouteOpportunityValidationArgs): void;
  validateRewardDefinition(
    definition: WorldNodeRewardDefinition | null | undefined,
    label: string,
    expectedNodeType: "quest" | "shrine" | "event" | "opportunity",
    errors: string[],
    linkedQuestId?: string
  ): void;
  validateStringIdList(values: string[] | null | undefined, label: string, errors: string[]): void;
}

interface ContentValidatorActReferenceState {
  primaryOutcomeIds: Set<string>;
  followUpOutcomeIds: Set<string>;
  consequenceIds: Set<string>;
  shrineOutcomeIds: Set<string>;
  flagIds: Set<string>;
}

interface ContentValidatorActPathState {
  label: string;
  primaryOutcomeId: string;
  followUpOutcomeId: string;
  consequenceIds: string[];
  flagIds: string[];
  mercenaryId: string;
}

interface ContentValidatorShrinePathState {
  label: string;
  shrineOutcomeId: string;
  flagIds: string[];
  mercenaryId: string;
}

interface ContentValidatorFlagPathState {
  label: string;
  flagIds: string[];
}

interface ContentValidatorVariantChoiceSource {
  variants?: Array<{
    choices?: WorldNodeChoiceDefinition[];
  }>;
}

interface ContentValidatorWorldPathsApi {
  collectEffectFlagIds(effects: RewardChoiceEffect[] | null | undefined): Set<string>;
  collectActReferenceState(
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined
  ): ContentValidatorActReferenceState;
  collectActPathStates(
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined,
    options?: { includeEmptyShrineState?: boolean }
  ): ContentValidatorActPathState[];
  collectShrinePathStates(shrineDefinition: ShrineNodeDefinition | null | undefined): ContentValidatorShrinePathState[];
  collectOpportunityChoiceStates(opportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined): ContentValidatorFlagPathState[];
  collectReservePathStates(
    opportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    crossroadOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectRelayPathStates(reserveOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined): ContentValidatorFlagPathState[];
  collectCulminationPathStates(
    questDefinition: QuestNodeDefinition | null | undefined,
    shrineDefinition: ShrineNodeDefinition | null | undefined,
    relayOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorActPathState[];
  collectLegacyPathStates(culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined): ContentValidatorFlagPathState[];
  collectReckoningPathStates(
    culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    reserveOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectRecoveryPathStates(
    culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectAccordPathStates(
    culminationOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    shrineOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    crossroadOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectCovenantPathStates(
    legacyOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    reckoningOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    recoveryOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    accordOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectDetourPathStates(
    covenantOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    recoveryOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    accordOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  collectEscalationPathStates(
    covenantOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    legacyOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined,
    reckoningOpportunityDefinition: ContentValidatorVariantChoiceSource | null | undefined
  ): ContentValidatorFlagPathState[];
  getOpportunityVariantRequirementSignature(variantDefinition: OpportunityNodeVariantDefinition | null | undefined): string;
  getShrineOpportunityVariantRequirementSignature(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined): string;
  getReserveOpportunityVariantRequirementSignature(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined): string;
  getOpportunityVariantSpecificity(variantDefinition: OpportunityNodeVariantDefinition | null | undefined): number;
  getShrineOpportunityVariantSpecificity(variantDefinition: ShrineOpportunityVariantDefinition | null | undefined): number;
  getReserveOpportunityVariantSpecificity(variantDefinition: ReserveOpportunityVariantDefinition | null | undefined): number;
  doesVariantMatchPath(
    variantDefinition: OpportunityNodeVariantDefinition | null | undefined,
    pathState: ContentValidatorActPathState
  ): boolean;
  doesShrineOpportunityVariantMatchPath(
    variantDefinition: ShrineOpportunityVariantDefinition | null | undefined,
    pathState: ContentValidatorShrinePathState
  ): boolean;
  doesReserveOpportunityVariantMatchPath(
    variantDefinition: ReserveOpportunityVariantDefinition | null | undefined,
    pathState: ContentValidatorFlagPathState
  ): boolean;
}

interface WorldNodeCatalogOpportunitiesApi {
  additionalOpportunityVariants: Record<number, OpportunityNodeVariantDefinition[]>;
  shrineOpportunityDefinitions: Record<number, ShrineOpportunityDefinition>;
  crossroadOpportunityDefinitions: Record<number, CrossroadOpportunityDefinition>;
  reserveOpportunityDefinitions: Record<number, ReserveOpportunityDefinition>;
  relayOpportunityDefinitions: Record<number, RelayOpportunityDefinition>;
  culminationOpportunityDefinitions: Record<number, CulminationOpportunityDefinition>;
  legacyOpportunityDefinitions: Record<number, LegacyOpportunityDefinition>;
  reckoningOpportunityDefinitions: Record<number, ReckoningOpportunityDefinition>;
  recoveryOpportunityDefinitions: Record<number, RecoveryOpportunityDefinition>;
  accordOpportunityDefinitions: Record<number, AccordOpportunityDefinition>;
  covenantOpportunityDefinitions: Record<number, CovenantOpportunityDefinition>;
  detourOpportunityDefinitions: Record<number, DetourOpportunityDefinition>;
  escalationOpportunityDefinitions: Record<number, EscalationOpportunityDefinition>;
}

interface WorldNodeCatalogApi {
  getCatalog(): WorldNodeCatalog;
  assertValidCatalog(): void;
}

interface WorldNodeEngineApi {
  getCatalog(): WorldNodeCatalog;
  assertValidCatalog(): void;
  createQuestZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createShrineZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createEventZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCrossroadOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createShrineOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createReserveOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createRelayOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCulminationOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createLegacyOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createReckoningOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createRecoveryOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createAccordOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createCovenantOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createDetourOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createEscalationOpportunityZone(config: { actSeed: ActSeed; prerequisites: string[] }): ZoneState;
  createActWorldNodes(config: { actSeed: ActSeed; openingZoneId: string }): ZoneState[];
  isWorldNodeZone(zone: ZoneState): boolean;
  buildZoneReward(config: { run: RunState; zone: ZoneState; content?: GameContent | null }): RunReward;
  applyChoice(run: RunState, reward: RunReward, choice: RewardChoice): ActionResult;
}

interface WorldNodeQuestChoiceBuildResult {
  choices: RewardChoice[];
  extraLines: string[];
}

interface WorldNodeResolvedOpportunity {
  definition: WorldNodeRewardDefinition;
  variant: WorldNodeRewardDefinition;
  contextLines: string[];
}

interface WorldNodeChoiceStrategyApi {
  buildStrategicChoices(
    kind: string,
    choiceDefinitions: WorldNodeChoiceDefinition[],
    run: RunState,
    content?: GameContent | null
  ): RewardChoice[];
  buildQuestChoices(
    run: RunState,
    zone: ZoneState,
    actNumber: number,
    definition: QuestNodeDefinition,
    content?: GameContent | null
  ): WorldNodeQuestChoiceBuildResult;
}

interface WorldNodeRuneforgeApi {
  buildQuestRuneforgePackage(
    run: RunState,
    zone: ZoneState,
    actNumber: number,
    content?: GameContent | null
  ): { summaryLine: string; descriptionLine: string; effects: RewardChoiceEffect[] } | null;
}

interface WorldNodeOpportunityResolversApi {
  resolveOpportunityNode(nodeType: string, run: RunState, actNumber: number): WorldNodeResolvedOpportunity | null;
}

interface WorldNodeOutcomeOptions {
  isShrineOpportunityNodeId?: ((nodeId: string) => boolean) | null;
}

interface WorldNodeOutcomesApi {
  applyChoice(run: RunState, reward: RunReward, choice: RewardChoice, options?: WorldNodeOutcomeOptions): ActionResult;
}
