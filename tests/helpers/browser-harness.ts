import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(__dirname, "../../..");
const GENERATED_ROOT = path.join(ROOT, "generated");

const SHARED_RUNTIME_FILES = [
  "src/content/game-content.js",
  "src/combat/combat-modifiers.js",
  "src/combat/combat-engine.js",
];

const VALIDATOR_RUNTIME_FILES = [
  "src/content/content-validator-world-paths.js",
  "src/content/content-validator-world-opportunities.js",
  "src/content/content-validator-runtime-content.js",
  "src/content/content-validator.js",
];

const ENCOUNTER_REGISTRY_HELPER_FILES = [
  "src/content/encounter-registry-enemy-builders.js",
  "src/content/encounter-registry-builders.js",
];

const ITEM_RUNTIME_FILES = [
  "src/items/item-data.js",
  "src/items/item-catalog.js",
  "src/items/item-loadout.js",
  "src/items/item-town.js",
  "src/items/item-system.js",
];

const RUN_RUNTIME_FILES = [
  "src/run/run-state.js",
  "src/run/run-route-builder.js",
  "src/run/run-progression.js",
  "src/run/run-reward-flow.js",
  "src/run/run-factory.js",
];

const PERSISTENCE_RUNTIME_FILES = [
  "src/state/save-migrations.js",
  "src/state/profile-migrations.js",
  "src/state/persistence.js",
];

const APP_UI_RUNTIME_FILES = [
  "src/ui/ui-common.js",
  "src/ui/launch-flow-view.js",
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

const WORLD_NODE_RUNTIME_FILES = [
  "src/quests/world-node-outcomes.js",
  "src/quests/world-node-zones.js",
  "src/quests/world-node-variants.js",
  "src/quests/world-node-engine.js",
];

const CONTENT_HELPER_RUNTIME_FILES = [
  ...SHARED_RUNTIME_FILES,
  ...VALIDATOR_RUNTIME_FILES,
  ...ENCOUNTER_REGISTRY_HELPER_FILES,
];

const COMBAT_RUNTIME_FILES = [
  ...CONTENT_HELPER_RUNTIME_FILES,
  "src/character/class-registry.js",
  ...WORLD_NODE_RUNTIME_FILES,
  "src/content/encounter-registry.js",
];

const APP_RUNTIME_FILES = [
  ...CONTENT_HELPER_RUNTIME_FILES,
  "src/content/encounter-registry.js",
  "src/character/class-registry.js",
  "src/ui/render-utils.js",
  ...ITEM_RUNTIME_FILES,
  "src/rewards/reward-engine.js",
  ...WORLD_NODE_RUNTIME_FILES,
  ...RUN_RUNTIME_FILES,
  "src/town/service-registry.js",
  ...PERSISTENCE_RUNTIME_FILES,
  "src/app/app-engine.js",
  ...APP_UI_RUNTIME_FILES,
];

export function getAppRuntimeFiles(): string[] {
  return [...APP_RUNTIME_FILES];
}

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
