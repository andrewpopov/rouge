(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, deepClone, slugify, toBonusValue, uniquePush } = runtimeWindow.ROUGE_RUN_STATE;

  const MAX_ZONE_ENCOUNTERS = 5;

  function slugifyZone(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function createEncounterSequence(
    kind: ZoneKind,
    count: number,
    actNumber: number,
    content: GameContent,
    zoneRole?: ZoneRole,
    zoneTitle?: string
  ): string[] {
    // Try zone-specific encounters first for contiguous themed waves
    if (zoneTitle && kind !== "boss") {
      const zoneKey = `act_${actNumber}_${slugifyZone(zoneTitle)}`;
      const zonePool = content?.generatedZoneEncounterIds?.[zoneKey];
      if (Array.isArray(zonePool) && zonePool.length > 0) {
        return Array.from({ length: clamp(count, 1, MAX_ZONE_ENCOUNTERS) }, (_, index) => zonePool[index % zonePool.length]);
      }
    }

    const actPools = (content?.generatedActEncounterIds?.[actNumber] || {}) as Partial<GeneratedActEncounterIds> &
      Record<string, string[] | undefined>;
    let sourcePool = null;

    if (typeof zoneRole === "string" && Array.isArray(actPools[zoneRole]) && actPools[zoneRole].length > 0) {
      sourcePool = actPools[zoneRole];
    } else if (kind === "boss") {
      sourcePool = actPools.boss;
    } else if (kind === "miniboss") {
      sourcePool = actPools.branchMiniboss;
    } else {
      sourcePool = actPools.opening;
    }

    let fallbackPool = ["blood_moor_raiders"];
    if (kind === "boss") {
      fallbackPool = ["catacombs_gate"];
    } else if (kind === "miniboss") {
      fallbackPool = ["burial_grounds"];
    }

    const pool = Array.isArray(sourcePool) && sourcePool.length > 0 ? sourcePool : fallbackPool;
    return Array.from({ length: clamp(count, 1, MAX_ZONE_ENCOUNTERS) }, (_, index) => pool[index % pool.length]);
  }

  function createZoneState(config: {
    actNumber: number;
    title: string;
    kind: ZoneKind;
    zoneRole?: ZoneRole;
    description: string;
    encounterCount: number;
    prerequisites: string[];
    content: GameContent;
  }): ZoneState {
    const { actNumber, title, kind, zoneRole, description, encounterCount, prerequisites, content } = config;
    const encounterIds = createEncounterSequence(kind, encounterCount, actNumber, content, zoneRole, title);
    const status = Array.isArray(prerequisites) && prerequisites.length === 0 ? "available" : "locked";
    return {
      id: `act_${actNumber}_${slugify(title)}`,
      actNumber,
      title,
      kind,
      zoneRole,
      description,
      encounterIds,
      encounterTotal: encounterIds.length,
      encountersCleared: 0,
      visited: false,
      cleared: false,
      status,
      prerequisites: [...prerequisites],
    };
  }

  function createActState(actSeed: ActSeed, bossEntry: BossEntry | null | undefined, content: GameContent): ActState {
    const campaignZones = (actSeed.mainlineZones || []).filter((zone) => zone !== actSeed.town);
    const bossZoneName = actSeed.boss.zone;
    const branchZoneCandidates = [];
    uniquePush(branchZoneCandidates, actSeed.sideZones?.[0] || "");
    uniquePush(branchZoneCandidates, campaignZones[Math.max(1, Math.floor(campaignZones.length * 0.35))] || "");
    uniquePush(branchZoneCandidates, campaignZones[Math.max(1, campaignZones.length - 3)] || "");

    const routeZoneNames = [];
    uniquePush(routeZoneNames, campaignZones[0] || `${actSeed.town} Outskirts`);
    uniquePush(routeZoneNames, branchZoneCandidates[0] || campaignZones[1] || `${actSeed.town} Wilds`);
    uniquePush(routeZoneNames, branchZoneCandidates[1] || campaignZones[Math.max(2, campaignZones.length - 2)] || `${actSeed.town} Approach`);

    const openingZone = createZoneState({
      actNumber: actSeed.act,
      title: routeZoneNames[0],
      kind: "battle",
      zoneRole: "opening",
      description: "Opening pressure zone. It establishes the act route and usually contains multiple repeated encounters.",
      encounterCount: clamp(actSeed.act + 1, 2, 5),
      prerequisites: [],
      content,
    });

    const branchZoneOne = createZoneState({
      actNumber: actSeed.act,
      title: routeZoneNames[1],
      kind: "miniboss",
      zoneRole: "branchMiniboss",
      description: "Branch combat zone with stronger resistance and a higher reward floor.",
      encounterCount: clamp(Math.floor((actSeed.act + 1) / 2) + 1, 1, 3),
      prerequisites: [openingZone.id],
      content,
    });

    const branchZoneTwo = createZoneState({
      actNumber: actSeed.act,
      title: routeZoneNames[2],
      kind: "battle",
      zoneRole: "branchBattle",
      description: "Second branch zone. It deepens the act route before the boss unlocks.",
      encounterCount: clamp(actSeed.act + 1, 2, 4),
      prerequisites: [openingZone.id],
      content,
    });

    const worldNodeZones = runtimeWindow.ROUGE_WORLD_NODES?.createActWorldNodes({
      actSeed,
      openingZoneId: openingZone.id,
    }) || [];

    const bossZone = createZoneState({
      actNumber: actSeed.act,
      title: bossZoneName,
      kind: "boss",
      zoneRole: "boss",
      description: `Boss zone for ${actSeed.boss.name}. This closes the act and opens the next safe zone.`,
      encounterCount: 1,
      prerequisites: [branchZoneOne.id, branchZoneTwo.id],
      content,
    });

    return {
      id: `act_${actSeed.act}`,
      actNumber: actSeed.act,
      title: `Act ${actSeed.act}: ${actSeed.name}`,
      town: actSeed.town,
      boss: {
        ...deepClone(actSeed.boss),
        profile: bossEntry?.bossProfile || null,
      },
      zones: [openingZone, branchZoneOne, branchZoneTwo, ...worldNodeZones, bossZone],
      complete: false,
    };
  }

  function buildActSeedFromState(act: ActState): ActSeed {
    const bossZone = Array.isArray(act?.zones) ? act.zones.find((zone) => zone.kind === "boss") || null : null;
    return {
      act: act?.actNumber || 1,
      name: String(act?.title || `Act ${act?.actNumber || 1}`).replace(/^Act\s+\d+:\s*/, ""),
      town: act?.town || "Safe Zone",
      mainlineZones: [],
      sideZones: [],
      boss: {
        id: act?.boss?.id || `act_${act?.actNumber || 1}_boss`,
        name: act?.boss?.name || "Boss",
        zone: bossZone?.title || act?.boss?.zone || act?.boss?.name || "Boss",
      },
    };
  }

  function worldNodeZoneIsResolved(run: RunState, zone: ZoneState): boolean {
    if (run.world?.resolvedNodeIds?.includes(zone.id)) {
      return true;
    }
    if (zone.kind === "quest") {
      return Boolean(run.world?.questOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === "shrine") {
      return Boolean(run.world?.shrineOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === "event") {
      return Boolean(run.world?.eventOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === "opportunity") {
      return Boolean(run.world?.opportunityOutcomes?.[zone.nodeId || ""]);
    }
    return false;
  }

  function normalizeWorldNodeZone(run: RunState, template: ZoneState, existingZone: ZoneState | null): ZoneState {
    const resolved = worldNodeZoneIsResolved(run, template) || Boolean(existingZone?.cleared);
    if (resolved) {
      uniquePush(run.world.resolvedNodeIds, template.id);
    }

    return {
      ...template,
      ...(existingZone || {}),
      id: template.id,
      actNumber: template.actNumber,
      title: template.title,
      kind: template.kind,
      zoneRole: template.zoneRole,
      description: template.description,
      encounterIds: [],
      encounterTotal: 1,
      encountersCleared: resolved ? 1 : clamp(toBonusValue(existingZone?.encountersCleared), 0, 1),
      visited: Boolean(existingZone?.visited || resolved),
      cleared: resolved,
      status: resolved ? "cleared" : template.status,
      prerequisites:
        Array.isArray(existingZone?.prerequisites) && existingZone.prerequisites.length > 0
          ? [...existingZone.prerequisites]
          : [...template.prerequisites],
      nodeId: template.nodeId,
      nodeType: template.nodeType,
    };
  }

  function normalizeActWorldNodes(run: RunState, act: ActState): ActState {
    if (!Array.isArray(act?.zones) || !runtimeWindow.ROUGE_WORLD_NODES?.createActWorldNodes) {
      return act;
    }

    const openingZone =
      act.zones.find((zone) => zone.zoneRole === "opening") ||
      act.zones.find((zone) => zone.kind === "battle" && (!Array.isArray(zone.prerequisites) || zone.prerequisites.length === 0)) ||
      act.zones[0] ||
      null;

    if (!openingZone) {
      return act;
    }

    const desiredWorldNodeZones = runtimeWindow.ROUGE_WORLD_NODES.createActWorldNodes({
      actSeed: buildActSeedFromState(act),
      openingZoneId: openingZone.id,
    });

    const existingWorldNodesById = new Map(
      act.zones
        .filter((zone) => runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone))
        .map((zone) => [zone.id, zone] as const)
    );
    const normalizedWorldNodes = desiredWorldNodeZones.map((template) => {
      return normalizeWorldNodeZone(run, template, existingWorldNodesById.get(template.id) || null);
    });

    const nonWorldZones = act.zones.filter((zone) => !runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone));
    const bossIndex = nonWorldZones.findIndex((zone) => zone.kind === "boss");
    const zones =
      bossIndex >= 0
        ? [...nonWorldZones.slice(0, bossIndex), ...normalizedWorldNodes, ...nonWorldZones.slice(bossIndex)]
        : [...nonWorldZones, ...normalizedWorldNodes];

    return {
      ...act,
      zones,
    };
  }

  function normalizeRunActs(run: RunState): void {
    if (!Array.isArray(run?.acts)) {
      return;
    }
    run.acts = run.acts.map((act) => normalizeActWorldNodes(run, act));
  }

  function getCurrentAct(run: RunState): ActState | null {
    return Array.isArray(run?.acts) ? run.acts[run.currentActIndex] || null : null;
  }

  function syncCurrentActFields(run: RunState): void {
    const currentAct = getCurrentAct(run);
    run.actNumber = currentAct?.actNumber || 1;
    run.actTitle = currentAct?.title || "Act";
    run.safeZoneName = currentAct?.town || "Safe Zone";
    run.bossName = currentAct?.boss?.name || "Boss";
  }

  function getCurrentZones(run: RunState): ZoneState[] {
    return Array.isArray(getCurrentAct(run)?.zones) ? getCurrentAct(run).zones : [];
  }

  function getZoneById(run: RunState, zoneId: string): ZoneState | null {
    return getCurrentZones(run).find((zone) => zone.id === zoneId) || null;
  }

  function zoneIsUnlocked(run: RunState, zone: ZoneState | null): boolean {
    if (!zone) {
      return false;
    }
    if (!Array.isArray(zone.prerequisites) || zone.prerequisites.length === 0) {
      return true;
    }
    return zone.prerequisites.every((requiredZoneId) => {
      const requiredZone = getZoneById(run, requiredZoneId);
      return Boolean(requiredZone?.cleared);
    });
  }

  function recomputeZoneStatuses(run: RunState): void {
    getCurrentZones(run).forEach((zone) => {
      if (zone.cleared) {
        zone.status = "cleared";
        return;
      }
      zone.status = zoneIsUnlocked(run, zone) ? "available" : "locked";
    });
  }

  function getReachableZones(run: RunState): ZoneState[] {
    recomputeZoneStatuses(run);
    return getCurrentZones(run).filter((zone) => zone.status === "available");
  }

  runtimeWindow.ROUGE_RUN_ROUTE_BUILDER = {
    createActState,
    normalizeRunActs,
    getCurrentAct,
    syncCurrentActFields,
    getCurrentZones,
    getZoneById,
    recomputeZoneStatuses,
    getReachableZones,
  };
})();
