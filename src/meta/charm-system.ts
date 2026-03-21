(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const POUCH_CAPACITY = 8;
  const ACTION_EQUIP_PREFIX = "charm_equip_";
  const ACTION_UNEQUIP_PREFIX = "charm_unequip_";

  function getCharmDefinition(charmId: string): CharmDefinition | null {
    return runtimeWindow.ROUGE_CHARM_DATA?.getCharmDefinition(charmId) || null;
  }

  function getEquippedSlotCost(profile: ProfileState | null): number {
    const equippedIds = profile?.meta?.charms?.equippedCharmIds || [];
    let total = 0;
    for (const charmId of equippedIds) {
      const charm = getCharmDefinition(charmId);
      if (charm) {
        total += charm.slotCost;
      }
    }
    return total;
  }

  function canEquipCharm(profile: ProfileState | null, charmId: string): boolean {
    if (!profile?.meta?.charms) {
      return false;
    }
    const charm = getCharmDefinition(charmId);
    if (!charm) {
      return false;
    }
    if (!profile.meta.charms.unlockedCharmIds.includes(charmId)) {
      return false;
    }
    if (profile.meta.charms.equippedCharmIds.includes(charmId)) {
      return false;
    }
    return getEquippedSlotCost(profile) + charm.slotCost <= POUCH_CAPACITY;
  }

  function equipCharm(profile: ProfileState, charmId: string): boolean {
    if (!canEquipCharm(profile, charmId)) {
      return false;
    }
    profile.meta.charms.equippedCharmIds = [...profile.meta.charms.equippedCharmIds, charmId];
    return true;
  }

  function unequipCharm(profile: ProfileState, charmId: string): boolean {
    if (!profile?.meta?.charms) {
      return false;
    }
    const index = profile.meta.charms.equippedCharmIds.indexOf(charmId);
    if (index < 0) {
      return false;
    }
    profile.meta.charms.equippedCharmIds = profile.meta.charms.equippedCharmIds.filter((id: string) => id !== charmId);
    return true;
  }

  function unlockCharm(profile: ProfileState, charmId: string): boolean {
    if (!profile?.meta?.charms) {
      return false;
    }
    if (profile.meta.charms.unlockedCharmIds.includes(charmId)) {
      return false;
    }
    const charm = getCharmDefinition(charmId);
    if (!charm) {
      return false;
    }
    profile.meta.charms.unlockedCharmIds = [...profile.meta.charms.unlockedCharmIds, charmId];
    return true;
  }

  function buildCharmBonuses(profile: ProfileState | null, classId?: string): ItemBonusSet {
    const total: ItemBonusSet = {};
    const equippedIds = profile?.meta?.charms?.equippedCharmIds || [];
    for (const charmId of equippedIds) {
      const charm = getCharmDefinition(charmId);
      if (!charm) {
        continue;
      }
      if (charm.classId && charm.classId !== classId) {
        continue;
      }
      const bonuses = charm.bonuses || {};
      for (const key of Object.keys(bonuses) as (keyof ItemBonusSet)[]) {
        total[key] = (total[key] || 0) + (bonuses[key] || 0);
      }
    }
    return total;
  }

  function getCharmPouchSummary(profile: ProfileState | null): {
    capacity: number;
    slotsUsed: number;
    slotsRemaining: number;
    equippedCount: number;
    unlockedCount: number;
    equippedCharms: CharmDefinition[];
    unequippedCharms: CharmDefinition[];
  } {
    const charms = profile?.meta?.charms;
    const equippedIds = charms?.equippedCharmIds || [];
    const unlockedIds = charms?.unlockedCharmIds || [];
    const slotsUsed = getEquippedSlotCost(profile);
    const equippedCharms: CharmDefinition[] = [];
    const unequippedCharms: CharmDefinition[] = [];
    for (const charmId of unlockedIds) {
      const charm = getCharmDefinition(charmId);
      if (!charm) {
        continue;
      }
      if (equippedIds.includes(charmId)) {
        equippedCharms.push(charm);
      } else {
        unequippedCharms.push(charm);
      }
    }
    return {
      capacity: POUCH_CAPACITY,
      slotsUsed,
      slotsRemaining: POUCH_CAPACITY - slotsUsed,
      equippedCount: equippedCharms.length,
      unlockedCount: unlockedIds.length,
      equippedCharms,
      unequippedCharms,
    };
  }

  function checkAndUnlockCharms(profile: ProfileState, run: RunState | null): string[] {
    if (!profile?.meta?.charms || !profile?.meta?.progression) {
      return [];
    }
    const prog = profile.meta.progression;
    const newlyUnlocked: string[] = [];

    const ACT_CHARM_MAP: Record<number, string> = {
      1: "small_charm_vita",
      2: "small_charm_might",
      3: "small_charm_warding",
      4: "small_charm_focus",
      5: "small_charm_spite",
    };
    for (const [actNum, charmId] of Object.entries(ACT_CHARM_MAP)) {
      if (prog.highestActCleared >= Number(actNum) && unlockCharm(profile, charmId)) {
        newlyUnlocked.push(charmId);
      }
    }

    if (prog.totalBossesDefeated >= 3 && unlockCharm(profile, "small_charm_vigor")) {
      newlyUnlocked.push("small_charm_vigor");
    }
    if (prog.totalBossesDefeated >= 5 && unlockCharm(profile, "small_charm_remedy")) {
      newlyUnlocked.push("small_charm_remedy");
    }
    if (prog.totalBossesDefeated >= 8 && unlockCharm(profile, "large_charm_resilience")) {
      newlyUnlocked.push("large_charm_resilience");
    }
    if (prog.totalBossesDefeated >= 10 && unlockCharm(profile, "large_charm_prowess")) {
      newlyUnlocked.push("large_charm_prowess");
    }

    const classesPlayedCount = Array.isArray(prog.classesPlayed) ? prog.classesPlayed.length : 0;
    if (classesPlayedCount >= 2 && unlockCharm(profile, "small_charm_loyalty")) {
      newlyUnlocked.push("small_charm_loyalty");
    }
    if (classesPlayedCount >= 3 && unlockCharm(profile, "large_charm_command")) {
      newlyUnlocked.push("large_charm_command");
    }

    if (prog.highestActCleared >= 5 && unlockCharm(profile, "large_charm_fortitude")) {
      newlyUnlocked.push("large_charm_fortitude");
    }

    const classesPlayed = Array.isArray(prog.classesPlayed) ? prog.classesPlayed : [];
    const GRAND_CHARM_CLASS_MAP: Record<string, string> = {
      sorceress: "grand_charm_sorceress",
      barbarian: "grand_charm_barbarian",
      amazon: "grand_charm_amazon",
      paladin: "grand_charm_paladin",
      necromancer: "grand_charm_necromancer",
      assassin: "grand_charm_assassin",
      druid: "grand_charm_druid",
    };
    if (prog.highestActCleared >= 3) {
      for (const classId of classesPlayed) {
        const charmId = GRAND_CHARM_CLASS_MAP[classId];
        if (charmId && unlockCharm(profile, charmId)) {
          newlyUnlocked.push(charmId);
        }
      }
    }

    return newlyUnlocked;
  }

  runtimeWindow.ROUGE_CHARM_SYSTEM = {
    POUCH_CAPACITY,
    ACTION_EQUIP_PREFIX,
    ACTION_UNEQUIP_PREFIX,
    getEquippedSlotCost,
    canEquipCharm,
    equipCharm,
    unequipCharm,
    unlockCharm,
    buildCharmBonuses,
    getCharmPouchSummary,
    checkAndUnlockCharms,
  };
})();
