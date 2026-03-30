type RandomFn = () => number;

type CardTarget = "enemy" | "none";
type EnemyIntentKind =
  | "attack"
  | "attack_all"
  | "attack_and_guard"
  | "drain_attack"
  | "sunder_attack"
  | "charge"
  | "teleport"
  | "guard"
  | "guard_allies"
  | "heal_ally"
  | "heal_allies"
  | "heal_and_guard"
  | "resurrect_ally"
  | "summon_minion"
  | "attack_burn"
  | "attack_burn_all"
  | "attack_lightning"
  | "attack_lightning_all"
  | "attack_poison_all"
  | "attack_poison"
  | "attack_chill"
  | "curse_amplify"
  | "curse_weaken"
  | "drain_energy"
  | "buff_allies_attack"
  | "consume_corpse"
  | "corpse_explosion";
type EnemyIntentTarget = "hero" | "lowest_life" | "mercenary" | "all_allies";
type ZoneKind = "battle" | "boss" | "miniboss" | "quest" | "shrine" | "event" | "opportunity";
// ZoneRole values include fixed roles and dynamic mainline/side slugs (e.g. "mainline_1", "side_dark_wood")
type ZoneRole = "opening" | "boss" | "branchBattle" | "branchMiniboss" | (string & {});
type AppPhase =
  | "boot"
  | "front_door"
  | "character_select"
  | "safe_zone"
  | "world_map"
  | "encounter"
  | "reward"
  | "act_transition"
  | "run_complete"
  | "run_failed";
type CombatPhase = "player" | "enemy" | "victory" | "defeat";
type CombatOutcome = "victory" | "defeat";

type CardEffectKind =
  | "damage"
  | "damage_all"
  | "summon_minion"
  | "gain_guard_self"
  | "gain_guard_party"
  | "heal_hero"
  | "heal_mercenary"
  | "draw"
  | "mark_enemy_for_mercenary"
  | "buff_mercenary_next_attack"
  | "apply_burn"
  | "apply_burn_all"
  | "apply_poison"
  | "apply_poison_all"
  | "apply_slow"
  | "apply_slow_all"
  | "apply_freeze"
  | "apply_freeze_all"
  | "apply_stun"
  | "apply_stun_all"
  | "apply_paralyze"
  | "apply_paralyze_all";
type CardRewardRole = "foundation" | "engine" | "support" | "tech";

type StatusEffectKind = "burn" | "poison" | "slow" | "freeze" | "stun" | "paralyze";
type WeaponEffectKind = "burn" | "slow" | "freeze" | "shock" | "crushing";
type WeaponDamageType = "fire" | "cold" | "lightning" | "poison";
type DamageType = "physical" | WeaponDamageType;
type HeroDebuffKind = "burn" | "poison" | "chill" | "amplify" | "weaken" | "energyDrain";
type MonsterTraitKind =
  | "swift"
  | "flee_on_ally_death"
  | "death_explosion"
  | "death_poison"
  | "death_spawn"
  | "frenzy"
  | "thorns"
  | "regeneration"
  | "extra_fast"
  | "extra_strong"
  | "cursed"
  | "cold_enchanted"
  | "fire_enchanted"
  | "lightning_enchanted"
  | "stone_skin"
  | "mana_burn"
  | "summon_allies_on_spawn";

interface SpawnConfig {
  minCount: number;
  maxCount: number;
  spawnName: string;
  lifeRatio: number;
  attackRatio: number;
  role: string;
  traits: MonsterTraitKind[];
  family: string;
}

interface CardEffect {
  kind: CardEffectKind;
  value: number;
  secondaryValue?: number;
  minionId?: string;
  duration?: number;
}

interface CardDefinition {
  id: string;
  title: string;
  cost: number;
  target: CardTarget;
  text: string;
  effects: CardEffect[];
  proficiency?: string;
  skillRef?: string;
  tier?: number;
  rewardRole?: CardRewardRole;
  archetypeTags?: string[];
}

interface ClassCardDefinition extends CardDefinition {
  skillRef: string;
  tier: number;
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
  actOrigin: number;
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
  damageType?: DamageType;
  statusValue?: number;
  cooldown?: number;
}

interface EnemyTemplate {
  templateId: string;
  name: string;
  maxLife: number;
  intents: EnemyIntent[];
  role?: string;
  variant?: string;
  affixes?: string[];
  traits?: MonsterTraitKind[];
  family?: string;
  summonTemplateId?: string;
  spawnConfig?: SpawnConfig;
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
  heroHandSize?: number;
  heroPotionHeal?: number;
  heroDamageBonus?: number;
  heroGuardBonus?: number;
  heroBurnBonus?: number;
  mercenaryAttack?: number;
  mercenaryMaxLife?: number;
}

interface WeaponEffectDefinition {
  kind: WeaponEffectKind;
  amount: number;
  proficiency?: string;
}

interface WeaponDamageDefinition {
  type: WeaponDamageType;
  amount: number;
  proficiency?: string;
}

interface DamageResistanceDefinition {
  type: DamageType;
  amount: number;
}

interface WeaponCombatProfile {
  attackDamageByProficiency?: Record<string, number>;
  supportValueByProficiency?: Record<string, number>;
  typedDamage?: WeaponDamageDefinition[];
  effects?: WeaponEffectDefinition[];
}

interface ArmorMitigationProfile {
  resistances?: DamageResistanceDefinition[];
  immunities?: DamageType[];
}

interface RuntimeItemDefinition {
  id: string;
  sourceId: string;
  name: string;
  slot: EquipmentSlot;
  family: string;
  summary: string;
  actRequirement: number;
  progressionTier: number;
  maxSockets: number;
  bonuses: ItemBonusSet;
  weaponProfile?: WeaponCombatProfile;
  armorProfile?: ArmorMitigationProfile;
}

interface RuntimeRuneDefinition {
  id: string;
  sourceId: string;
  name: string;
  allowedSlots: Array<EquipmentSlot>;
  rank: number;
  progressionTier: number;
  summary: string;
  bonuses: ItemBonusSet;
}

interface RuntimeRunewordDefinition {
  id: string;
  sourceId: string;
  name: string;
  slot: EquipmentSlot;
  familyAllowList?: string[];
  progressionTier: number;
  socketCount: number;
  requiredRunes: string[];
  summary: string;
  bonuses: ItemBonusSet;
}

interface ClassRewardTiers {
  early: string[];
  mid: string[];
  late: string[];
}

interface GameContent {
  hero: HeroDefinition;
  mercenaryCatalog: Record<string, MercenaryDefinition>;
  cardCatalog: Record<string, CardDefinition>;
  starterDeck: string[];
  starterDeckProfiles: Record<string, string[]>;
  classDeckProfiles: Record<string, string>;
  classStarterDecks?: Record<string, string[]>;
  classRewardPools?: Record<string, ClassRewardTiers>;
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
  generatedZoneEncounterIds?: Record<string, string[]>;
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

type ZoneMonsterMap = Record<string, Record<string, string[]>>;

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
  zoneMonsters?: ZoneMonsterMap;
}
