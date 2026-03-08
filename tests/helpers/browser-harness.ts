import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(__dirname, "../../..");
const GENERATED_ROOT = path.join(ROOT, "generated");

const COMBAT_RUNTIME_FILES = [
  "src/content/game-content.js",
  "src/combat/combat-engine.js",
  "src/content/content-validator-world-paths.js",
  "src/content/content-validator-runtime-content.js",
  "src/content/content-validator.js",
  "src/content/encounter-registry-enemy-builders.js",
  "src/content/encounter-registry-builders.js",
  "src/character/class-registry.js",
  "src/quests/world-node-engine.js",
  "src/content/encounter-registry.js",
];

const APP_RUNTIME_FILES = [
  "src/content/game-content.js",
  "src/combat/combat-engine.js",
  "src/content/content-validator-world-paths.js",
  "src/content/content-validator-runtime-content.js",
  "src/content/content-validator.js",
  "src/content/encounter-registry-enemy-builders.js",
  "src/content/encounter-registry-builders.js",
  "src/content/encounter-registry.js",
  "src/character/class-registry.js",
  "src/ui/render-utils.js",
  "src/items/item-data.js",
  "src/items/item-catalog.js",
  "src/items/item-loadout.js",
  "src/items/item-town.js",
  "src/items/item-system.js",
  "src/rewards/reward-engine.js",
  "src/quests/world-node-engine.js",
  "src/run/run-state.js",
  "src/run/run-route-builder.js",
  "src/run/run-progression.js",
  "src/run/run-reward-flow.js",
  "src/run/run-factory.js",
  "src/town/service-registry.js",
  "src/state/save-migrations.js",
  "src/state/profile-migrations.js",
  "src/state/persistence.js",
  "src/app/app-engine.js",
  "src/ui/ui-common.js",
  "src/ui/front-door-view.js",
  "src/ui/character-select-view.js",
  "src/ui/safe-zone-view.js",
  "src/ui/world-map-view.js",
  "src/ui/combat-view.js",
  "src/ui/reward-view.js",
  "src/ui/act-transition-view.js",
  "src/ui/run-summary-view.js",
  "src/ui/app-shell.js",
  "src/ui/action-dispatcher.js",
];

function loadBrowserScript(filename: string, sandbox: vm.Context): void {
  const fullPath = path.join(GENERATED_ROOT, filename);
  const source = fs.readFileSync(fullPath, "utf8");
  new vm.Script(source, { filename: fullPath }).runInContext(sandbox);
}

function loadRuntimeScripts(files: string[], sandbox: vm.Context): void {
  files.forEach((filename) => {
    loadBrowserScript(filename, sandbox);
  });
}

function readSeedJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.has(key) ? values.get(key) || null : null;
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

class FakeElement {
  dataset: Record<string, string>;

  constructor(dataset: Record<string, string> = {}) {
    this.dataset = dataset;
  }

  closest(selector: string): FakeElement | null {
    return selector === "[data-action]" ? this : null;
  }
}

function createBrowserSandbox(storage?: StorageLike): vm.Context {
  const sandbox = {
    window: {
      localStorage: storage,
      Element: FakeElement,
    },
    console,
    Math,
    Date,
    Element: FakeElement,
  };
  return vm.createContext(sandbox);
}

export function createCombatHarness() {
  const sandbox = createBrowserSandbox();
  loadRuntimeScripts(COMBAT_RUNTIME_FILES, sandbox);
  const browserWindow = sandbox.window as unknown as Window;
  const seedBundle = {
    classes: readSeedJson<NonNullable<SeedBundle["classes"]>>("data/seeds/d2/classes.json"),
    skills: readSeedJson<NonNullable<SeedBundle["skills"]>>("data/seeds/d2/skills.json"),
    zones: readSeedJson<NonNullable<SeedBundle["zones"]>>("data/seeds/d2/zones.json"),
    bosses: readSeedJson<NonNullable<SeedBundle["bosses"]>>("data/seeds/d2/bosses.json"),
    enemyPools: readSeedJson<NonNullable<SeedBundle["enemyPools"]>>("data/seeds/d2/enemy-pools.json"),
  };
  const classRuntimeContent = browserWindow.ROUGE_CLASS_REGISTRY.createRuntimeContent(browserWindow.ROUGE_GAME_CONTENT, seedBundle);
  const runtimeContent = browserWindow.ROUGE_ENCOUNTER_REGISTRY.createRuntimeContent(classRuntimeContent, seedBundle);

  return {
    content: runtimeContent,
    engine: browserWindow.ROUGE_COMBAT_ENGINE,
    validator: browserWindow.ROUGE_CONTENT_VALIDATOR,
    seedBundle,
  };
}

export function createAppHarness() {
  const storage = createMemoryStorage();
  const sandbox = createBrowserSandbox(storage);
  loadRuntimeScripts(APP_RUNTIME_FILES, sandbox);

  const seedBundle = {
    classes: readSeedJson<NonNullable<SeedBundle["classes"]>>("data/seeds/d2/classes.json"),
    skills: readSeedJson<NonNullable<SeedBundle["skills"]>>("data/seeds/d2/skills.json"),
    zones: readSeedJson<NonNullable<SeedBundle["zones"]>>("data/seeds/d2/zones.json"),
    bosses: readSeedJson<NonNullable<SeedBundle["bosses"]>>("data/seeds/d2/bosses.json"),
    enemyPools: readSeedJson<NonNullable<SeedBundle["enemyPools"]>>("data/seeds/d2/enemy-pools.json"),
    items: readSeedJson<SeedBundle["items"]>("data/seeds/d2/items.json"),
    runes: readSeedJson<SeedBundle["runes"]>("data/seeds/d2/runes.json"),
    runewords: readSeedJson<SeedBundle["runewords"]>("data/seeds/d2/runewords.json"),
  };
  const browserWindow = sandbox.window as unknown as Window;
  const classRuntimeContent = browserWindow.ROUGE_CLASS_REGISTRY.createRuntimeContent(browserWindow.ROUGE_GAME_CONTENT, seedBundle);
  const itemizedContent = browserWindow.ROUGE_ITEM_SYSTEM.createRuntimeContent(classRuntimeContent, seedBundle);
  const runtimeContent = browserWindow.ROUGE_ENCOUNTER_REGISTRY.createRuntimeContent(itemizedContent, seedBundle);

  return {
    content: runtimeContent,
    combatEngine: browserWindow.ROUGE_COMBAT_ENGINE,
    classRegistry: browserWindow.ROUGE_CLASS_REGISTRY,
    itemSystem: browserWindow.ROUGE_ITEM_SYSTEM,
    persistence: browserWindow.ROUGE_PERSISTENCE,
    runFactory: browserWindow.ROUGE_RUN_FACTORY,
    appEngine: browserWindow.ROUGE_APP_ENGINE,
    appShell: browserWindow.ROUGE_APP_SHELL,
    actionDispatcher: browserWindow.ROUGE_ACTION_DISPATCHER,
    browserWindow,
    createActionTarget: (dataset: Record<string, string>) => new FakeElement(dataset) as unknown as EventTarget,
    seedBundle,
    storage,
  };
}
