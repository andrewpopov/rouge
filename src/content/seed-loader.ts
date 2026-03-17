(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const SEED_ROOT = "./data/seeds/d2";
  const SEED_FILES = {
    classes: "classes.json",
    skills: "skills.json",
    zones: "zones.json",
    enemyPools: "enemy-pools.json",
    monsters: "monsters.json",
    items: "items.json",
    runes: "runes.json",
    runewords: "runewords.json",
    bosses: "bosses.json",
    zoneMonsters: "zone-monsters.json",
  };

  let cachedPromise: Promise<SeedBundle> | null = null;

  async function loadJson(relativePath: string) {
    const response = await fetch(relativePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${relativePath}: ${response.status}`);
    }
    return response.json();
  }

  async function loadSeedBundle() {
    if (!cachedPromise) {
      cachedPromise = Promise.all(
        Object.entries(SEED_FILES).map(async ([key, fileName]) => [key, await loadJson(`${SEED_ROOT}/${fileName}`)])
      ).then((entries) => ({
        loadedAt: new Date().toISOString(),
        ...Object.fromEntries(entries),
      }));
    }

    return cachedPromise;
  }

  runtimeWindow.ROUGE_SEED_LOADER = {
    SEED_ROOT,
    SEED_FILES,
    loadSeedBundle,
  };
})();
