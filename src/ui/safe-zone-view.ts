(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  interface ActNpcLayout {
    healer: { name: string; posX: number; posY: number };
    blacksmith: { name: string; posX: number; posY: number };
    vendor: { name: string; posX: number; posY: number };
    mercenary: { name: string; posX: number; posY: number };
    stash: { posX: number; posY: number };
    cain: { posX: number; posY: number };
    travel?: { name: string; role: string; posX: number; posY: number };
    exitGate?: { posX: number; posY: number };
    extras?: Array<{ id: string; name: string; role: string; icon: string; posX: number; posY: number; actionSource: string }>;
  }

  function getTravelEmptyLabel(actNumber: number, npcName: string): string {
    const labels: Record<number, string> = {
      1: `${npcName}'s caravan waits at the camp's edge, ready for the road east.`,
      2: `${npcName}'s ship rocks gently at the dock. The sea route lies open.`,
      3: `${npcName} keeps the ship moored and ready at the Kurast docks.`,
    };
    return labels[actNumber] || `${npcName} stands ready for the journey ahead.`;
  }

  const ACT_NPC_LAYOUTS: Record<number, ActNpcLayout> = {
    1: {
      // Rogue Encampment — positions matched to act1.jpg NPC sprites
      healer:     { name: "Akara",   posX: 65, posY: 32 },  // east side, in her tent
      blacksmith: { name: "Charsi",  posX: 33, posY: 27 },  // NW, at the forge/anvil
      vendor:     { name: "Gheed",   posX: 27, posY: 48 },  // west side, near wagon
      mercenary:  { name: "Kashya",  posX: 55, posY: 20 },  // NE, near palisade gate
      stash:      { posX: 50, posY: 42 },                    // center campfire
      cain:       { posX: 48, posY: 45 },                    // near campfire
      travel:     { name: "Warriv", role: "Caravan Leader", posX: 38, posY: 58 },
    },
    2: {
      // Lut Gholein — positions matched to act2.jpg NPC labels
      healer:     { name: "Fara",    posX: 50, posY: 30 },  // center, "Trade & Repair"
      blacksmith: { name: "Fara",    posX: 50, posY: 30 },
      vendor:     { name: "Elzix",   posX: 26, posY: 22 },  // upper-left, inn area
      mercenary:  { name: "Greiz",   posX: 43, posY: 13 },  // top, "Mercenary Leader"
      stash:      { posX: 56, posY: 30 },                    // right of Fara, chest icon
      cain:       { posX: 54, posY: 42 },                    // below-right, "Identifier"
      travel:     { name: "Meshif", role: "Ship Captain", posX: 82, posY: 52 },
      extras: [
        { id: "atma", name: "Atma", role: "Healer", icon: "\u2764", posX: 62, posY: 32, actionSource: "healer" },
        { id: "lysander", name: "Lysander", role: "Trade", icon: "\u2696", posX: 42, posY: 38, actionSource: "vendor" },
      ],
    },
    3: {
      // Kurast Docks — positions matched to act3.jpg NPC labels
      healer:     { name: "Ormus",   posX: 38, posY: 42 },  // center platform, "Healer & Trade"
      blacksmith: { name: "Hratli",  posX: 82, posY: 48 },  // right dock, "Trade & Repair"
      vendor:     { name: "Alkor",   posX: 48, posY: 17 },  // upper-center, "Gambler & Trade"
      mercenary:  { name: "Asheara", posX: 14, posY: 18 },  // upper-left, Iron Wolves
      stash:      { posX: 48, posY: 40 },                    // center, near waypoint
      cain:       { posX: 50, posY: 44 },                    // below Cain label, right of center
      travel:     { name: "Meshif", role: "Ship Captain", posX: 12, posY: 52 },
    },
    4: {
      // Pandemonium Fortress — positions matched to act4.jpg NPC labels
      healer:     { name: "Jamella", posX: 45, posY: 72 },  // bottom-center, "Healer & Gambler"
      blacksmith: { name: "Halbu",   posX: 72, posY: 48 },  // right chamber, "Trade & Repair"
      vendor:     { name: "Jamella", posX: 45, posY: 72 },
      mercenary:  { name: "Tyrael",  posX: 45, posY: 8 },   // top-center, angelic figure
      stash:      { posX: 24, posY: 36 },                    // left side, "Chest"
      cain:       { posX: 33, posY: 28 },                    // upper-left, "Identifier"
    },
    5: {
      // Harrogath — positions matched to act5.jpg NPC labels
      healer:     { name: "Malah",      posX: 65, posY: 16 },  // upper-right, "Healer & Trade"
      blacksmith: { name: "Larzuk",     posX: 78, posY: 38 },  // right side, "Trade & Repair"
      vendor:     { name: "Anya",       posX: 35, posY: 55 },  // lower-left, "Gambler & Trade"
      mercenary:  { name: "Qual-Kehk",  posX: 33, posY: 20 },  // upper-left, "Mercenary Leader"
      stash:      { posX: 65, posY: 45 },                       // center-right, "Chest"
      cain:       { posX: 48, posY: 33 },                       // center, "Identifier"
    },
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

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const operationsApi = runtimeWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW;
    const operations = operationsApi.createOperationsModel(appState, services);
    const { escapeHtml } = services.renderUtils;
    const { run, routeSnapshot, healerActions, quartermasterActions, progressionActions, vendorActions, inventoryActions, stashActions, mercenaryActions, accountSummary } = operations;
    const townFocus = appState.ui.townFocus;

    const cainRescued = run.actNumber >= 2 || (run.acts || []).some((act) =>
      (act.zones || []).some((z) => z.title === "Tristram" && z.cleared)
    );

    const layout = ACT_NPC_LAYOUTS[run.actNumber] || ACT_NPC_LAYOUTS[1];

    // Detect merged NPC roles across acts
    const healerAndSmithSame = layout.healer.name === layout.blacksmith.name;  // Act 2: Fara
    const healerAndVendorSame = !healerAndSmithSame && layout.healer.name === layout.vendor.name;  // Act 4: Jamella

    // Healer always handles belt refill (quartermaster merged into healer, matching D2 potion sellers)
    const healerRole = healerAndSmithSame ? "Healer & Smith" : healerAndVendorSame ? "Healer & Vendor" : "Healer";
    const healerMergedActions = healerAndSmithSame
      ? [...healerActions, ...quartermasterActions, ...inventoryActions]
      : healerAndVendorSame
        ? [...healerActions, ...quartermasterActions, ...vendorActions]
        : [...healerActions, ...quartermasterActions];

    const npcs: TownNpc[] = [
      { id: "healer", name: layout.healer.name, role: healerRole, icon: NPC_ICONS.healer, posX: layout.healer.posX, posY: layout.healer.posY, actions: healerMergedActions, emptyLabel: "No recovery needed." },
      ...(!healerAndSmithSame ? [{ id: "blacksmith", name: layout.blacksmith.name, role: "Blacksmith", icon: NPC_ICONS.blacksmith, posX: layout.blacksmith.posX, posY: layout.blacksmith.posY, actions: inventoryActions, emptyLabel: "No inventory actions available." }] : []),
      ...(!healerAndVendorSame ? [{ id: "vendor", name: layout.vendor.name, role: "Vendor", icon: NPC_ICONS.vendor, posX: layout.vendor.posX, posY: layout.vendor.posY, actions: vendorActions, emptyLabel: "Vendor stock is empty." }] : []),
      { id: "mercenary", name: layout.mercenary.name, role: "Mercenary Captain", icon: NPC_ICONS.mercenary, posX: layout.mercenary.posX, posY: layout.mercenary.posY, actions: mercenaryActions, emptyLabel: "No mercenary actions available.", isMerc: true },
      ...(cainRescued ? [{ id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: layout.cain.posX, posY: layout.cain.posY, actions: progressionActions, emptyLabel: "No progression available." }] : []),
      ...(layout.travel ? [{ id: "travel", name: layout.travel.name, role: layout.travel.role, icon: NPC_ICONS.travel, posX: layout.travel.posX, posY: layout.travel.posY, actions: [] as TownAction[], emptyLabel: getTravelEmptyLabel(run.actNumber, layout.travel.name) }] : []),
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: layout.stash.posX, posY: layout.stash.posY, actions: stashActions, emptyLabel: "The stash is empty." },
      ...(layout.extras || []).map((extra) => {
        const sourceActions: Record<string, TownAction[]> = { healer: healerActions, vendor: vendorActions, blacksmith: inventoryActions, mercenary: mercenaryActions, progression: progressionActions };
        return { id: extra.id, name: extra.name, role: extra.role, icon: extra.icon, posX: extra.posX, posY: extra.posY, actions: sourceActions[extra.actionSource] || [], emptyLabel: `${extra.name} has nothing to offer.` };
      }),
    ];

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
          <img class="town-map-bg" src="./assets/curated/town-maps/act${run.actNumber > 5 ? 1 : run.actNumber}.jpg"
               alt="${escapeHtml(run.safeZoneName)}" draggable="false"
               onerror="this.style.display='none'" />
          <div class="town-npc-layer">
            ${npcIcons}
            <button class="town-exit-gate" style="left:82%;top:78%"
                    data-action="leave-safe-zone"
                    title="Exit to World Map">
              <span class="town-exit-gate__icon">\u{1F6AA}</span>
              <span class="town-exit-gate__label">World Map</span>
            </button>
          </div>
        </div>
      </div>
      ${npcOverlay}
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
