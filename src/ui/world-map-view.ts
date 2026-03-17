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
      // Mainline (left→right across the middle)
      "town":              [7, 44],
      "Blood Moor":        [19, 44],
      "Cold Plains":       [33, 44],
      "Stony Field":       [46, 44],
      "The Underground Passage": [58, 44],
      "Dark Wood":         [72, 44],
      "Black Marsh":       [86, 44],
      // Monastery wrap (right→left along bottom)
      "Tamoe Highland":    [93, 68],
      "Outer Cloister":    [80, 82],
      "Barracks":          [64, 80],
      "Jail":              [50, 80],
      "Inner Cloister":    [37, 80],
      "Cathedral":         [25, 80],
      "Catacombs":         [10, 80],
      // Side branches (upper row, spaced well apart)
      "Den of Evil":       [18, 25],
      "Burial Grounds":    [34, 20],
      "Tristram":          [51, 24],
      "Forgotten Tower":   [80, 24],
    },
    2: {
      // Mainline (left→right across the middle)
      "town":              [6, 46],
      "Rocky Waste":       [19, 46],
      "Dry Hills":         [32, 46],
      "Far Oasis":         [47, 46],
      "Lost City":         [62, 46],
      "Valley of Snakes":  [78, 46],
      // Monastery-style wrap (left→right along bottom)
      "Harem":             [14, 78],
      "The Palace Cellar": [28, 78],
      "Arcane Sanctuary":  [42, 78],
      "Canyon of the Magi": [56, 78],
      "Tal Rasha's Tomb":  [72, 78],
      "Tal Rasha's Chamber": [72, 86],
      // Side branches (upper row)
      "Sewers":            [16, 18],
      "Halls of the Dead": [38, 17],
      "Maggot Lair":       [56, 24],
      "Lost Reliquary":    [82, 22],
    },
    3: {
      // Upper mainline (left→right)
      "town":              [7, 38],
      "Spider Forest":     [24, 38],
      "Great Marsh":       [42, 28],
      "Flayer Jungle":     [60, 38],
      "Lower Kurast":      [78, 38],
      // Lower mainline (right→left)
      "Kurast Bazaar":     [72, 72],
      "Upper Kurast":      [52, 72],
      "Kurast Causeway":   [35, 72],
      "Travincal":         [20, 72],
      "Durance of Hate":   [7, 74],
      // Side branches
      "Spider Cavern":     [24, 14],
      "Flayer Dungeon":    [62, 13],
      "Kurast Sewers":     [55, 82],
    },
    4: {
      // Single row (left→right)
      "town":              [8, 65],
      "Outer Steppes":     [24, 65],
      "Plains of Despair": [40, 65],
      "City of the Damned": [56, 65],
      "River of Flame":    [74, 65],
      "Chaos Sanctuary":   [92, 65],
    },
    5: {
      // Top row (left→right)
      "town":              [6, 26],
      "Bloody Foothills":  [22, 26],
      "Frigid Highlands":  [42, 26],
      "Arreat Plateau":    [62, 26],
      "Crystalline Passage": [84, 26],
      // Bottom row (right→left)
      "Glacial Trail":     [90, 66],
      "Frozen Tundra":     [58, 72],
      "The Ancients' Way": [32, 72],
      "Arreat Summit":     [10, 72],
      // Lowest row (left→right)
      "Worldstone Keep":   [24, 90],
      "Throne of Destruction": [48, 90],
      "The Worldstone Chamber": [72, 88],
      // Side branches
      "Nihlathak's Temple": [16, 48],
      "Frozen River":      [84, 16],
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
        if (positions.has(zone.id)) { continue; }
        const parentId = (zone.prerequisites || [])[0];
        const parentPos = parentId ? positions.get(parentId) : null;
        if (parentPos) {
          let yOffset: number;
          if (zone.kind === "quest") {
            yOffset = 18;
          } else if (zone.kind === "event") {
            yOffset = 82;
          } else {
            yOffset = parentPos[1] - 15;
          }
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
        let cls: string;
        if (opening.status === "cleared") {
          cls = "edge--cleared";
        } else if (opening.status === "available") {
          cls = "edge--active";
        } else {
          cls = "edge--locked";
        }
        lines.push(`<line x1="${fp[0]}%" y1="${fp[1]}%" x2="${tp[0]}%" y2="${tp[1]}%" class="map-edge ${cls}" />`);
      }
    }

    // Every zone draws edges from its prerequisites
    for (const zone of zones) {
      const tp = positions.get(zone.id);
      if (!tp) { continue; }
      for (const prereqId of zone.prerequisites || []) {
        const prereq = zoneById.get(prereqId);
        const fp = positions.get(prereqId);
        if (!fp || !prereq) { continue; }

        const bothCleared = prereq.status === "cleared" && zone.status === "cleared";
        const active = prereq.status === "cleared" && zone.status === "available";
        let cls: string;
        if (bothCleared) {
          cls = "edge--cleared";
        } else if (active) {
          cls = "edge--active";
        } else {
          cls = "edge--locked";
        }

        lines.push(`<line x1="${fp[0]}%" y1="${fp[1]}%" x2="${tp[0]}%" y2="${tp[1]}%" class="map-edge ${cls}" />`);
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
    if (!pos) { return ""; }

    const icon = ZONE_KIND_ICONS[zone.kind] || "\u2694";
    let statusClass = "waypoint--locked";
    if (zone.status === "cleared") {
      statusClass = "waypoint--cleared";
    } else if (zone.status === "available" && reachable) {
      statusClass = "waypoint--available";
    }

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
    if (!zone) {return "Route";}
    if (zone.kind === "quest") {return "Quest Fork";}
    if (zone.kind === "shrine") {return "Shrine Blessing";}
    if (zone.kind === "event") {return "Aftermath Node";}
    if (zone.kind === "boss") {return "Boss Gate";}
    if (zone.kind === "miniboss") {return "Pressure Route";}
    if (zone.kind === "opportunity") {return "Opportunity";}
    return "Battle Path";
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const currentZones = services.runFactory.getCurrentZones(run);
    const reachableZoneIds = new Set(services.runFactory.getReachableZones(run).map((z) => z.id));
    const clearedCount = currentZones.filter((z) => z.cleared).length;

    // Filter out shrines, opportunities, events, and unmapped zones
    const mapZones = currentZones.filter(
      (z) => z.kind !== "shrine" && z.kind !== "opportunity" && z.kind !== "event"
    );

    const actMapFile = getActMapFilename(run.actNumber);
    const positions = computePositions(mapZones, run.actNumber);

    // Town waypoint (always shown, always cleared)
    const townPos = positions.get("town") || [7, 44];
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

          <svg class="actmap__edges">
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
