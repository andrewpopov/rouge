type RandomFn = () => number;

type CardTarget = string;
type EnemyIntentKind = string;
type EnemyIntentTarget = string;
type ZoneKind = string;
type ZoneRole = string;
type AppPhase = string;
type CombatPhase = string;
type CombatOutcome = string;

interface CardEffectBase {
  kind: string;
  value: number;
}

type CardEffect = CardEffectBase;

interface CardDefinition {
  id: string;
  title: string;
  cost: number;
  target: CardTarget;
  text: string;
  effects: CardEffect[];
}

interface HeroDefinition {
  id: string;
  name: string;
  classId?: string;
  className: string;
  maxLife: number;
  maxEnergy: number;
  handSize: number;
  potionHeal: number;
  baseStats?: Record<string, unknown>;
  startingResources?: Record<string, unknown>;
  [key: string]: unknown;
}

interface MercenaryDefinition {
  id: string;
  name: string;
  role: string;
  maxLife: number;
  attack: number;
  behavior: string;
  passiveText: string;
  routePerks?: MercenaryRoutePerkDefinition[];
  [key: string]: unknown;
}

interface MercenaryRoutePerkDefinition {
  id: string;
  title: string;
  requiredFlagIds: string[];
  attackBonus?: number;
  attackBonusPerAct?: number;
  behaviorBonus?: number;
  behaviorBonusPerAct?: number;
  startGuard?: number;
  startGuardPerAct?: number;
  heroDamageBonus?: number;
  heroDamageBonusPerAct?: number;
  heroStartGuard?: number;
  heroStartGuardPerAct?: number;
  openingDraw?: number;
  openingDrawPerAct?: number;
  scalingStartAct?: number;
}

interface EnemyIntent {
  kind: EnemyIntentKind;
  label: string;
  value: number;
  target?: EnemyIntentTarget;
  secondaryValue?: number;
}

interface EnemyTemplate {
  templateId: string;
  name: string;
  maxLife: number;
  intents: EnemyIntent[];
  role?: string;
  variant?: string;
  affixes?: string[];
}

interface EncounterEnemyEntry {
  id: string;
  templateId: string;
}

interface EncounterModifier {
  kind: string;
  value: number;
}

interface EncounterDefinition {
  id: string;
  name: string;
  description: string;
  enemies: EncounterEnemyEntry[];
  modifiers?: EncounterModifier[];
}

interface ConsequenceEncounterPackageDefinition {
  id: string;
  title: string;
  zoneRole: ZoneRole;
  requiredFlagIds: string[];
  encounterId: string;
}

interface ConsequenceRewardPackageDefinition {
  id: string;
  title: string;
  zoneRole: ZoneRole;
  requiredFlagIds: string[];
  grants: RewardGrants;
  bonusLines?: string[];
}

interface GeneratedActEncounterIds {
  opening: string[];
  branchBattle: string[];
  branchMiniboss: string[];
  boss: string[];
}

interface RewardCardPools {
  profileCards: Record<string, string[]>;
  zoneRoleCards: Record<string, string[]>;
  bossCards: string[];
}

interface ItemBonusSet {
  heroMaxLife?: number;
  heroMaxEnergy?: number;
  heroPotionHeal?: number;
  heroDamageBonus?: number;
  heroGuardBonus?: number;
  heroBurnBonus?: number;
  mercenaryAttack?: number;
  mercenaryMaxLife?: number;
}

interface RuntimeItemDefinition {
  id: string;
  sourceId: string;
  name: string;
  slot: "weapon" | "armor";
  family: string;
  summary: string;
  actRequirement: number;
  progressionTier: number;
  maxSockets: number;
  bonuses: ItemBonusSet;
}

interface RuntimeRuneDefinition {
  id: string;
  sourceId: string;
  name: string;
  allowedSlots: Array<"weapon" | "armor">;
  rank: number;
  progressionTier: number;
  summary: string;
  bonuses: ItemBonusSet;
}

interface RuntimeRunewordDefinition {
  id: string;
  sourceId: string;
  name: string;
  slot: "weapon" | "armor";
  familyAllowList?: string[];
  progressionTier: number;
  socketCount: number;
  requiredRunes: string[];
  summary: string;
  bonuses: ItemBonusSet;
}

interface GameContent {
  hero: HeroDefinition;
  mercenaryCatalog: Record<string, MercenaryDefinition>;
  cardCatalog: Record<string, CardDefinition>;
  starterDeck: string[];
  starterDeckProfiles: Record<string, string[]>;
  classDeckProfiles: Record<string, string>;
  classProgressionCatalog?: Record<string, RuntimeClassProgressionDefinition>;
  rewardPools?: RewardCardPools;
  itemCatalog?: Record<string, RuntimeItemDefinition>;
  runeCatalog?: Record<string, RuntimeRuneDefinition>;
  runewordCatalog?: Record<string, RuntimeRunewordDefinition>;
  consequenceEncounterPackages?: Record<number, ConsequenceEncounterPackageDefinition[]>;
  consequenceRewardPackages?: Record<number, ConsequenceRewardPackageDefinition[]>;
  enemyCatalog: Record<string, EnemyTemplate>;
  encounterCatalog: Record<string, EncounterDefinition>;
  generatedActEncounterIds?: Record<number, GeneratedActEncounterIds>;
}

interface ClassStartingResources {
  hitPoints?: string;
  mana?: string;
  [key: string]: string | undefined;
}

interface ClassDefinition {
  id: string;
  name: string;
  skillTrees: string[];
  baseStats?: Record<string, unknown>;
  startingResources?: ClassStartingResources;
  [key: string]: unknown;
}

interface SkillSeedDefinition {
  id: string;
  name: string;
  requiredLevel: number;
}

interface SkillTreeSeedDefinition {
  id: string;
  name: string;
  skills: SkillSeedDefinition[];
}

interface ClassSkillsSeedEntry {
  classId: string;
  className: string;
  trees: SkillTreeSeedDefinition[];
}

interface SkillsSeedFile {
  version?: string;
  source?: string | Record<string, unknown>;
  classes?: ClassSkillsSeedEntry[];
}

interface RuntimeClassSkillDefinition {
  id: string;
  name: string;
  requiredLevel: number;
}

interface RuntimeClassTreeDefinition {
  id: string;
  name: string;
  archetypeId: string;
  summary: string;
  bonusPerRank: ItemBonusSet;
  maxRank: number;
  unlockThreshold: number;
  unlockBonusPerThreshold: ItemBonusSet;
  skills: RuntimeClassSkillDefinition[];
}

interface RuntimeClassProgressionDefinition {
  classId: string;
  className: string;
  trees: RuntimeClassTreeDefinition[];
}

interface ActBossSeed {
  id: string;
  name: string;
  zone: string;
}

interface ActSeed {
  act: number;
  name: string;
  town: string;
  mainlineZones?: string[];
  sideZones?: string[];
  sideBranches?: Array<{
    name: string;
    from: string;
    gatedBy?: string;
    encounters?: number;
    kind?: ZoneKind;
    description?: string;
  }>;
  openingDungeon?: string;
  boss: ActBossSeed;
}

interface ZonesSeedFile {
  acts?: ActSeed[];
}

interface BossEntry {
  id: string;
  name: string;
  bossProfile?: string | null;
  [key: string]: unknown;
}

interface BossesSeedFile {
  entries?: BossEntry[];
}

interface EnemyPoolEntryRef {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface EnemyPoolEntry {
  act: number;
  enemies?: EnemyPoolEntryRef[];
  nativeEnemies?: EnemyPoolEntryRef[];
  guestEnemiesNightmareHell?: EnemyPoolEntryRef[];
}

interface EnemyPoolsSeedFile {
  enemyPools?: EnemyPoolEntry[];
}

interface SeedBundle {
  loadedAt?: string;
  classes?: {
    classes?: ClassDefinition[];
  };
  skills?: SkillsSeedFile;
  zones?: ZonesSeedFile;
  enemyPools?: EnemyPoolsSeedFile;
  monsters?: unknown;
  items?: unknown;
  runes?: unknown;
  runewords?: unknown;
  bosses?: BossesSeedFile;
}
