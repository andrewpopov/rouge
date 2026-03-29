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

  interface TownNpc extends SafeZoneNpcViewModel {
    posX: number;
    posY: number;
  }

  interface NpcEntry {
    id: string;
    name: string;
    role: string;
    icon: string;
    posX: number;
    posY: number;
    vendorClasses: VendorClass[];
    requiresCainRescue?: boolean;
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
      { id: "healer", name: "Akara", role: "Priestess", icon: NPC_ICONS.healer, posX: 80, posY: 53, vendorClasses: [VC.HEALER, VC.QUARTERMASTER] },
      { id: "blacksmith", name: "Charsi", role: "Blacksmith", icon: NPC_ICONS.blacksmith, posX: 43, posY: 28, vendorClasses: [VC.BLACKSMITH] },
      { id: "vendor", name: "Gheed", role: "Vendor & Gambler", icon: NPC_ICONS.vendor, posX: 23, posY: 48, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary", name: "Kashya", role: "Mercenary Captain", icon: NPC_ICONS.mercenary, posX: 60, posY: 50, vendorClasses: [VC.MERCENARY] },
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: 50, posY: 40, vendorClasses: [VC.STASH] },
      { id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 45, posY: 45, vendorClasses: [VC.SAGE], requiresCainRescue: true },
      { id: "travel", name: "Warriv", role: "Caravan Leader", icon: NPC_ICONS.travel, posX: 45, posY: 53, vendorClasses: [VC.TRAVEL] },
    ],
    2: [
      { id: "healer", name: "Fara", role: "Healer & Smith", icon: NPC_ICONS.healer, posX: 50, posY: 36, vendorClasses: [VC.HEALER, VC.QUARTERMASTER, VC.BLACKSMITH] },
      { id: "vendor", name: "Elzix", role: "Vendor & Gambler", icon: NPC_ICONS.vendor, posX: 26, posY: 26, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary", name: "Greiz", role: "Mercenary Captain", icon: NPC_ICONS.mercenary, posX: 43, posY: 17, vendorClasses: [VC.MERCENARY] },
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: 57, posY: 42, vendorClasses: [VC.STASH] },
      { id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 60, posY: 50, vendorClasses: [VC.SAGE], requiresCainRescue: true },
      { id: "travel", name: "Meshif", role: "Ship Captain", icon: NPC_ICONS.travel, posX: 82, posY: 57, vendorClasses: [VC.TRAVEL] },
      { id: "atma", name: "Atma", role: "Healer", icon: NPC_ICONS.healer, posX: 70, posY: 37, vendorClasses: [VC.HEALER] },
      { id: "lysander", name: "Lysander", role: "Trade", icon: NPC_ICONS.vendor, posX: 47, posY: 47, vendorClasses: [VC.VENDOR] },
    ],
    3: [
      { id: "healer", name: "Ormus", role: "Healer", icon: NPC_ICONS.healer, posX: 35, posY: 43, vendorClasses: [VC.HEALER, VC.QUARTERMASTER] },
      { id: "blacksmith", name: "Hratli", role: "Blacksmith", icon: NPC_ICONS.blacksmith, posX: 83, posY: 55, vendorClasses: [VC.BLACKSMITH] },
      { id: "vendor", name: "Alkor", role: "Gambler & Vendor", icon: NPC_ICONS.vendor, posX: 48, posY: 12, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary", name: "Asheara", role: "Mercenary Captain", icon: NPC_ICONS.mercenary, posX: 14, posY: 18, vendorClasses: [VC.MERCENARY] },
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: 48, posY: 40, vendorClasses: [VC.STASH] },
      { id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 46, posY: 49, vendorClasses: [VC.SAGE], requiresCainRescue: true },
      { id: "travel", name: "Meshif", role: "Ship Captain", icon: NPC_ICONS.travel, posX: 10, posY: 60, vendorClasses: [VC.TRAVEL] },
    ],
    4: [
      { id: "healer", name: "Jamella", role: "Healer & Vendor", icon: NPC_ICONS.healer, posX: 50, posY: 65, vendorClasses: [VC.HEALER, VC.QUARTERMASTER, VC.VENDOR, VC.GAMBLER] },
      { id: "blacksmith", name: "Halbu", role: "Blacksmith", icon: NPC_ICONS.blacksmith, posX: 70, posY: 50, vendorClasses: [VC.BLACKSMITH] },
      { id: "mercenary", name: "Tyrael", role: "Mercenary Captain", icon: NPC_ICONS.mercenary, posX: 40, posY: 15, vendorClasses: [VC.MERCENARY] },
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: 27, posY: 26, vendorClasses: [VC.STASH] },
      { id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 33, posY: 28, vendorClasses: [VC.SAGE], requiresCainRescue: true },
    ],
    5: [
      { id: "healer", name: "Malah", role: "Healer", icon: NPC_ICONS.healer, posX: 63, posY: 21, vendorClasses: [VC.HEALER, VC.QUARTERMASTER] },
      { id: "blacksmith", name: "Larzuk", role: "Blacksmith", icon: NPC_ICONS.blacksmith, posX: 79, posY: 54, vendorClasses: [VC.BLACKSMITH] },
      { id: "vendor", name: "Anya", role: "Gambler & Vendor", icon: NPC_ICONS.vendor, posX: 35, posY: 55, vendorClasses: [VC.VENDOR, VC.GAMBLER] },
      { id: "mercenary", name: "Qual-Kehk", role: "Mercenary Captain", icon: NPC_ICONS.mercenary, posX: 36, posY: 38, vendorClasses: [VC.MERCENARY] },
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: 67, posY: 53, vendorClasses: [VC.STASH] },
      { id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 40, posY: 50, vendorClasses: [VC.SAGE], requiresCainRescue: true },
    ],
  };

  const ACT_EXIT_GATES: Record<number, { posX: number; posY: number }> = {
    1: { posX: 77, posY: 75 },
    2: { posX: 32, posY: 12 },
    3: { posX: 68, posY: 27 },
    4: { posX: 73, posY: 75 },
    5: { posX: 17, posY: 30 },
  };

  function getActionsForVendorClasses(
    classes: VendorClass[],
    actionsByCategory: Record<string, TownAction[]>,
    actNumber: number,
    npcName: string
  ): { actions: TownAction[]; emptyLabel: string } {
    const actions: TownAction[] = [];
    const has = (vendorClass: VendorClass) => classes.includes(vendorClass);

    if (has(VC.HEALER)) { actions.push(...(actionsByCategory.healer || [])); }
    if (has(VC.QUARTERMASTER)) { actions.push(...(actionsByCategory.quartermaster || [])); }
    if (has(VC.BLACKSMITH)) { actions.push(...(actionsByCategory.blacksmith || [])); }
    if (has(VC.VENDOR)) { actions.push(...(actionsByCategory.vendor || [])); }
    if (has(VC.MERCENARY)) { actions.push(...(actionsByCategory.mercenary || [])); }
    if (has(VC.SAGE)) { actions.push(...(actionsByCategory.sage || [])); }
    if (has(VC.STASH)) { actions.push(...(actionsByCategory.stash || [])); }
    if (has(VC.GAMBLER)) { actions.push(...(actionsByCategory.gambler || [])); }

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
    const merchantApi = runtimeWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT;
    const operationsApi = runtimeWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW;
    const operations = operationsApi.createOperationsModel(appState, services);
    const { escapeHtml } = services.renderUtils;
    const {
      run,
      routeSnapshot,
      healerActions,
      quartermasterActions,
      progressionActions,
      vendorActions,
      blacksmithActions,
      sageActions,
      gamblerActions,
      inventoryActions,
      stashActions,
      mercenaryActions,
      accountSummary,
    } = operations;
    const townFocus = appState.ui.townFocus;

    const cainRescued = run.actNumber >= 2 || (run.acts || []).some((act) =>
      (act.zones || []).some((zone) => zone.title === "Tristram" && zone.cleared)
    );

    const npcEntries = ACT_NPC_LAYOUTS[run.actNumber] || ACT_NPC_LAYOUTS[1];
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
        const vendorActionsForNpc = getActionsForVendorClasses(entry.vendorClasses, actionsByCategory, run.actNumber, entry.name);
        return {
          id: entry.id,
          name: entry.name,
          role: entry.role,
          icon: entry.icon,
          posX: entry.posX,
          posY: entry.posY,
          actions: vendorActionsForNpc.actions,
          emptyLabel: vendorActionsForNpc.emptyLabel,
          isMerc: entry.vendorClasses.includes(VC.MERCENARY),
        };
      });

    const focusedNpc = townFocus ? npcs.find((npc) => npc.id === townFocus) : null;
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
      ? merchantApi.buildNpcOverlay(focusedNpc, run.gold, appState.content, escapeHtml)
      : "";
    const inventoryOverlay = appState.ui.inventoryOpen
      ? `<div class="inv-overlay" data-action="close-inventory">
          <div data-action="noop">${runtimeWindow.ROUGE_INVENTORY_VIEW.buildInventoryMarkup(appState, services)}</div>
        </div>`
      : "";

    const mapSrc = `./assets/curated/town-maps/act${run.actNumber > 5 ? 1 : run.actNumber}.webp`;
    const nextZoneLabel = routeSnapshot.nextZone?.title || "World Map";
    const townIntro = `${run.safeZoneName} still holds beneath the blood sky. Settle your affairs, choose a guide, and decide how the road will open toward ${nextZoneLabel}.`;
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
    const townLedgerActionCount = [
      healerActions,
      quartermasterActions,
      progressionActions,
      vendorActions,
      blacksmithActions,
      sageActions,
      gamblerActions,
      inventoryActions,
      stashActions,
      mercenaryActions,
    ].reduce((total, actions) => total + actions.length, 0);
    const townLedgerPrepIssueCount = Math.max(0, operations.readinessIssues.length - 1);
    const townDistrictCount = [
      healerActions.length + quartermasterActions.length > 0,
      progressionActions.length > 0,
      vendorActions.length + gamblerActions.length > 0,
      inventoryActions.length + blacksmithActions.length > 0,
      stashActions.length > 0,
      mercenaryActions.length > 0,
    ].filter(Boolean).length;
    const townLedgerJumpRow = `
      <nav class="town-operations-jump-row" aria-label="Town ledger sections">
        <a class="neutral-btn" href="#town-departure">Departure Board</a>
        <a class="neutral-btn" href="#town-loadout">Loadout Bench</a>
        <a class="neutral-btn" href="#town-prep-outcomes">Prep Desk</a>
        <a class="neutral-btn" href="#town-drilldowns">Service Drilldowns</a>
        <a class="neutral-btn" href="#town-districts">Town Districts</a>
      </nav>
    `;

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
          <div class="town-map-container" style="--town-map-image:url('${mapSrc}')">
            <img class="town-map-bg" src="${mapSrc}"
                 alt="${escapeHtml(run.safeZoneName)}" draggable="false"
                 onerror="this.style.display='none'" />
            <div class="town-npc-layer">
              <div class="town-map-plaque">
                <span class="town-map-plaque__label">Camp Stage</span>
                <strong class="town-map-plaque__title">Choose a guide or open the gate.</strong>
                <span class="town-map-plaque__trail">Trail to ${escapeHtml(nextZoneLabel)}</span>
              </div>
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
      </div>
      ${npcOverlay}
      ${inventoryOverlay}
      <details class="town-operations-details">
        <summary class="town-operations-toggle">
          <span class="town-operations-toggle__chevron" aria-hidden="true">\u25B8</span>
          <span class="town-operations-toggle__copy">
            <span class="town-operations-toggle__eyebrow">Town Ledger</span>
            <span class="town-operations-toggle__title">Departure, loadout, services, and district details</span>
            <span class="town-operations-toggle__hint">Open the long-form town ledger when you want the full prep picture before leaving camp.</span>
          </span>
          <span class="town-operations-toggle__stats" aria-hidden="true">
            <span class="town-operations-toggle__stat">
              <strong>${townLedgerActionCount}</strong>
              <span>live actions</span>
            </span>
            <span class="town-operations-toggle__stat">
              <strong>${townLedgerPrepIssueCount}</strong>
              <span>prep checks</span>
            </span>
            <span class="town-operations-toggle__stat">
              <strong>${townDistrictCount}</strong>
              <span>district wings</span>
            </span>
          </span>
        </summary>
        <div class="town-operations-surface">
          <header class="town-operations-hero">
            <div class="town-operations-hero__copy">
              <p class="eyebrow">Town Ledger</p>
              <h2>Review the camp before you step back onto the road.</h2>
              <p>
                This is the full town view: departure board, loadout bench, prep comparisons, and every district action in one place.
                Use it when the map is not enough and you want the whole expedition picture at once.
              </p>
            </div>
            <div class="town-operations-summary" aria-label="Town ledger summary">
              <article class="town-operations-summary__card">
                <span class="town-operations-summary__label">Next Trail</span>
                <strong class="town-operations-summary__value">${escapeHtml(nextZoneLabel)}</strong>
              </article>
              <article class="town-operations-summary__card">
                <span class="town-operations-summary__label">Live Actions</span>
                <strong class="town-operations-summary__value">${townLedgerActionCount}</strong>
              </article>
              <article class="town-operations-summary__card">
                <span class="town-operations-summary__label">Prep Checks</span>
                <strong class="town-operations-summary__value">${townLedgerPrepIssueCount}</strong>
              </article>
            </div>
          </header>
          ${townLedgerJumpRow}
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
                <p>Every service lane in camp, grouped by what you can actually do there right now.</p>
              </div>
              <div class="district-grid">
                ${buildDistrictMarkup("Recovery & Supplies", [...healerActions, ...quartermasterActions], (action) => services.renderUtils.buildTownActionCard(action))}
                ${buildDistrictMarkup("Training Hall", progressionActions, (action) => services.renderUtils.buildTownActionCard(action))}
                ${buildDistrictMarkup("Vendor Arcade", vendorActions, (action) => services.renderUtils.buildTownActionCard(action))}
                ${buildDistrictMarkup("Field Pack", inventoryActions, (action) => services.renderUtils.buildTownActionCard(action))}
                ${buildDistrictMarkup("Profile Vault", stashActions, (action) => services.renderUtils.buildTownActionCard(action))}
                ${buildDistrictMarkup("Mercenary Barracks", mercenaryActions, (action) => services.renderUtils.buildMercenaryActionCard(action))}
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
        </div>
      </details>
    `;
  }

  function buildDistrictMarkup(title: string, actions: TownAction[], renderCard: (action: TownAction) => string): string {
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
