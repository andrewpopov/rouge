(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    groupByRole,
    buildEnemyTemplate,
  } = runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS;
  const { MODIFIER_KIND } = runtimeWindow.ROUGE_COMBAT_MODIFIERS;

  const ACT_FLAVOR = {
    1: {
      openingLabel: "Wilderness",
      branchBattleLabel: "Abbey Road",
      branchMinibossLabel: "Grave Ridge",
      bossLabel: "Abbey Vault",
      openingDescription: "Rogue-outskirts skirmishes with shamans, raiders, and first ranged pressure.",
      branchBattleDescription: "Disciplined cult and monastery pressure with tougher fronts and ranged cover.",
      branchMinibossDescription: "Elite graveyard pressure asks for attrition discipline first, then a clean answer to a screened support backline.",
      bossDescription: "The Briar Matron cycles poison swarms into a telegraphed spray, asking for sustain first and a fast punish second.",
      bossAdds: ["brute", "support"],
    },
    2: {
      openingLabel: "Desert",
      branchBattleLabel: "Tomb",
      branchMinibossLabel: "Sepulcher Court",
      bossLabel: "Royal Sepulcher",
      openingDescription: "Open-desert swarms and ranged harassment with faster battlefield pressure.",
      branchBattleDescription: "Crypt and tomb pressure with mummies, brood enemies, and ranged chip damage.",
      branchMinibossDescription: "Sepulcher defenders test guard-break tools first and reviver disruption second.",
      bossDescription: "The Sepulcher Devourer alternates shell-up recovery with committed charges, asking for frontline durability and punish timing.",
      bossAdds: ["support", "ranged"],
    },
    3: {
      openingLabel: "Jungle",
      branchBattleLabel: "Temple",
      branchMinibossLabel: "Idol Reach",
      bossLabel: "Corrupted Sanctum",
      openingDescription: "Jungle packs swarm with quick attackers, priests, and irregular ranged fire.",
      branchBattleDescription: "Temple and causeway fights lean into cultists, priests, and bruiser escorts.",
      branchMinibossDescription: "Idol-reach branches pressure backline reach first and priest disruption second.",
      bossDescription: "The Idol Patriarch builds a support court around a telegraphed lightning burst, asking for backline reach and spell-pressure mitigation.",
      bossAdds: ["support", "ranged"],
    },
    4: {
      openingLabel: "Outer Hell",
      branchBattleLabel: "Infernal Route",
      branchMinibossLabel: "Citadel",
      bossLabel: "Ashen Throne",
      openingDescription: "Hellfield skirmishes escalate immediately into harder-hitting demonic packs.",
      branchBattleDescription: "Infernal route battles favor durable demons, ranged punishment, and attrition.",
      branchMinibossDescription: "Citadel defenders test anti-fire prep first and escort disruption second.",
      bossDescription: "Ashen Throne battles revolve around a telegraphed fire salvo, recovery windows, and a punishing follow-up charge.",
      bossAdds: ["brute", "support"],
    },
    5: {
      openingLabel: "Siege Front",
      branchBattleLabel: "Frozen Pass",
      branchMinibossLabel: "Citadel Ascent",
      bossLabel: "Crown Of Ruin",
      openingDescription: "Act V opens with siege pressure, ranged volleys, and heavier frontline enemies.",
      branchBattleDescription: "Frozen routes mix durable beasts, ranged chip, and attrition pressure.",
      branchMinibossDescription: "Citadel-ascent encounters test summon handling first and layered-control recovery second.",
      bossDescription: "The Siege Tyrant mixes war-host musters with a telegraphed volley, asking for summon control and recovery after disruption.",
      bossAdds: ["brute", "ranged"],
    },
  };

  function getFlavor(actNumber: number) {
    return (ACT_FLAVOR as Record<number, typeof ACT_FLAVOR[1]>)[actNumber] || ACT_FLAVOR[1];
  }

  function pickEntry(entries: EnemyPoolEntryRef[], index: number, fallback: EnemyPoolEntryRef) {
    if (Array.isArray(entries) && entries.length > 0) {
      return entries[index % entries.length];
    }
    return fallback;
  }

  function pickEscortTemplate(role: string, rangedTemplateId: string, supportTemplateId: string, bruteTemplateId: string) {
    if (role === "ranged") {
      return rangedTemplateId;
    }
    if (role === "support") {
      return supportTemplateId;
    }
    return bruteTemplateId;
  }

  function inferEncounterCounterTags(id: string, modifiers: EncounterModifier[] = []): CounterTag[] {
    const tags = new Set<CounterTag>()
    const actNumber = Number((id.match(/^act_(\d+)_/) || [])[1] || 0)
    if (id.includes("_boss")) {
      if (actNumber === 1) {
        tags.add("anti_attrition")
      } else if (actNumber === 2) {
        tags.add("anti_guard_break")
      } else if (actNumber === 3) {
        tags.add("anti_backline")
        tags.add("anti_lightning_pressure")
      } else if (actNumber === 4) {
        tags.add("anti_fire_pressure")
        tags.add("telegraph_respect")
      } else if (actNumber >= 5) {
        tags.add("anti_summon")
        tags.add("anti_control")
      }
    } else if (id.includes("_miniboss") || id.includes("branch_retinue") || id.includes("branch_sanctum") || id.includes("branch_warhost")) {
      tags.add("telegraph_respect")
      if (actNumber === 1) {
        tags.add("anti_attrition")
        tags.add("anti_backline")
      } else if (actNumber === 2) {
        tags.add("anti_guard_break")
        tags.add("anti_support_disruption")
      } else if (actNumber === 3) {
        tags.add("anti_backline")
        tags.add("anti_lightning_pressure")
      } else if (actNumber === 4) {
        tags.add("anti_fire_pressure")
        tags.add("anti_guard_break")
      } else if (actNumber >= 5) {
        tags.add("anti_summon")
        tags.add("anti_control")
      }
    }
    modifiers.forEach((modifier) => {
      const kind = String(modifier.kind || "")
      if (kind.includes("BACKLINE") || kind.includes("SNIPER")) {
        tags.add("anti_backline")
      }
      if (kind.includes("ESCORT") || kind.includes("PHALANX")) {
        tags.add("anti_guard_break")
      }
      if (kind.includes("RITUAL") || kind.includes("ONSLAUGHT") || kind.includes("SALVO") || kind.includes("LINEBREAKER")) {
        tags.add("telegraph_respect")
      }
      if (kind.includes("TRIAGE") || kind.includes("WAR_DRUMS")) {
        tags.add("anti_support_disruption")
      }
      if (kind.includes("COURT_RESERVES")) {
        tags.add("anti_summon")
      }
    })
    return [...tags]
  }

  function makeEncounter(id: string, name: string, description: string, enemyTemplateIds: string[], modifiers: EncounterModifier[] = []) {
    const counterTags = inferEncounterCounterTags(id, modifiers)
    return {
      id,
      name,
      description,
      enemies: enemyTemplateIds.map((templateId: string, index: number) => ({
        id: `${id}_enemy_${index + 1}`,
        templateId,
      })),
      modifiers: modifiers.map((modifier) => ({ ...modifier })),
      askTags: [...counterTags],
      counterTags,
    };
  }

  const { slugify: slugifyZone } = runtimeWindow.ROUGE_UTILS;

  function monsterNameToEntry(name: string, zoneSlug: string) {
    const baseId = slugifyZone(name);
    return { id: `z_${zoneSlug}_${baseId}`, name };
  }

  function spreadAcrossRoles(entries: EnemyPoolEntryRef[]) {
    const grouped = groupByRole(entries);
    const usedIds = new Set();
    const result: Record<string, EnemyPoolEntryRef | null> = { raider: null, ranged: null, support: null, brute: null };
    const roles = ["support", "ranged", "brute", "raider"];

    roles.forEach((role) => {
      const candidate = (grouped as unknown as Record<string, EnemyPoolEntryRef[]>)[role].find((e: EnemyPoolEntryRef) => !usedIds.has(e.id));
      if (candidate) {
        result[role] = candidate;
        usedIds.add(candidate.id);
      }
    });

    const unused = entries.filter((e: EnemyPoolEntryRef) => !usedIds.has(e.id));
    roles.forEach((role) => {
      if (!result[role]) {
        result[role] = unused.shift() || (grouped as unknown as Record<string, EnemyPoolEntryRef[]>)[role][0] || entries[0];
      }
    });
    return result;
  }

  function buildZoneEncounterSet({ actNumber, zoneName, monsterNames }: { actNumber: number; zoneName: string; monsterNames: string[] }) {
    if (!Array.isArray(monsterNames) || monsterNames.length === 0) {
      return null;
    }

    const zoneSlug = slugifyZone(zoneName);
    const entries = monsterNames.map((n: string) => monsterNameToEntry(n, zoneSlug));
    const spread = spreadAcrossRoles(entries);

    const raiderA = buildEnemyTemplate({ actNumber, entry: spread.raider, role: "raider" });
    const raiderB = buildEnemyTemplate({
      actNumber,
      entry: entries.length > 1 ? entries.find((e) => e.id !== spread.raider.id) || spread.raider : spread.raider,
      role: "raider",
      variant: "alt",
    });
    const rangedA = buildEnemyTemplate({ actNumber, entry: spread.ranged, role: "ranged" });
    const supportA = buildEnemyTemplate({ actNumber, entry: spread.support, role: "support" });
    const bruteA = buildEnemyTemplate({ actNumber, entry: spread.brute, role: "brute" });

    const prefix = `act_${actNumber}_zone_${zoneSlug}`;
    const enemyTemplates = [raiderA, raiderB, rangedA, supportA, bruteA];
    const enemyCatalog = Object.fromEntries(enemyTemplates.map((t) => [t.templateId, t]));

    const encounterIds = [
      `${prefix}_patrol`,
      `${prefix}_ambush`,
      `${prefix}_swarm`,
    ];

    const encounterCatalog = {
      [encounterIds[0]]: makeEncounter(
        encounterIds[0],
        `${zoneName} Patrol`,
        `A pack of ${zoneName} denizens blocks the path.`,
        actNumber >= 4
          ? [raiderA.templateId, raiderB.templateId, rangedA.templateId, supportA.templateId]
          : [raiderA.templateId, raiderB.templateId, supportA.templateId],
        actNumber >= 4
          ? [{ kind: MODIFIER_KIND.BACKLINE_SCREEN, value: Math.max(2, actNumber - 1) }]
          : []
      ),
      [encounterIds[1]]: makeEncounter(
        encounterIds[1],
        `${zoneName} Ambush`,
        `${zoneName} creatures emerge from the shadows with ranged support.`,
        actNumber >= 3
          ? [raiderA.templateId, raiderB.templateId, rangedA.templateId, supportA.templateId]
          : [raiderA.templateId, rangedA.templateId, supportA.templateId],
        [
          { kind: MODIFIER_KIND.AMBUSH_OPENING, value: 1 },
          ...(actNumber >= 3 ? [{ kind: MODIFIER_KIND.BACKLINE_SCREEN, value: Math.max(2, actNumber - 1) }] : []),
        ]
      ),
      [encounterIds[2]]: makeEncounter(
        encounterIds[2],
        `${zoneName} Swarm`,
        `A larger group of ${zoneName} inhabitants surges forward with brute force.`,
        actNumber >= 3
          ? [raiderA.templateId, raiderB.templateId, bruteA.templateId, rangedA.templateId, supportA.templateId]
          : [raiderA.templateId, bruteA.templateId, rangedA.templateId, supportA.templateId],
        [
          { kind: MODIFIER_KIND.VANGUARD_RUSH, value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) },
          ...(actNumber >= 3 ? [{ kind: MODIFIER_KIND.WAR_DRUMS, value: 1 }] : []),
          ...(actNumber >= 4 ? [{ kind: MODIFIER_KIND.LINEBREAKER_CHARGE, value: 1 }] : []),
        ]
      ),
    };

    return { enemyCatalog, encounterCatalog, encounterIds };
  }

  runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_BUILDERS_ZONES = {
    ACT_FLAVOR,
    getFlavor,
    pickEntry,
    pickEscortTemplate,
    makeEncounter,
    buildZoneEncounterSet,
  };
})();
