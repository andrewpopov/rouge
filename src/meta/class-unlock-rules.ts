(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ALWAYS_UNLOCKED_CLASS_IDS = ["barbarian", "sorceress", "amazon"];

  interface ClassUnlockRule {
    classId: string;
    className: string;
    description: string;
    condition: (profile: ProfileState) => boolean;
  }

  const CLASS_UNLOCK_RULES: ClassUnlockRule[] = [
    {
      classId: "paladin",
      className: "Paladin",
      description: "Clear Act 2",
      condition: (profile: ProfileState) => (profile?.meta?.progression?.highestActCleared || 0) >= 2,
    },
    {
      classId: "necromancer",
      className: "Necromancer",
      description: "Defeat 5 bosses",
      condition: (profile: ProfileState) => (profile?.meta?.progression?.totalBossesDefeated || 0) >= 5,
    },
    {
      classId: "assassin",
      className: "Assassin",
      description: "Clear Act 3",
      condition: (profile: ProfileState) => (profile?.meta?.progression?.highestActCleared || 0) >= 3,
    },
    {
      classId: "druid",
      className: "Druid",
      description: "Play 3 different classes",
      condition: (profile: ProfileState) => (Array.isArray(profile?.meta?.progression?.classesPlayed) ? profile.meta.progression.classesPlayed.length : 0) >= 3,
    },
  ];

  function isClassUnlocked(profile: ProfileState | null, classId: string): boolean {
    if (ALWAYS_UNLOCKED_CLASS_IDS.includes(classId)) {
      return true;
    }
    if (!profile) {
      return false;
    }
    const rule = CLASS_UNLOCK_RULES.find((r) => r.classId === classId);
    if (!rule) {
      return true;
    }
    return rule.condition(profile);
  }

  function getUnlockHint(classId: string): string {
    const rule = CLASS_UNLOCK_RULES.find((r) => r.classId === classId);
    return rule?.description || "";
  }

  function listUnlockedClassIds(profile: ProfileState | null): string[] {
    const allRules = [...ALWAYS_UNLOCKED_CLASS_IDS];
    for (const rule of CLASS_UNLOCK_RULES) {
      if (profile && rule.condition(profile)) {
        allRules.push(rule.classId);
      }
    }
    return allRules;
  }

  function checkAndUnlockClasses(profile: ProfileState): string[] {
    if (!profile?.meta?.unlocks) {
      return [];
    }
    const newlyUnlocked: string[] = [];
    const currentUnlocked = new Set(profile.meta.unlocks.classIds || []);
    for (const classId of ALWAYS_UNLOCKED_CLASS_IDS) {
      if (!currentUnlocked.has(classId)) {
        newlyUnlocked.push(classId);
      }
    }
    for (const rule of CLASS_UNLOCK_RULES) {
      if (!currentUnlocked.has(rule.classId) && rule.condition(profile)) {
        newlyUnlocked.push(rule.classId);
      }
    }
    return newlyUnlocked;
  }

  runtimeWindow.ROUGE_CLASS_UNLOCK_RULES = {
    ALWAYS_UNLOCKED_CLASS_IDS,
    CLASS_UNLOCK_RULES,
    isClassUnlocked,
    getUnlockHint,
    listUnlockedClassIds,
    checkAndUnlockClasses,
  };
})();
