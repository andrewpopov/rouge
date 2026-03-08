/* eslint-disable no-nested-ternary */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getPreviewLabel(labels: string[], emptyLabel: string, maxItems = 4): string {
    const filtered = Array.isArray(labels) ? labels.filter(Boolean) : [];
    if (filtered.length === 0) {
      return emptyLabel;
    }

    const visible = filtered.slice(0, maxItems);
    return filtered.length > maxItems ? `${visible.join(", ")}, +${filtered.length - maxItems} more` : visible.join(", ");
  }

  function getNodeFamilyLabel(zone: ZoneState | null): string {
    if (!zone) {
      return "Route";
    }

    if (zone.kind !== "opportunity") {
      if (zone.kind === "quest") {
        return "Quest Fork";
      }
      if (zone.kind === "shrine") {
        return "Shrine Blessing";
      }
      if (zone.kind === "event") {
        return "Aftermath Node";
      }
      if (zone.kind === "boss") {
        return "Boss Gate";
      }
      if (zone.kind === "miniboss") {
        return "Pressure Route";
      }
      return "Battle Path";
    }

    switch (zone.nodeType) {
      case "shrine_opportunity":
        return "Shrine Opportunity";
      case "crossroad_opportunity":
        return "Crossroad Opportunity";
      case "reserve_opportunity":
        return "Reserve Opportunity";
      case "relay_opportunity":
        return "Relay Opportunity";
      case "culmination_opportunity":
        return "Culmination Opportunity";
      case "legacy_opportunity":
        return "Legacy Opportunity";
      case "reckoning_opportunity":
        return "Reckoning Opportunity";
      case "recovery_opportunity":
        return "Recovery Opportunity";
      case "accord_opportunity":
        return "Accord Opportunity";
      case "covenant_opportunity":
        return "Covenant Opportunity";
      default:
        return "Opportunity Chain";
    }
  }

  type OpportunityPresentationDefinition = {
    summary?: string;
    requiresQuestId?: string;
    requiresShrineId?: string;
    requiresOpportunityId?: string;
    requiresShrineOpportunityId?: string;
    requiresCrossroadOpportunityId?: string;
    requiresReserveOpportunityId?: string;
    requiresRelayOpportunityId?: string;
    requiresCulminationOpportunityId?: string;
    requiresLegacyOpportunityId?: string;
    requiresReckoningOpportunityId?: string;
    requiresRecoveryOpportunityId?: string;
    requiresAccordOpportunityId?: string;
  };

  function getOpportunityDefinition(catalog: WorldNodeCatalog | null, zone: ZoneState): OpportunityPresentationDefinition | null {
    switch (zone.nodeType) {
      case "shrine_opportunity":
        return (catalog?.shrineOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "crossroad_opportunity":
        return (catalog?.crossroadOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "reserve_opportunity":
        return (catalog?.reserveOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "relay_opportunity":
        return (catalog?.relayOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "culmination_opportunity":
        return (catalog?.culminationOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "legacy_opportunity":
        return (catalog?.legacyOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "reckoning_opportunity":
        return (catalog?.reckoningOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "recovery_opportunity":
        return (catalog?.recoveryOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "accord_opportunity":
        return (catalog?.accordOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "covenant_opportunity":
        return (catalog?.covenantOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      default:
        return (catalog?.opportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
    }
  }

  function buildConsequencePreviewLines(run: RunState): string[] {
    const questLines = Object.values(run.world?.questOutcomes || {}).map((entry) => `Quest · ${entry.title}: ${entry.outcomeTitle}.`);
    const shrineLines = Object.values(run.world?.shrineOutcomes || {}).map((entry) => `Shrine · ${entry.title}: ${entry.outcomeTitle}.`);
    const eventLines = Object.values(run.world?.eventOutcomes || {}).map((entry) => `Aftermath · ${entry.title}: ${entry.outcomeTitle}.`);
    const opportunityLines = Object.values(run.world?.opportunityOutcomes || {}).map((entry) => `Opportunity · ${entry.title}: ${entry.outcomeTitle}.`);
    const lines = [...questLines, ...shrineLines, ...eventLines, ...opportunityLines];
    return lines.length > 0 ? lines.slice(-6).reverse() : ["No route consequences are logged yet. Resolve a quest, shrine, or aftermath lane to seed this ledger."];
  }

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
      const opportunityDefinitionByType = getOpportunityDefinition(catalog, zone);
      const linkedQuestRecord = opportunityDefinitionByType?.requiresQuestId
        ? run.world?.questOutcomes?.[opportunityDefinitionByType.requiresQuestId] || null
        : null;
      const linkedShrineRecord = opportunityDefinitionByType?.requiresShrineId
        ? run.world?.shrineOutcomes?.[opportunityDefinitionByType.requiresShrineId] || null
        : null;
      const linkedOpportunityRecord = opportunityDefinitionByType?.requiresOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresOpportunityId] || null
        : null;
      const linkedShrineOpportunityRecord = opportunityDefinitionByType?.requiresShrineOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresShrineOpportunityId] || null
        : null;
      const linkedCrossroadRecord = opportunityDefinitionByType?.requiresCrossroadOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresCrossroadOpportunityId] || null
        : null;
      const linkedReserveRecord = opportunityDefinitionByType?.requiresReserveOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresReserveOpportunityId] || null
        : null;
      const linkedRelayRecord = opportunityDefinitionByType?.requiresRelayOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresRelayOpportunityId] || null
        : null;
      const linkedCulminationRecord = opportunityDefinitionByType?.requiresCulminationOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresCulminationOpportunityId] || null
        : null;
      const linkedLegacyRecord = opportunityDefinitionByType?.requiresLegacyOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresLegacyOpportunityId] || null
        : null;
      const linkedReckoningRecord = opportunityDefinitionByType?.requiresReckoningOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresReckoningOpportunityId] || null
        : null;
      const linkedRecoveryRecord = opportunityDefinitionByType?.requiresRecoveryOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresRecoveryOpportunityId] || null
        : null;
      const linkedAccordRecord = opportunityDefinitionByType?.requiresAccordOpportunityId
        ? run.world?.opportunityOutcomes?.[opportunityDefinitionByType.requiresAccordOpportunityId] || null
        : null;
      const familyLabel = getNodeFamilyLabel(zone);
      const dependencyLine =
        zone.nodeType === "shrine_opportunity"
          ? linkedShrineRecord?.outcomeTitle
            ? `Triggered by shrine blessing ${linkedShrineRecord.outcomeTitle}.`
            : "Unlocks after the act shrine resolves."
          : zone.nodeType === "crossroad_opportunity"
            ? linkedQuestRecord?.outcomeTitle && linkedShrineRecord?.outcomeTitle
              ? `Triggered by quest ${linkedQuestRecord.outcomeTitle} and shrine ${linkedShrineRecord.outcomeTitle}.`
              : "Unlocks once both the quest lane and shrine lane are resolved."
            : zone.nodeType === "reserve_opportunity"
              ? linkedOpportunityRecord?.outcomeTitle && linkedShrineOpportunityRecord?.outcomeTitle && linkedCrossroadRecord?.outcomeTitle
                ? `Triggered by ${linkedOpportunityRecord.outcomeTitle}, ${linkedShrineOpportunityRecord.outcomeTitle}, and ${linkedCrossroadRecord.outcomeTitle}.`
                : "Unlocks after the main, shrine, and crossroad opportunity lanes all resolve."
              : zone.nodeType === "relay_opportunity"
                ? linkedReserveRecord?.outcomeTitle
                  ? `Triggered by earlier reserve lane ${linkedReserveRecord.outcomeTitle}.`
                  : "Unlocks after the reserve lane resolves."
                : zone.nodeType === "culmination_opportunity"
                  ? linkedQuestRecord?.outcomeTitle && linkedRelayRecord?.outcomeTitle
                    ? `Triggered by quest ${linkedQuestRecord.outcomeTitle} and relay ${linkedRelayRecord.outcomeTitle}.`
                    : "Unlocks after the relay lane closes back into the quest chain."
                  : zone.nodeType === "legacy_opportunity"
                    ? linkedCulminationRecord?.outcomeTitle
                      ? `Triggered by culmination lane ${linkedCulminationRecord.outcomeTitle}.`
                      : "Unlocks after the culmination lane resolves."
                    : zone.nodeType === "reckoning_opportunity"
                      ? linkedReserveRecord?.outcomeTitle && linkedCulminationRecord?.outcomeTitle
                        ? `Triggered by reserve ${linkedReserveRecord.outcomeTitle} and culmination ${linkedCulminationRecord.outcomeTitle}.`
                        : "Unlocks after reserve and culmination lanes resolve together."
                      : zone.nodeType === "recovery_opportunity"
                        ? linkedShrineOpportunityRecord?.outcomeTitle && linkedCulminationRecord?.outcomeTitle
                          ? `Triggered by shrine lane ${linkedShrineOpportunityRecord.outcomeTitle} and culmination ${linkedCulminationRecord.outcomeTitle}.`
                          : "Unlocks after shrine and culmination lanes align."
                        : zone.nodeType === "accord_opportunity"
                          ? linkedShrineOpportunityRecord?.outcomeTitle && linkedCrossroadRecord?.outcomeTitle && linkedCulminationRecord?.outcomeTitle
                            ? `Triggered by shrine ${linkedShrineOpportunityRecord.outcomeTitle}, crossroad ${linkedCrossroadRecord.outcomeTitle}, and culmination ${linkedCulminationRecord.outcomeTitle}.`
                            : "Unlocks after shrine, crossroad, and culmination lanes all resolve."
                          : zone.nodeType === "covenant_opportunity"
                            ? linkedLegacyRecord?.outcomeTitle && linkedReckoningRecord?.outcomeTitle && linkedRecoveryRecord?.outcomeTitle && linkedAccordRecord?.outcomeTitle
                              ? `Triggered by legacy ${linkedLegacyRecord.outcomeTitle}, reckoning ${linkedReckoningRecord.outcomeTitle}, recovery ${linkedRecoveryRecord.outcomeTitle}, and accord ${linkedAccordRecord.outcomeTitle}.`
                              : "Unlocks after the four post-culmination lanes all resolve."
                            : linkedQuestRecord?.followUpOutcomeTitle
                              ? `Triggered by ${linkedQuestRecord.outcomeTitle} -> ${linkedQuestRecord.followUpOutcomeTitle}.`
                              : "Unlocks after the full quest and aftermath chain resolves.";

      return {
        hookLabel: opportunityRecord ? `${familyLabel} Logged` : zone.status === "available" ? `${familyLabel} Ready` : `${familyLabel} Locked`,
        summaryLine: opportunityDefinitionByType?.summary || opportunityDefinition?.summary || zone.description,
        detailLines: [
          dependencyLine,
          opportunityRecord ? `Recorded as ${opportunityRecord.outcomeTitle}.` : `${familyLabel} nodes pay off route consequences through reward instead of combat.`,
          "Late opportunity families stay inside the same map to reward loop.",
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
    const resolvedShrineCount = Object.keys(run.world?.shrineOutcomes || {}).length;
    const resolvedEventCount = Object.keys(run.world?.eventOutcomes || {}).length;
    const resolvedOpportunityCount = Object.keys(run.world?.opportunityOutcomes || {}).length;
    const unclearedBeforeBoss = currentZones.filter((zone) => zone.kind !== "boss" && !zone.cleared).length;
    const zoneTitles = Object.fromEntries(currentZones.map((zone) => [zone.id, zone.title]));
    const recommendedZone = currentZones.find((zone) => reachableZoneIds.has(zone.id) && zone.kind !== "boss") || bossZone;
    const routeFamilyLabels = Array.from(new Set(currentZones.filter((zone) => zone.kind !== "battle").map((zone) => getNodeFamilyLabel(zone))));
    const consequencePreviewLines = buildConsequencePreviewLines(run);

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
                ${buildBadge(getNodeFamilyLabel(recommendedZone), recommendedZone ? "available" : "locked")}
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
              <p>${escapeHtml(`${resolvedQuestCount} quest, ${resolvedShrineCount} shrine, ${resolvedEventCount} aftermath, and ${resolvedOpportunityCount} opportunity results already feed back into route metadata.`)}</p>
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
            <h2>Route Intel</h2>
            <p>The map now surfaces consequence state directly: what lane families exist in the act, what they have already recorded, and which late opportunity branches are still unresolved.</p>
          </div>
          <div class="feature-grid feature-grid-wide">
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Route Families</strong>
                ${buildBadge(`${routeFamilyLabels.length} tracked`, routeFamilyLabels.length > 0 ? "available" : "locked")}
              </div>
              <p>${escapeHtml(`Live families this act: ${getPreviewLabel(routeFamilyLabels, "battle routes only")}.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Consequence Ledger</strong>
                ${buildBadge(`${resolvedQuestCount + resolvedShrineCount + resolvedEventCount + resolvedOpportunityCount} logged`, resolvedOpportunityCount > 0 ? "available" : "locked")}
              </div>
              ${services.renderUtils.buildStringList(consequencePreviewLines, "log-list reward-list ledger-list")}
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Opportunity Lanes</strong>
                ${buildBadge(`${resolvedOpportunityCount} resolved`, resolvedOpportunityCount > 0 ? "available" : "locked")}
              </div>
              <p>${escapeHtml(`${currentZones.filter((zone) => zone.kind === "opportunity").length} opportunity nodes are authored on this act map, including late convergence families.`)}</p>
            </article>
            <article class="feature-card">
              <div class="entity-name-row">
                <strong>Quest And Shrine State</strong>
                ${buildBadge(`${resolvedQuestCount + resolvedShrineCount} recorded`, resolvedQuestCount + resolvedShrineCount > 0 ? "available" : "locked")}
              </div>
              <p>${escapeHtml(`${resolvedQuestCount} quest, ${resolvedShrineCount} shrine, and ${resolvedEventCount} aftermath results are already informing route unlocks.`)}</p>
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
              <p>Main and shrine opportunities pay off early side lanes while preserving the same reward resolution surface.</p>
            </article>
            <article class="feature-card">
              <strong>Convergence Lanes</strong>
              <p>Crossroad, reserve, relay, and culmination nodes explicitly call out when multiple earlier lanes are feeding one new route decision.</p>
            </article>
            <article class="feature-card">
              <strong>Post-Culmination Lanes</strong>
              <p>Legacy, reckoning, recovery, and accord now read as parallel late routes instead of generic opportunity cards.</p>
            </article>
            <article class="feature-card">
              <strong>Covenant Node</strong>
              <p>Covenant is the final convergence lane, and the map keeps its dependency chain visible before you click into it.</p>
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
