interface WorldNodeRewardDefinition {
  id: string;
  title: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  choices: WorldNodeChoiceDefinition[];
}

interface WorldNodeChoiceDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  effects: RewardChoiceEffect[];
  followUp?: WorldNodeRewardDefinition;
}

interface QuestNodeDefinition extends WorldNodeRewardDefinition {
  kind: "quest";
  zoneTitle: string;
}

interface ShrineNodeDefinition extends WorldNodeRewardDefinition {
  kind: "shrine";
  zoneTitle: string;
}

interface EventNodeDefinition {
  kind: "event";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
}

interface OpportunityNodeVariantDefinition extends WorldNodeRewardDefinition {
  requiresPrimaryOutcomeIds?: string[];
  requiresFollowUpOutcomeIds?: string[];
  requiresConsequenceIds?: string[];
  requiresFlagIds?: string[];
  requiresMercenaryIds?: string[];
}

interface ShrineOpportunityVariantDefinition extends WorldNodeRewardDefinition {
  requiresShrineOutcomeIds?: string[];
  requiresFlagIds?: string[];
  requiresMercenaryIds?: string[];
}

interface ReserveOpportunityVariantDefinition extends WorldNodeRewardDefinition {
  requiresFlagIds?: string[];
}

interface OpportunityNodeDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  variants: OpportunityNodeVariantDefinition[];
}

interface CrossroadOpportunityDefinition extends OpportunityNodeDefinition {
  requiresShrineId: string;
}

interface ShrineOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresShrineId: string;
  variants: ShrineOpportunityVariantDefinition[];
}

interface ReserveOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresOpportunityId: string;
  requiresShrineOpportunityId: string;
  requiresCrossroadOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface RelayOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresReserveOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface CulminationOpportunityDefinition extends OpportunityNodeDefinition {
  requiresRelayOpportunityId: string;
}

interface LegacyOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface ReckoningOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresReserveOpportunityId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface RecoveryOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresShrineOpportunityId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface AccordOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresShrineOpportunityId: string;
  requiresCrossroadOpportunityId: string;
  requiresCulminationOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface CovenantOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresLegacyOpportunityId: string;
  requiresReckoningOpportunityId: string;
  requiresRecoveryOpportunityId: string;
  requiresAccordOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface DetourOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresRecoveryOpportunityId: string;
  requiresAccordOpportunityId: string;
  requiresCovenantOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface EscalationOpportunityDefinition {
  kind: "opportunity";
  id: string;
  title: string;
  zoneTitle: string;
  description: string;
  summary: string;
  grants: RewardGrants;
  requiresQuestId: string;
  requiresLegacyOpportunityId: string;
  requiresReckoningOpportunityId: string;
  requiresCovenantOpportunityId: string;
  variants: ReserveOpportunityVariantDefinition[];
}

interface WorldNodeCatalog {
  quests: Record<number, QuestNodeDefinition>;
  shrines: Record<number, ShrineNodeDefinition>;
  events: Record<number, EventNodeDefinition>;
  opportunities: Record<number, OpportunityNodeDefinition>;
  crossroadOpportunities: Record<number, CrossroadOpportunityDefinition>;
  shrineOpportunities: Record<number, ShrineOpportunityDefinition>;
  reserveOpportunities: Record<number, ReserveOpportunityDefinition>;
  relayOpportunities: Record<number, RelayOpportunityDefinition>;
  culminationOpportunities: Record<number, CulminationOpportunityDefinition>;
  legacyOpportunities: Record<number, LegacyOpportunityDefinition>;
  reckoningOpportunities: Record<number, ReckoningOpportunityDefinition>;
  recoveryOpportunities: Record<number, RecoveryOpportunityDefinition>;
  accordOpportunities: Record<number, AccordOpportunityDefinition>;
  covenantOpportunities: Record<number, CovenantOpportunityDefinition>;
  detourOpportunities: Record<number, DetourOpportunityDefinition>;
  escalationOpportunities: Record<number, EscalationOpportunityDefinition>;
}
