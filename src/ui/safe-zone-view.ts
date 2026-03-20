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

  function buildNpcOverlay(
    npc: TownNpc,
    gold: number,
    escapeHtml: (s: string) => string
  ): string {
    const actionCards =
      npc.actions.length > 0
        ? `<div class="merchant-grid">${npc.actions.map((a) => buildMerchantCard(a, escapeHtml)).join("")}</div>`
        : `<p class="merchant-empty">${escapeHtml(npc.emptyLabel)}</p>`;

    return `
      <div class="town-npc-overlay" data-action="close-town-npc">
        <div class="merchant-screen" data-action="noop">
          <div class="merchant-header">
            <div class="merchant-header__identity">
              <span class="merchant-header__icon">${npc.icon}</span>
              <div>
                <h2 class="merchant-header__name">${escapeHtml(npc.name)}</h2>
                <span class="merchant-header__role">${escapeHtml(npc.role)}</span>
              </div>
            </div>
            <div class="merchant-header__gold">
              <span class="merchant-header__coin">\u{1F4B0}</span> ${gold}g
            </div>
          </div>
          ${actionCards}
          <div class="merchant-footer">
            <button class="merchant-leave" data-action="close-town-npc">
              <span class="merchant-leave__arrow">\u2190</span> Leave
            </button>
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

    if (has(VC.HEALER))        actions.push(...(actionsByCategory.healer || []));
    if (has(VC.QUARTERMASTER)) actions.push(...(actionsByCategory.quartermaster || []));
    if (has(VC.BLACKSMITH))    actions.push(...(actionsByCategory.blacksmith || []));
    if (has(VC.VENDOR))        actions.push(...(actionsByCategory.vendor || []));
    if (has(VC.MERCENARY))     actions.push(...(actionsByCategory.mercenary || []));
    if (has(VC.SAGE))          actions.push(...(actionsByCategory.sage || []));
    if (has(VC.STASH))         actions.push(...(actionsByCategory.stash || []));
    if (has(VC.GAMBLER))       actions.push(...(actionsByCategory.gambler || []));
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
      ? buildNpcOverlay(focusedNpc, run.gold, escapeHtml)
      : "";

    const inventoryOverlay = appState.ui.inventoryOpen
      ? `<div class="inv-overlay" data-action="close-inventory">
          <div data-action="noop">${runtimeWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(appState, services)}</div>
        </div>`
      : "";

    const statusBar = `
      <div class="town-status">
        <span class="town-status__zone">${escapeHtml(run.safeZoneName)}</span>
        <span class="town-status__stats">
          ${escapeHtml(run.className)} Lv.${run.level}
          \u00b7 HP ${run.hero.currentLife}/${run.hero.maxLife}
          \u00b7 ${run.gold}g
        </span>
      </div>
    `;

    const operationsMarkup = operationsApi.buildOperationsMarkup(appState, services, operations);

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="town-screen">
        ${statusBar}
        <div class="town-map-container">
          <img class="town-map-bg" src="./assets/curated/town-maps/act${run.actNumber > 5 ? 1 : run.actNumber}.webp"
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
