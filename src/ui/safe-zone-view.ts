(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  type VendorClass = "healer" | "quartermaster" | "blacksmith" | "vendor" | "gambler" | "mercenary" | "sage" | "stash" | "travel";

  const VENDOR_CLASS = {
    HEALER: "healer" as VendorClass,
    QUARTERMASTER: "quartermaster" as VendorClass,
    BLACKSMITH: "blacksmith" as VendorClass,
    VENDOR: "vendor" as VendorClass,
    GAMBLER: "gambler" as VendorClass,
    MERCENARY: "mercenary" as VendorClass,
    SAGE: "sage" as VendorClass,
    STASH: "stash" as VendorClass,
    TRAVEL: "travel" as VendorClass,
  };

  interface TownNpc {
    id: string;
    name: string;
    role: string;
    icon: string;
    posX: number;
    posY: number;
    actions: TownAction[];
    emptyLabel: string;
    isMerc?: boolean;
  }

  const NPC_ICONS: Record<string, string> = {
    healer: "\u2764",
    blacksmith: "\u2692",
    vendor: "\u2696",
    mercenary: "\u2694",
    cain: "\u272A",
    travel: "\u2693",
    stash: "\u26B0",
  };

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

  interface NpcEntry {
    id: string;
    name: string;
    role: string;
    icon: string;
    posX: number;
    posY: number;
    vendorClasses: VendorClass[];
    emptyLabel?: string;
    requiresCainRescue?: boolean;
  }

  function getTravelEmptyLabel(actNumber: number, npcName: string): string {
    const labels: Record<number, string> = {
      1: `${npcName}'s caravan waits at the camp's edge, ready for the road east.`,
      2: `${npcName}'s ship rocks gently at the dock. The sea route lies open.`,
      3: `${npcName} keeps the ship moored and ready at the Kurast docks.`,
    };
    return labels[actNumber] || `${npcName} stands ready for the journey ahead.`;
  }

  const VC = VENDOR_CLASS;

  const ACT_NPC_LAYOUTS: Record<number, NpcEntry[]> = {
    1: [
      // Rogue Encampment — positions matched to act1.jpg NPC sprites
      { id: "healer",     name: "Akara",   role: "Priestess",        icon: NPC_ICONS.healer,     posX: 80, posY: 53, vendorClasses: [VC.HEALER, VC.QUARTERMASTER] },
      { id: "blacksmith", name: "Charsi",  role: "Blacksmith",       icon: NPC_ICONS.blacksmith, posX: 43, posY: 28, vendorClasses: [VC.BLACKSMITH] },
      { id: "vendor",     name: "Gheed",   role: "Vendor & Gambler", icon: NPC_ICONS.vendor,     posX: 23, posY: 48, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary",  name: "Kashya",  role: "Mercenary Captain",icon: NPC_ICONS.mercenary,  posX: 60, posY: 50, vendorClasses: [VC.MERCENARY] },
      { id: "stash",      name: "Stash",   role: "Profile Vault",    icon: NPC_ICONS.stash,      posX: 50, posY: 40, vendorClasses: [VC.STASH] },
      { id: "cain",       name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 45, posY: 45, vendorClasses: [VC.SAGE], requiresCainRescue: true },
      { id: "travel",     name: "Warriv",  role: "Caravan Leader",   icon: NPC_ICONS.travel,     posX: 45, posY: 53, vendorClasses: [VC.TRAVEL] },
    ],
    2: [
      // Lut Gholein — positions matched to act2.webp NPC sprites
      { id: "healer",     name: "Fara",    role: "Healer & Smith",   icon: NPC_ICONS.healer,     posX: 50, posY: 36, vendorClasses: [VC.HEALER, VC.QUARTERMASTER, VC.BLACKSMITH] },
      { id: "vendor",     name: "Elzix",   role: "Vendor & Gambler", icon: NPC_ICONS.vendor,     posX: 26, posY: 26, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary",  name: "Greiz",   role: "Mercenary Captain",icon: NPC_ICONS.mercenary,  posX: 43, posY: 17, vendorClasses: [VC.MERCENARY] },
      { id: "stash",      name: "Stash",   role: "Profile Vault",    icon: NPC_ICONS.stash,      posX: 57, posY: 42, vendorClasses: [VC.STASH] },
      { id: "cain",       name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 60, posY: 50, vendorClasses: [VC.SAGE], requiresCainRescue: true },
      { id: "travel",     name: "Meshif",  role: "Ship Captain",     icon: NPC_ICONS.travel,     posX: 82, posY: 57, vendorClasses: [VC.TRAVEL] },
      { id: "atma",       name: "Atma",    role: "Healer",           icon: NPC_ICONS.healer,     posX: 70, posY: 37, vendorClasses: [VC.HEALER] },
      { id: "lysander",   name: "Lysander",role: "Trade",            icon: NPC_ICONS.vendor,     posX: 47, posY: 47, vendorClasses: [VC.VENDOR] },
    ],
    3: [
      // Kurast Docks — positions matched to act3.webp NPC sprites
      { id: "healer",     name: "Ormus",   role: "Healer",           icon: NPC_ICONS.healer,     posX: 35, posY: 43, vendorClasses: [VC.HEALER, VC.QUARTERMASTER] },
      { id: "blacksmith", name: "Hratli",  role: "Blacksmith",       icon: NPC_ICONS.blacksmith, posX: 83, posY: 55, vendorClasses: [VC.BLACKSMITH] },
      { id: "vendor",     name: "Alkor",   role: "Gambler & Vendor", icon: NPC_ICONS.vendor,     posX: 48, posY: 12, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary",  name: "Asheara", role: "Mercenary Captain",icon: NPC_ICONS.mercenary,  posX: 14, posY: 18, vendorClasses: [VC.MERCENARY] },
      { id: "stash",      name: "Stash",   role: "Profile Vault",    icon: NPC_ICONS.stash,      posX: 48, posY: 40, vendorClasses: [VC.STASH] },
      { id: "cain",       name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 46, posY: 49, vendorClasses: [VC.SAGE], requiresCainRescue: true },
      { id: "travel",     name: "Meshif",  role: "Ship Captain",     icon: NPC_ICONS.travel,     posX: 10, posY: 60, vendorClasses: [VC.TRAVEL] },
    ],
    4: [
      // Pandemonium Fortress — positions matched to act4.webp NPC sprites
      { id: "healer",     name: "Jamella", role: "Healer & Vendor",  icon: NPC_ICONS.healer,     posX: 50, posY: 65, vendorClasses: [VC.HEALER, VC.QUARTERMASTER, VC.VENDOR, VC.GAMBLER] },
      { id: "blacksmith", name: "Halbu",   role: "Blacksmith",       icon: NPC_ICONS.blacksmith, posX: 70, posY: 50, vendorClasses: [VC.BLACKSMITH] },
      { id: "mercenary",  name: "Tyrael",  role: "Mercenary Captain",icon: NPC_ICONS.mercenary,  posX: 40, posY: 15, vendorClasses: [VC.MERCENARY] },
      { id: "stash",      name: "Stash",   role: "Profile Vault",    icon: NPC_ICONS.stash,      posX: 27, posY: 26, vendorClasses: [VC.STASH] },
      { id: "cain",       name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 33, posY: 28, vendorClasses: [VC.SAGE], requiresCainRescue: true },
    ],
    5: [
      // Harrogath — positions matched to act5.webp grid overlay
      { id: "healer",     name: "Malah",     role: "Healer",           icon: NPC_ICONS.healer,     posX: 63, posY: 21, vendorClasses: [VC.HEALER, VC.QUARTERMASTER] },
      { id: "blacksmith", name: "Larzuk",    role: "Blacksmith",       icon: NPC_ICONS.blacksmith, posX: 79, posY: 54, vendorClasses: [VC.BLACKSMITH] },
      { id: "vendor",     name: "Anya",      role: "Gambler & Vendor", icon: NPC_ICONS.vendor,     posX: 35, posY: 55, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary",  name: "Qual-Kehk", role: "Mercenary Captain",icon: NPC_ICONS.mercenary,  posX: 36, posY: 38, vendorClasses: [VC.MERCENARY] },
      { id: "stash",      name: "Stash",     role: "Profile Vault",    icon: NPC_ICONS.stash,      posX: 67, posY: 53, vendorClasses: [VC.STASH] },
      { id: "cain",       name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 40, posY: 50, vendorClasses: [VC.SAGE], requiresCainRescue: true },
    ],
  };

  const ACT_EXIT_GATES: Record<number, { posX: number; posY: number }> = {
    1: { posX: 77, posY: 75 },
    2: { posX: 32, posY: 12 },
    3: { posX: 68, posY: 27 },
    4: { posX: 73, posY: 75 },
    5: { posX: 17, posY: 30 },
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
    return String(input || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getVendorItemEyebrow(action: TownAction): string {
    if (action.runeSourceId) {
      return action.runeTier ? `Tier ${action.runeTier} Rune` : "Rune";
    }
    if (action.itemFamily) {
      return action.itemFamily;
    }
    if (action.itemSlot) {
      return toTitleCase(action.itemSlot);
    }
    return "Stock";
  }

  function getVendorItemTone(action: TownAction): string {
    if (action.runeSourceId) {
      const tier = Math.max(1, action.runeTier || 1);
      if (tier >= 7) { return "rune-legend"; }
      if (tier >= 5) { return "rune-rare"; }
      if (tier >= 3) { return "rune-uncommon"; }
      return "rune-common";
    }

    switch (action.itemRarity) {
      case "green":
        return "set";
      case "brown":
        return "unique";
      case "yellow":
        return "rare";
      case "blue":
        return "magic";
      default:
        return "normal";
    }
  }

  function getNpcThemeKey(npc: TownNpc): string {
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
    const badgeLabel =
      action.cost > 0
        ? `${action.cost}g`
        : action.actionLabel === "—"
          ? "Closed"
          : action.actionLabel;
    const footerLabel =
      action.cost > 0
        ? `${action.actionLabel} • ${action.cost}g`
        : action.actionLabel === "—"
          ? "Unavailable"
          : action.actionLabel;

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

  function buildNpcServiceSections(npc: TownNpc, themeKey: string): MerchantServiceSection[] {
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
    npc: TownNpc,
    gold: number,
    themeKey: string,
    escapeHtml: (s: string) => string
  ): string {
    const sections = buildNpcServiceSections(npc, themeKey);
    const overview = getServiceOverview(themeKey);
    const readyCount = npc.actions.filter((action) => !action.disabled).length;
    const freeCount = npc.actions.filter((action) => action.cost <= 0 && !action.disabled).length;
    const lockedCount = Math.max(0, npc.actions.length - readyCount);

    return `
      <div class="merchant-service-shell">
        <section class="merchant-service-intel">
          <div class="merchant-service-intel__copy">
            <p class="merchant-service-intel__eyebrow">${escapeHtml(overview.label)}</p>
            <h4 class="merchant-service-intel__title">${escapeHtml(npc.name)} keeps this desk under watch.</h4>
            <p class="merchant-service-intel__body">${escapeHtml(overview.copy)}</p>
          </div>
          <div class="merchant-service-intel__stats">
            <div class="merchant-service-intel__stat">
              <span>Actions</span>
              <strong>${npc.actions.length}</strong>
            </div>
            <div class="merchant-service-intel__stat">
              <span>Ready</span>
              <strong>${readyCount}</strong>
            </div>
            <div class="merchant-service-intel__stat">
              <span>Free</span>
              <strong>${freeCount}</strong>
            </div>
            <div class="merchant-service-intel__stat">
              <span>Locked</span>
              <strong>${lockedCount}</strong>
            </div>
            <div class="merchant-service-intel__stat">
              <span>Gold</span>
              <strong>${gold}g</strong>
            </div>
          </div>
        </section>
        ${sections.map((section) => buildServiceSection(section, themeKey, escapeHtml)).join("")}
      </div>
    `;
  }

  function buildEmptyOverlayState(npc: TownNpc, themeKey: string, escapeHtml: (s: string) => string): string {
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

  function buildVendorItemArt(action: TownAction, content: GameContent, escapeHtml: (s: string) => string): string {
    const assetMap = runtimeWindow.ROUGE_ASSET_MAP;
    if (action.itemSourceId) {
      const sprite = assetMap?.getItemSprite?.(action.itemSourceId, action.itemRarity, action.itemSlot);
      if (sprite) {
        return `
          <div class="merchant-item__art merchant-item__art--equipment" aria-hidden="true">
            <img class="merchant-item__sprite" src="${escapeHtml(sprite)}" alt="" draggable="false" />
          </div>
        `;
      }
    }

    if (action.runeSourceId) {
      const runeDefinition = runtimeWindow.ROUGE_ITEM_CATALOG.getRuneDefinition(content, action.runeSourceId);
      const tier = Math.max(1, Math.min(9, action.runeTier || runeDefinition?.progressionTier || 1));
      const sprite = assetMap?.getRuneSprite?.(action.runeSourceId);
      if (sprite) {
        return `
          <div class="merchant-item__art merchant-item__art--rune merchant-item__art--rune-tier-${tier}" aria-hidden="true">
            <img class="merchant-item__sprite merchant-item__sprite--rune" src="${escapeHtml(sprite)}" alt="" draggable="false" />
            <span class="merchant-item__rune-tier">T${tier}</span>
          </div>
        `;
      }
      const glyph = (runeDefinition?.name || action.runeSourceId || "Rune").slice(0, 3).toUpperCase();
      return `
        <div class="merchant-item__art merchant-item__art--rune merchant-item__art--rune-tier-${tier}" aria-hidden="true">
          <span class="merchant-item__rune-glyph">${escapeHtml(glyph)}</span>
          <span class="merchant-item__rune-tier">T${tier}</span>
        </div>
      `;
    }

    return `
      <div class="merchant-item__art merchant-item__art--fallback" aria-hidden="true">
        <span class="merchant-item__fallback-glyph">+</span>
      </div>
    `;
  }

  function buildMerchantCard(a: TownAction, escapeHtml: (s: string) => string): string {
    const icon = CATEGORY_ICONS[a.category] || "\u2726";
    const canAfford = !a.disabled;
    return `
      <button class="merchant-card ${a.disabled ? "merchant-card--disabled" : ""}"
              data-action="use-town-action" data-town-action-id="${escapeHtml(a.id)}">
        <div class="merchant-card__icon">${icon}</div>
        <div class="merchant-card__name">${escapeHtml(a.title)}</div>
        ${a.subtitle ? `<div class="merchant-card__sub">${escapeHtml(a.subtitle)}</div>` : ""}
        ${a.description ? `<div class="merchant-card__desc">${escapeHtml(a.description)}</div>` : ""}
        ${a.cost > 0
          ? `<div class="merchant-card__price ${canAfford ? "" : "merchant-card__price--cant-afford"}">
              <span class="merchant-card__coin">\u{1F4B0}</span> ${a.cost}
            </div>`
          : `<div class="merchant-card__price merchant-card__price--free">FREE</div>`
        }
      </button>
    `;
  }

  function buildVendorItemCard(a: TownAction, content: GameContent, escapeHtml: (s: string) => string): string {
    const canAfford = !a.disabled;
    const eyebrow = getVendorItemEyebrow(a);
    const tone = getVendorItemTone(a);
    return `
      <button class="merchant-item merchant-item--tone-${escapeHtml(tone)} ${a.disabled ? "merchant-item--disabled" : ""}"
              data-action="use-town-action" data-town-action-id="${escapeHtml(a.id)}">
        ${buildVendorItemArt(a, content, escapeHtml)}
        <div class="merchant-item__content">
          <div class="merchant-item__eyebrow">${escapeHtml(eyebrow)}</div>
          <div class="merchant-item__name">${escapeHtml(a.title)}</div>
          <div class="merchant-item__footer">
            <span class="merchant-item__price ${canAfford ? "" : "merchant-item__price--cant-afford"}">
              <span class="merchant-card__coin">\u{1F4B0}</span> ${a.cost}
            </span>
            <span class="merchant-item__btn">${escapeHtml(a.actionLabel)}</span>
          </div>
        </div>
      </button>
    `;
  }

  function buildVendorSection(title: string, actions: TownAction[], content: GameContent, escapeHtml: (s: string) => string): string {
    return `
      <div class="merchant-section">
        <div class="merchant-section__title">${title}</div>
        <div class="merchant-section__grid">
          ${actions.map((a) => buildVendorItemCard(a, content, escapeHtml)).join("")}
        </div>
      </div>
    `;
  }

  function buildVendorStockLayout(actions: TownAction[], content: GameContent, escapeHtml: (s: string) => string): string {
    const refreshAction = actions.find((a) => a.id === "vendor_refresh_stock");
    const buyActions = actions.filter((a) => a.id.startsWith("vendor_buy"));
    const consignActions = actions.filter((a) => a.id.startsWith("vendor_consign"));
    const otherActions = actions.filter((a) =>
      a.id !== "vendor_refresh_stock" && !a.id.startsWith("vendor_buy") && !a.id.startsWith("vendor_consign")
    );

    const equipmentBuys = buyActions.filter((a) =>
      a.previewLines.some((l) => l.startsWith("Equipment stock"))
    );
    const runeBuys = buyActions.filter((a) =>
      a.previewLines.some((l) => l.startsWith("Rune stock"))
    );

    let html = "";

    if (refreshAction) {
      html += `
        <div class="merchant-refresh">
          <div class="merchant-refresh__info">
            <span class="merchant-refresh__icon">\u21BB</span>
            <span class="merchant-refresh__label">${escapeHtml(refreshAction.title)}</span>
          </div>
          <button class="merchant-refresh__btn ${refreshAction.disabled ? "merchant-refresh__btn--disabled" : ""}"
                  data-action="use-town-action" data-town-action-id="${escapeHtml(refreshAction.id)}"
                  ${refreshAction.disabled ? "disabled" : ""}>
            ${refreshAction.cost > 0
              ? `<span class="merchant-card__coin">\u{1F4B0}</span> ${refreshAction.cost}`
              : escapeHtml(refreshAction.actionLabel)}
          </button>
        </div>
      `;
    }

    if (equipmentBuys.length > 0) {
      html += buildVendorSection("\u2694 Equipment", equipmentBuys, content, escapeHtml);
    }
    if (runeBuys.length > 0) {
      html += buildVendorSection("\u2726 Runes", runeBuys, content, escapeHtml);
    }
    if (consignActions.length > 0) {
      html += buildVendorSection("\u26B0 Stash Consignment", consignActions, content, escapeHtml);
    }
    if (otherActions.length > 0) {
      html += `<div class="merchant-grid">${otherActions.map((a) => buildMerchantCard(a, escapeHtml)).join("")}</div>`;
    }

    return html;
  }

  function buildNpcOverlay(
    npc: TownNpc,
    gold: number,
    content: GameContent,
    escapeHtml: (s: string) => string
  ): string {
    const themeKey = getNpcThemeKey(npc);
    const presentation = MERCHANT_PRESENTATIONS[themeKey] || MERCHANT_PRESENTATIONS[npc.id] || MERCHANT_PRESENTATIONS.default;
    const portraitKey = toPortraitKey(npc.name);
    const portraitSrc = `./assets/curated/town-portraits/${portraitKey}.png`;
    const portraitFallbackSrc = `./assets/curated/town-portraits/${npc.id}.svg`;
    const serviceChips = [...new Set(npc.actions.map((a) => getMerchantActionLabel(a)))]
      .slice(0, 4)
      .map((label) => `<span class="merchant-portrait__chip">${escapeHtml(label)}</span>`)
      .join("");
    const isVendorStock = npc.actions.some((a) => a.id === "vendor_refresh_stock");
    let actionCards: string;
    if (npc.actions.length === 0) {
      actionCards = buildEmptyOverlayState(npc, themeKey, escapeHtml);
    } else if (isVendorStock) {
      actionCards = buildVendorStockLayout(npc.actions, content, escapeHtml);
    } else {
      actionCards = buildNpcServiceLayout(npc, gold, themeKey, escapeHtml);
    }

    return `
      <div class="town-npc-overlay" data-action="close-town-npc">
        <div class="merchant-screen merchant-screen--${escapeHtml(npc.id)} merchant-screen--theme-${escapeHtml(themeKey)} merchant-screen--name-${escapeHtml(portraitKey)}" data-action="noop">
          <div class="merchant-layout">
            <aside class="merchant-portrait merchant-portrait--${escapeHtml(npc.id)} merchant-portrait--theme-${escapeHtml(themeKey)} merchant-portrait--name-${escapeHtml(portraitKey)} merchant-portrait--fallback">
              <div class="merchant-portrait__art">
                <img class="merchant-portrait__image"
                     src="${escapeHtml(portraitSrc)}"
                     alt="${escapeHtml(npc.name)}"
                     data-fallback-src="${escapeHtml(portraitFallbackSrc)}"
                     draggable="false"
                     onload="this.closest('.merchant-portrait')?.classList.remove('merchant-portrait--fallback')"
                     onerror="if (this.dataset.fallbackSrc && this.src.indexOf(this.dataset.fallbackSrc) === -1) { this.src = this.dataset.fallbackSrc; } else { this.style.display='none'; }" />
                <div class="merchant-portrait__fallback-art" aria-hidden="true">
                  <span class="merchant-portrait__sigil">${npc.icon}</span>
                </div>
              </div>
              <div class="merchant-portrait__content">
                <p class="merchant-portrait__eyebrow">${escapeHtml(presentation.epithet)}</p>
                <h2 class="merchant-portrait__name">${escapeHtml(npc.name)}</h2>
                <p class="merchant-portrait__role">${escapeHtml(npc.role)}</p>
                <p class="merchant-portrait__quote">${escapeHtml(presentation.quote)}</p>
                <div class="merchant-portrait__chips">
                  ${serviceChips || `<span class="merchant-portrait__chip">${escapeHtml(toTitleCase(npc.role))}</span>`}
                </div>
                <p class="merchant-portrait__footer">${escapeHtml(presentation.footer)}</p>
              </div>
            </aside>
            <section class="merchant-panel">
              <div class="merchant-header">
                <div class="merchant-header__identity">
                  <span class="merchant-header__icon">${npc.icon}</span>
                  <div>
                    <h3 class="merchant-header__name">${escapeHtml(npc.name)}</h3>
                    <span class="merchant-header__role">${escapeHtml(npc.role)}</span>
                  </div>
                </div>
                <div class="merchant-header__gold">
                  <span class="merchant-header__coin">\u{1F4B0}</span> ${gold}g
                </div>
              </div>
              <div class="merchant-body">
                ${actionCards}
              </div>
              <div class="merchant-footer">
                <p class="merchant-footer__note">${escapeHtml(presentation.footer)}</p>
                <button class="merchant-leave" data-action="close-town-npc">
                  <span class="merchant-leave__arrow">\u2190</span> Leave
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  /** Map vendor classes to their corresponding action categories. */
  function getActionsForVendorClasses(
    classes: VendorClass[],
    actionsByCategory: Record<string, TownAction[]>,
    actNumber: number,
    npcName: string
  ): { actions: TownAction[]; emptyLabel: string } {
    const actions: TownAction[] = [];
    const has = (vc: VendorClass) => classes.includes(vc);

    if (has(VC.HEALER))        { actions.push(...(actionsByCategory.healer || [])); }
    if (has(VC.QUARTERMASTER)) { actions.push(...(actionsByCategory.quartermaster || [])); }
    if (has(VC.BLACKSMITH))    { actions.push(...(actionsByCategory.blacksmith || [])); }
    if (has(VC.VENDOR))        { actions.push(...(actionsByCategory.vendor || [])); }
    if (has(VC.MERCENARY))     { actions.push(...(actionsByCategory.mercenary || [])); }
    if (has(VC.SAGE))          { actions.push(...(actionsByCategory.sage || [])); }
    if (has(VC.STASH))         { actions.push(...(actionsByCategory.stash || [])); }
    if (has(VC.GAMBLER))       { actions.push(...(actionsByCategory.gambler || [])); }
    // TRAVEL: flavor NPC with no gameplay actions

    const emptyLabels: Partial<Record<VendorClass, string>> = {
      [VC.HEALER]: "No recovery needed.",
      [VC.BLACKSMITH]: "No forge work available.",
      [VC.VENDOR]: "Vendor stock is empty.",
      [VC.GAMBLER]: "The gambler has nothing to offer.",
      [VC.MERCENARY]: "No mercenary actions available.",
      [VC.SAGE]: "Cain has no services available.",
      [VC.STASH]: "The stash is empty.",
    };
    const primaryClass = classes[0];
    const emptyLabel = has(VC.TRAVEL)
      ? getTravelEmptyLabel(actNumber, npcName)
      : emptyLabels[primaryClass] || `${npcName} has nothing to offer.`;

    return { actions, emptyLabel };
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const operationsApi = runtimeWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW;
    const operations = operationsApi.createOperationsModel(appState, services);
    const { escapeHtml } = services.renderUtils;
    const { run, routeSnapshot, healerActions, quartermasterActions, progressionActions, vendorActions, blacksmithActions, sageActions, gamblerActions, inventoryActions, stashActions, mercenaryActions, accountSummary } = operations;
    const townFocus = appState.ui.townFocus;

    const cainRescued = run.actNumber >= 2 || (run.acts || []).some((act) =>
      (act.zones || []).some((z) => z.title === "Tristram" && z.cleared)
    );

    const npcEntries = ACT_NPC_LAYOUTS[run.actNumber] || ACT_NPC_LAYOUTS[1];

    // Map vendor classes to action categories for class-driven NPC action assignment
    const actionsByCategory: Record<string, TownAction[]> = {
      healer: healerActions,
      quartermaster: quartermasterActions,
      blacksmith: [...blacksmithActions, ...inventoryActions],
      vendor: vendorActions,
      gambler: gamblerActions,
      mercenary: mercenaryActions,
      sage: [...sageActions, ...progressionActions],
      stash: stashActions,
    };

    const npcs: TownNpc[] = npcEntries
      .filter((entry) => !entry.requiresCainRescue || cainRescued)
      .map((entry) => {
        const { actions, emptyLabel } = getActionsForVendorClasses(entry.vendorClasses, actionsByCategory, run.actNumber, entry.name);
        return {
          id: entry.id,
          name: entry.name,
          role: entry.role,
          icon: entry.icon,
          posX: entry.posX,
          posY: entry.posY,
          actions,
          emptyLabel,
          isMerc: entry.vendorClasses.includes(VC.MERCENARY),
        };
      });

    const focusedNpc = townFocus ? npcs.find((n) => n.id === townFocus) : null;

    const npcIcons = npcs
      .map((npc) => {
        const hasActions = npc.actions.length > 0;
        const isFocused = npc.id === townFocus;
        return `
          <button class="town-npc-icon ${hasActions ? "town-npc-icon--active" : ""} ${isFocused ? "town-npc-icon--focused" : ""}"
                  style="left:${npc.posX}%;top:${npc.posY}%"
                  data-action="focus-town-npc" data-npc-id="${escapeHtml(npc.id)}"
                  title="${escapeHtml(npc.name)} \u2014 ${escapeHtml(npc.role)}">
            <span class="town-npc-icon__dot"></span>
            <span class="town-npc-icon__label">${escapeHtml(npc.name)}</span>
            <span class="town-npc-icon__role">${escapeHtml(npc.role)}</span>
            ${hasActions ? `<span class="town-npc-icon__badge" title="${npc.actions.length} action${npc.actions.length === 1 ? "" : "s"} available">${npc.actions.length}</span>` : ""}
          </button>
        `;
      })
      .join("");

    const npcOverlay = focusedNpc
      ? buildNpcOverlay(focusedNpc, run.gold, appState.content, escapeHtml)
      : "";

    const inventoryOverlay = appState.ui.inventoryOpen
      ? `<div class="inv-overlay" data-action="close-inventory">
          <div data-action="noop">${runtimeWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(appState, services)}</div>
        </div>`
      : "";

    const mapSrc = `./assets/curated/town-maps/act${run.actNumber > 5 ? 1 : run.actNumber}.webp`;
    const nextZoneLabel = routeSnapshot.nextZone?.title || "World Map";
    const townIntro = `${run.safeZoneName} still holds beneath the blood sky. Take stock of your allies, mend your kit, and decide how the road will open toward ${nextZoneLabel}.`;
    const statusBar = `
      <div class="town-status">
        <div class="town-status__card">
          <span class="town-status__label">Bloodline</span>
          <span class="town-status__value">${escapeHtml(run.className)} Lv.${run.level}</span>
        </div>
        <div class="town-status__card">
          <span class="town-status__label">Vitals</span>
          <span class="town-status__value">HP ${run.hero.currentLife}/${run.hero.maxLife}</span>
        </div>
        <div class="town-status__card">
          <span class="town-status__label">Coin</span>
          <span class="town-status__value">${run.gold}g</span>
        </div>
        <div class="town-status__card">
          <span class="town-status__label">Next Trail</span>
          <span class="town-status__value">${escapeHtml(nextZoneLabel)}</span>
        </div>
      </div>
    `;

    const operationsMarkup = operationsApi.buildOperationsMarkup(appState, services, operations);

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="town-screen" style="--town-backdrop-image:url('${mapSrc}')">
        <div class="town-screen__veil" aria-hidden="true"></div>
        <div class="town-hero">
          <div class="town-hero__copy">
            <p class="eyebrow">Safe Haven</p>
            <h1>${escapeHtml(run.safeZoneName)}</h1>
            <p class="town-hero__intro">${escapeHtml(townIntro)}</p>
          </div>
          ${statusBar}
        </div>
        <div class="town-map-shell">
          <div class="town-map-container">
            <img class="town-map-bg" src="${mapSrc}"
                 alt="${escapeHtml(run.safeZoneName)}" draggable="false"
                 onerror="this.style.display='none'" />
            <div class="town-npc-layer">
              ${npcIcons}
              <button class="town-inv-btn" data-action="open-inventory" title="Open Inventory">
                \u{1F392} Inventory
              </button>
              <button class="town-exit-gate" style="left:${ACT_EXIT_GATES[run.actNumber]?.posX ?? 82}%;top:${ACT_EXIT_GATES[run.actNumber]?.posY ?? 78}%"
                      data-action="leave-safe-zone"
                      title="Exit to World Map">
                <span class="town-exit-gate__icon">\u{1F6AA}</span>
                <span class="town-exit-gate__label">World Map</span>
              </button>
            </div>
          </div>
          <p class="town-map-note">Choose a guide in camp or step through the gate when the trail is set.</p>
        </div>
      </div>
      ${npcOverlay}
      ${inventoryOverlay}
      <details class="town-operations-details">
        <summary class="town-operations-toggle">Town Details</summary>
        <section class="safe-zone-grid">
          ${common.buildExpeditionLaunchFlowMarkup(appState, accountSummary, services.renderUtils, {
            currentStep: "town",
            copy: "",
            hallFollowThrough: "",
            draftFollowThrough: "",
            townFollowThrough: "Use this first town pass to validate recovery, spend pressure, stash pressure, and the departure board before you reopen the route.",
          })}
          ${operationsMarkup}
          <article class="panel battle-panel" id="town-districts">
            <div class="panel-head">
              <h2>Town Districts</h2>
            </div>
            <div class="district-grid">
              ${buildDistrictMarkup("Recovery & Supplies", [...healerActions, ...quartermasterActions], (a) => services.renderUtils.buildTownActionCard(a))}
              ${buildDistrictMarkup("Training Hall", progressionActions, (a) => services.renderUtils.buildTownActionCard(a))}
              ${buildDistrictMarkup("Vendor Arcade", vendorActions, (a) => services.renderUtils.buildTownActionCard(a))}
              ${buildDistrictMarkup("Field Pack", inventoryActions, (a) => services.renderUtils.buildTownActionCard(a))}
              ${buildDistrictMarkup("Profile Vault", stashActions, (a) => services.renderUtils.buildTownActionCard(a))}
              ${buildDistrictMarkup("Mercenary Barracks", mercenaryActions, (a) => services.renderUtils.buildMercenaryActionCard(a))}
            </div>
            <div class="safe-zone-cta">
              <div>
                <p class="eyebrow">Departure Gate</p>
                <h3>${escapeHtml(routeSnapshot.nextZone?.title || "World Map")}</h3>
              </div>
              <button class="primary-btn" data-action="leave-safe-zone">Step Onto The World Map</button>
            </div>
          </article>
        </section>
      </details>
    `;
  }

  function buildDistrictMarkup(title: string, actions: TownAction[], renderCard: (a: TownAction) => string): string {
    return `
      <article class="district-card">
        <div class="panel-head panel-head-compact"><h3>${title}</h3></div>
        ${actions.length > 0 ? `<div class="feature-grid town-service-grid">${actions.map(renderCard).join("")}</div>` : ""}
      </article>
    `;
  }

  runtimeWindow.ROUGE_SAFE_ZONE_VIEW = {
    render,
  };
})();
