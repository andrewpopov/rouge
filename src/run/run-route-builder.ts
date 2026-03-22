(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const { clamp, deepClone, slugify, toBonusValue, uniquePush } = runtimeWindow.ROUGE_RUN_STATE;

  const MAX_ZONE_ENCOUNTERS = 5;

  function createEncounterSequence(
    kind: ZoneKind,
    count: number,
    actNumber: number,
    content: GameContent,
    zoneRole?: ZoneRole,
    zoneTitle?: string
  ): string[] {
    // Try zone-specific encounters first for contiguous themed waves
    if (zoneTitle && kind !== ZONE_KIND.BOSS) {
      const zoneKey = `act_${actNumber}_${slugify(zoneTitle)}`;
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
    } else if (kind === ZONE_KIND.BOSS) {
      sourcePool = actPools.boss;
    } else if (kind === ZONE_KIND.MINIBOSS) {
      sourcePool = actPools.branchMiniboss;
    } else {
      sourcePool = actPools.opening;
    }

    let fallbackPool = ["blood_moor_raiders"];
    if (kind === ZONE_KIND.BOSS) {
      fallbackPool = ["catacombs_gate"];
    } else if (kind === ZONE_KIND.MINIBOSS) {
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

  /**
   * Build the full mainline + side-branch zone chain for an act.
   *
   * Act 1 example:
   *   Blood Moor → Cold Plains → Stony Field → Underground Passage →
   *   Dark Wood → Black Marsh → Tamoe Highland → Outer Cloister →
   *   Barracks → Jail → Inner Cloister → Cathedral → Catacombs (boss)
   *
   * Side branches (from zones.json sideBranches):
   *   Den of Evil (off Blood Moor), Burial Grounds (off Cold Plains),
   *   Tristram (off Stony Field, locked until Dark Wood entered),
   *   Tower (off Black Marsh)
   */
  function createActState(actSeed: ActSeed, bossEntry: BossEntry | null | undefined, content: GameContent): ActState {
    const campaignZones = (actSeed.mainlineZones || []).filter((zone) => zone !== actSeed.town);
    const bossZoneName = actSeed.boss.zone;

    // Remove the boss zone name from the mainline if it appears there
    const mainlineNames = campaignZones.filter((z) => z !== bossZoneName);

    // Build the linear mainline chain: each zone requires the previous one
    const mainlineZones: ZoneState[] = [];
    for (let i = 0; i < mainlineNames.length; i++) {
      const isFirst = i === 0;
      const zone = createZoneState({
        actNumber: actSeed.act,
        title: mainlineNames[i],
        kind: ZONE_KIND.BATTLE,
        zoneRole: isFirst ? "opening" : `mainline_${i}`,
        description: isFirst
          ? "Opening pressure zone. The first area outside the safety of town."
          : `Mainline zone ${i + 1}. Push deeper into the act.`,
        encounterCount: clamp(Math.max(1, actSeed.act + 1 - Math.floor(i / 3)), 1, 3),
        prerequisites: isFirst ? [] : [mainlineZones[i - 1].id],
        content,
      });
      mainlineZones.push(zone);
    }

    // Build side branches from seed data
    const sideBranches = actSeed.sideBranches || [];
    const sideZones: ZoneState[] = [];
    const mainlineByName = new Map(mainlineZones.map((z) => [z.title, z]));
    const sideByName = new Map<string, ZoneState>();

    for (const branch of sideBranches) {
      const isTownLink = branch.from === actSeed.town;
      const parentZone = mainlineByName.get(branch.from) || sideByName.get(branch.from);
      if (!parentZone && !isTownLink) { continue; }

      const prerequisites: string[] = parentZone ? [parentZone.id] : [];

      // If a gate zone is specified, that zone must also be cleared
      if (branch.gatedBy) {
        const gateZone = mainlineByName.get(branch.gatedBy) || sideByName.get(branch.gatedBy);
        if (gateZone) { prerequisites.push(gateZone.id); }
      }

      const zone = createZoneState({
        actNumber: actSeed.act,
        title: branch.name,
        kind: branch.kind || ZONE_KIND.BATTLE,
        zoneRole: `side_${slugify(branch.name)}`,
        description: branch.description || "Optional side area with extra rewards.",
        encounterCount: branch.encounters || 5,
        prerequisites,
        content,
      });
      sideZones.push(zone);
      sideByName.set(branch.name, zone);
    }

    // World nodes gate behind the last mainline zone before the boss
    const worldNodeGateZone = mainlineZones[mainlineZones.length - 1] || mainlineZones[0];
    const worldNodeZones = runtimeWindow.ROUGE_WORLD_NODES?.createActWorldNodes({
      actSeed,
      openingZoneId: worldNodeGateZone?.id || "",
    }) || [];

    // Boss requires the last mainline zone
    const bossZone = createZoneState({
      actNumber: actSeed.act,
      title: bossZoneName,
      kind: ZONE_KIND.BOSS,
      zoneRole: "boss",
      description: `Boss zone for ${actSeed.boss.name}. This closes the act and opens the next safe zone.`,
      encounterCount: 1,
      prerequisites: worldNodeGateZone ? [worldNodeGateZone.id] : [],
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
      zones: [...mainlineZones, ...sideZones, ...worldNodeZones, bossZone],
      complete: false,
    };
  }

  function buildActSeedFromState(act: ActState): ActSeed {
    const bossZone = Array.isArray(act?.zones) ? act.zones.find((zone) => zone.kind === ZONE_KIND.BOSS) || null : null;
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
    if (zone.kind === ZONE_KIND.QUEST) {
      return Boolean(run.world?.questOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === ZONE_KIND.SHRINE) {
      return Boolean(run.world?.shrineOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === ZONE_KIND.EVENT) {
      return Boolean(run.world?.eventOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === ZONE_KIND.OPPORTUNITY) {
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

    // World nodes gate behind the last mainline zone before the boss.
    const nonBossZones = act.zones.filter((zone) => zone.kind !== ZONE_KIND.BOSS && !runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone));
    const mainlineChain = nonBossZones.filter((zone) => zone.zoneRole === "opening" || (zone.zoneRole || "").startsWith("mainline_"));
    const worldNodeGateZone =
      mainlineChain[mainlineChain.length - 1] ||
      act.zones.find((zone) => zone.zoneRole === "opening") ||
      act.zones[0] ||
      null;

    if (!worldNodeGateZone) {
      return act;
    }

    const desiredWorldNodeZones = runtimeWindow.ROUGE_WORLD_NODES.createActWorldNodes({
      actSeed: buildActSeedFromState(act),
      openingZoneId: worldNodeGateZone.id,
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
    const bossIndex = nonWorldZones.findIndex((zone) => zone.kind === ZONE_KIND.BOSS);
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
