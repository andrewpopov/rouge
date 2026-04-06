export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function flushAsyncWork(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// ---------------------------------------------------------------------------
// Snapshot round-trip
// ---------------------------------------------------------------------------

test("createSnapshot produces a versioned envelope with a deep-cloned run", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);

  const snapshot = persistence.createSnapshot({
    phase: state.phase,
    selectedClassId: "sorceress",
    selectedMercenaryId: "iron_wolf",
    run: state.run,
  });

  assert.equal(snapshot.schemaVersion, persistence.SCHEMA_VERSION);
  assert.equal(snapshot.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(snapshot.selectedClassId, "sorceress");
  assert.equal(snapshot.run.classId, "sorceress");
  assert.ok(snapshot.savedAt);

  // Deep clone: mutating the original run must not affect the snapshot.
  state.run.gold = 9999;
  assert.notEqual(snapshot.run.gold, 9999);
});

test("serializeSnapshot and restoreSnapshot round-trip preserves data", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);

  const snapshot = persistence.createSnapshot({
    phase: state.phase,
    selectedClassId: "sorceress",
    selectedMercenaryId: "iron_wolf",
    run: state.run,
  });

  const serialized = persistence.serializeSnapshot(snapshot);
  assert.equal(typeof serialized, "string");

  const restored = persistence.restoreSnapshot(serialized);
  assert.ok(restored);
  assert.equal(restored.phase, snapshot.phase);
  assert.equal(restored.selectedClassId, snapshot.selectedClassId);
  assert.equal(restored.run.classId, snapshot.run.classId);
  assert.equal(restored.run.hero.name, snapshot.run.hero.name);
});

test("restoreSnapshot returns null for invalid input", () => {
  const { persistence } = createHarness();

  assert.equal(persistence.restoreSnapshot("not-json"), null);
  assert.equal(persistence.restoreSnapshot("{}"), null);
  assert.equal(persistence.restoreSnapshot(null), null);
});

// ---------------------------------------------------------------------------
// Profile round-trip
// ---------------------------------------------------------------------------

test("createEmptyProfile produces a valid default profile", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();

  assert.equal(profile.activeRunSnapshot, null);
  assert.equal(JSON.stringify(profile.stash.entries), "[]");
  assert.equal(JSON.stringify(profile.runHistory), "[]");
  assert.equal(profile.meta.settings.showHints, true);
  assert.equal(profile.meta.settings.reduceMotion, false);
  assert.equal(profile.meta.progression.highestLevel, 1);
  assert.ok(Array.isArray(profile.meta.unlocks.townFeatureIds));
  assert.ok(profile.meta.unlocks.townFeatureIds.length > 0);
});

test("serializeProfile and restoreProfile round-trip preserves data", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();
  profile.meta.progression.highestLevel = 7;
  profile.meta.progression.classesPlayed = ["sorceress", "amazon"];

  const serialized = persistence.serializeProfile(profile);
  assert.equal(typeof serialized, "string");

  const restored = persistence.restoreProfile(serialized);
  assert.ok(restored);
  assert.equal(restored.profile.meta.progression.highestLevel, 7);
  assert.ok(restored.profile.meta.progression.classesPlayed.includes("sorceress"));
  assert.ok(restored.profile.meta.progression.classesPlayed.includes("amazon"));
});

test("restoreProfile handles malformed input gracefully", () => {
  const { persistence } = createHarness();

  // Malformed JSON still produces a migrated default profile (the migration layer is lenient)
  const fromBroken = persistence.restoreProfile("{broken");
  // null input also gets migrated into a default envelope
  const fromNull = persistence.restoreProfile(null);

  // Both should either be null or a valid envelope — accept whichever the implementation does
  if (fromBroken !== null) {
    assert.ok(fromBroken.profile);
    assert.ok(fromBroken.profile.meta);
  }
  if (fromNull !== null) {
    assert.ok(fromNull.profile);
    assert.ok(fromNull.profile.meta);
  }
});

// ---------------------------------------------------------------------------
// Storage save/load round-trip (snapshot)
// ---------------------------------------------------------------------------

test("saveToStorage and loadFromStorage round-trip through the in-memory storage", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);

  const snapshot = persistence.createSnapshot({
    phase: state.phase,
    selectedClassId: "sorceress",
    selectedMercenaryId: "iron_wolf",
    run: state.run,
  });

  const saveResult = persistence.saveToStorage(snapshot, storage);
  assert.equal(saveResult.ok, true);

  const loaded = persistence.loadFromStorage(storage);
  assert.ok(loaded);
  assert.equal(loaded.run.classId, "sorceress");
});

test("hasSavedSnapshot returns false on empty storage and true after saving", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();

  assert.equal(persistence.hasSavedSnapshot(storage), false);

  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);

  const snapshot = persistence.createSnapshot({
    phase: state.phase,
    selectedClassId: "sorceress",
    selectedMercenaryId: "iron_wolf",
    run: state.run,
  });
  persistence.saveToStorage(snapshot, storage);

  assert.equal(persistence.hasSavedSnapshot(storage), true);
});

test("clearStorage removes the active run snapshot", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);

  const snapshot = persistence.createSnapshot({
    phase: state.phase,
    selectedClassId: "sorceress",
    selectedMercenaryId: "iron_wolf",
    run: state.run,
  });
  persistence.saveToStorage(snapshot, storage);
  assert.equal(persistence.hasSavedSnapshot(storage), true);

  persistence.clearStorage(storage);
  assert.equal(persistence.hasSavedSnapshot(storage), false);
});

// ---------------------------------------------------------------------------
// Profile storage round-trip
// ---------------------------------------------------------------------------

test("saveProfileToStorage and loadProfileFromStorage round-trip", () => {
  const { persistence, storage } = createHarness();
  const profile = persistence.createEmptyProfile();
  profile.meta.progression.highestLevel = 12;

  const result = persistence.saveProfileToStorage(profile, storage);
  assert.equal(result.ok, true);

  const loaded = persistence.loadProfileFromStorage(storage);
  assert.ok(loaded);
  assert.equal(loaded.meta.progression.highestLevel, 12);
});

test("initializeProfileStore uses backend profile persistence for authenticated users", async () => {
  const { persistence, browserWindow, storage } = createHarness();
  const backendProfile = persistence.createEmptyProfile();
  backendProfile.meta.progression.highestLevel = 18;

  const fetchCalls: Array<{ input: string; init?: RequestInit }> = [];
  let savedProfilePayload = "";
  (browserWindow as Window & Record<string, unknown>).fetch = async (input: string, init?: RequestInit) => {
    fetchCalls.push({ input, init });
    if (!init?.method || init.method === "GET") {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            profile: persistence.serializeProfile(backendProfile),
          };
        },
      } as unknown as Response;
    }
    savedProfilePayload = String(init.body || "");
    return {
      ok: true,
      async json() {
        return { ok: true };
      },
    } as unknown as Response;
  };
  (browserWindow as Window & Record<string, unknown>).ROGUE_AUTH = {
    initializeGoogleAuth() {},
    async checkSession() {},
    async handleCredentialResponse() {},
    renderSignInButton() {},
    async signOut() {},
    getAuthState() {
      return {
        user: {
          googleId: "gid-backend",
          email: "backend@example.com",
          name: "Backend Hero",
          avatarUrl: "",
        },
        loading: false,
        ready: true,
      };
    },
    onAuthChange() {},
    async waitUntilReady() {},
  };

  await persistence.initializeProfileStore();

  const loaded = persistence.loadProfileFromStorage();
  assert.ok(loaded);
  assert.equal(loaded.meta.progression.highestLevel, 18);
  assert.equal(storage.getItem(persistence.PROFILE_STORAGE_KEY), null);

  loaded.meta.progression.highestLevel = 19;
  const saveResult = persistence.saveProfileToStorage(loaded);
  assert.equal(saveResult.ok, true);
  await flushAsyncWork();
  await flushAsyncWork();

  assert.equal(fetchCalls[0].input, "/api/profile");
  assert.equal(fetchCalls.some((call) => call.init?.method === "PUT"), true);
  const savedBody = JSON.parse(savedProfilePayload) as { profile: string };
  const restored = persistence.restoreProfile(savedBody.profile);
  assert.ok(restored);
  assert.equal(restored.profile.meta.progression.highestLevel, 19);
});

test("loadProfileFromStorage returns null from empty storage", () => {
  const { persistence, storage } = createHarness();
  assert.equal(persistence.loadProfileFromStorage(storage), null);
});

// ---------------------------------------------------------------------------
// Profile meta operations
// ---------------------------------------------------------------------------

test("ensureProfileMeta fills defaults on a bare profile", () => {
  const { persistence } = createHarness();
  const profile = { activeRunSnapshot: null, stash: { entries: [] }, runHistory: [], meta: null } as unknown as ProfileState;

  persistence.ensureProfileMeta(profile);

  assert.ok(profile.meta);
  assert.equal(profile.meta.settings.showHints, true);
  assert.equal(profile.meta.progression.highestLevel, 1);
  assert.ok(Array.isArray(profile.meta.unlocks.townFeatureIds));
  assert.ok(profile.meta.unlocks.townFeatureIds.includes("safe_zone_services"));
});

test("unlockProfileEntries adds new IDs without duplicating existing ones", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();

  persistence.unlockProfileEntries(profile, "bossIds", ["andariel"]);
  assert.ok(profile.meta.unlocks.bossIds.includes("andariel"));

  persistence.unlockProfileEntries(profile, "bossIds", ["andariel", "duriel"]);
  const andarielCount = profile.meta.unlocks.bossIds.filter((id: string) => id === "andariel").length;
  assert.equal(andarielCount, 1);
  assert.ok(profile.meta.unlocks.bossIds.includes("duriel"));
});

test("updateProfileSettings patches only recognised boolean keys", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();

  assert.equal(profile.meta.settings.showHints, true);
  persistence.updateProfileSettings(profile, { showHints: false });
  assert.equal(profile.meta.settings.showHints, false);

  persistence.updateProfileSettings(profile, { reduceMotion: true });
  assert.equal(profile.meta.settings.reduceMotion, true);
  // showHints should remain unchanged by the second patch.
  assert.equal(profile.meta.settings.showHints, false);
});

// ---------------------------------------------------------------------------
// Run history recording
// ---------------------------------------------------------------------------

test("recordRunHistory adds an entry to the front of runHistory", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);

  const profile = persistence.createEmptyProfile();
  persistence.recordRunHistory(profile, state.run, "completed", content);

  assert.equal(profile.runHistory.length, 1);
  assert.equal(profile.runHistory[0].classId, "sorceress");
  assert.equal(profile.runHistory[0].outcome, "completed");
  assert.ok(profile.runHistory[0].completedAt);
});

test("recordRunHistory updates meta progression stats from the run", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);
  state.run.summary.goldGained = 150;
  state.run.summary.bossesDefeated = 2;

  const profile = persistence.createEmptyProfile();
  persistence.recordRunHistory(profile, state.run, "completed", content);

  assert.equal(profile.meta.progression.totalGoldCollected, 150);
  assert.equal(profile.meta.progression.totalBossesDefeated, 2);
  assert.ok(profile.meta.progression.classesPlayed.includes("sorceress"));
});

test("recordRunHistory accumulates stats across multiple runs", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const profile = persistence.createEmptyProfile();

  // First run
  const state1 = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  appEngine.startCharacterSelect(state1);
  appEngine.setSelectedClass(state1, "sorceress");
  appEngine.setSelectedMercenary(state1, "iron_wolf");
  appEngine.startRun(state1);
  state1.run.summary.goldGained = 100;
  persistence.recordRunHistory(profile, state1.run, "completed", content);

  // Second run
  const state2 = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  appEngine.startCharacterSelect(state2);
  appEngine.setSelectedClass(state2, "amazon");
  appEngine.setSelectedMercenary(state2, "iron_wolf");
  appEngine.startRun(state2);
  state2.run.summary.goldGained = 200;
  persistence.recordRunHistory(profile, state2.run, "failed", content);

  assert.equal(profile.runHistory.length, 2);
  // Most recent entry is first.
  assert.equal(profile.runHistory[0].classId, "amazon");
  assert.equal(profile.runHistory[0].outcome, "failed");
  assert.equal(profile.meta.progression.totalGoldCollected, 300);
  assert.ok(profile.meta.progression.classesPlayed.includes("sorceress"));
  assert.ok(profile.meta.progression.classesPlayed.includes("amazon"));
});

// ---------------------------------------------------------------------------
// Profile summary
// ---------------------------------------------------------------------------

test("getProfileSummary returns zeroed metrics for an empty profile", () => {
  const { persistence } = createHarness();
  const profile = persistence.createEmptyProfile();
  const summary = persistence.getProfileSummary(profile);

  assert.equal(summary.hasActiveRun, false);
  assert.equal(summary.runHistoryCount, 0);
  assert.equal(summary.completedRuns, 0);
  assert.equal(summary.failedRuns, 0);
  assert.equal(summary.highestLevel, 1);
  assert.equal(summary.totalGoldCollected, 0);
});

test("getProfileSummary reflects recorded run history", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);
  state.run.summary.goldGained = 250;

  const profile = persistence.createEmptyProfile();
  persistence.recordRunHistory(profile, state.run, "completed", content);

  const summary = persistence.getProfileSummary(profile);
  assert.equal(summary.runHistoryCount, 1);
  assert.equal(summary.completedRuns, 1);
  assert.equal(summary.totalGoldCollected, 250);
  assert.ok(summary.classesPlayedCount >= 1);
});

// ---------------------------------------------------------------------------
// Full end-to-end: run -> record -> save -> load -> verify
// ---------------------------------------------------------------------------

test("full lifecycle: start run, record history, save profile, reload, and verify integrity", () => {
  const { content, combatEngine, appEngine, persistence, seedBundle, storage } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "iron_wolf");
  appEngine.startRun(state);
  state.run.summary.goldGained = 500;
  state.run.summary.bossesDefeated = 1;

  const profile = persistence.createEmptyProfile();
  persistence.recordRunHistory(profile, state.run, "completed", content);
  persistence.saveProfileToStorage(profile, storage);

  const loaded = persistence.loadProfileFromStorage(storage);
  assert.ok(loaded);
  assert.equal(loaded.runHistory.length, 1);
  assert.equal(loaded.runHistory[0].outcome, "completed");
  assert.equal(loaded.meta.progression.totalGoldCollected, 500);
  assert.equal(loaded.meta.progression.totalBossesDefeated, 1);
});
