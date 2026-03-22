(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  type CubeInput =
    | { kind: "charm"; size: CharmSize; count: number }
    | { kind: "rune"; count: number }
    | { kind: "equipment"; rarity?: string };

  type CubeOutput =
    | { kind: "charm"; size: CharmSize }
    | { kind: "rune_upgrade" }
    | { kind: "charm_reroll" };

  interface CubeRecipe {
    id: string;
    title: string;
    description: string;
    inputs: CubeInput[];
    output: CubeOutput;
  }

  const ACTION_PREFIX = "cube_recipe_";

  const CUBE_RECIPES: CubeRecipe[] = [
    {
      id: "cube_3_small_to_large",
      title: "Transmute Small Charms",
      description: "Combine 3 small charms to create 1 large charm.",
      inputs: [{ kind: "charm", size: "small", count: 3 }],
      output: { kind: "charm", size: "large" },
    },
    {
      id: "cube_3_large_to_grand",
      title: "Transmute Large Charms",
      description: "Combine 3 large charms to create 1 grand charm.",
      inputs: [{ kind: "charm", size: "large", count: 3 }],
      output: { kind: "charm", size: "grand" },
    },
    {
      id: "cube_3_runes_upgrade",
      title: "Upgrade Runes",
      description: "Combine 3 identical runes to create 1 rune of the next tier.",
      inputs: [{ kind: "rune", count: 3 }],
      output: { kind: "rune_upgrade" },
    },
    {
      id: "cube_charm_reroll",
      title: "Reroll Charm",
      description: "Sacrifice 1 charm and 1 rune to reroll the charm with new bonuses of the same size.",
      inputs: [{ kind: "charm", size: "small", count: 1 }, { kind: "rune", count: 1 }],
      output: { kind: "charm_reroll" },
    },
  ];

  function hasRequiredCharms(profile: ProfileState, size: CharmSize, count: number): boolean {
    const charmData = runtimeWindow.ROUGE_CHARM_DATA;
    if (!charmData || !profile?.meta?.charms) {
      return false;
    }
    const unlockedIds = profile.meta.charms.unlockedCharmIds || [];
    const equippedIds = new Set(profile.meta.charms.equippedCharmIds || []);
    let available = 0;
    for (const charmId of unlockedIds) {
      if (equippedIds.has(charmId)) {
        continue;
      }
      const charm = charmData.getCharmDefinition(charmId);
      if (charm && charm.size === size) {
        available += 1;
      }
    }
    return available >= count;
  }

  function hasRequiredRunes(profile: ProfileState, count: number): boolean {
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const runeEntries = stashEntries.filter((entry: InventoryEntry) => entry.kind === "rune");
    if (count <= 1) {
      return runeEntries.length >= count;
    }
    const runeCounts: Record<string, number> = {};
    for (const entry of runeEntries) {
      const runeId = (entry as InventoryRuneEntry).runeId;
      runeCounts[runeId] = (runeCounts[runeId] || 0) + 1;
    }
    return Object.values(runeCounts).some((c) => c >= count);
  }

  function canExecuteRecipe(profile: ProfileState, recipeId: string): boolean {
    const recipe = CUBE_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) {
      return false;
    }
    for (const input of recipe.inputs) {
      if (input.kind === "charm" && !hasRequiredCharms(profile, input.size, input.count)) {
        return false;
      }
      if (input.kind === "rune" && !hasRequiredRunes(profile, input.count)) {
        return false;
      }
    }
    return true;
  }

  function listAvailableRecipes(profile: ProfileState): { recipe: CubeRecipe; canExecute: boolean }[] {
    return CUBE_RECIPES.map((recipe) => ({
      recipe,
      canExecute: canExecuteRecipe(profile, recipe.id),
    }));
  }

  function buildCubeActions(profile: ProfileState): TownAction[] {
    return CUBE_RECIPES.map((recipe) => {
      const canExecute = canExecuteRecipe(profile, recipe.id);
      return {
        id: `${ACTION_PREFIX}${recipe.id}`,
        category: "cube" as string,
        title: recipe.title,
        subtitle: "Horadric Cube",
        description: recipe.description,
        previewLines: [recipe.description, canExecute ? "Materials ready." : "Missing materials."],
        cost: 0,
        actionLabel: canExecute ? "Transmute" : "Locked",
        disabled: !canExecute,
      };
    });
  }

  function getUnequippedCharmsBySize(profile: ProfileState, size: CharmSize): string[] {
    const charmData = runtimeWindow.ROUGE_CHARM_DATA;
    if (!charmData || !profile?.meta?.charms) {
      return [];
    }
    const equippedIds = new Set(profile.meta.charms.equippedCharmIds || []);
    return (profile.meta.charms.unlockedCharmIds || []).filter((charmId: string) => {
      if (equippedIds.has(charmId)) {
        return false;
      }
      const charm = charmData.getCharmDefinition(charmId);
      return charm && charm.size === size;
    });
  }

  function getCharmsOfSize(size: CharmSize): CharmDefinition[] {
    const charmData = runtimeWindow.ROUGE_CHARM_DATA;
    if (!charmData) {
      return [];
    }
    return charmData.listAllCharms().filter((charm: CharmDefinition) => charm.size === size);
  }

  function removeFirstRune(profile: ProfileState): boolean {
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const runeIndex = stashEntries.findIndex((entry: InventoryEntry) => entry.kind === "rune");
    if (runeIndex < 0) {
      return false;
    }
    profile.stash.entries = stashEntries.filter((_: InventoryEntry, i: number) => i !== runeIndex);
    return true;
  }

  function executeCharmTransmute(profile: ProfileState, inputSize: CharmSize, outputSize: CharmSize, inputCount: number): { ok: boolean; message: string } {
    const available = getUnequippedCharmsBySize(profile, inputSize);
    if (available.length < inputCount) {
      return { ok: false, message: `Need ${inputCount} unequipped ${inputSize} charms.` };
    }

    const consumed = available.slice(0, inputCount);
    profile.meta.charms.unlockedCharmIds = profile.meta.charms.unlockedCharmIds.filter(
      (id: string) => !consumed.includes(id)
    );

    const outputPool = getCharmsOfSize(outputSize);
    const alreadyUnlocked = new Set(profile.meta.charms.unlockedCharmIds);
    const candidates = outputPool.filter((charm) => !alreadyUnlocked.has(charm.id));
    let chosen: CharmDefinition | null = null;
    if (candidates.length > 0) {
      chosen = candidates[Math.floor(Math.random() * candidates.length)];
    } else if (outputPool.length > 0) {
      chosen = outputPool[Math.floor(Math.random() * outputPool.length)];
    }

    if (!chosen) {
      return { ok: false, message: `No ${outputSize} charms available in the pool.` };
    }

    if (!alreadyUnlocked.has(chosen.id)) {
      profile.meta.charms.unlockedCharmIds = [...profile.meta.charms.unlockedCharmIds, chosen.id];
    }

    return { ok: true, message: `Transmuted ${inputCount} ${inputSize} charms into ${chosen.name}.` };
  }

  function executeCharmReroll(profile: ProfileState): { ok: boolean; message: string } {
    const allSizes: CharmSize[] = ["small", "large", "grand"];
    let rerollSize: CharmSize | null = null;
    let rerollCharmId: string | null = null;

    for (const size of allSizes) {
      const available = getUnequippedCharmsBySize(profile, size);
      if (available.length > 0) {
        rerollSize = size;
        rerollCharmId = available[0];
        break;
      }
    }

    if (!rerollSize || !rerollCharmId) {
      return { ok: false, message: "No unequipped charm to reroll." };
    }

    if (!removeFirstRune(profile)) {
      return { ok: false, message: "No rune in stash." };
    }

    profile.meta.charms.unlockedCharmIds = profile.meta.charms.unlockedCharmIds.filter(
      (id: string) => id !== rerollCharmId
    );

    const outputPool = getCharmsOfSize(rerollSize);
    const alreadyUnlocked = new Set(profile.meta.charms.unlockedCharmIds);
    const candidates = outputPool.filter((charm) => !alreadyUnlocked.has(charm.id) && charm.id !== rerollCharmId);
    let chosen: CharmDefinition | null = null;
    if (candidates.length > 0) {
      chosen = candidates[Math.floor(Math.random() * candidates.length)];
    } else if (outputPool.length > 0) {
      chosen = outputPool[Math.floor(Math.random() * outputPool.length)];
    }

    if (!chosen) {
      return { ok: false, message: `No ${rerollSize} charms available for reroll.` };
    }

    if (!alreadyUnlocked.has(chosen.id)) {
      profile.meta.charms.unlockedCharmIds = [...profile.meta.charms.unlockedCharmIds, chosen.id];
    }

    return { ok: true, message: `Rerolled into ${chosen.name}.` };
  }

  function executeRecipe(profile: ProfileState, recipeId: string): { ok: boolean; message: string } {
    if (!canExecuteRecipe(profile, recipeId)) {
      return { ok: false, message: "Missing materials for this recipe." };
    }
    const recipe = CUBE_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) {
      return { ok: false, message: "Unknown recipe." };
    }

    if (recipe.id === "cube_3_small_to_large") {
      return executeCharmTransmute(profile, "small", "large", 3);
    }
    if (recipe.id === "cube_3_large_to_grand") {
      return executeCharmTransmute(profile, "large", "grand", 3);
    }
    if (recipe.id === "cube_3_runes_upgrade") {
      return executeRuneUpgrade(profile);
    }
    if (recipe.id === "cube_charm_reroll") {
      return executeCharmReroll(profile);
    }

    return { ok: false, message: "Unknown recipe." };
  }

  function executeRuneUpgrade(profile: ProfileState): { ok: boolean; message: string } {
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const runeCounts: Record<string, { count: number; entryIds: string[] }> = {};
    for (const entry of stashEntries) {
      if (entry.kind === "rune") {
        const runeId = (entry as InventoryRuneEntry).runeId;
        if (!runeCounts[runeId]) {
          runeCounts[runeId] = { count: 0, entryIds: [] };
        }
        runeCounts[runeId].count += 1;
        runeCounts[runeId].entryIds.push(entry.entryId);
      }
    }

    const eligibleRuneId = Object.keys(runeCounts).find((runeId) => runeCounts[runeId].count >= 3);
    if (!eligibleRuneId) {
      return { ok: false, message: "Need 3 identical runes." };
    }

    const runeTemplates = runtimeWindow.ROUGE_ITEM_DATA?.RUNE_TEMPLATES;
    if (!runeTemplates) {
      return { ok: false, message: "Rune data not available." };
    }

    const allRunes = Object.values(runeTemplates) as RuneTemplateDefinition[];
    const currentRune = allRunes.find((r) => r.sourceId === eligibleRuneId);
    if (!currentRune) {
      return { ok: false, message: "Rune definition not found." };
    }

    const nextTierRune = allRunes
      .filter((r) => r.progressionTier === currentRune.progressionTier + 1)
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId))[0] || null;
    if (!nextTierRune) {
      return { ok: false, message: "Already at max rune tier." };
    }

    const entriesToRemove = runeCounts[eligibleRuneId].entryIds.slice(0, 3);
    profile.stash.entries = stashEntries.filter((entry: InventoryEntry) => !entriesToRemove.includes(entry.entryId));

    const nextEntryId = `cube_rune_${Date.now()}`;
    profile.stash.entries.push({
      entryId: nextEntryId,
      kind: "rune",
      runeId: nextTierRune.sourceId,
    } as InventoryRuneEntry);

    return { ok: true, message: `Upgraded to ${nextTierRune.sourceId}.` };
  }

  runtimeWindow.ROUGE_HORADRIC_CUBE = {
    ACTION_PREFIX,
    CUBE_RECIPES,
    canExecuteRecipe,
    listAvailableRecipes,
    buildCubeActions,
    executeRecipe,
  };
})();
