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
      branchMinibossDescription: "Elite graveyard pressure led by a champion and support backline.",
      bossDescription: "The Briar Matron's guard line leans into poison swarms and fast melee pressure.",
      bossAdds: ["brute", "support"],
    },
    2: {
      openingLabel: "Desert",
      branchBattleLabel: "Tomb",
      branchMinibossLabel: "Sepulcher Court",
      bossLabel: "Royal Sepulcher",
      openingDescription: "Open-desert swarms and ranged harassment with faster battlefield pressure.",
      branchBattleDescription: "Crypt and tomb pressure with mummies, brood enemies, and ranged chip damage.",
      branchMinibossDescription: "Sepulcher defenders hold the line with elite bruisers and reviver-style support.",
      bossDescription: "The Sepulcher Devourer's chamber closes around heavy bruisers and relentless boss hits.",
      bossAdds: ["support", "ranged"],
    },
    3: {
      openingLabel: "Jungle",
      branchBattleLabel: "Temple",
      branchMinibossLabel: "Idol Reach",
      bossLabel: "Corrupted Sanctum",
      openingDescription: "Jungle packs swarm with quick attackers, priests, and irregular ranged fire.",
      branchBattleDescription: "Temple and causeway fights lean into cultists, priests, and bruiser escorts.",
      branchMinibossDescription: "Idol-reach branches feature stronger elites with priest support.",
      bossDescription: "The Idol Patriarch's court mixes spell pressure and disciplined support around the act boss.",
      bossAdds: ["support", "ranged"],
    },
    4: {
      openingLabel: "Outer Hell",
      branchBattleLabel: "Infernal Route",
      branchMinibossLabel: "Citadel",
      bossLabel: "Ashen Throne",
      openingDescription: "Hellfield skirmishes escalate immediately into harder-hitting demonic packs.",
      branchBattleDescription: "Infernal route battles favor durable demons, ranged punishment, and attrition.",
      branchMinibossDescription: "Citadel defenders revolve around elite bruisers and spell-support backlines.",
      bossDescription: "Ashen Throne battles center on the Cinder Tyrant's escort pressure and brutal follow-up hits.",
      bossAdds: ["brute", "support"],
    },
    5: {
      openingLabel: "Siege Front",
      branchBattleLabel: "Frozen Pass",
      branchMinibossLabel: "Citadel Ascent",
      bossLabel: "Crown Of Ruin",
      openingDescription: "Act V opens with siege pressure, ranged volleys, and heavier frontline enemies.",
      branchBattleDescription: "Frozen routes mix durable beasts, ranged chip, and attrition pressure.",
      branchMinibossDescription: "Citadel-ascent encounters feature elite guardians and layered support.",
      bossDescription: "The Siege Tyrant's court builds around escorts, ranged punishment, and boss spike turns.",
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

  function makeEncounter(id: string, name: string, description: string, enemyTemplateIds: string[], modifiers: EncounterModifier[] = []) {
    return {
      id,
      name,
      description,
      enemies: enemyTemplateIds.map((templateId: string, index: number) => ({
        id: `${id}_enemy_${index + 1}`,
        templateId,
      })),
      modifiers: modifiers.map((modifier) => ({ ...modifier })),
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
        [raiderA.templateId, raiderB.templateId, supportA.templateId]
      ),
      [encounterIds[1]]: makeEncounter(
        encounterIds[1],
        `${zoneName} Ambush`,
        `${zoneName} creatures emerge from the shadows with ranged support.`,
        [raiderA.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: MODIFIER_KIND.AMBUSH_OPENING, value: 1 }]
      ),
      [encounterIds[2]]: makeEncounter(
        encounterIds[2],
        `${zoneName} Swarm`,
        `A larger group of ${zoneName} inhabitants surges forward with brute force.`,
        [raiderA.templateId, bruteA.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: MODIFIER_KIND.VANGUARD_RUSH, value: 1 }]
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
