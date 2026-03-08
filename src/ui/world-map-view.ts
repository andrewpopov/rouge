(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getNodePresentation(zone: ZoneState, run: RunState) {
    // Map guidance is inferred from zone metadata and world-node records; resolution logic stays outside the shell.
    const catalog = runtimeWindow.ROUGE_WORLD_NODES?.getCatalog?.() || null;
    const questDefinition = catalog?.quests?.[zone.actNumber] || null;
    const shrineDefinition = catalog?.shrines?.[zone.actNumber] || null;
    const eventDefinition = catalog?.events?.[zone.actNumber] || null;
    const opportunityDefinition = catalog?.opportunities?.[zone.actNumber] || null;
    const questRecord = zone.nodeId ? run.world?.questOutcomes?.[zone.nodeId] || null : null;
    const shrineRecord = zone.nodeId ? run.world?.shrineOutcomes?.[zone.nodeId] || null : null;
    const eventRecord = zone.nodeId ? run.world?.eventOutcomes?.[zone.nodeId] || null : null;
    const opportunityRecord = zone.nodeId ? run.world?.opportunityOutcomes?.[zone.nodeId] || null : null;

    if (zone.kind === "quest") {
      return {
        hookLabel: questRecord ? "Outcome Logged" : "Quest Fork",
        summaryLine: questDefinition?.summary || zone.description,
        detailLines: [
          questRecord ? `Resolved as ${questRecord.outcomeTitle}.` : "Choose one outcome and write it into the run ledger.",
          "Quest nodes skip combat and resolve through the shared reward surface.",
          "A later aftermath node can branch from the result.",
        ],
      };
    }

    if (zone.kind === "shrine") {
      return {
        hookLabel: shrineRecord ? "Blessing Logged" : "Blessing Ready",
        summaryLine: shrineDefinition?.summary || zone.description,
        detailLines: [
          shrineRecord ? `Blessing taken: ${shrineRecord.outcomeTitle}.` : "Choose one blessing to mutate the run immediately.",
          "Shrines skip combat but still hand back through the reward seam.",
          "The blessing persists for the rest of the expedition.",
        ],
      };
    }

    if (zone.kind === "event") {
      const linkedQuestRecord = eventDefinition?.requiresQuestId ? run.world?.questOutcomes?.[eventDefinition.requiresQuestId] || null : null;
      const linkedQuestTitle = catalog?.quests?.[zone.actNumber]?.title || eventDefinition?.requiresQuestId || "the act quest";
      let hookLabel = "Quest Locked";
      if (eventRecord) {
        hookLabel = "Aftermath Logged";
      } else if (linkedQuestRecord) {
        hookLabel = "Aftermath Ready";
      }

      return {
        hookLabel,
        summaryLine: eventDefinition?.summary || zone.description,
        detailLines: [
          linkedQuestRecord ? `Triggered by ${linkedQuestRecord.title}: ${linkedQuestRecord.outcomeTitle}.` : `Unlocks after ${linkedQuestTitle} resolves.`,
          eventRecord ? `Recorded as ${eventRecord.outcomeTitle}.` : "Writes a follow-up consequence back into the quest ledger.",
          "Aftermath nodes resolve directly through reward instead of combat.",
        ],
      };
    }

    if (zone.kind === "opportunity") {
      const linkedQuestRecord = opportunityDefinition?.requiresQuestId
        ? run.world?.questOutcomes?.[opportunityDefinition.requiresQuestId] || null
        : null;
      let hookLabel = "Chain Locked";
      if (opportunityRecord) {
        hookLabel = "Chain Logged";
      } else if (linkedQuestRecord?.followUpOutcomeId) {
        hookLabel = "Chain Ready";
      }

      return {
        hookLabel,
        summaryLine: opportunityDefinition?.summary || zone.description,
        detailLines: [
          linkedQuestRecord?.followUpOutcomeTitle
            ? `Triggered by ${linkedQuestRecord.outcomeTitle} -> ${linkedQuestRecord.followUpOutcomeTitle}.`
            : "Unlocks after the full quest and aftermath chain resolves.",
          opportunityRecord ? `Recorded as ${opportunityRecord.outcomeTitle}.` : "Opportunity nodes pay off the full side chain through reward.",
          "No new shell phase is invented for this chain.",
        ],
      };
    }

    if (zone.kind === "boss") {
      return {
        hookLabel: "Boss Gate",
        summaryLine: zone.description,
        detailLines: [
          zone.status === "available"
            ? `${run.bossName} is open now.`
            : `${run.bossName} stays locked until the pressure routes are cleared.`,
          "Boss nodes still enter combat before returning to reward.",
        ],
      };
    }

    return {
      hookLabel: zone.kind === "miniboss" ? "Pressure Route" : "Battle Path",
      summaryLine: zone.description,
      detailLines: [
        `${zone.encounterTotal} encounter slot${zone.encounterTotal === 1 ? "" : "s"} live in this area.`,
        zone.encountersCleared > 0 ? "Area progress is preserved if you retreat to town." : "Clear encounters here to push the act forward.",
      ],
    };
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml, buildBadge } = services.renderUtils;
    const run = appState.run;
    const currentAct = services.runFactory.getCurrentAct(run);
    const currentZones = services.runFactory.getCurrentZones(run);
    const reachableZoneIds = new Set(services.runFactory.getReachableZones(run).map((zone) => zone.id));
    const clearedZones = currentZones.filter((zone) => zone.cleared).length;
    const bossZone = currentZones.find((zone) => zone.kind === "boss") || null;
    const battleZones = currentZones.filter((zone) => zone.kind === "battle" || zone.kind === "miniboss").length;
    const chainZones = currentZones.filter((zone) => ["quest", "shrine", "event", "opportunity"].includes(zone.kind)).length;
    const reachableNonBoss = currentZones.filter((zone) => zone.kind !== "boss" && reachableZoneIds.has(zone.id)).length;
    const lockedByPrereqs = currentZones.filter((zone) => zone.status === "locked" && zone.prerequisites.length > 0).length;
    const resolvedQuestCount = Object.keys(run.world?.questOutcomes || {}).length;
    const resolvedEventCount = Object.keys(run.world?.eventOutcomes || {}).length;
    const unclearedBeforeBoss = currentZones.filter((zone) => zone.kind !== "boss" && !zone.cleared).length;
    const zoneTitles = Object.fromEntries(currentZones.map((zone) => [zone.id, zone.title]));
    const recommendedZone = currentZones.find((zone) => reachableZoneIds.has(zone.id) && zone.kind !== "boss") || bossZone;

    services.renderUtils.buildShell(root, {
      eyebrow: "World Map",
      title: run.actTitle,
      copy:
        "The map now explains the outer loop clearly: where pressure lives, which nodes resolve through combat, which ones pay off through reward, and how close the boss gate is to opening.",
      body: `
        ${common.renderRunStatus(run, "World Map", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Act Pressure</h2>
            <p>${escapeHtml(`${currentAct?.town || run.safeZoneName} sits behind you. Read route pressure here before you commit the party to the next area.`)}</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Recommended Route</strong>
                ${buildBadge(recommendedZone ? recommendedZone.kind : "none", recommendedZone ? "available" : "locked")}
              </div>
              <p>${escapeHtml(recommendedZone ? `${recommendedZone.title} is the cleanest next step from the current map state.` : "No route is currently open.")}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Areas Cleared</strong>
                ${buildBadge(`${clearedZones}/${currentZones.length}`, clearedZones === currentZones.length ? "cleared" : "available")}
              </div>
              <p>Map progress survives a return to town, so route scouting never costs you cleared encounters.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Open Pressure</strong>
                ${buildBadge(`${reachableNonBoss}`, reachableNonBoss > 0 ? "available" : "locked")}
              </div>
              <p>${escapeHtml(`${reachableNonBoss} non-boss route${reachableNonBoss === 1 ? "" : "s"} are currently live.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Boss Gate</strong>
                ${buildBadge(common.getBossStatusLabel(bossZone?.status), common.getBossStatusTone(bossZone?.status))}
              </div>
              <p>${escapeHtml(`${run.bossName} sits beyond ${bossZone?.title || "the final route"}.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Boss Pressure</strong>
                ${buildBadge(unclearedBeforeBoss === 0 ? "Ready" : `${unclearedBeforeBoss} left`, unclearedBeforeBoss === 0 ? "cleared" : "locked")}
              </div>
              <p>${escapeHtml(unclearedBeforeBoss === 0 ? `${run.bossName} is the last route left in this act.` : `Clear ${unclearedBeforeBoss} more non-boss areas before the final gate is fully open.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Side Chains</strong>
                ${buildBadge(`${chainZones}`, chainZones > 0 ? "available" : "locked")}
              </div>
              <p>${escapeHtml(`${resolvedQuestCount} quest outcomes and ${resolvedEventCount} aftermath results already feed back into route metadata.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Battle Routes</strong>
                ${buildBadge(`${battleZones}`, battleZones > 0 ? "available" : "locked")}
              </div>
              <p>Battle and miniboss areas still deliver the core map to encounter to reward cadence for the act.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Prerequisite Locks</strong>
                ${buildBadge(`${lockedByPrereqs}`, lockedByPrereqs > 0 ? "locked" : "cleared")}
              </div>
              <p>Locked nodes stay visible so consequence chains and future node families have a stable place to surface.</p>
            </article>
          </div>
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Node Legend</h2>
            <p>Every node family now has a clear promise: what kind of resolution it uses, what it can change, and how it connects back into the run ledger.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <strong>Battle Paths</strong>
              <p>Battle and miniboss areas enter combat, then return through reward before the route continues.</p>
            </article>
            <article class="feature-card">
              <strong>Boss Nodes</strong>
              <p>Bosses are the act-pressure release valve. Clear prerequisite routes, then enter one final encounter before the reward and act transition.</p>
            </article>
            <article class="feature-card">
              <strong>Quest Forks</strong>
              <p>Quest nodes skip combat, write an outcome into the ledger, and can later unlock aftermath content.</p>
            </article>
            <article class="feature-card">
              <strong>Shrine Blessings</strong>
              <p>Shrines resolve instantly through the reward seam and mutate the run without adding a side-screen.</p>
            </article>
            <article class="feature-card">
              <strong>Aftermath Nodes</strong>
              <p>Aftermath routes read earlier quest outcomes and write a follow-up consequence back into the act chain.</p>
            </article>
            <article class="feature-card">
              <strong>Opportunity Chains</strong>
              <p>Opportunity nodes pay off the full quest chain and still use the same reward surface as every other non-combat node.</p>
            </article>
          </div>
          <div class="cta-row">
            <button class="neutral-btn" data-action="return-safe-zone">Return To ${escapeHtml(run.safeZoneName)}</button>
          </div>
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Route Atlas</h2>
            <p>Each route card shows pressure type, prerequisite chain, resolution style, and whether entering it continues combat momentum or pays off a non-combat branch.</p>
          </div>
          <div class="map-grid">
            ${currentZones
              .map((zone) => {
                const reachable = reachableZoneIds.has(zone.id);
                const nodePresentation = getNodePresentation(zone, run);
                let actionLabel = "Locked";
                if (zone.status === "available") {
                  actionLabel = zone.encountersCleared > 0 && !zone.cleared ? "Continue Route" : "Enter Route";
                } else if (zone.status === "cleared") {
                  actionLabel = "Resolved";
                }

                return services.renderUtils.buildWorldMapNodeCard({
                  zone,
                  reachable,
                  actionLabel,
                  prerequisiteLabel:
                    zone.prerequisites.length > 0
                      ? zone.prerequisites.map((prerequisiteId) => zoneTitles[prerequisiteId] || prerequisiteId).join(", ")
                      : "Opening Route",
                  hookLabel: nodePresentation.hookLabel,
                  summaryLine: nodePresentation.summaryLine,
                  detailLines: nodePresentation.detailLines,
                });
              })
              .join("")}
          </div>
        </section>
      `,
    });
  }

  runtimeWindow.ROUGE_WORLD_MAP_VIEW = {
    render,
  };
})();
