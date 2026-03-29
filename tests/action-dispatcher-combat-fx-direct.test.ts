export {};

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";

type SelectorMap = Map<string, TestElement | null>;
type SelectorListMap = Map<string, TestElement[]>;

class TestClassList {
  private readonly values = new Set<string>();

  constructor(initial = "") {
    this.replace(initial);
  }

  add(...tokens: string[]): void {
    tokens.filter(Boolean).forEach((token) => this.values.add(token));
  }

  remove(...tokens: string[]): void {
    tokens.forEach((token) => this.values.delete(token));
  }

  contains(token: string): boolean {
    return this.values.has(token);
  }

  replace(value: string): void {
    this.values.clear();
    value.split(/\s+/).filter(Boolean).forEach((token) => this.values.add(token));
  }

  toString(): string {
    return [...this.values].join(" ");
  }
}

class TestElement {
  readonly children: TestElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly style: Record<string, unknown> & { setProperty(name: string, value: string): void };
  readonly classList: TestClassList;
  ownerDocument: TestDocument | null = null;
  parentNode: TestElement | null = null;
  textContent = "";
  innerHTML = "";
  removed = false;
  private classNameValue = "";
  private readonly selectors: SelectorMap = new Map();
  private readonly selectorLists: SelectorListMap = new Map();

  constructor(className = "") {
    this.classList = new TestClassList(className);
    this.classNameValue = this.classList.toString();
    this.style = Object.assign({}, {
      setProperty: (name: string, value: string) => {
        this.style[name] = value;
      },
    });
  }

  get className(): string {
    return this.classList.toString() || this.classNameValue;
  }

  set className(value: string) {
    this.classNameValue = value;
    this.classList.replace(value);
  }

  appendChild(child: TestElement): TestElement {
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    return child;
  }

  remove(): void {
    this.removed = true;
    if (!this.parentNode) {
      return;
    }
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) {
      this.parentNode.children.splice(index, 1);
    }
    this.parentNode = null;
  }

  setSelector(selector: string, element: TestElement | null): void {
    this.selectors.set(selector, element);
  }

  setSelectorAll(selector: string, elements: TestElement[]): void {
    this.selectorLists.set(selector, elements);
  }

  querySelector(selector: string): TestElement | null {
    return this.selectors.get(selector) || null;
  }

  querySelectorAll(selector: string): TestElement[] {
    return this.selectorLists.get(selector) || [];
  }

  removeAttribute(name: string): void {
    delete this.dataset[name];
  }

  setAttribute(name: string, value: string): void {
    this.dataset[name] = value;
  }

  cloneNode(): TestElement {
    const clone = new TestElement(this.className);
    clone.textContent = this.textContent;
    clone.innerHTML = this.innerHTML;
    return clone;
  }

  getBoundingClientRect() {
    return { left: 16, top: 24, width: 96, height: 128, right: 112, bottom: 152 };
  }
}

class TestDocument {
  readonly body = new TestElement("document-body");
  private readonly selectors: SelectorMap = new Map();
  private readonly selectorLists: SelectorListMap = new Map();

  constructor() {
    this.body.ownerDocument = this;
  }

  createElement(tag: string): TestElement {
    const element = new TestElement(tag);
    element.ownerDocument = this;
    return element;
  }

  setSelector(selector: string, element: TestElement | null): void {
    this.selectors.set(selector, element);
  }

  setSelectorAll(selector: string, elements: TestElement[]): void {
    this.selectorLists.set(selector, elements);
  }

  querySelector(selector: string): TestElement | null {
    return this.selectors.get(selector) || null;
  }

  querySelectorAll(selector: string): TestElement[] {
    return this.selectorLists.get(selector) || [];
  }
}

interface CombatFxHarness {
  api: ActionDispatcherCombatFxApi;
  document: TestDocument;
  screen: TestElement;
  stage: TestElement;
  enemySprite: TestElement;
  heroSprite: TestElement;
  mercSprite: TestElement;
  deckShell: TestElement;
  cardFan: TestElement;
  readyPile: TestElement;
  drawPile: TestElement;
  discardPile: TestElement;
  handCards: TestElement[];
}

function createCombatState(overrides: Partial<CombatState> = {}): CombatState {
  const card = (id: string): CardInstance => ({ instanceId: `${id}_instance`, cardId: id } as CardInstance);

  return {
    turn: 1,
    phase: "player",
    outcome: null,
    log: ["Earlier log line."],
    hand: [card("hand_1"), card("hand_2"), card("hand_3")],
    drawPile: [card("draw_1"), card("draw_2"), card("draw_3")],
    discardPile: [],
    hero: {
      name: "Hero",
      life: 24,
      maxLife: 24,
      guard: 4,
      heroBurn: 0,
      heroPoison: 0,
      chill: 0,
      amplify: 0,
      weaken: 0,
      energyDrain: 0,
    } as CombatHeroState,
    mercenary: {
      name: "Mercenary",
      life: 14,
      maxLife: 14,
      guard: 2,
      alive: true,
    } as CombatMercenaryState,
    enemies: [
      {
        id: "enemy_1",
        name: "Fallen",
        life: 12,
        maxLife: 12,
        guard: 4,
        alive: true,
        burn: 0,
        poison: 0,
        slow: 0,
        freeze: 0,
        stun: 0,
        paralyze: 0,
      } as CombatEnemyState,
    ],
    ...overrides,
  } as CombatState;
}

function createCombatFxHarness(): CombatFxHarness {
  const document = new TestDocument();
  const screen = new TestElement("combat-screen");
  const stage = new TestElement("stage");
  const phaseEl = new TestElement("combat-header__phase");
  const allies = new TestElement("stage__allies");
  const enemySprite = new TestElement("sprite sprite--enemy");
  const heroSprite = new TestElement("sprite sprite--hero");
  const mercSprite = new TestElement("sprite sprite--mercenary");
  const deckShell = new TestElement("combat-command__deck-shell");
  const cardFan = new TestElement("card-fan");
  const readyPile = new TestElement("combat-command__pile");
  const drawPile = new TestElement("combat-command__pile");
  const discardPile = new TestElement("combat-command__pile");
  const handCards = [new TestElement("fan-card"), new TestElement("fan-card")];

  enemySprite.dataset.enemyId = "enemy_1";
  screen.ownerDocument = document;
  stage.ownerDocument = document;
  allies.ownerDocument = document;
  enemySprite.ownerDocument = document;
  heroSprite.ownerDocument = document;
  mercSprite.ownerDocument = document;
  deckShell.ownerDocument = document;
  cardFan.ownerDocument = document;
  readyPile.ownerDocument = document;
  drawPile.ownerDocument = document;
  discardPile.ownerDocument = document;
  handCards.forEach((card) => { card.ownerDocument = document; });

  document.setSelector(".combat-screen", screen);
  document.setSelector(".stage", stage);
  document.setSelector(".combat-command__deck-shell", deckShell);
  document.setSelectorAll(".card-fan .fan-card", handCards);
  screen.setSelector(".combat-header__phase", phaseEl);
  stage.setSelector(".stage__allies", allies);
  stage.setSelectorAll(".sprite--enemy", [enemySprite]);
  stage.setSelectorAll(".stage__allies .sprite", [heroSprite, mercSprite]);
  stage.setSelectorAll(".stage__allies .sprite:not(.sprite--dead)", [heroSprite, mercSprite]);
  allies.setSelectorAll(".sprite", [heroSprite, mercSprite]);
  deckShell.setSelector(".card-fan", cardFan);
  deckShell.setSelector("[data-combat-pile='ready']", readyPile);
  deckShell.setSelector("[data-combat-pile='draw']", drawPile);
  deckShell.setSelector("[data-combat-pile='discard']", discardPile);

  const sandbox = {
    window: {
      ROUGE_VIEW_LIFECYCLE: {
        managedTimeout(fn: () => void, delay: number) {
          if (delay <= 200) {
            fn();
          }
          return 1 as unknown as ReturnType<typeof setTimeout>;
        },
        managedRAF(fn: () => void) {
          fn();
          return 1;
        },
      },
    } as unknown as Window & Record<string, unknown>,
    document,
    console,
  };
  const context = vm.createContext(sandbox);
  const scriptPath = path.resolve(__dirname, "../src/ui/action-dispatcher-combat-fx.js");
  const source = fs.readFileSync(scriptPath, "utf8");
  vm.runInContext(source, context);

  return {
    api: (sandbox.window as Window & Record<string, unknown>).__ROUGE_ACTION_DISPATCHER_COMBAT_FX as unknown as ActionDispatcherCombatFxApi,
    document,
    screen,
    stage,
    enemySprite,
    heroSprite,
    mercSprite,
    deckShell,
    cardFan,
    readyPile,
    drawPile,
    discardPile,
    handCards,
  };
}

test("combat fx direct harness animates played-card finishers and deck resolution state", () => {
  const harness = createCombatFxHarness();
  const combat = createCombatState();
  const playedCardEl = new TestElement("fan-card");

  harness.api.doCombatAction(
    combat,
    () => {
      combat.hand.pop();
      combat.discardPile.push({ instanceId: "discard_1", cardId: "discard_card" } as CardInstance);
      combat.enemies[0].life = 0;
      combat.enemies[0].guard = 0;
      combat.enemies[0].alive = false;
    },
    () => {},
    { playedCardEl: playedCardEl as unknown as CombatFxActionOptions["playedCardEl"] }
  );

  assert.ok(harness.document.body.children.some((child) => child.classList.contains("fan-card--fx-clone")));
  assert.ok(harness.document.body.children.some((child) => child.classList.contains("fan-card--playing")));
  assert.ok(harness.enemySprite.classList.contains("sprite--hit"));
  assert.ok(harness.enemySprite.classList.contains("sprite--shake"));
  assert.ok(harness.enemySprite.classList.contains("sprite--guard-broken"));
  assert.ok(harness.screen.classList.contains("combat-screen--shake"));
  assert.ok(harness.deckShell.classList.contains("combat-command__deck-shell--resolve"));
  assert.ok(harness.deckShell.children.some((child) => child.className.includes("combat-command__deck-flow")));
  assert.ok(harness.enemySprite.children.some((child) => child.className.includes("damage-number")));
});

test("combat fx direct harness animates enemy-phase sequencing and the return to player control", () => {
  const harness = createCombatFxHarness();
  const combat = createCombatState({
    phase: "enemy",
    hand: [] as CardInstance[],
    drawPile: [{ instanceId: "draw_1", cardId: "draw_card" } as CardInstance],
    discardPile: [
      { instanceId: "discard_1", cardId: "discard_card_1" } as CardInstance,
      { instanceId: "discard_2", cardId: "discard_card_2" } as CardInstance,
      { instanceId: "discard_3", cardId: "discard_card_3" } as CardInstance,
    ],
  });

  harness.api.doCombatAction(
    combat,
    () => {
      combat.turn = 2;
      combat.phase = "player";
      combat.log = ["Fallen attacks Hero.", "Earlier log line."];
      combat.hand = [
        { instanceId: "hand_1", cardId: "ready_card_1" } as CardInstance,
        { instanceId: "hand_2", cardId: "ready_card_2" } as CardInstance,
      ];
      combat.drawPile = [] as CardInstance[];
      combat.discardPile = [{ instanceId: "discard_4", cardId: "discard_card_4" } as CardInstance];
      combat.hero.guard = 1;
    },
    () => {},
    { sequenceEnemyPhase: true }
  );

  assert.ok(harness.stage.classList.contains("stage--player-return"));
  assert.ok(harness.screen.classList.contains("combat-screen--player-return"));
  assert.ok(harness.deckShell.classList.contains("combat-command__deck-shell--return"));
  assert.ok(harness.deckShell.classList.contains("combat-command__deck-shell--ready"));
  assert.ok(harness.cardFan.classList.contains("card-fan--readying"));
  assert.ok(harness.readyPile.classList.contains("combat-command__pile--pulse"));
  assert.ok(harness.drawPile.classList.contains("combat-command__pile--pulse"));
  assert.ok(harness.enemySprite.classList.contains("sprite--acting"));
  assert.ok(harness.heroSprite.classList.contains("sprite--under-pressure"));
  assert.ok(harness.handCards[0].classList.contains("fan-card--wake"));
  assert.ok(harness.screen.children.some((child) => child.className.includes("turn-banner")));
  assert.ok(harness.screen.children.some((child) => child.className.includes("combat-sequence-banner")));
  assert.ok(harness.deckShell.children.some((child) => child.textContent.includes("Fresh hand")));
});
