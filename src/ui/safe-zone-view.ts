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
    akara: "\u2764",
    charsi: "\u2692",
    gheed: "\u2696",
    kashya: "\u2694",
    cain: "\u272A",
    warriv: "\u26B1",
    stash: "\u26B0",
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

    const npcs: TownNpc[] = [
      { id: "akara", name: "Akara", role: "Healer", icon: NPC_ICONS.akara, posX: 78, posY: 54, actions: healerActions, emptyLabel: "No recovery needed." },
      { id: "charsi", name: "Charsi", role: "Blacksmith", icon: NPC_ICONS.charsi, posX: 36, posY: 22, actions: inventoryActions, emptyLabel: "No inventory actions available." },
      { id: "gheed", name: "Gheed", role: "Vendor", icon: NPC_ICONS.gheed, posX: 22, posY: 48, actions: vendorActions, emptyLabel: "Vendor stock is empty." },
      { id: "kashya", name: "Kashya", role: "Mercenary Captain", icon: NPC_ICONS.kashya, posX: 58, posY: 42, actions: mercenaryActions, emptyLabel: "No mercenary actions available.", isMerc: true },
      { id: "cain", name: "Deckard Cain", role: "Sage \u2014 Training", icon: NPC_ICONS.cain, posX: 48, posY: 55, actions: progressionActions, emptyLabel: "No progression available." },
      { id: "warriv", name: "Warriv", role: "Quartermaster", icon: NPC_ICONS.warriv, posX: 36, posY: 42, actions: quartermasterActions, emptyLabel: "Belt is full." },
      { id: "stash", name: "Stash", role: "Profile Vault", icon: NPC_ICONS.stash, posX: 50, posY: 40, actions: stashActions, emptyLabel: "The stash is empty." },
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
            ${hasActions ? `<span class="town-npc-icon__badge">${npc.actions.length}</span>` : ""}
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
              ${buildDistrictMarkup("Recovery Ward", healerActions, (a) => services.renderUtils.buildTownActionCard(a))}
              ${buildDistrictMarkup("Quartermaster Stores", quartermasterActions, (a) => services.renderUtils.buildTownActionCard(a))}
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
