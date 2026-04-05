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
