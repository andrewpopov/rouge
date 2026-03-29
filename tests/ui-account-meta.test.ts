export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function buildPlanningCharter(slot: EquipmentSlot, runewordId: string, overrides: Partial<ProfilePlanningCharterSummary> = {}): ProfilePlanningCharterSummary {
  return {
    slot,
    runewordId,
    archivedRunCount: 0,
    completedRunCount: 0,
    bestActsCleared: 0,
    bestCompletedRunId: "",
    bestCompletedClassId: "",
    bestCompletedClassName: "",
    bestCompletedAt: "",
    bestCompletedLoadoutTier: 0,
    bestCompletedLoadoutSockets: 0,
    requiredSocketCount: 2,
    compatibleBaseCount: 0,
    preparedBaseCount: 0,
    readyBaseCount: 0,
    bestBaseItemId: "",
    bestBaseTier: 0,
    bestBaseSocketsUnlocked: 0,
    bestBaseMaxSockets: 0,
    bestBaseInsertedRuneCount: 0,
    bestBaseMissingRuneCount: 0,
    bestBaseSocketGap: 0,
    commissionableBaseCount: 0,
    hasReadyBase: false,
    repeatForgeReady: false,
    ...overrides,
  };
}

function buildConvergence(overrides: Partial<ProfileAccountConvergenceSummary> = {}): ProfileAccountConvergenceSummary {
  return {
    id: "forge_accord",
    title: "Forge Accord",
    description: "Merge archive pressure with mastery pressure.",
    rewardFeatureId: "artisan_stock",
    effectSummary: "Unlock forge synergy across charters.",
    status: "available",
    unlocked: false,
    unlockedRequirementCount: 1,
    requiredFeatureCount: 2,
    requiredFeatureIds: ["economy_ledger", "war_college"],
    requiredFeatureTitles: ["Economy Ledger", "War College"],
    missingFeatureIds: ["war_college"],
    missingFeatureTitles: ["War College"],
    ...overrides,
  };
}

function buildMilestone(overrides: Partial<ProfileAccountMilestoneSummary> = {}): ProfileAccountMilestoneSummary {
  return {
    id: "embers_1",
    title: "Economy Ledger",
    description: "",
    rewardFeatureId: "economy_ledger",
    treeId: "embers",
    treeTitle: "Ash Ledger",
    tier: 1,
    tierLabel: "Tier 1",
    isCapstone: false,
    isEligible: true,
    status: "available",
    blockedByIds: [],
    blockedByTitles: [],
    unlocked: false,
    progress: 0,
    target: 1,
    ...overrides,
  };
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildRichAccountSummary(baseSummary: ProfileAccountSummary, content: GameContent): ProfileAccountSummary {
  const weaponRunewordId = content.runewordCatalog.steel ? "steel" : Object.keys(content.runewordCatalog)[0];
  const armorRunewordId = content.runewordCatalog.lionheart ? "lionheart" : weaponRunewordId;
  const weaponBaseId = content.itemCatalog.item_short_sword ? "item_short_sword" : Object.keys(content.itemCatalog)[0];

  return {
    ...baseSummary,
    archive: {
      ...baseSummary.archive,
      entryCount: 3,
      completedCount: 2,
      failedCount: 1,
      featureUnlockCount: 1,
      latestClassName: "Sorceress",
      latestOutcome: "completed",
      recentFeatureIds: ["economy_ledger"],
      recentPlannedRunewordIds: [weaponRunewordId],
    },
    planning: {
      ...baseSummary.planning,
      weaponRunewordId,
      armorRunewordId,
      plannedRunewordCount: 2,
      fulfilledPlanCount: 2,
      unfulfilledPlanCount: 1,
      overview: {
        ...baseSummary.planning.overview,
        readyCharterCount: 1,
        preparedCharterCount: 2,
        missingBaseCharterCount: 0,
        trackedBaseCount: 2,
        highestTrackedBaseTier: 3,
        nextAction: "open_sockets",
        nextActionLabel: "Open Sockets",
        nextActionSummary: "Open sockets before drafting again.",
      },
      weaponCharter: buildPlanningCharter("weapon", weaponRunewordId, {
        readyBaseCount: 1,
        preparedBaseCount: 1,
        compatibleBaseCount: 2,
        bestBaseItemId: weaponBaseId,
        bestBaseSocketsUnlocked: 2,
        bestBaseMaxSockets: 2,
        bestBaseMissingRuneCount: 0,
        completedRunCount: 1,
        bestActsCleared: 3,
      }),
      armorCharter: buildPlanningCharter("armor", armorRunewordId, {
        readyBaseCount: 0,
        preparedBaseCount: 1,
        compatibleBaseCount: 2,
        bestBaseSocketsUnlocked: 1,
        bestBaseMaxSockets: 3,
        bestBaseMissingRuneCount: 2,
        completedRunCount: 0,
        bestActsCleared: 1,
      }),
    },
    stash: {
      ...baseSummary.stash,
      socketReadyEquipmentCount: 1,
      runeCount: 3,
      runewordEquipmentCount: 1,
    },
    review: {
      ...baseSummary.review,
      capstoneCount: 2,
      readyCapstoneCount: 1,
      nextCapstoneId: "embers_capstone",
      nextCapstoneTitle: "Apex Doctrine",
      convergenceCount: 2,
      availableConvergenceCount: 1,
      nextConvergenceId: "forge_accord",
      nextConvergenceTitle: "Forge Accord",
    },
    focusedTreeId: "embers",
    focusedTreeTitle: "Ash Ledger",
    treeCount: Math.max(1, baseSummary.treeCount),
    trees: [
      {
        id: "embers",
        title: "Ash Ledger",
        description: "Push the archive toward charter and trade depth.",
        currentRank: 2,
        maxRank: 5,
        isFocused: true,
        eligibleMilestoneCount: 1,
        blockedMilestoneCount: 1,
        nextMilestoneId: "embers_2",
        nextMilestoneTitle: "Merchant Principate",
        capstoneId: "embers_capstone",
        capstoneTitle: "Apex Doctrine",
        capstoneUnlocked: false,
        capstoneStatus: "available",
        unlockedFeatureIds: ["economy_ledger"],
        milestones: [
          buildMilestone({ id: "embers_1", title: "Economy Ledger", unlocked: true, status: "unlocked", progress: 1, target: 1 }),
          buildMilestone({
            id: "embers_2",
            title: "Merchant Principate",
            rewardFeatureId: "merchant_principate",
            tier: 2,
            tierLabel: "Tier 2",
            unlocked: false,
            status: "available",
            progress: 1,
            target: 2,
          }),
          buildMilestone({
            id: "embers_capstone",
            title: "Apex Doctrine",
            rewardFeatureId: "apex_doctrine",
            tier: 3,
            tierLabel: "Capstone",
            isCapstone: true,
            isEligible: false,
            status: "locked",
            blockedByIds: ["merchant_principate"],
            blockedByTitles: ["Merchant Principate"],
            progress: 0,
            target: 1,
          }),
        ],
      },
    ],
    convergences: [
      buildConvergence(),
      buildConvergence({
        id: "vault_accord",
        title: "Vault Accord",
        description: "A deeper vault lane waiting behind missing links.",
        effectSummary: "Unlock stash synergy across charters.",
        status: "locked",
        unlocked: false,
        unlockedRequirementCount: 1,
        requiredFeatureCount: 3,
        requiredFeatureIds: ["economy_ledger", "merchant_principate", "chronicle_exchange"],
        requiredFeatureTitles: ["Economy Ledger", "Merchant Principate", "Chronicle Exchange"],
        missingFeatureIds: ["chronicle_exchange"],
        missingFeatureTitles: ["Chronicle Exchange"],
      }),
    ],
    unlockedMilestoneCount: Math.max(1, baseSummary.unlockedMilestoneCount),
    milestoneCount: Math.max(3, baseSummary.milestoneCount),
    nextMilestoneTitle: "Merchant Principate",
  };
}

test("ui-account-meta helper labels and empty planning summaries stay human-readable", () => {
  const { browserWindow, content } = createHarness();
  const accountMeta = browserWindow.ROUGE_UI_ACCOUNT_META;

  assert.equal(accountMeta.getTownFeatureLabel("economy_ledger"), "Economy Ledger");
  assert.equal(accountMeta.getTownFeatureLabel("mystic_exchange"), "Mystic Exchange");
  assert.equal(accountMeta.getTutorialLabel("profile_stash"), "Profile Stash");
  assert.equal(accountMeta.getTutorialLabel("late_game_focus"), "Late Game Focus");

  const planning = accountMeta.createDefaultPlanningSummary();
  assert.equal(planning.plannedRunewordCount, 0);
  assert.equal(planning.overview.nextActionLabel, "No Live Charter");
  assert.equal(planning.overview.nextActionSummary, "No runeword charter is pinned on the account yet.");
  assert.deepEqual(toPlain(accountMeta.getPlanningCharterStageLines(planning, content)), [
    "Weapon charter staging: no weapon charter pinned.",
    "Armor charter staging: no armor charter pinned.",
  ]);
});

test("ui-account-meta planning stage lines use runtime runeword and item names when charter data is present", () => {
  const { browserWindow, content } = createHarness();
  const accountMeta = browserWindow.ROUGE_UI_ACCOUNT_META;
  const weaponRunewordId = content.runewordCatalog.steel ? "steel" : Object.keys(content.runewordCatalog)[0];
  const armorRunewordId = content.runewordCatalog.lionheart ? "lionheart" : weaponRunewordId;
  const weaponBaseId = content.itemCatalog.item_short_sword ? "item_short_sword" : Object.keys(content.itemCatalog)[0];
  const weaponName = content.runewordCatalog[weaponRunewordId].name;
  const armorName = content.runewordCatalog[armorRunewordId].name;
  const baseName = content.itemCatalog[weaponBaseId].name;
  const planning: ProfilePlanningSummary = {
    ...accountMeta.createDefaultPlanningSummary(),
    weaponRunewordId,
    armorRunewordId,
    plannedRunewordCount: 2,
    weaponCharter: buildPlanningCharter("weapon", weaponRunewordId, {
      readyBaseCount: 1,
      preparedBaseCount: 2,
      bestBaseItemId: weaponBaseId,
    }),
    armorCharter: buildPlanningCharter("armor", armorRunewordId, {
      readyBaseCount: 0,
      preparedBaseCount: 1,
    }),
  };

  const lines = accountMeta.getPlanningCharterStageLines(planning, content);

  assert.match(lines[0], new RegExp(`${weaponName} -> 1 ready, 2 prepared, ${baseName}\\.`));
  assert.match(lines[1], new RegExp(`${armorName} -> 0 ready, 1 prepared, best base not parked yet\\.`));
});

test("ui-account-meta continuity markup surfaces archive deltas, charter readiness, mastery, and convergence pressure together", () => {
  const { browserWindow, appEngine, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const accountMeta = browserWindow.ROUGE_UI_ACCOUNT_META;
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const baseSummary = appEngine.getAccountProgressSummary(state);
  const summary = buildRichAccountSummary(baseSummary, content);

  const markup = accountMeta.buildAccountMetaContinuityMarkup(state, summary, services.renderUtils, {
    title: "Meta Continuity Desk",
    copy: "Keep the account pressure readable between runs.",
  });

  assert.match(markup, /Meta Continuity Desk/);
  assert.match(markup, /Recent Delta/);
  assert.match(markup, /Economy Ledger/);
  assert.match(markup, /Charter Staging/);
  assert.match(markup, /1 ready/);
  assert.match(markup, /Ash Ledger/);
  assert.match(markup, /Merchant Principate/);
  assert.match(markup, /Forge Accord/);
  assert.match(markup, /Unlock forge synergy across charters\./);
});

test("ui-account-meta drilldown markup expands charter slot posture and convergence follow-through", () => {
  const { browserWindow, appEngine, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const summary = buildRichAccountSummary(appEngine.getAccountProgressSummary(state), content);
  const markup = browserWindow.ROUGE_UI_ACCOUNT_META.buildAccountMetaDrilldownMarkup(state, summary, services.renderUtils, {
    title: "Account Drilldown",
    charterFollowThrough: "Check the vault before opening a new run.",
    convergenceFollowThrough: "Review progression lanes before rerouting focus.",
  });

  assert.match(markup, /Account Drilldown/);
  assert.match(markup, /Charter Forecast/);
  assert.match(markup, /Weapon Charter/);
  assert.match(markup, /Armor Charter/);
  assert.match(markup, /Best parked base:/);
  assert.match(markup, /Socket posture:/);
  assert.match(markup, /Convergence Drilldown/);
  assert.match(markup, /Check the vault before opening a new run\./);
  assert.match(markup, /Review progression lanes before rerouting focus\./);
});

test("ui-account-meta tree review renders focused-tree cards, convergence cards, and the empty fallback", () => {
  const { browserWindow, appEngine, content, combatEngine, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  const services = browserWindow.ROUGE_UI_COMMON.getServices();
  const summary = buildRichAccountSummary(appEngine.getAccountProgressSummary(state), content);

  const reviewMarkup = browserWindow.ROUGE_UI_ACCOUNT_META.buildAccountTreeReviewMarkup(summary, services.renderUtils, {
    showControls: false,
  });
  assert.match(reviewMarkup, /Focused Tree/);
  assert.match(reviewMarkup, /Ash Ledger/);
  assert.match(reviewMarkup, /Capstone Ready: Apex Doctrine/);
  assert.match(reviewMarkup, /Blocked by prerequisites: Merchant Principate\./);
  assert.match(reviewMarkup, /Forge Accord/);
  assert.match(reviewMarkup, /Vault Accord/);
  assert.doesNotMatch(reviewMarkup, /data-action="set-account-progression-focus"/);

  const emptyMarkup = browserWindow.ROUGE_UI_ACCOUNT_META.buildAccountTreeReviewMarkup({
    ...summary,
    treeCount: 0,
    trees: [],
  }, services.renderUtils);
  assert.match(emptyMarkup, /Account progression trees have not unlocked yet\./);
});
