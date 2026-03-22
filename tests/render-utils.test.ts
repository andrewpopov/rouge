export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

test("escapeHtml escapes special characters", () => {
  const { browserWindow } = createHarness();
  const { escapeHtml } = browserWindow.ROUGE_RENDER_UTILS;

  assert.equal(escapeHtml("<script>alert('xss')</script>"), "&lt;script&gt;alert('xss')&lt;/script&gt;");
  assert.equal(escapeHtml("a & b"), "a &amp; b");
  assert.equal(escapeHtml('"quoted"'), "&quot;quoted&quot;");
  assert.equal(escapeHtml("normal text"), "normal text");
  assert.equal(escapeHtml(""), "");
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(42), "42");
});

test("buildStat produces stat markup with label and value", () => {
  const { browserWindow } = createHarness();
  const { buildStat } = browserWindow.ROUGE_RENDER_UTILS;

  const result = buildStat("Gold", 100);
  assert.ok(result.includes("Gold"), "should include label");
  assert.ok(result.includes("100"), "should include value");
});

test("buildBadge produces badge markup with tone class", () => {
  const { browserWindow } = createHarness();
  const { buildBadge } = browserWindow.ROUGE_RENDER_UTILS;

  const cleared = buildBadge("Victory", "cleared");
  assert.ok(cleared.includes("Victory"), "should include label");
  assert.ok(cleared.includes("cleared"), "should include tone class");

  const locked = buildBadge("Locked", "locked");
  assert.ok(locked.includes("locked"), "should include locked tone");
});

test("buildBadgeRow produces multiple badges", () => {
  const { browserWindow } = createHarness();
  const { buildBadgeRow } = browserWindow.ROUGE_RENDER_UTILS;

  const result = buildBadgeRow(["Alpha", "Beta", "Gamma"], "available");
  assert.ok(result.includes("Alpha"), "should include first badge");
  assert.ok(result.includes("Beta"), "should include second badge");
  assert.ok(result.includes("Gamma"), "should include third badge");
});

test("buildStringList produces list markup from string array", () => {
  const { browserWindow } = createHarness();
  const { buildStringList } = browserWindow.ROUGE_RENDER_UTILS;

  const result = buildStringList(["Line one.", "Line two."], "log-list");
  assert.ok(result.includes("Line one"), "should include first line");
  assert.ok(result.includes("Line two"), "should include second line");
  assert.ok(result.includes("log-list"), "should include class name");

  const empty = buildStringList([], "log-list");
  assert.ok(typeof empty === "string", "should return string for empty array");
});

test("buildNoticePanel produces notice markup", () => {
  const { browserWindow } = createHarness();
  const { buildNoticePanel } = browserWindow.ROUGE_RENDER_UTILS;

  const result = buildNoticePanel("Something happened!", "Warning");
  assert.ok(result.includes("Something happened"), "should include message");
  assert.ok(result.includes("Warning"), "should include label");
});

test("buildChoiceList produces choice buttons from reward choices", () => {
  const { browserWindow } = createHarness();
  const { buildChoiceList } = browserWindow.ROUGE_RENDER_UTILS;

  const choices = [
    { id: "choice_1", kind: "gold", title: "Gold Reward", subtitle: "", description: "+50 Gold", previewLines: [], effects: [] as RewardChoiceEffect[] },
    { id: "choice_2", kind: "xp", title: "XP Reward", subtitle: "", description: "+100 XP", previewLines: [], effects: [] as RewardChoiceEffect[] },
  ] as RewardChoice[];
  const result = buildChoiceList(choices);
  assert.ok(result.includes("Gold Reward"), "should include first choice title");
  assert.ok(result.includes("XP Reward"), "should include second choice title");
  assert.ok(result.includes("choice_1"), "should include first choice id");
});

test("buildWorldMapNodeCard produces zone card markup", () => {
  const { browserWindow } = createHarness();
  const { buildWorldMapNodeCard } = browserWindow.ROUGE_RENDER_UTILS;

  const result = buildWorldMapNodeCard({
    zone: { id: "z1", title: "Blood Moor", kind: "battle", status: "available", cleared: false, encountersCleared: 0, encounterTotal: 2, prerequisites: [], description: "A bloody moor." } as ZoneState,
    reachable: true,
    actionLabel: "Enter Route",
    prerequisiteLabel: "Opening Route",
    hookLabel: "Battle Path",
    summaryLine: "A test zone.",
    detailLines: ["Detail 1"],
  });
  assert.ok(result.includes("Blood Moor"), "should include zone title");
  assert.ok(result.includes("Enter Route"), "should include action label");
  assert.ok(result.includes("Battle Path"), "should include hook label");
});

test("buildTownActionCard produces action card markup", () => {
  const { browserWindow } = createHarness();
  const { buildTownActionCard } = browserWindow.ROUGE_RENDER_UTILS;

  const action: TownAction = {
    id: "heal_hero",
    title: "Heal Wanderer",
    subtitle: "Full restore",
    description: "Restore all HP",
    previewLines: ["Restores all hit points."],
    category: "service",
    cost: 50,
    actionLabel: "Heal",
    disabled: false,
  };

  const result = buildTownActionCard(action);
  assert.ok(result.includes("Heal Wanderer"), "should include action title");
  assert.ok(result.includes("50"), "should include cost");
});

test("buildShell sets root innerHTML with shell structure", () => {
  const { browserWindow } = createHarness();
  const { buildShell } = browserWindow.ROUGE_RENDER_UTILS;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  buildShell(root, {
    eyebrow: "Act 1",
    title: "The Rogue Encampment",
    copy: "Welcome to town.",
    body: "<p>Body content</p>",
    footer: "<button>Continue</button>",
  });

  assert.ok(root.innerHTML.includes("Act 1"), "should include eyebrow");
  assert.ok(root.innerHTML.includes("The Rogue Encampment"), "should include title");
  assert.ok(root.innerHTML.includes("Body content"), "should include body");
  assert.ok(root.innerHTML.includes("Continue"), "should include footer");
});
