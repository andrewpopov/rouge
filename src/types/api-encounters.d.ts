interface EncounterRegistryGroupedEntries {
  raider: EnemyPoolEntryRef[];
  ranged: EnemyPoolEntryRef[];
  support: EnemyPoolEntryRef[];
  brute: EnemyPoolEntryRef[];
}

interface EncounterRegistryEnemyScale {
  life: number;
  attack: number;
  guard: number;
  heal: number;
}

interface EncounterRegistryEliteAffixProfile {
  id: string;
  label: string;
  lifeBonus: number;
  attackBonus: number;
  guardBonus: number;
}

interface EncounterRegistryElitePackage {
  profileId: string;
  role: string;
  entryIndex: number;
  templateIdSuffix: string;
}

interface EncounterRegistryActContent {
  enemyCatalog: Record<string, EnemyTemplate>;
  encounterCatalog: Record<string, EncounterDefinition>;
  encounterIdsByKind: GeneratedActEncounterIds;
}

interface EncounterRegistryEnemyBuildersApi {
  normalizeActPool(seedBundle: SeedBundle, actNumber: number): EnemyPoolEntryRef[];
  groupByRole(entries: EnemyPoolEntryRef[]): EncounterRegistryGroupedEntries;
  getElitePackages(actNumber: number): EncounterRegistryElitePackage[];
  getEliteAffixProfile(profileId: string): EncounterRegistryEliteAffixProfile;
  buildEnemyTemplate(options: {
    actNumber: number;
    entry: EnemyPoolEntryRef;
    role: string;
    variant?: string;
    templateIdSuffix?: string;
    labelPrefix?: string;
    scaleOverride?: EncounterRegistryEnemyScale | null;
    affixes?: string[];
    intents?: EnemyIntent[] | null;
  }): EnemyTemplate;
  buildEliteTemplate(options: {
    actNumber: number;
    entry: EnemyPoolEntryRef;
    role: string;
    profile: EncounterRegistryEliteAffixProfile;
    templateIdSuffix: string;
  }): EnemyTemplate;
  buildBossTemplate(options: {
    actNumber: number;
    actSeed: ActSeed;
    bossEntry: BossEntry | null | undefined;
  }): EnemyTemplate;
}

interface EncounterRegistryZoneContent {
  enemyCatalog: Record<string, EnemyTemplate>;
  encounterCatalog: Record<string, EncounterDefinition>;
  encounterIds: string[];
}

interface EncounterRegistryBuildersApi {
  normalizeActPool(seedBundle: SeedBundle, actNumber: number): EnemyPoolEntryRef[];
  groupByRole(entries: EnemyPoolEntryRef[]): EncounterRegistryGroupedEntries;
  buildActEncounterSet(options: {
    actSeed: ActSeed;
    bossEntry: BossEntry | null | undefined;
    groupedEntries: EncounterRegistryGroupedEntries;
  }): EncounterRegistryActContent;
  buildZoneEncounterSet(options: {
    actNumber: number;
    zoneName: string;
    monsterNames: string[];
  }): EncounterRegistryZoneContent | null;
}

interface EncounterRegistryApi {
  createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle): GameContent;
}

interface ContentValidationReport {
  ok: boolean;
  errors: string[];
}

interface ContentValidatorApi {
  validateSeedBundle(seedBundle: SeedBundle): ContentValidationReport;
  assertValidSeedBundle(seedBundle: SeedBundle): void;
  validateRuntimeContent(content: GameContent): ContentValidationReport;
  assertValidRuntimeContent(content: GameContent): void;
  validateWorldNodeCatalog(worldNodeCatalog: WorldNodeCatalog): ContentValidationReport;
  assertValidWorldNodeCatalog(worldNodeCatalog: WorldNodeCatalog): void;
}

interface ContentValidatorRuntimeContentApi {
  validateRuntimeContent(content: GameContent): ContentValidationReport;
}
