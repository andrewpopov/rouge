/* eslint-disable no-nested-ternary */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ZONE_KIND_ICONS: Record<string, string> = {
    battle: "\u2694",
    miniboss: "\u2620",
    quest: "\u2753",
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

  /**
   * Per-act position maps measured from the background images.
   * Each key is the zone title; value is [x%, y%].
   */
  const ACT_POSITIONS: Record<number, Record<string, [number, number]>> = {
    1: {
      "town":              [6.4, 51],
      "Blood Moor":        [19.2, 51],
      "Cold Plains":       [33.4, 51],
      "Stony Field":       [47.4, 51],
      "The Underground Passage": [61.7, 51],
      "Dark Wood":         [76.2, 51],
      "Black Marsh":       [91.6, 51],
      "Tamoe Highland":    [94.7, 69],
      "Outer Cloister":    [77, 86],
      "Barracks":          [62.4, 84],
      "Jail":              [48.9, 84],
      "Inner Cloister":    [33.9, 84],
      "Cathedral":         [21.2, 84],
      "Catacombs":         [6.7, 87],
      "Den of Evil":       [18.7, 17],
      "Burial Grounds":    [33.2, 14],
      "Tristram":          [47.2, 14],
      "Forgotten Tower":   [90.7, 20],
    },
  };

  /**
   * Look up measured positions for each zone, falling back to
   * dynamic layout for acts without measured data.
   */
  function computePositions(zones: ZoneState[], actNumber: number): Map<string, [number, number]> {
    const positions = new Map<string, [number, number]>();
    const measured = ACT_POSITIONS[actNumber];

    if (measured) {
      // Use measured town position
      positions.set("town", measured["town"] || [4, 50]);

      // Match zones by title
      for (const zone of zones) {
        const pos = measured[zone.title];
        if (pos) {
          positions.set(zone.id, pos);
        }
      }

      // Any zone without a measured position gets placed near its prerequisite
      for (const zone of zones) {
        if (positions.has(zone.id)) continue;
        const parentId = (zone.prerequisites || [])[0];
        const parentPos = parentId ? positions.get(parentId) : null;
        if (parentPos) {
          const yOffset = zone.kind === "quest" ? 18 : zone.kind === "event" ? 82 : parentPos[1] - 15;
          positions.set(zone.id, [Math.min(parentPos[0] + 4, 94), yOffset]);
        }
      }
      return positions;
    }

    // Fallback: dynamic layout for acts without measured data
    const mainline = zones.filter((z) => z.zoneRole === "opening" || (z.zoneRole || "").startsWith("mainline_"));
    const boss = zones.find((z) => z.kind === "boss");
    const sides = zones.filter((z) => (z.zoneRole || "").startsWith("side_"));
    const worldNodes = zones.filter((z) => z.kind === "quest" || z.kind === "event");

    positions.set("town", [4, 50]);

    const mainCount = mainline.length;
    for (let i = 0; i < mainCount; i++) {
      const x = 12 + (i / Math.max(mainCount - 1, 1)) * 76;
      positions.set(mainline[i].id, [Math.round(x), 50]);
    }

    if (boss) {
      positions.set(boss.id, [96, 50]);
    }

    const mainlineById = new Map(mainline.map((z) => [z.id, z]));
    for (const side of sides) {
      const parentId = (side.prerequisites || []).find((pid) => mainlineById.has(pid));
      const parentPos = parentId ? positions.get(parentId) : null;
      if (parentPos) {
        positions.set(side.id, [parentPos[0], 18]);
      }
    }

    for (const wn of worldNodes) {
      const parentId = (wn.prerequisites || [])[0];
      const parentPos = parentId ? positions.get(parentId) : null;
      if (parentPos) {
        const yOffset = wn.kind === "quest" ? 18 : 82;
        positions.set(wn.id, [Math.min(parentPos[0] + 4, 94), yOffset]);
      }
    }

    return positions;
  }

  /**
   * Build SVG edge paths connecting zones based on prerequisite chains.
   * Each zone draws an edge from each of its prerequisites.
   */
  function buildSvgEdges(zones: ZoneState[], positions: Map<string, [number, number]>): string {
    const zoneById = new Map(zones.map((z) => [z.id, z]));
    const lines: string[] = [];

    // Town → opening edge
    const opening = zones.find((z) => z.zoneRole === "opening");
    if (opening) {
      const fp = positions.get("town");
      const tp = positions.get(opening.id);
      if (fp && tp) {
        const cls = opening.status === "cleared" ? "edge--cleared" : opening.status === "available" ? "edge--active" : "edge--locked";
        lines.push(`<line x1="${fp[0]}" y1="${fp[1]}" x2="${tp[0]}" y2="${tp[1]}" class="map-edge ${cls}" />`);
      }
    }

    // Every zone draws edges from its prerequisites
    for (const zone of zones) {
      const tp = positions.get(zone.id);
      if (!tp) continue;
      for (const prereqId of zone.prerequisites || []) {
        const prereq = zoneById.get(prereqId);
        const fp = positions.get(prereqId);
        if (!fp || !prereq) continue;

        const bothCleared = prereq.status === "cleared" && zone.status === "cleared";
        const active = prereq.status === "cleared" && zone.status === "available";
        const cls = bothCleared ? "edge--cleared" : active ? "edge--active" : "edge--locked";

        // Use curves for vertical connections, straight lines for horizontal
        if (Math.abs(fp[1] - tp[1]) > 10) {
          const mx = (fp[0] + tp[0]) / 2;
          lines.push(`<path d="M ${fp[0]} ${fp[1]} C ${mx} ${fp[1]}, ${mx} ${tp[1]}, ${tp[0]} ${tp[1]}" class="map-edge ${cls}" />`);
        } else {
          lines.push(`<line x1="${fp[0]}" y1="${fp[1]}" x2="${tp[0]}" y2="${tp[1]}" class="map-edge ${cls}" />`);
        }
      }
    }
    return lines.join("");
  }

  function buildWaypointNode(
    zone: ZoneState,
    reachable: boolean,
    escapeHtml: (s: string) => string,
    positions: Map<string, [number, number]>
  ): string {
    const pos = positions.get(zone.id);
    if (!pos) return "";

    const icon = ZONE_KIND_ICONS[zone.kind] || "\u2694";
    const statusClass =
      zone.status === "cleared" ? "waypoint--cleared"
        : zone.status === "available" && reachable ? "waypoint--available"
        : "waypoint--locked";

    const canClick = zone.status === "available" && reachable;
    const tag = canClick ? "button" : "div";
    const action = canClick ? `data-action="select-zone" data-zone-id="${escapeHtml(zone.id)}"` : "";

    return `
      <${tag} class="waypoint ${statusClass}" ${action}
           style="left:${pos[0]}%;top:${pos[1]}%">
        <span class="waypoint__icon">${icon}</span>
        <span class="waypoint__label">${escapeHtml(zone.title)}</span>
        ${zone.status === "cleared" ? `<span class="waypoint__check">\u2713</span>` : ""}
        ${zone.encounterTotal > 0 && zone.status !== "cleared"
          ? `<span class="waypoint__progress">${zone.encountersCleared}/${zone.encounterTotal}</span>`
          : ""}
      </${tag}>
    `;
  }

  function getNodeFamilyLabel(zone: ZoneState | null): string {
    if (!zone) return "Route";
    if (zone.kind === "quest") return "Quest Fork";
    if (zone.kind === "shrine") return "Shrine Blessing";
    if (zone.kind === "event") return "Aftermath Node";
    if (zone.kind === "boss") return "Boss Gate";
    if (zone.kind === "miniboss") return "Pressure Route";
    if (zone.kind === "opportunity") return "Opportunity";
    return "Battle Path";
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const currentZones = services.runFactory.getCurrentZones(run);
    const reachableZoneIds = new Set(services.runFactory.getReachableZones(run).map((z) => z.id));
    const clearedCount = currentZones.filter((z) => z.cleared).length;

    // Filter out shrines, opportunities, and events -- only show combat + quest + boss
    const mapZones = currentZones.filter(
      (z) => z.kind !== "shrine" && z.kind !== "opportunity" && z.kind !== "event"
    );

    const actMapFile = getActMapFilename(run.actNumber);
    const positions = computePositions(mapZones, run.actNumber);

    // Town waypoint (always shown, always cleared)
    const townPos = positions.get("town") || [6.4, 53];
    const townWaypoint = `
      <div class="waypoint waypoint--town" style="left:${townPos[0]}%;top:${townPos[1]}%">
        <span class="waypoint__icon">\u{1F3E0}</span>
        <span class="waypoint__label">${escapeHtml(run.safeZoneName)}</span>
      </div>
    `;

    const waypoints = mapZones.map((z) => buildWaypointNode(z, reachableZoneIds.has(z.id), escapeHtml, positions)).join("");
    const edges = buildSvgEdges(mapZones, positions);
    const accountSummary = services.appEngine.getAccountProgressSummary(appState);
    const zoneTitles = Object.fromEntries(currentZones.map((zone) => [zone.id, zone.title]));

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="actmap">
        <div class="actmap__hud">
          <div class="actmap__title">
            <span class="actmap__eyebrow">Act ${run.actNumber}</span>
            <h1 class="actmap__name">${escapeHtml(run.actTitle)}</h1>
          </div>
          <div class="actmap__stats">
            <span>${escapeHtml(run.className)} Lv.${run.level}</span>
            <span class="actmap__sep">\u00b7</span>
            <span>HP ${run.hero.currentLife}/${run.hero.maxLife}</span>
            <span class="actmap__sep">\u00b7</span>
            <span>${run.gold}g</span>
          </div>
        </div>

        <div class="actmap__canvas">
          <img class="actmap__bg"
               src="./assets/curated/act-maps/${actMapFile}.png"
               alt="${escapeHtml(run.actTitle)}"
               draggable="false" />

          <svg class="actmap__edges" viewBox="0 0 100 100" preserveAspectRatio="none">
            ${edges}
          </svg>

          ${townWaypoint}
          ${waypoints}

          <div class="actmap__progress">
            <div class="actmap__progress-fill" style="width:${currentZones.length > 0 ? Math.round((clearedCount / currentZones.length) * 100) : 0}%"></div>
          </div>
        </div>

        <div class="actmap__actions">
          <button class="actmap__retreat" data-action="return-safe-zone">
            \u2190 Return to ${escapeHtml(run.safeZoneName)}
          </button>
        </div>
      </div>

      <details class="town-operations-details">
        <summary class="town-operations-toggle">Route Details</summary>
        <section class="safe-zone-grid">
          ${common.renderRunStatus(run, "World Map", services.renderUtils)}
          ${common.buildAccountMetaContinuityMarkup(appState, accountSummary, services.renderUtils, {
            copy: "Account meta board beside route pressure.",
          })}
          ${common.buildAccountMetaDrilldownMarkup(appState, accountSummary, services.renderUtils, {
            copy: "Charter and convergence details.",
            charterFollowThrough: "Charter pressure context for route decisions.",
            convergenceFollowThrough: "Convergence pressure context for route decisions.",
          })}
          <section class="panel flow-panel">
            <div class="panel-head">
              <h2>Route Atlas</h2>
              <p>Zone details and prerequisite chains.</p>
            </div>
            <div class="map-grid">
              ${currentZones
                .map((zone) => {
                  const reachable = reachableZoneIds.has(zone.id);
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
                    hookLabel: getNodeFamilyLabel(zone),
                    summaryLine: zone.description,
                    detailLines: [],
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
