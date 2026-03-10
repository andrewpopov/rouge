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
   * Each zone gets a position on the map as [x%, y%].
   * Positions are keyed by zoneRole so they work across all acts.
   * The graph flows: town -> opening -> branch1 / branch2 -> boss
   * Quest and event nodes sit off the main path.
   */
  const ZONE_POSITIONS: Record<string, [number, number]> = {
    town:           [4, 50],
    opening:        [22, 50],
    branchMiniboss: [44, 26],
    branchBattle:   [44, 74],
    quest:          [62, 26],
    event:          [62, 74],
    boss:           [82, 50],
  };

  /** Lines connecting zones, as [fromRole, toRole] pairs */
  const ZONE_EDGES: [string, string][] = [
    ["town", "opening"],
    ["opening", "branchMiniboss"],
    ["opening", "branchBattle"],
    ["branchMiniboss", "boss"],
    ["branchBattle", "boss"],
    ["opening", "quest"],
    ["quest", "event"],
  ];

  function getZonePosition(zone: ZoneState): [number, number] | null {
    if (zone.kind === "boss") return ZONE_POSITIONS.boss;
    if (zone.zoneRole && ZONE_POSITIONS[zone.zoneRole]) return ZONE_POSITIONS[zone.zoneRole];
    if (zone.kind === "quest") return ZONE_POSITIONS.quest;
    if (zone.kind === "event") return ZONE_POSITIONS.event;
    return null;
  }

  function buildSvgEdges(zones: ZoneState[]): string {
    const roleMap = new Map<string, ZoneState>();
    for (const z of zones) {
      if (z.kind === "boss") roleMap.set("boss", z);
      else if (z.kind === "quest") roleMap.set("quest", z);
      else if (z.kind === "event") roleMap.set("event", z);
      else if (z.zoneRole) roleMap.set(z.zoneRole, z);
    }
    // Always add a virtual town node
    roleMap.set("town", { status: "cleared" } as ZoneState);

    const lines: string[] = [];
    for (const [fromRole, toRole] of ZONE_EDGES) {
      const from = roleMap.get(fromRole);
      const to = roleMap.get(toRole);
      if (!from || !to) continue;
      const fp = ZONE_POSITIONS[fromRole];
      const tp = ZONE_POSITIONS[toRole];
      if (!fp || !tp) continue;

      const bothCleared = from.status === "cleared" && to.status === "cleared";
      const active = from.status === "cleared" && to.status === "available";
      const cls = bothCleared ? "edge--cleared" : active ? "edge--active" : "edge--locked";

      lines.push(
        `<line x1="${fp[0]}%" y1="${fp[1]}%" x2="${tp[0]}%" y2="${tp[1]}%" class="map-edge ${cls}" />`
      );
    }
    return lines.join("");
  }

  function buildWaypointNode(
    zone: ZoneState,
    reachable: boolean,
    escapeHtml: (s: string) => string
  ): string {
    const pos = getZonePosition(zone);
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

    // Filter out shrines and opportunities -- only show combat + quest + event + boss
    const mapZones = currentZones.filter(
      (z) => z.kind !== "shrine" && z.kind !== "opportunity"
    );

    const actMapFile = getActMapFilename(run.actNumber);

    // Town waypoint (always shown, always cleared)
    const townWaypoint = `
      <div class="waypoint waypoint--town" style="left:${ZONE_POSITIONS.town[0]}%;top:${ZONE_POSITIONS.town[1]}%">
        <span class="waypoint__icon">\u{1F3E0}</span>
        <span class="waypoint__label">${escapeHtml(run.safeZoneName)}</span>
      </div>
    `;

    const waypoints = mapZones.map((z) => buildWaypointNode(z, reachableZoneIds.has(z.id), escapeHtml)).join("");
    const edges = buildSvgEdges(mapZones);
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
