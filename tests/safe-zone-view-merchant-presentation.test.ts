export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

interface MerchantPresentationApi {
  toTitleCase(input: string): string;
  toPortraitKey(input: string): string;
  getNpcThemeKey(npc: SafeZoneNpcViewModel): string;
  getMerchantActionLabel(action: TownAction): string;
  getMerchantActionIcon(action: TownAction): string;
  buildNpcServiceLayout(
    npc: SafeZoneNpcViewModel,
    gold: number,
    themeKey: string,
    escapeHtml: (value: string) => string
  ): string;
  buildEmptyOverlayState(
    npc: SafeZoneNpcViewModel,
    themeKey: string,
    escapeHtml: (value: string) => string
  ): string;
}

function buildTownAction(overrides: Partial<TownAction> = {}): TownAction {
  return {
    id: "healer_restore_life",
    category: "service",
    title: "Restore Life",
    subtitle: "",
    description: "Patch the party back together.",
    previewLines: ["Restore the hero to full life."],
    cost: 25,
    actionLabel: "Restore",
    disabled: false,
    ...overrides,
  };
}

function buildNpc(overrides: Partial<SafeZoneNpcViewModel> = {}): SafeZoneNpcViewModel {
  return {
    id: "healer",
    name: "Mireya",
    role: "Remedy Keeper",
    icon: "\u2764",
    actions: [],
    emptyLabel: "The desk is quiet.",
    ...overrides,
  };
}

test("merchant presentation helpers resolve theme keys, labels, and icons across service categories", () => {
  const { browserWindow } = createHarness();
  const presentation = browserWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION as unknown as MerchantPresentationApi;

  assert.equal(presentation.toTitleCase("profile_vault"), "Profile Vault");
  assert.equal(presentation.toPortraitKey("Corven Vale"), "deckard-cain");
  assert.equal(
    presentation.getNpcThemeKey(buildNpc({
      id: "camp_broker",
      actions: [buildTownAction({ id: "inventory_equip", category: "inventory" })],
    })),
    "blacksmith"
  );
  assert.equal(
    presentation.getNpcThemeKey(buildNpc({
      id: "mystic",
      actions: [buildTownAction({ id: "vendor_refresh_stock", category: "vendor" })],
    })),
    "vendor"
  );
  assert.equal(
    presentation.getNpcThemeKey(buildNpc({
      id: "sage_guest",
      actions: [buildTownAction({ id: "progression_spend_skill", category: "progression" })],
    })),
    "cain"
  );

  assert.equal(
    presentation.getMerchantActionLabel(buildTownAction({ id: "quartermaster_refill_belt", category: "service" })),
    "Supplies"
  );
  assert.equal(
    presentation.getMerchantActionLabel(buildTownAction({ id: "stash_withdraw_item", category: "stash" })),
    "Vault"
  );
  assert.equal(
    presentation.getMerchantActionIcon(buildTownAction({ id: "sage_identify", category: "sage" })),
    "\u272A"
  );
  assert.equal(
    presentation.getMerchantActionIcon(buildTownAction({ id: "sage_purge_burn", category: "sage" })),
    "\u2715"
  );
  assert.equal(
    presentation.getMerchantActionIcon(buildTownAction({ id: "sage_transform_spark", category: "sage" })),
    "\u21BB"
  );
  assert.equal(
    presentation.getMerchantActionIcon(buildTownAction({ id: "quartermaster_refill_belt", category: "service" })),
    "\u2697"
  );
  assert.equal(
    presentation.getMerchantActionIcon(buildTownAction({ id: "stash_withdraw_item", category: "stash" })),
    "\u26B0"
  );
});

test("merchant presentation layouts group cain and healer services into their themed sections", () => {
  const { browserWindow } = createHarness();
  const presentation = browserWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION as unknown as MerchantPresentationApi;
  const escapeHtml = browserWindow.ROUGE_UI_COMMON.getServices().renderUtils.escapeHtml;

  const cainMarkup = presentation.buildNpcServiceLayout(
    buildNpc({
      id: "cain",
      name: "Corven Vale",
      role: "Keeper Of Rites",
      icon: "\u272A",
      actions: [
        buildTownAction({
          id: "sage_identify",
          category: "sage",
          title: "Identify Deck",
          description: "Reveal what is worth keeping.",
          previewLines: ["Inspect the deck before the next push."],
        }),
        buildTownAction({
          id: "sage_transform_bolt",
          category: "sage",
          title: "Transmute Skill",
          description: "Recast a weak card into something sharper.",
          previewLines: ["Transform one skill into a new line."],
        }),
        buildTownAction({
          id: "progression_spend_skill",
          category: "progression",
          title: "Spend Skill Point",
          description: "Convert bloodline gains into strength.",
          previewLines: ["Invest in the focused tree."],
          cost: 0,
          actionLabel: "Train",
        }),
      ],
    }),
    77,
    "cain",
    escapeHtml
  );

  assert.match(cainMarkup, /Ritual Desk/);
  assert.match(cainMarkup, /Consult/);
  assert.match(cainMarkup, /Rites/);
  assert.match(cainMarkup, /Bloodline Training/);
  assert.match(cainMarkup, /Actions/);
  assert.match(cainMarkup, /77g/);
  assert.match(cainMarkup, /merchant-service-card__preview/);

  const healerMarkup = presentation.buildNpcServiceLayout(
    buildNpc({
      id: "healer",
      actions: [
        buildTownAction({
          id: "healer_restore_life",
          category: "service",
          title: "Restore Life",
          previewLines: ["Heal the hero to full."],
        }),
        buildTownAction({
          id: "quartermaster_refill_belt",
          category: "service",
          title: "Refill Belt",
          previewLines: ["Restock the belt."],
          cost: 0,
          actionLabel: "\u2014",
          disabled: true,
        }),
        buildTownAction({
          id: "camp_blessing",
          category: "service",
          title: "Camp Blessing",
          description: "A small blessing before departure.",
          previewLines: ["Carry a light ward into the next route."],
          cost: 0,
          actionLabel: "Bless",
        }),
      ],
    }),
    18,
    "healer",
    escapeHtml
  );

  assert.match(healerMarkup, /Camp Relief/);
  assert.match(healerMarkup, /Recovery/);
  assert.match(healerMarkup, /Supplies/);
  assert.match(healerMarkup, /Camp Support/);
  assert.match(healerMarkup, /merchant-service-card--disabled/);
  assert.match(healerMarkup, /Closed/);
  assert.match(healerMarkup, /Unavailable/);
});

test("merchant presentation empty-state copy stays theme specific for stash and travel desks", () => {
  const { browserWindow } = createHarness();
  const presentation = browserWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION as unknown as MerchantPresentationApi;
  const escapeHtml = browserWindow.ROUGE_UI_COMMON.getServices().renderUtils.escapeHtml;

  const stashMarkup = presentation.buildEmptyOverlayState(
    buildNpc({
      id: "stash",
      name: "Stash",
      role: "Profile Vault",
      icon: "\u26B0",
      emptyLabel: "No reserve gear is waiting in the vault.",
    }),
    "stash",
    escapeHtml
  );
  assert.match(stashMarkup, /Profile Vault/);
  assert.match(stashMarkup, /No reserve gear is waiting in the vault\./);
  assert.match(stashMarkup, /No reserve gear or runes are waiting in the vault\./);

  const travelMarkup = presentation.buildEmptyOverlayState(
    buildNpc({
      id: "travel",
      name: "Dagan",
      role: "Roadmaster",
      icon: "\u2693",
      emptyLabel: "The caravan is ready when you are.",
    }),
    "travel",
    escapeHtml
  );
  assert.match(travelMarkup, /Departure Lane/);
  assert.match(travelMarkup, /The caravan is ready when you are\./);
  assert.match(travelMarkup, /The road is already open\./);
});
