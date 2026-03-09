(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function buildTownDistrictMarkup(
    title: string,
    copy: string,
    actions: TownAction[],
    emptyCopy: string,
    renderCard: (action: TownAction) => string,
    gridClass = "feature-grid town-service-grid"
  ): string {
    // Districts are a presentation layer over existing town actions; the service modules still own execution.
    return `
      <article class="district-card">
        <div class="panel-head panel-head-compact">
          <h3>${title}</h3>
          <p>${copy}</p>
        </div>
        ${
          actions.length > 0
            ? `<div class="${gridClass}">${actions.map((action) => renderCard(action)).join("")}</div>`
            : `<p class="flow-copy">${emptyCopy}</p>`
        }
      </article>
    `;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const operationsApi = runtimeWindow.ROUGE_SAFE_ZONE_OPERATIONS_VIEW;
    const operations = operationsApi.createOperationsModel(appState, services);
    const { escapeHtml } = services.renderUtils;
    const { run, routeSnapshot, healerActions, quartermasterActions, progressionActions, vendorActions, inventoryActions, stashActions, mercenaryActions, accountSummary } =
      operations;

    const townJumpRow = `
      <div class="cta-row hall-jump-row">
        <a class="neutral-btn" href="#town-departure">Departure Board</a>
        <a class="neutral-btn" href="#town-loadout">Loadout Bench</a>
        <a class="neutral-btn" href="#town-prep-outcomes">Before / After Desk</a>
        <a class="neutral-btn" href="#town-drilldowns">Service Drilldowns</a>
        <a class="neutral-btn" href="#town-districts">Town Districts</a>
      </div>
    `;

    // The operations module owns the dense route/build/account town contract; this shell keeps navigation and districts readable.
    services.renderUtils.buildShell(root, {
      eyebrow: "Safe Zone",
      title: run.safeZoneName,
      copy:
        "Town is now organized as a real run hub. Recovery, training, stash, loadout, contracts, and departure planning all have clear homes while mutation still stays in the domain modules.",
      body: `
        ${common.renderRunStatus(run, "Safe Zone", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        ${common.buildExpeditionLaunchFlowMarkup(appState, accountSummary, services.renderUtils, {
          currentStep: "town",
          copy:
            "Town now keeps the hall signal, draft commit, and first-service pass in one launch flow, so the player can still read how the expedition started while preparing to leave safety.",
          hallFollowThrough: "The hall already set the preferred class, archive signal, and launch context that fed this run.",
          draftFollowThrough:
            "The drafted class shell and mercenary contract are now live on the expedition; this town pass confirms the opening build and supply state.",
          townFollowThrough:
            "Use this first town pass to validate recovery, spend pressure, stash pressure, and the departure board before you reopen the route.",
        })}
        <section class="safe-zone-grid">
          ${operationsApi.buildOperationsMarkup(appState, services, operations)}

          <article class="panel battle-panel" id="town-districts">
            <div class="panel-head">
              <h2>Town Districts</h2>
              <p>Each live service now has a named district. The shell groups recovery, supply, training, trade, stash, and companion management instead of flattening them into one list.</p>
            </div>
            ${townJumpRow}
            <div class="district-grid">
              ${buildTownDistrictMarkup(
                "Recovery Ward",
                "Restore the party before re-entering the route.",
                healerActions,
                "No recovery actions are needed right now.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Quartermaster Stores",
                "Refill belt stock and stabilize the next departure.",
                quartermasterActions,
                "The belt is already full.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Training Hall",
                "Spend skill, class, and attribute points without moving build rules into the shell.",
                progressionActions,
                "No progression spend is available right now.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Vendor Arcade",
                "Buy upgrades or refresh the local stock.",
                vendorActions,
                "Vendor stock is empty.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Field Pack",
                "Equip, socket, sell, and stash carried entries before you leave.",
                inventoryActions,
                "No carried inventory actions are available.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Profile Vault",
                "Withdraw profile stash items into the live expedition.",
                stashActions,
                "The profile stash is empty.",
                (action) => services.renderUtils.buildTownActionCard(action)
              )}
              ${buildTownDistrictMarkup(
                "Mercenary Barracks",
                "Swap contracts or revive a fallen companion without losing route progress.",
                mercenaryActions,
                "No mercenary actions are available.",
                (action) => services.renderUtils.buildMercenaryActionCard(action),
                "selection-grid selection-grid-mercs mercenary-hall-grid"
              )}
            </div>
            <div class="safe-zone-cta">
              <div>
                <p class="eyebrow">Departure Gate</p>
                <h3>${escapeHtml(routeSnapshot.nextZone?.title || "World Map")}</h3>
                <p class="service-subtitle">
                  ${escapeHtml(
                    routeSnapshot.nextZone
                      ? `Return to ${routeSnapshot.nextZone.title} with current map progress, loadout, and world outcomes intact.`
                      : "Open the map to read unlocked routes, side-node pressure, and boss access before leaving town."
                  )}
                </p>
              </div>
              <button class="primary-btn" data-action="leave-safe-zone">Step Onto The World Map</button>
            </div>
          </article>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_SAFE_ZONE_VIEW = {
    render,
  };
})();
