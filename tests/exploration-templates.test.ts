export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createRunState() {
  const harness = createAppHarness();
  const { appEngine, content, combatEngine, seedBundle, browserWindow } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  const templates = browserWindow.__ROUGE_EXPLORATION_EVENT_TEMPLATES;
  return { state, content, templates, browserWindow };
}

function validateEventTemplate(template: { id: string; title: string; icon: string; buildChoices: (run: RunState, content: GameContent) => unknown[] }, run: RunState, content: GameContent) {
  assert.ok(template.id, `template should have id`);
  assert.ok(template.title, `template ${template.id} should have title`);
  assert.ok(template.icon, `template ${template.id} should have icon`);
  assert.equal(typeof template.buildChoices, "function", `template ${template.id} should have buildChoices function`);

  const choices = template.buildChoices(run, content);
  assert.ok(Array.isArray(choices), `buildChoices for ${template.id} should return an array`);
  // Some events have minGold requirements and return [] when gold is insufficient
  // so we only validate non-empty choice arrays
  for (const choice of choices) {
    const c = choice as { id: string; title: string; description: string; effects: unknown[] };
    assert.ok(c.id, `choice in ${template.id} should have id`);
    assert.ok(c.title, `choice in ${template.id} should have title`);
    assert.ok(c.description, `choice in ${template.id} should have description`);
    assert.ok(Array.isArray(c.effects), `choice ${c.id} in ${template.id} should have effects array`);
  }
}

// ── SHRINE_EVENTS ──

test("SHRINE_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.SHRINE_EVENTS));
  assert.ok(templates.SHRINE_EVENTS.length > 0, "should have shrine events");

  for (const template of templates.SHRINE_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("SHRINE_EVENTS each have exactly 3 choices", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 999; // Ensure gold is sufficient
  for (const template of templates.SHRINE_EVENTS) {
    const choices = template.buildChoices(state.run, content);
    assert.equal(choices.length, 3, `${template.id} should have 3 choices`);
  }
});

// ── BLESSING_EVENTS ──

test("BLESSING_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.BLESSING_EVENTS));
  assert.ok(templates.BLESSING_EVENTS.length > 0, "should have blessing events");

  for (const template of templates.BLESSING_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("BLESSING_EVENTS each have exactly 3 choices", () => {
  const { state, content, templates } = createRunState();
  for (const template of templates.BLESSING_EVENTS) {
    const choices = template.buildChoices(state.run, content);
    assert.equal(choices.length, 3, `${template.id} should have 3 choices`);
  }
});

// ── GAMBLE_EVENTS ──

test("GAMBLE_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.GAMBLE_EVENTS));
  assert.ok(templates.GAMBLE_EVENTS.length > 0, "should have gamble events");

  state.run.gold = 999; // Ensure gold requirement is met
  for (const template of templates.GAMBLE_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("GAMBLE_EVENTS return empty choices when gold is insufficient", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 0;
  for (const template of templates.GAMBLE_EVENTS) {
    if (template.minGold && template.minGold > 0) {
      const choices = template.buildChoices(state.run, content);
      assert.equal(choices.length, 0, `${template.id} should return no choices when gold is 0`);
    }
  }
});

test("GAMBLE_EVENTS return choices when gold is sufficient", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 999;
  for (const template of templates.GAMBLE_EVENTS) {
    const choices = template.buildChoices(state.run, content);
    assert.ok(choices.length > 0, `${template.id} should have choices with sufficient gold`);
  }
});

// ── TRADER_EVENTS ──

test("TRADER_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.TRADER_EVENTS));
  assert.ok(templates.TRADER_EVENTS.length > 0, "should have trader events");

  state.run.gold = 999;
  for (const template of templates.TRADER_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("TRADER_EVENTS return empty choices when gold is insufficient", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 0;
  for (const template of templates.TRADER_EVENTS) {
    if (template.minGold && template.minGold > 0) {
      const choices = template.buildChoices(state.run, content);
      assert.equal(choices.length, 0, `${template.id} should return no choices when gold is 0`);
    }
  }
});

// ── MYSTERY_EVENTS ──

test("MYSTERY_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.MYSTERY_EVENTS));
  assert.ok(templates.MYSTERY_EVENTS.length > 0, "should have mystery events");

  for (const template of templates.MYSTERY_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("MYSTERY_EVENTS each have exactly 3 choices", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 999;
  for (const template of templates.MYSTERY_EVENTS) {
    const choices = template.buildChoices(state.run, content);
    assert.equal(choices.length, 3, `${template.id} should have 3 choices`);
  }
});

// ── REST_EVENTS ──

test("REST_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.REST_EVENTS));
  assert.ok(templates.REST_EVENTS.length > 0, "should have rest events");

  for (const template of templates.REST_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("REST_EVENTS each have exactly 3 choices", () => {
  const { state, content, templates } = createRunState();
  for (const template of templates.REST_EVENTS) {
    const choices = template.buildChoices(state.run, content);
    assert.equal(choices.length, 3, `${template.id} should have 3 choices`);
  }
});

// ── TRIAL_EVENTS ──

test("TRIAL_EVENTS has entries with valid structure", () => {
  const { state, content, templates } = createRunState();
  assert.ok(Array.isArray(templates.TRIAL_EVENTS));
  assert.ok(templates.TRIAL_EVENTS.length > 0, "should have trial events");

  for (const template of templates.TRIAL_EVENTS) {
    validateEventTemplate(template, state.run, content);
  }
});

test("TRIAL_EVENTS each have exactly 3 choices", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 999;
  for (const template of templates.TRIAL_EVENTS) {
    const choices = template.buildChoices(state.run, content);
    assert.equal(choices.length, 3, `${template.id} should have 3 choices`);
  }
});

// ── getUpgradableCardIds ──

test("getUpgradableCardIds is a function exported by templates module", () => {
  const { templates } = createRunState();
  assert.equal(typeof templates.getUpgradableCardIds, "function");
});

test("getUpgradableCardIds returns an array", () => {
  const { state, content, templates } = createRunState();
  const result = templates.getUpgradableCardIds(state.run, content);
  assert.ok(Array.isArray(result));
});

// ── Event template field completeness ──

test("all event templates have required fields: id, kind, title, flavor, icon", () => {
  const { templates } = createRunState();
  const allTemplates = [
    ...templates.SHRINE_EVENTS,
    ...templates.BLESSING_EVENTS,
    ...templates.GAMBLE_EVENTS,
    ...templates.TRADER_EVENTS,
    ...templates.MYSTERY_EVENTS,
    ...templates.REST_EVENTS,
    ...templates.TRIAL_EVENTS,
  ];

  for (const template of allTemplates) {
    assert.ok(template.id, `template should have id`);
    assert.ok(template.kind, `template ${template.id} should have kind`);
    assert.ok(template.title, `template ${template.id} should have title`);
    assert.ok(template.flavor, `template ${template.id} should have flavor`);
    assert.ok(template.icon, `template ${template.id} should have icon`);
  }
});

test("event template IDs are unique across all arrays", () => {
  const { templates } = createRunState();
  const allTemplates = [
    ...templates.SHRINE_EVENTS,
    ...templates.BLESSING_EVENTS,
    ...templates.GAMBLE_EVENTS,
    ...templates.TRADER_EVENTS,
    ...templates.MYSTERY_EVENTS,
    ...templates.REST_EVENTS,
    ...templates.TRIAL_EVENTS,
  ];

  const ids = allTemplates.map((t: { id: string }) => t.id);
  assert.equal(new Set(ids).size, ids.length, "all event template IDs should be unique");
});

test("choice effects have valid kind values", () => {
  const { state, content, templates } = createRunState();
  state.run.gold = 999;
  const allTemplates = [
    ...templates.SHRINE_EVENTS,
    ...templates.BLESSING_EVENTS,
    ...templates.GAMBLE_EVENTS,
    ...templates.TRADER_EVENTS,
    ...templates.MYSTERY_EVENTS,
    ...templates.REST_EVENTS,
    ...templates.TRIAL_EVENTS,
  ];

  const validEffectKinds = new Set([
    "hero_damage", "hero_heal", "hero_max_life",
    "mercenary_attack", "mercenary_max_life",
    "gold_bonus", "refill_potions", "belt_capacity",
    "card_upgrade", "card_add",
  ]);

  for (const template of allTemplates) {
    const choices = template.buildChoices(state.run, content);
    for (const choice of choices) {
      const c = choice as { effects: { kind: string; value: number }[] };
      for (const effect of c.effects) {
        assert.ok(validEffectKinds.has(effect.kind), `effect kind "${effect.kind}" in ${template.id} should be valid`);
        assert.equal(typeof effect.value, "number", `effect value in ${template.id} should be a number`);
      }
    }
  }
});
