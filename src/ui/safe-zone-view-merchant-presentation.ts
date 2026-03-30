(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const MERCHANT_PRESENTATIONS: Record<string, { epithet: string; quote: string; footer: string }> = {
    healer: {
      epithet: "Keeper Of Remedies",
      quote: "The camp still breathes while its wounds are named and tended.",
      footer: "Recovery first. Then the road.",
    },
    blacksmith: {
      epithet: "Forgekeeper",
      quote: "Steel remembers every hand that trusted it at the edge of ruin.",
      footer: "Leave only when the edge is worthy.",
    },
    vendor: {
      epithet: "Camp Broker",
      quote: "Every expedition begins with a wager, and every wager has a price.",
      footer: "Spend coin where it buys survival, not comfort.",
    },
    mercenary: {
      epithet: "Captain Of Blades",
      quote: "No gate opens cleanly. Someone always bleeds to force the path.",
      footer: "Choose your company before you choose the road.",
    },
    stash: {
      epithet: "Vault Warden",
      quote: "What you carry defines the fight. What you store defines the next one.",
      footer: "Pack light. Keep only what changes fate.",
    },
    cain: {
      epithet: "Keeper Of Rites",
      quote: "Knowledge is the only fire the dark cannot fully swallow.",
      footer: "Study first. The dead are patient.",
    },
    travel: {
      epithet: "Roadmaster",
      quote: "Once the wheels turn, the camp becomes memory and the map becomes law.",
      footer: "When you step out, commit to the trail.",
    },
    default: {
      epithet: "Camp Fixture",
      quote: "Even sanctuary has a price when the sky itself turns hostile.",
      footer: "Take what the camp offers. Leave before it is too late.",
    },
  };

  const MERCHANT_CATEGORY_LABELS: Record<string, string> = {
    healer: "Recovery",
    quartermaster: "Supplies",
    blacksmith: "Forge",
    vendor: "Trade",
    gambler: "Gamble",
    mercenary: "Mercenaries",
    sage: "Rites",
    progression: "Training",
    stash: "Vault",
    inventory: "Loadout",
  };

  const PORTRAIT_KEY_OVERRIDES: Record<string, string> = {
    mireya: "akara",
    braska: "charsi",
    murn: "gheed",
    veyra: "kashya",
    "corven-vale": "deckard-cain",
    dagan: "warriv",
    samira: "fara",
    khezir: "elzix",
    vorrik: "greiz",
    salek: "meshif",
    naima: "atma",
    sabir: "lysander",
    sevran: "ormus",
    brenn: "hratli",
    vasko: "alkor",
    ilya: "asheara",
    serapha: "jamella",
    dorn: "halbu",
    aurel: "tyrael",
    ysra: "malah",
    torv: "larzuk",
    elska: "anya",
    hadrik: "qual-kehk",
  };

  const CATEGORY_ICONS: Record<string, string> = {
    service: "\u2764",
    vendor: "\u2696",
    progression: "\u272A",
    inventory: "\u2692",
    stash: "\u26B0",
    mercenary: "\u2694",
  };

  interface MerchantServiceSection {
    title: string;
    copy: string;
    actions: TownAction[];
  }

  function toTitleCase(input: string): string {
    return String(input || "")
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function toPortraitKey(input: string): string {
    const normalized = String(input || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return PORTRAIT_KEY_OVERRIDES[normalized] || normalized;
  }

  function getNpcThemeKey(npc: SafeZoneNpcViewModel): string {
    if (npc.id === "cain") {
      return "cain";
    }
    if (npc.id === "travel") {
      return "travel";
    }
    if (npc.id === "stash") {
      return "stash";
    }
    if (npc.id === "healer") {
      return "healer";
    }
    if (npc.id === "blacksmith") {
      return "blacksmith";
    }
    if (npc.id === "mercenary") {
      return "mercenary";
    }
    if (npc.id === "vendor") {
      return "vendor";
    }

    const categories = new Set(npc.actions.map((action) => action.category));
    if (categories.has("sage") || categories.has("progression")) {
      return "cain";
    }
    if (categories.has("mercenary")) {
      return "mercenary";
    }
    if (categories.has("stash")) {
      return "stash";
    }
    if (categories.has("blacksmith") || categories.has("inventory")) {
      return "blacksmith";
    }
    if (categories.has("vendor") || categories.has("gambler")) {
      return "vendor";
    }
    if (categories.has("service")) {
      return "healer";
    }
    return npc.id;
  }

  function getMerchantActionLabel(action: TownAction): string {
    if (action.category === "service") {
      if (action.id.startsWith("healer_")) {
        return "Recovery";
      }
      if (action.id.startsWith("quartermaster_")) {
        return "Supplies";
      }
    }
    return MERCHANT_CATEGORY_LABELS[action.category] || toTitleCase(action.category);
  }

  function getMerchantActionIcon(action: TownAction): string {
    if (action.id === "sage_identify") {
      return "\u272A";
    }
    if (action.id.startsWith("quartermaster_deck_surgery_")) {
      return "\u2702";
    }
    if (action.id.startsWith("sage_purge_")) {
      return "\u2715";
    }
    if (action.id.startsWith("sage_transform_")) {
      return "\u21BB";
    }
    if (action.category === "service" && action.id.startsWith("quartermaster_")) {
      return "\u2697";
    }
    if (action.category === "stash") {
      return "\u26B0";
    }
    return CATEGORY_ICONS[action.category] || "\u2726";
  }

  function getServiceCardTone(action: TownAction, themeKey: string): string {
    if (action.id === "sage_identify") {
      return "ritual";
    }
    if (action.id.startsWith("sage_purge_")) {
      return "ash";
    }
    if (action.id.startsWith("sage_transform_")) {
      return "ember";
    }
    if (action.category === "progression") {
      return "discipline";
    }
    if (action.category === "mercenary") {
      if (action.subtitle === "On Contract") {
        return "contract";
      }
      if (action.subtitle === "Revive Contract") {
        return "ember";
      }
      return "steel";
    }
    if (action.category === "blacksmith") {
      return "forge";
    }
    if (action.category === "inventory") {
      return "steel";
    }
    if (action.category === "stash") {
      return "vault";
    }
    if (action.category === "service") {
      return action.id.startsWith("quartermaster_") ? "supply" : "remedy";
    }
    if (action.category === "vendor" || action.category === "gambler") {
      return "trade";
    }
    if (themeKey === "travel") {
      return "route";
    }
    return "ember";
  }

  function getServiceOverview(themeKey: string): { label: string; copy: string } {
    switch (themeKey) {
      case "cain":
        return {
          label: "Ritual Desk",
          copy: "Consult the ledger, cut dead weight from the deck, and invest bloodline gains before the trail reopens.",
        };
      case "mercenary":
        return {
          label: "Contract Board",
          copy: "Review the active contract first, then decide whether this expedition needs a different blade at its flank.",
        };
      case "blacksmith":
        return {
          label: "Forge Bench",
          copy: "The forge handles both deck metal and field gear. Rework what matters before you step beyond the gate.",
        };
      case "stash":
        return {
          label: "Profile Vault",
          copy: "This reserve persists between expeditions. Use it to bank power, not clutter.",
        };
      case "healer":
        return {
          label: "Camp Relief",
          copy: "Patch wounds, refill supplies, and leave only when the next route will not punish neglect.",
        };
      case "travel":
        return {
          label: "Departure Lane",
          copy: "When the road is chosen, there is nothing left to negotiate inside the camp walls.",
        };
      default:
        return {
          label: "Camp Services",
          copy: "Read the board, spend deliberately, and leave the camp cleaner than you found it.",
        };
    }
  }

  function getEmptyOverlayCopy(themeKey: string): string {
    switch (themeKey) {
      case "stash":
        return "No reserve gear or runes are waiting in the vault. Anything worth saving still has to be sent here from the current run.";
      case "travel":
        return "The road is already open. Leave the camp when your build, companion, and supplies are truly settled.";
      case "blacksmith":
        return "Nothing in the current loadout needs forge work yet. Stronger paths and new sockets will surface as the expedition matures.";
      case "healer":
        return "No wounds or supply gaps are pressing right now. The camp can send you back out clean.";
      default:
        return "The board is quiet for now. When the next pressure opens, it will show up here.";
    }
  }

  function buildServiceActionCard(action: TownAction, themeKey: string, escapeHtml: (s: string) => string): string {
    const tone = getServiceCardTone(action, themeKey);
    const previewLines = (action.previewLines || []).slice(0, 3);
    let badgeLabel = action.actionLabel;
    if (action.cost > 0) {
      badgeLabel = `${action.cost}g`;
    } else if (action.actionLabel === "—") {
      badgeLabel = "Closed";
    }
    let footerLabel = action.actionLabel;
    if (action.cost > 0) {
      footerLabel = `${action.actionLabel} • ${action.cost}g`;
    } else if (action.actionLabel === "—") {
      footerLabel = "Unavailable";
    }

    return `
      <button class="merchant-service-card merchant-service-card--tone-${escapeHtml(tone)} ${action.disabled ? "merchant-service-card--disabled" : ""}"
              data-action="use-town-action"
              data-town-action-id="${escapeHtml(action.id)}"
              ${action.disabled ? "disabled" : ""}>
        <div class="merchant-service-card__head">
          <div class="merchant-service-card__identity">
            <span class="merchant-service-card__icon">${getMerchantActionIcon(action)}</span>
            <div class="merchant-service-card__titles">
              <span class="merchant-service-card__eyebrow">${escapeHtml(getMerchantActionLabel(action))}</span>
              <span class="merchant-service-card__name">${escapeHtml(action.title)}</span>
            </div>
          </div>
          <span class="merchant-service-card__badge">${escapeHtml(badgeLabel)}</span>
        </div>
        ${action.subtitle ? `<p class="merchant-service-card__subtitle">${escapeHtml(action.subtitle)}</p>` : ""}
        ${action.description ? `<p class="merchant-service-card__desc">${escapeHtml(action.description)}</p>` : ""}
        ${previewLines.length > 0
          ? `<ul class="merchant-service-card__preview">${previewLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
          : ""
        }
        <div class="merchant-service-card__footer">
          <span class="merchant-service-card__state">${escapeHtml(action.disabled ? "Unavailable" : "Ready")}</span>
          <span class="merchant-service-card__cta">${escapeHtml(footerLabel)}</span>
        </div>
      </button>
    `;
  }

  function buildServiceSection(section: MerchantServiceSection, themeKey: string, escapeHtml: (s: string) => string): string {
    return `
      <section class="merchant-service-section">
        <div class="merchant-service-section__head">
          <div>
            <p class="merchant-service-section__eyebrow">${escapeHtml(section.title)}</p>
            <h4 class="merchant-service-section__title">${escapeHtml(section.copy)}</h4>
          </div>
          <span class="merchant-service-section__count">${section.actions.length}</span>
        </div>
        <div class="merchant-service-section__grid">
          ${section.actions.map((action) => buildServiceActionCard(action, themeKey, escapeHtml)).join("")}
        </div>
      </section>
    `;
  }

  function buildNpcServiceSections(npc: SafeZoneNpcViewModel, themeKey: string): MerchantServiceSection[] {
    const actions = npc.actions;

    if (themeKey === "cain") {
      const consult = actions.filter((action) => action.id === "sage_identify");
      const rites = actions.filter((action) => action.category === "sage" && action.id !== "sage_identify");
      const training = actions.filter((action) => action.category === "progression");
      return [
        { title: "Consult", copy: "Read the open evolution paths before you spend coin elsewhere.", actions: consult },
        { title: "Rites", copy: "Purge and transmute cards when the deck needs cleaner lines.", actions: rites },
        { title: "Bloodline Training", copy: "Convert banked progression into permanent strength before departure.", actions: training },
      ].filter((section) => section.actions.length > 0);
    }

    if (themeKey === "mercenary") {
      const currentContract = actions.filter((action) => action.subtitle === "On Contract" || action.subtitle === "Revive Contract");
      const company = actions.filter((action) => !currentContract.includes(action));
      return [
        { title: "Current Contract", copy: "Your present companion and any revive terms sit here first.", actions: currentContract },
        { title: "Available Company", copy: "Alternative contracts ready to take the field on this act.", actions: company },
      ].filter((section) => section.actions.length > 0);
    }

    if (themeKey === "blacksmith") {
      const forge = actions.filter((action) => action.category === "blacksmith");
      const fieldPack = actions.filter((action) => action.category === "inventory");
      return [
        { title: "Forge Services", copy: "Deck evolutions and socket work that reshape how the run fights.", actions: forge },
        { title: "Field Pack", copy: "Equipment already in hand that can be equipped, sold, socketed, or stashed.", actions: fieldPack },
      ].filter((section) => section.actions.length > 0);
    }

    if (themeKey === "healer") {
      const recovery = actions.filter((action) => action.id.startsWith("healer_"));
      const supplies = actions.filter((action) => action.id.startsWith("quartermaster_"));
      const remainder = actions.filter((action) => !recovery.includes(action) && !supplies.includes(action));
      return [
        { title: "Recovery", copy: "Restore Life and stabilize the party before the next push.", actions: recovery },
        { title: "Supplies", copy: "Refill belt charges and basic expedition stock.", actions: supplies },
        { title: "Camp Support", copy: "Additional camp-facing services available at this stop.", actions: remainder },
      ].filter((section) => section.actions.length > 0);
    }

    if (themeKey === "stash") {
      return [
        {
          title: "Stored Reserve",
          copy: "Profile-held gear and runes that can be pulled into the current expedition.",
          actions,
        },
      ];
    }

    const groupedActions = new Map<string, TownAction[]>();
    actions.forEach((action) => {
      const label = getMerchantActionLabel(action);
      const list = groupedActions.get(label) || [];
      list.push(action);
      groupedActions.set(label, list);
    });
    return [...groupedActions.entries()].map(([label, grouped]) => ({
      title: label,
      copy: `${label} services currently posted in camp.`,
      actions: grouped,
    }));
  }

  function buildNpcServiceLayout(
    npc: SafeZoneNpcViewModel,
    themeKey: string,
    escapeHtml: (s: string) => string
  ): string {
    const sections = buildNpcServiceSections(npc, themeKey);
    const overview = getServiceOverview(themeKey);

    return `
      <div class="merchant-service-shell">
        <section class="merchant-service-intel">
          <div class="merchant-service-intel__copy">
            <p class="merchant-service-intel__eyebrow">${escapeHtml(overview.label)}</p>
            <h4 class="merchant-service-intel__title">${escapeHtml(npc.name)} keeps this desk under watch.</h4>
            <p class="merchant-service-intel__body">${escapeHtml(overview.copy)}</p>
          </div>
        </section>
        ${sections.map((section) => buildServiceSection(section, themeKey, escapeHtml)).join("")}
      </div>
    `;
  }

  function buildEmptyOverlayState(npc: SafeZoneNpcViewModel, themeKey: string, escapeHtml: (s: string) => string): string {
    const overview = getServiceOverview(themeKey);
    return `
      <section class="merchant-empty-state merchant-empty-state--${escapeHtml(themeKey)}">
        <div class="merchant-empty-state__sigil" aria-hidden="true">${npc.icon}</div>
        <div class="merchant-empty-state__content">
          <p class="merchant-empty-state__eyebrow">${escapeHtml(overview.label)}</p>
          <h4 class="merchant-empty-state__title">${escapeHtml(npc.emptyLabel)}</h4>
          <p class="merchant-empty-state__copy">${escapeHtml(getEmptyOverlayCopy(themeKey))}</p>
        </div>
      </section>
    `;
  }

  runtimeWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION = {
    MERCHANT_PRESENTATIONS,
    toTitleCase,
    toPortraitKey,
    getNpcThemeKey,
    getMerchantActionLabel,
    getMerchantActionIcon,
    buildNpcServiceLayout,
    buildEmptyOverlayState,
  };
})();
