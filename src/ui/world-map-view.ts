(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getNodePresentation(zone: ZoneState, run: RunState) {
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
          questRecord
            ? `Resolved as ${questRecord.outcomeTitle}.`
            : "Choose one outcome to write into the quest ledger.",
          "Quest nodes skip combat and resolve immediately through the reward screen.",
          "A later aftermath node can react to this result.",
        ],
      };
    }

    if (zone.kind === "shrine") {
      return {
        hookLabel: shrineRecord ? "Blessing Logged" : "Blessing Ready",
        summaryLine: shrineDefinition?.summary || zone.description,
        detailLines: [
          shrineRecord
            ? `Blessing taken: ${shrineRecord.outcomeTitle}.`
            : "Choose one blessing to mutate the run immediately.",
          "Shrines skip combat and return through the shared reward seam.",
          "The blessing persists on the current run.",
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
          linkedQuestRecord
            ? `Triggered by ${linkedQuestRecord.title}: ${linkedQuestRecord.outcomeTitle}.`
            : `Unlocks after ${linkedQuestTitle} resolves.`,
          eventRecord
            ? `Recorded as ${eventRecord.outcomeTitle}.`
            : "Aftermath nodes write a follow-up consequence back to the quest ledger.",
          "These nodes also resolve through the reward screen instead of starting combat.",
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
            : "Unlocks after the quest and aftermath chain both resolve.",
          opportunityRecord
            ? `Recorded as ${opportunityRecord.outcomeTitle}.`
            : "Opportunity nodes write the final chain consequence back to the run ledger.",
          "This is the third non-combat payoff in the route chain and still resolves through the reward screen.",
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
            : `${run.bossName} stays locked until the branch routes are cleared.`,
          "Boss routes still enter combat before handing back to the reward flow.",
        ],
      };
    }

    return {
      hookLabel: zone.kind === "miniboss" ? "Pressure Route" : "Battle Path",
      summaryLine: zone.description,
      detailLines: [
        `${zone.encounterTotal} encounter slot${zone.encounterTotal === 1 ? "" : "s"} live in this area.`,
        zone.encountersCleared > 0 ? "Area progress is preserved if you return to town." : "Clear encounters here to advance the act route.",
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
    const questNodes = currentZones.filter((zone) => {
      return zone.kind === "quest" || zone.kind === "shrine" || zone.kind === "event" || zone.kind === "opportunity";
    }).length;
    const bossZone = currentZones.find((zone) => zone.kind === "boss") || null;
    const lockedByPrereqs = currentZones.filter((zone) => zone.status === "locked" && zone.prerequisites.length > 0).length;
    const resolvedQuestCount = Object.keys(run.world?.questOutcomes || {}).length;
    const unclearedBeforeBoss = currentZones.filter((zone) => zone.kind !== "boss" && !zone.cleared).length;
    const zoneTitles = Object.fromEntries(currentZones.map((zone) => [zone.id, zone.title]));

    services.renderUtils.buildShell(root, {
      eyebrow: "World Map",
      title: `${run.actTitle}`,
      copy:
        "Each area on the map owns one to five encounters. The game loops world_map to encounter to reward as you clear the act route.",
      body: `
        ${common.renderRunStatus(run, "World Map", services.renderUtils)}
        ${common.renderNotice(appState, services.renderUtils)}
        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Route Overview</h2>
            <p>${escapeHtml(currentAct.town)} anchors this act. Clear both branch routes before the boss zone unlocks.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Areas Cleared</strong>
                ${buildBadge(`${clearedZones}/${currentZones.length}`, clearedZones === currentZones.length ? "cleared" : "available")}
              </div>
              <p>Route progress is preserved when you return to town.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Reachable Now</strong>
                ${buildBadge(`${reachableZoneIds.size}`, reachableZoneIds.size > 0 ? "available" : "locked")}
              </div>
              <p>Locked nodes stay visible so future route metadata has a stable place to live.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Special Nodes</strong>
                ${buildBadge(`${questNodes}`, questNodes > 0 ? "available" : "locked")}
              </div>
              <p>Quest, shrine, and event hooks can surface beside battle nodes without changing the map shell.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Prerequisite Locks</strong>
                ${buildBadge(`${lockedByPrereqs}`, lockedByPrereqs > 0 ? "locked" : "cleared")}
              </div>
              <p>Node prerequisites stay visible on the map so route gating reads clearly before shrine and event families land.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Quest Ledger</strong>
                ${buildBadge(`${resolvedQuestCount}`, resolvedQuestCount > 0 ? "available" : "locked")}
              </div>
              <p>Resolved quest outcomes persist on the run and can inform later map or reward metadata.</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Boss Gate</strong>
                ${buildBadge(common.getBossStatusLabel(bossZone?.status), common.getBossStatusTone(bossZone?.status))}
              </div>
              <p>${escapeHtml(`${run.bossName} sits behind ${bossZone?.title || "the final route"}.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Boss Pressure</strong>
                ${buildBadge(unclearedBeforeBoss === 0 ? "Ready" : `${unclearedBeforeBoss} left`, unclearedBeforeBoss === 0 ? "cleared" : "locked")}
              </div>
              <p>
                ${escapeHtml(
                  unclearedBeforeBoss === 0
                    ? `${run.bossName} is the last route left in this act.`
                    : `Clear ${unclearedBeforeBoss} more non-boss areas before the final gate fully opens.`
                )}
              </p>
            </article>
          </div>
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Map Guide</h2>
            <p>Node families keep their own explanation space here without changing the phase model.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <strong>Battle Paths</strong>
              <p>Battle and miniboss areas lead into combat, then hand back into the reward screen before the route resumes.</p>
            </article>
            <article class="feature-card">
              <strong>Quest Nodes</strong>
              <p>Quest routes skip combat, write a quest outcome into the world ledger, and can unlock later aftermath content.</p>
            </article>
            <article class="feature-card">
              <strong>Shrine Nodes</strong>
              <p>Shrines resolve immediately and grant a persistent blessing through the same reward seam as combat loot.</p>
            </article>
            <article class="feature-card">
              <strong>Aftermath Nodes</strong>
              <p>Aftermath routes read earlier quest outcomes and write a follow-up consequence without inventing a new shell phase.</p>
            </article>
            <article class="feature-card">
              <strong>Opportunity Nodes</strong>
              <p>Opportunity routes pay off the full quest chain and still use the shared reward seam instead of a one-off shell.</p>
            </article>
          </div>
          <div class="cta-row">
            <button class="neutral-btn" data-action="return-safe-zone">Return To ${escapeHtml(run.safeZoneName)}</button>
          </div>
        </section>

        <section class="panel flow-panel">
          <div class="panel-head">
            <h2>Route Nodes</h2>
            <p>Each card shows encounters, prerequisites, and what kind of resolution you should expect before entering.</p>
          </div>
          <div class="map-grid">
            ${currentZones
              .map((zone) => {
                const reachable = reachableZoneIds.has(zone.id);
                const nodePresentation = getNodePresentation(zone, run);
                let actionLabel = "Locked";
                if (zone.status === "available") {
                  if (zone.encountersCleared > 0 && !zone.cleared) {
                    actionLabel = "Continue Area";
                  } else {
                    actionLabel = "Enter Area";
                  }
                } else if (zone.status === "cleared") {
                  actionLabel = "Cleared";
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
