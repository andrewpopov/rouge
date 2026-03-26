(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

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
      // Side branches (directly above their parent mainline zone)
      "Den of Evil":       [19, 18],
      "Burial Grounds":    [33, 18],
      "Tristram":          [46, 18],
      "Forgotten Tower":   [86, 18],
    },
    2: {
      // Mainline (left→right across the middle)
      "town":              [8, 46],
      "Rocky Waste":       [22, 46],
      "Dry Hills":         [34, 46],
      "Far Oasis":         [47, 46],
      "Lost City":         [63, 46],
      "Valley of Snakes":  [79, 46],
      // Monastery-style wrap (left→right along bottom)
      "Harem":             [16, 76],
      "The Palace Cellar": [30, 76],
      "Arcane Sanctuary":  [44, 76],
      "Canyon of the Magi": [59, 76],
      "Tal Rasha's Tomb":  [76, 76],
      "Tal Rasha's Chamber": [90, 76],
      // Side branches (upper row)
      "Sewers":            [8, 16],
      "Halls of the Dead": [38, 18],
      "Maggot Lair":       [56, 22],
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
      "Kurast Sewers":     [62, 86],
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
      "Frozen River":        [84, 10],
      "Drifter Cavern":      [90, 50],
      // Nihlathak's Temple chain (from Harrogath, gated by Frozen River)
      "Nihlathak's Temple":  [22, 48],
      "Halls of Anguish":    [42, 48],
      "Halls of Pain":       [62, 48],
      "Halls of Vaught":     [82, 48],
    },
  };

  /**
   * Zones whose map edge should originate from town rather than from
   * their prerequisite (thematically the player returns to town first).
   */
  const TOWN_EDGE_ZONES: Record<number, Set<string>> = {
    2: new Set(["Harem", "Sewers"]),
    5: new Set(["Nihlathak's Temple"]),
  };

  /**
   * Gate-only prerequisite edges that should not be drawn visually.
   * Key = zone title, value = set of prerequisite zone titles to skip drawing.
   * The prerequisite still gates entry; we just don't draw the line.
   */
  const HIDDEN_EDGES: Record<string, Set<string>> = {
    "Tristram": new Set(["Dark Wood"]),
    "Nihlathak's Temple": new Set(["Frozen River"]),
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
          if (zone.kind === ZONE_KIND.QUEST) {
            yOffset = 18;
          } else if (zone.kind === ZONE_KIND.EVENT) {
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
    const boss = zones.find((z) => z.kind === ZONE_KIND.BOSS);
    const sides = zones.filter((z) => (z.zoneRole || "").startsWith("side_"));
    const worldNodes = zones.filter((z) => z.kind === ZONE_KIND.QUEST || z.kind === ZONE_KIND.EVENT);

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
        const yOffset = wn.kind === ZONE_KIND.QUEST ? 18 : 82;
        positions.set(wn.id, [Math.min(parentPos[0] + 4, 94), yOffset]);
      }
    }

    return positions;
  }

  /**
   * Build SVG edge paths connecting zones based on prerequisite chains.
   * Each zone draws an edge from each of its prerequisites.
   */
  function buildSvgEdges(zones: ZoneState[], positions: Map<string, [number, number]>, actNumber: number): string {
    const zoneById = new Map(zones.map((z) => [z.id, z]));
    const townEdgeSet = TOWN_EDGE_ZONES[actNumber];
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

      // Zones in TOWN_EDGE_ZONES draw their edge from town instead of prerequisite
      if (townEdgeSet?.has(zone.title)) {
        const fp = positions.get("town");
        if (fp) {
          const allPrereqsCleared = (zone.prerequisites || []).every((pid) => zoneById.get(pid)?.status === "cleared");
          const active = allPrereqsCleared && zone.status === "available";
          const bothCleared = allPrereqsCleared && zone.status === "cleared";
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
        continue;
      }

      const hiddenSet = HIDDEN_EDGES[zone.title];
      for (const prereqId of zone.prerequisites || []) {
        const prereq = zoneById.get(prereqId);
        const fp = positions.get(prereqId);
        if (!fp || !prereq) { continue; }

        // Skip gate-only edges that shouldn't be drawn visually
        if (hiddenSet?.has(prereq.title)) { continue; }

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
    const ariaLabel = !canClick ? `aria-label="${escapeHtml(zone.title)} — ${zone.status === "cleared" ? "cleared" : "locked"}"` : "";

    const kindClass = zone.kind !== "battle" ? `waypoint--${zone.kind}` : "";

    return `
      <${tag} class="waypoint ${statusClass} ${kindClass}" ${action} ${ariaLabel}
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
    if (zone.kind === ZONE_KIND.QUEST) {return "Quest Fork";}
    if (zone.kind === ZONE_KIND.SHRINE) {return "Shrine Blessing";}
    if (zone.kind === ZONE_KIND.EVENT) {return "Aftermath Node";}
    if (zone.kind === ZONE_KIND.BOSS) {return "Boss Gate";}
    if (zone.kind === ZONE_KIND.MINIBOSS) {return "Pressure Route";}
    if (zone.kind === ZONE_KIND.OPPORTUNITY) {return "Opportunity";}
    return "Battle Path";
  }

  function buildBriefingStat(label: string, value: string | number, escapeHtml: (s: string) => string): string {
    return `
      <div class="actmap__briefing-stat">
        <span class="actmap__briefing-stat-label">${escapeHtml(label)}</span>
        <strong class="actmap__briefing-stat-value">${escapeHtml(String(value))}</strong>
      </div>
    `;
  }

  function deriveWorldMapModel(appState: AppState, services: UiRenderServices) {
    const run = appState.run;
    const currentZones = services.runFactory.getCurrentZones(run);
    const reachableZoneIds = new Set(services.runFactory.getReachableZones(run).map((z) => z.id));
    const clearedCount = currentZones.filter((z) => z.cleared).length;
    const mapZones = currentZones.filter(
      (z) => z.kind !== ZONE_KIND.QUEST && z.kind !== ZONE_KIND.SHRINE && z.kind !== ZONE_KIND.OPPORTUNITY && z.kind !== ZONE_KIND.EVENT
    );
    const actMapFile = getActMapFilename(run.actNumber);
    const positions = computePositions(mapZones, run.actNumber);
    const zoneTitles = Object.fromEntries(currentZones.map((zone) => [zone.id, zone.title]));
    const scrollOpen = appState.ui?.scrollMapOpen;
    const routeIntelOpen = appState.ui?.routeIntelOpen;
    const progressPct = currentZones.length > 0 ? Math.round((clearedCount / currentZones.length) * 100) : 0;
    const availableZones = currentZones.filter((zone) => zone.status === "available");
    const reachableAvailableZones = currentZones.filter((zone) => zone.status === "available" && reachableZoneIds.has(zone.id));
    const nextZone = reachableAvailableZones[0] || availableZones[0] || null;
    const specialKinds = new Set<string>([ZONE_KIND.QUEST, ZONE_KIND.SHRINE, ZONE_KIND.EVENT, ZONE_KIND.OPPORTUNITY]);
    const resolvedSpecialNodes = currentZones.filter((zone) =>
      specialKinds.has(zone.kind) && zone.status === "cleared"
    ).length;
    const branchCount = currentZones.filter((zone) => specialKinds.has(zone.kind)).length;
    const battleRoutesCleared = currentZones.filter((zone) => zone.kind === ZONE_KIND.BATTLE && zone.status === "cleared").length;
    const atlasZones = currentZones.filter((zone) =>
      zone.kind !== ZONE_KIND.BATTLE || zone.status === "available" || zone.zoneRole === "opening"
    );
    const atlasCards = atlasZones
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
      .join("");

    return {
      run, currentZones, reachableZoneIds, clearedCount,
      mapZones, actMapFile, positions,
      zoneTitles, scrollOpen, routeIntelOpen, progressPct,
      availableZones, reachableAvailableZones, nextZone,
      resolvedSpecialNodes, branchCount, battleRoutesCleared, atlasCards,
    };
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const vm = deriveWorldMapModel(appState, services);
    const {
      run, reachableZoneIds, mapZones, actMapFile, positions, scrollOpen, routeIntelOpen, progressPct,
      availableZones, reachableAvailableZones, nextZone, resolvedSpecialNodes, branchCount, battleRoutesCleared, atlasCards,
    } = vm;

    const townPos = positions.get("town") || [8, 44];
    const townWaypoint = `
      <div class="waypoint waypoint--town" style="left:${townPos[0]}%;top:${townPos[1]}%">
        <span class="waypoint__icon">\u{1F3E0}</span>
        <span class="waypoint__label">${escapeHtml(run.safeZoneName)}</span>
      </div>
    `;

    const waypoints = mapZones.map((z) => buildWaypointNode(z, reachableZoneIds.has(z.id), escapeHtml, positions)).join("");
    const edges = buildSvgEdges(mapZones, positions, run.actNumber);
    const nextZoneLabel = nextZone ? nextZone.title : "No route currently open";
    const nextZoneFamily = getNodeFamilyLabel(nextZone);
    const nextZoneStatus = nextZone
      ? nextZone.status === "available"
        ? nextZone.encountersCleared > 0 && !nextZone.cleared ? "Continue Route" : "Enter Route"
        : "Resolved"
      : "Awaiting route state";
    const openRouteCount = reachableAvailableZones.length;

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="actmap">
        <div class="actmap__shell">
          <div class="actmap__hud">
            <div class="actmap__title">
              <span class="actmap__eyebrow">Act ${run.actNumber} Campaign Board</span>
              <h1 class="actmap__name">${escapeHtml(run.actTitle)}</h1>
              <p class="actmap__intro">The fire is behind you now. Choose which blood-soaked trail deserves the next march.</p>
            </div>
            <div class="actmap__stats">
              <div class="actmap__stat-pill">
                <span class="actmap__stat-label">Bloodline</span>
                <strong class="actmap__stat-value">${escapeHtml(run.className)} Lv.${run.level}</strong>
              </div>
              <div class="actmap__stat-pill">
                <span class="actmap__stat-label">Vitality</span>
                <strong class="actmap__stat-value">HP ${run.hero.currentLife}/${run.hero.maxLife}</strong>
              </div>
              <div class="actmap__stat-pill">
                <span class="actmap__stat-label">Treasury</span>
                <strong class="actmap__stat-value">${run.gold}g</strong>
              </div>
              <div class="actmap__stat-pill">
                <span class="actmap__stat-label">Act Progress</span>
                <strong class="actmap__stat-value">${progressPct}%</strong>
              </div>
            </div>
          </div>

          <div class="actmap__layout ${routeIntelOpen ? "actmap__layout--intel-open" : "actmap__layout--intel-closed"}">
            <section class="actmap__board-panel ${routeIntelOpen ? "" : "actmap__board-panel--solo"}">
              <div class="actmap__panel-head actmap__panel-head--board">
                <div>
                  <div class="actmap__panel-eyebrow">Trail Overview</div>
                  <h2 class="actmap__panel-title">Waypoint Board</h2>
                </div>
                <div class="actmap__panel-copy">Mainline routes remain fixed. Side rites and aftermath forks surface as the act tightens around you.</div>
              </div>

              <div class="actmap__canvas ${scrollOpen ? "actmap__canvas--scroll" : ""}">
                <img class="actmap__bg"
                     src="./assets/curated/act-maps/${actMapFile}.png"
                     alt="${escapeHtml(run.actTitle)}"
                     draggable="false" />

                <div class="actmap__main-map">
                  <svg class="actmap__edges">
                    ${edges}
                  </svg>

                  ${townWaypoint}
                  ${waypoints}

                  <div class="actmap__progress">
                    <div class="actmap__progress-fill" style="width:${progressPct}%"></div>
                  </div>
                </div>

                <div class="actmap__scroll-overlay">
                  <div class="actmap__scroll-label">\u{1F4DC} Recovered Map Fragment</div>
                </div>
              </div>

              <div class="actmap__actions">
                <div class="actmap__action-cluster">
                  <button class="actmap__retreat" data-action="return-safe-zone">
                    \u2190 Return to ${escapeHtml(run.safeZoneName)}
                  </button>
                </div>
                <div class="actmap__action-cluster actmap__action-cluster--right">
                  <button class="actmap__intel-toggle" data-action="toggle-route-intel" aria-expanded="${routeIntelOpen ? "true" : "false"}">
                    ${routeIntelOpen ? "\u2715 Hide Route Intel" : "\u2630 View Route Intel"}
                  </button>
                  <button class="actmap__scroll-toggle" data-action="toggle-scroll-map">
                    ${scrollOpen ? "\u2694 Waypoint Map" : "\u{1F4DC} View Scroll"}
                  </button>
                </div>
              </div>
            </section>

            ${routeIntelOpen ? `
            <aside class="actmap__rail">
              <section class="actmap__briefing">
                <div class="actmap__panel-head">
                  <div>
                    <div class="actmap__panel-eyebrow">Field Briefing</div>
                    <h2 class="actmap__panel-title">Route Pressure</h2>
                  </div>
                </div>
                <p class="actmap__briefing-copy">
                  ${escapeHtml(nextZone
                    ? `${nextZoneFamily} ahead: ${nextZoneLabel}. ${openRouteCount} route${openRouteCount === 1 ? "" : "s"} can be pursued from the current board state.`
                    : "No route is currently open. Resolve the pending path state before the board can move again.")}
                </p>
                <div class="actmap__briefing-stats">
                  ${buildBriefingStat("Open Routes", openRouteCount, escapeHtml)}
                  ${buildBriefingStat("Battle Paths Cleared", battleRoutesCleared, escapeHtml)}
                  ${buildBriefingStat("Branch Nodes", branchCount, escapeHtml)}
                  ${buildBriefingStat("Resolved Special Nodes", resolvedSpecialNodes, escapeHtml)}
                </div>
                <div class="actmap__next-route">
                  <span class="actmap__next-route-label">Next Pressure Point</span>
                  <strong class="actmap__next-route-name">${escapeHtml(nextZoneLabel)}</strong>
                  <span class="actmap__next-route-meta">${escapeHtml(nextZoneFamily)} · ${escapeHtml(nextZoneStatus)}</span>
                </div>
                <div class="actmap__briefing-note">
                  ${escapeHtml(scrollOpen
                    ? "Scroll mode is open. The recovered parchment is visible for full-act orientation."
                    : `${availableZones.length} waypoint${availableZones.length === 1 ? "" : "s"} are presently in motion across the act.`)}
                </div>
              </section>

              <section class="actmap__atlas-panel">
                <div class="actmap__panel-head">
                  <div>
                    <div class="actmap__panel-eyebrow">Operational Ledger</div>
                    <h2 class="actmap__panel-title">Route Atlas</h2>
                  </div>
                  <div class="actmap__panel-copy">Quest forks, aftermath lanes, and combat routes are all tracked here beside the board.</div>
                </div>
                <div class="map-grid actmap__atlas-grid">
                  ${atlasCards}
                </div>
              </section>
            </aside>
            ` : ""}
          </div>

        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_WORLD_MAP_VIEW = {
    render,
  };
})();
