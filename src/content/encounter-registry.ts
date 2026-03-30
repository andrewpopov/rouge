(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { normalizeActPool, groupByRole, buildActEncounterSet, buildZoneEncounterSet } =
    runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_BUILDERS;
  const { slugify: slugifyZone } = runtimeWindow.ROUGE_UTILS;

  const LEGACY_ZONE_NAME_BY_DISPLAY_TITLE: Record<string, string> = {
    "Blighted Moors": "Blood Moor",
    "Pale Fields": "Cold Plains",
    "Cairn Field": "Stony Field",
    "Hollow Passage": "The Underground Passage",
    "Gloamwood": "Dark Wood",
    "Drowning Marsh": "Black Marsh",
    "Monastery Gate": "Tamoe Highland",
    "Outer Abbey": "Outer Cloister",
    "Gate Barracks": "Barracks",
    "Iron Cells": "Jail",
    "Black Chapel": "Cathedral",
    "Abbey Vault": "Catacombs",
    "Black Pit": "Den of Evil",
    "Graveyard Ridge": "Burial Grounds",
    "Ashfall Hamlet": "Tristram",
    "Ruined Watchtower": "Forgotten Tower",
    "Shale Flats": "Rocky Waste",
    "Dust Hills": "Dry Hills",
    "Salt Oasis": "Far Oasis",
    "Sunken Archives": "Lost City",
    "Veiled Court": "Harem",
    "Lower Court": "The Palace Cellar",
    "Star Archive": "Arcane Sanctuary",
    "Sandscript Canyon": "Canyon of the Magi",
    "Royal Vault": "Tal Rasha's Tomb",
    "Royal Sepulcher": "Tal Rasha's Chamber",
    "Collapsed Cisterns": "Sewers",
    "Buried Tomb Entries": "Halls of the Dead",
    "Worm-Tunnels": "Maggot Lair",
    "Serpent Vaults": "Valley of Snakes",
    "Widowwood": "Spider Forest",
    "Fever Marsh": "Great Marsh",
    "Hunter Canopy": "Flayer Jungle",
    "River Quarter": "Lower Kurast",
    "Idol Market": "Kurast Bazaar",
    "Flooded Processional": "Upper Kurast",
    "Temple Stairs": "Kurast Causeway",
    "Idol Court": "Travincal",
    "Corrupted Sanctum": "Durance of Hate",
    "Spider Hollows": "Spider Cavern",
    "Hunter Village": "Flayer Dungeon",
    "Drowned Causeway": "Kurast Sewers",
    "Burning Causeway": "Outer Steppes",
    "Chained Bastion": "Plains of Despair",
    "Demon Forge": "City of the Damned",
    "Black Gate": "River of Flame",
    "Ashen Throne": "Chaos Sanctuary",
    "Siege Walls": "Bloody Foothills",
    "Watchfire Ridge": "Frigid Highlands",
    "Tombs of the Fallen": "Arreat Plateau",
    "Ancient Halls": "Crystalline Passage",
    "Glacial Tunnels": "Glacial Trail",
    "Frost Scar": "Frozen Tundra",
    "The Ascent": "The Ancients' Way",
    "Summit Gate": "Arreat Summit",
    "Summit Citadel": "Worldstone Keep",
    "Citadel Core": "Throne of Destruction",
    "Crown of Ruin": "The Worldstone Chamber",
    "Icebound River": "Frozen River",
    "White Drift Cavern": "Drifter Cavern",
    "Mourning Temple": "Nihlathak's Temple",
    "Sorrow Halls": "Halls of Anguish",
    "Ruin Halls": "Halls of Pain",
    "Oathbreaker Vault": "Halls of Vaught",
  };

  function createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle) {
    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidSeedBundle(seedBundle);

    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const zoneMonsterMap = seedBundle?.zoneMonsters || {};
    const generatedEnemyCatalog: Record<string, EnemyTemplate> = {};
    const generatedEncounterCatalog: Record<string, EncounterDefinition> = {};
    const generatedActEncounterIds: Record<number, GeneratedActEncounterIds> = {};
    const generatedZoneEncounterIds: Record<string, string[]> = {};

    acts.forEach((actSeed: ActSeed) => {
      const poolEntries = normalizeActPool(seedBundle, actSeed.act);
      const groupedEntries = groupByRole(poolEntries);
      const bossEntry = bossEntries.find((entry: BossEntry) => entry.id === actSeed.boss.id) || null;
      const actContent = buildActEncounterSet({
        actSeed,
        bossEntry,
        groupedEntries,
      });
      Object.assign(generatedEnemyCatalog, actContent.enemyCatalog);
      Object.assign(generatedEncounterCatalog, actContent.encounterCatalog);
      generatedActEncounterIds[actSeed.act] = actContent.encounterIdsByKind;

      const actZoneMonsters = zoneMonsterMap[`Act ${actSeed.act}`] || {} as Record<string, string[]>;
      (Object.entries(actZoneMonsters) as [string, string[]][]).forEach(([zoneName, monsterNames]) => {
        const zoneContent = buildZoneEncounterSet({
          actNumber: actSeed.act,
          zoneName,
          monsterNames,
        });
        if (zoneContent) {
          Object.assign(generatedEnemyCatalog, zoneContent.enemyCatalog);
          Object.assign(generatedEncounterCatalog, zoneContent.encounterCatalog);
          const zoneKey = `act_${actSeed.act}_${slugifyZone(zoneName)}`;
          generatedZoneEncounterIds[zoneKey] = zoneContent.encounterIds;
        }
      });

      (actSeed.mainlineZones || [])
        .concat((actSeed.sideBranches || []).map((branch) => branch.name), actSeed.boss?.zone ? [actSeed.boss.zone] : [])
        .forEach((displayZoneName: string) => {
          const legacyZoneName = LEGACY_ZONE_NAME_BY_DISPLAY_TITLE[displayZoneName];
          if (!legacyZoneName || generatedZoneEncounterIds[`act_${actSeed.act}_${slugifyZone(displayZoneName)}`]) {
            return;
          }
          const monsterNames = actZoneMonsters[legacyZoneName];
          if (!Array.isArray(monsterNames) || monsterNames.length === 0) {
            return;
          }
          const zoneContent = buildZoneEncounterSet({
            actNumber: actSeed.act,
            zoneName: displayZoneName,
            monsterNames,
          });
          if (zoneContent) {
            Object.assign(generatedEnemyCatalog, zoneContent.enemyCatalog);
            Object.assign(generatedEncounterCatalog, zoneContent.encounterCatalog);
            const zoneKey = `act_${actSeed.act}_${slugifyZone(displayZoneName)}`;
            generatedZoneEncounterIds[zoneKey] = zoneContent.encounterIds;
          }
        });
    });

    const runtimeContent = {
      ...baseContent,
      enemyCatalog: {
        ...baseContent.enemyCatalog,
        ...generatedEnemyCatalog,
      },
      encounterCatalog: {
        ...baseContent.encounterCatalog,
        ...generatedEncounterCatalog,
      },
      generatedActEncounterIds,
      generatedZoneEncounterIds,
    };

    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidRuntimeContent(runtimeContent);
    return runtimeContent;
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY = {
    createRuntimeContent,
  };
})();
