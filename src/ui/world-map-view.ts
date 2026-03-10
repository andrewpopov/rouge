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
      case "detour_opportunity":
        return "Detour Opportunity";
      case "escalation_opportunity":
        return "Escalation Opportunity";
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
    requiresCovenantOpportunityId?: string;
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
      case "detour_opportunity":
        return (catalog?.detourOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      case "escalation_opportunity":
        return (catalog?.escalationOpportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
      default:
        return (catalog?.opportunities?.[zone.actNumber] as OpportunityPresentationDefinition | undefined) || null;
    }
  }

  function buildConsequencePreviewLines(run: RunState): string[] {
    const questLines = Object.values(run.world?.questOutcomes || {}).map((entry) => `Quest \u00b7 ${entry.title}: ${entry.outcomeTitle}.`);
    const shrineLines = Object.values(run.world?.shrineOutcomes || {}).map((entry) => `Shrine \u00b7 ${entry.title}: ${entry.outcomeTitle}.`);
    const eventLines = Object.values(run.world?.eventOutcomes || {}).map((entry) => `Aftermath \u00b7 ${entry.title}: ${entry.outcomeTitle}.`);
    const opportunityLines = Object.values(run.world?.opportunityOutcomes || {}).map((entry) => `Opportunity \u00b7 ${entry.title}: ${entry.outcomeTitle}.`);
    const lines = [...questLines, ...shrineLines, ...eventLines, ...opportunityLines];
    return lines.length > 0 ? lines.slice(-6).reverse() : ["No route consequences are logged yet. Resolve a quest, shrine, or aftermath lane to seed this ledger."];
  }

  const ZONE_KIND_ICONS: Record<string, string> = {
    battle: "\u2694",
    miniboss: "\u2620",
    quest: "\u2753",
    shrine: "\u2728",
    event: "\u26A0",
    boss: "\u{1F480}",
    opportunity: "\u2726",
  };

  function getActMapFilename(actNumber: number): string {
    const names: Record<number, string> = {
      1: "act1-the-sightless-eye",
      2: "act2-the-secret-of-the-vizjerei",
      3: "act3-the-infernal-gate",
      4: "act4-the-harrowing",
      5: "act5-lord-of-destruction",
    };
    return names[actNumber] || names[1];
  }

  function buildZoneCard(zone: ZoneState, reachable: boolean, escapeHtml: (s: string) => string): string {
    const icon = ZONE_KIND_ICONS[zone.kind] || "\u2694";
    const statusClass =
      zone.status === "cleared" ? "zone-card--cleared"
        : zone.status === "available" && reachable ? "zone-card--available"
        : "zone-card--locked";
    const familyLabel = getNodeFamilyLabel(zone);
    const progressText = zone.encounterTotal > 0
      ? `${zone.encountersCleared}/${zone.encounterTotal}`
      : "";

    return `
      <button class="zone-card ${statusClass}"
              data-action="select-zone" data-zone-id="${escapeHtml(zone.id)}"
              ${zone.status === "locked" ? "" : ""}>
        <div class="zone-card__icon">${icon}</div>
        <div class="zone-card__name">${escapeHtml(zone.title)}</div>
        <div class="zone-card__family">${escapeHtml(familyLabel)}</div>
        ${progressText ? `<div class="zone-card__progress">${progressText}</div>` : ""}
        <div class="zone-card__status">
          ${zone.status === "cleared" ? "\u2713 Cleared"
            : zone.status === "available" ? "Enter \u2192"
            : "\u{1F512} Locked"}
        </div>
      </button>
    `;
  }

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
      const familyLabel = getNodeFamilyLabel(zone);

      return {
        hookLabel: opportunityRecord ? `${familyLabel} Logged` : zone.status === "available" ? `${familyLabel} Ready` : `${familyLabel} Locked`,
        summaryLine: opportunityDefinitionByType?.summary || opportunityDefinition?.summary || zone.description,
        detailLines: [
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
    const unclearedBeforeBoss = currentZones.filter((zone) => zone.kind !== "boss" && !zone.cleared).length;
    const consequencePreviewLines = buildConsequencePreviewLines(run);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const zoneTitles = Object.fromEntries(currentZones.map((zone) => [zone.id, zone.title]));

    const actMapFile = getActMapFilename(run.actNumber);
    const availableZones = currentZones.filter((zone) => reachableZoneIds.has(zone.id) && zone.status === "available");
    const clearedZonesList = currentZones.filter((zone) => zone.cleared);
    const lockedZones = currentZones.filter((zone) => zone.status === "locked");

    // Zone progression nodes for the path visualization
    const pathNodes = currentZones.map((zone) => {
      const reachable = reachableZoneIds.has(zone.id);
      const icon = ZONE_KIND_ICONS[zone.kind] || "\u2694";
      const statusClass =
        zone.status === "cleared" ? "path-node--cleared"
          : zone.status === "available" && reachable ? "path-node--available"
          : "path-node--locked";
      return `
        <div class="path-node ${statusClass}" title="${escapeHtml(zone.title)} \u2014 ${escapeHtml(getNodeFamilyLabel(zone))}">
          <span class="path-node__icon">${icon}</span>
        </div>
      `;
    }).join(`<span class="path-connector"></span>`);

    // Available zone choice cards
    const choiceCards = availableZones.length > 0
      ? availableZones.map((zone) => buildZoneCard(zone, true, escapeHtml)).join("")
      : `<p class="worldmap-empty">No zones are currently available. ${bossZone && bossZone.status === "available" ? "The boss gate is open." : "Clear prerequisites to unlock more routes."}</p>`;

    // Boss card (separate if available)
    const bossCard = bossZone && bossZone.status === "available" && !availableZones.find((z) => z.id === bossZone.id)
      ? buildZoneCard(bossZone, true, escapeHtml)
      : "";

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="worldmap-screen">
        <div class="worldmap-header">
          <div class="worldmap-header__title">
            <span class="worldmap-header__eyebrow">World Map</span>
            <h1 class="worldmap-header__act">${escapeHtml(run.actTitle)}</h1>
          </div>
          <div class="worldmap-header__stats">
            <span>${escapeHtml(run.className)} Lv.${run.level}</span>
            <span>\u00b7</span>
            <span>HP ${run.hero.currentLife}/${run.hero.maxLife}</span>
            <span>\u00b7</span>
            <span>${run.gold}g</span>
          </div>
        </div>

        <div class="worldmap-atlas">
          <img class="worldmap-atlas__img"
               src="./assets/curated/act-maps/${actMapFile}.png"
               alt="${escapeHtml(run.actTitle)} progression map"
               draggable="false"
               onerror="this.style.display='none'" />
        </div>

        <div class="worldmap-progress">
          <div class="worldmap-progress__bar">
            <div class="worldmap-progress__fill" style="width:${currentZones.length > 0 ? Math.round((clearedZones / currentZones.length) * 100) : 0}%"></div>
          </div>
          <span class="worldmap-progress__label">${clearedZones}/${currentZones.length} zones cleared</span>
        </div>

        <div class="worldmap-path">
          ${pathNodes}
        </div>

        <div class="worldmap-choices">
          <h2 class="worldmap-choices__heading">Choose Your Path</h2>
          <div class="worldmap-choices__grid">
            ${choiceCards}
            ${bossCard}
          </div>
        </div>

        <div class="worldmap-retreat">
          <button class="merchant-leave" data-action="return-safe-zone">
            <span class="merchant-leave__arrow">\u2190</span> Return to ${escapeHtml(run.safeZoneName)}
          </button>
        </div>
      </div>

      <details class="town-operations-details">
        <summary class="town-operations-toggle">Route Details</summary>
        <section class="safe-zone-grid">
          ${common.renderRunStatus(run, "World Map", services.renderUtils)}
          ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
            copy:
              "The map keeps the same account-meta board visible while you route through combat and ledger nodes, so archive pressure and charter or mastery or convergence pressure stay legible beside route pressure.",
          })}
          ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
            copy:
              "The map now keeps the pinned charter slots and next convergence lane readable beside route pressure, so a route choice can still be weighed against account-side follow-through.",
            charterFollowThrough:
              "If charter pressure outranks the next node, retreat to town with this route state intact and use the pinned slot targets to decide what to fix first.",
            convergenceFollowThrough:
              "If convergence pressure is ready, treat the next route click as optional and reopen the account-side review before committing deeper into the act.",
          })}
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
        </section>
      </details>
    `;
  }

  runtimeWindow.ROUGE_WORLD_MAP_VIEW = {
    render,
  };
})();
