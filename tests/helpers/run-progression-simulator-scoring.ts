import { getMatchingProficienciesForWeapon } from "./balance-power-score"
import {
  POLICY_ARCHETYPE_PRIORITIES,
  SIMULATION_SCORING_WEIGHTS,
  type AppHarness,
  type BuildPolicyDefinition,
} from "./run-progression-simulator-core"

export function getWeaponEquipment(run: RunState) {
  return run.loadout?.weapon || null
}

export function getArmorEquipment(run: RunState) {
  return run.loadout?.armor || null
}

function getWeaponFamily(harness: AppHarness, run: RunState) {
  const weaponEquipment = getWeaponEquipment(run)
  return harness.browserWindow.ROUGE_ITEM_CATALOG.getWeaponFamily(weaponEquipment?.itemId || "", harness.content) || ""
}

function getWeaponProfile(harness: AppHarness, run: RunState) {
  return harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(getWeaponEquipment(run), harness.content) || null
}

function getLoadoutItemTier(harness: AppHarness, equipment: RunEquipmentState | null | undefined) {
  if (!equipment?.itemId) {
    return 0
  }
  return Number(harness.content.itemCatalog?.[equipment.itemId]?.progressionTier || 0)
}

function getLoadoutTierScore(harness: AppHarness, run: RunState) {
  const weaponTier = getLoadoutItemTier(harness, run.loadout?.weapon || null)
  const armorTier = getLoadoutItemTier(harness, run.loadout?.armor || null)
  const helmTier = getLoadoutItemTier(harness, run.loadout?.helm || null)
  const shieldTier = getLoadoutItemTier(harness, run.loadout?.shield || null)
  const preferredWeaponFamilies = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []
  const weaponFamily = getWeaponFamily(harness, run)
  const preferredWeaponTierWeight =
    preferredWeaponFamilies.length === 0 || preferredWeaponFamilies.includes(weaponFamily)
      ? 26
      : 10
  return weaponTier * preferredWeaponTierWeight + armorTier * 14 + helmTier * 6 + shieldTier * 6
}

function getEquipmentRarityScore(rarity: string | undefined) {
  switch (String(rarity || "").toLowerCase()) {
    case "brown":
      return 4
    case "yellow":
      return 3
    case "blue":
      return 2
    default:
      return 1
  }
}

function getCarriedEntryScore(harness: AppHarness, entry: InventoryEntry) {
  if (entry.kind === "equipment") {
    const item = harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, entry.equipment.itemId)
    const tier = Number(item?.progressionTier || 0)
    return tier * 10 + getEquipmentRarityScore(entry.equipment.rarity)
  }
  const rune = harness.browserWindow.ROUGE_ITEM_CATALOG.getRuneDefinition(harness.content, entry.runeId)
  const tier = Number(rune?.progressionTier || 0)
  return 100 + tier * 10
}

export function discardLowestValueCarriedEntry(harness: AppHarness, run: RunState) {
  const carried = Array.isArray(run.inventory?.carried) ? run.inventory.carried : []
  if (carried.length === 0) {
    return false
  }
  let lowestIndex = 0
  let lowestScore = getCarriedEntryScore(harness, carried[0])
  for (let index = 1; index < carried.length; index += 1) {
    const score = getCarriedEntryScore(harness, carried[index])
    if (score < lowestScore) {
      lowestScore = score
      lowestIndex = index
    }
  }
  carried.splice(lowestIndex, 1)
  return true
}

function getMatchingWeaponProficienciesForRun(
  harness: AppHarness,
  run: RunState,
  weaponProfile?: WeaponCombatProfile | null
) {
  return getMatchingProficienciesForWeapon(
    getWeaponFamily(harness, run),
    weaponProfile ?? getWeaponProfile(harness, run)
  )
}

export function getMatchingWeaponProficienciesForCombatState(state: CombatState) {
  return getMatchingProficienciesForWeapon(state.weaponFamily || "", state.weaponProfile || undefined)
}

function hasPreferredWeaponFamily(harness: AppHarness, run: RunState) {
  const preferred = harness.classRegistry.getPreferredWeaponFamilies(run.classId) || []
  return preferred.includes(getWeaponFamily(harness, run))
}

function getWeaponProficiencyWeight(proficiencyCounts: Record<string, number>, proficiency?: string) {
  if (!proficiency) {
    return 1
  }
  const cardCount = Number(proficiencyCounts[proficiency] || 0)
  if (cardCount <= 0) {
    return 0.1
  }
  return 1 + Math.min(0.45, cardCount * 0.08)
}

function scoreWeaponProfileForDeck(profile: WeaponCombatProfile | undefined, proficiencyCounts: Record<string, number>) {
  if (!profile) {
    return 0
  }
  const attackScore = Object.entries(profile.attackDamageByProficiency || {}).reduce((sum, [proficiency, value]) => {
    return sum + Number(value || 0) * 2.6 * getWeaponProficiencyWeight(proficiencyCounts, proficiency)
  }, 0)
  const supportScore = Object.entries(profile.supportValueByProficiency || {}).reduce((sum, [proficiency, value]) => {
    return sum + Number(value || 0) * 1.3 * getWeaponProficiencyWeight(proficiencyCounts, proficiency)
  }, 0)
  const typedDamageScore = (profile.typedDamage || []).reduce((sum, entry) => {
    return sum + Number(entry.amount || 0) * 2.4 * getWeaponProficiencyWeight(proficiencyCounts, entry.proficiency)
  }, 0)
  const effectScore = (profile.effects || []).reduce((sum, entry) => {
    return sum + Number(entry.amount || 0) * 1.7 * getWeaponProficiencyWeight(proficiencyCounts, entry.proficiency)
  }, 0)
  return attackScore + supportScore + typedDamageScore + effectScore
}

function scoreArmorProfile(profile: ArmorMitigationProfile | undefined) {
  if (!profile) {
    return 0
  }
  const resistanceScore = (profile.resistances || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) * 1.85
  const immunityScore = (profile.immunities || []).length * 12
  return resistanceScore + immunityScore
}

function scoreRunewordProgress(harness: AppHarness, run: RunState) {
  const itemCatalog = harness.browserWindow.ROUGE_ITEM_CATALOG
  const loadout = itemCatalog.buildHydratedLoadout(run, harness.content)

  function getRunewordPower(runeword: RuntimeRunewordDefinition | null) {
    if (!runeword) {
      return 0
    }
    return Object.values(runeword.bonuses || {}).reduce((sum, value) => {
      return sum + Math.max(0, Number(value || 0))
    }, 0)
  }

  return (["weapon", "armor"] as const).reduce((total, slot) => {
    const equipment = loadout[slot]
    if (!equipment) {
      return total
    }

    const targetRuneword = itemCatalog.getPreferredRunewordForEquipment(equipment, run, harness.content)
    if (!targetRuneword) {
      return total
    }

    const currentRuneword = itemCatalog.getRunewordDefinition(harness.content, equipment.runewordId || "")
    const currentPower = getRunewordPower(currentRuneword)
    const targetPower = getRunewordPower(targetRuneword)
    const targetSocketCount = Math.max(1, Number(targetRuneword.socketCount || 0))
    const insertedRunes = Array.isArray(equipment.insertedRunes) ? equipment.insertedRunes : []
    const prefixLength = insertedRunes.reduce((count: number, runeId: string, index: number) => {
      return count === index && targetRuneword.requiredRunes[index] === runeId ? count + 1 : count
    }, 0)
    const socketProgress = Math.min(targetSocketCount, Number(equipment.socketsUnlocked || 0)) / targetSocketCount
    const runeProgress = prefixLength / Math.max(1, targetRuneword.requiredRunes.length)
    const upgradeGap = Math.max(0, targetPower - currentPower)
    const isTargetComplete =
      equipment.runewordId === targetRuneword.id &&
      Number(equipment.socketsUnlocked || 0) >= targetSocketCount &&
      insertedRunes.length >= targetRuneword.requiredRunes.length

    if (isTargetComplete) {
      return total + targetPower * 5.5
    }

    return total + targetPower * (1.2 + socketProgress + runeProgress) + upgradeGap * 3.5
  }, 0)
}

function scoreArchetypePlan(
  harness: AppHarness,
  run: RunState,
  policy: BuildPolicyDefinition
) {
  const rewardEngine = harness.browserWindow.ROUGE_REWARD_ENGINE
  const entries = rewardEngine?.getArchetypeScoreEntries?.(run, harness.content) || []
  if (!Array.isArray(entries) || entries.length === 0) {
    return 0
  }

  const primary = entries[0] || null
  const secondary = entries[1] || null
  const preferred = POLICY_ARCHETYPE_PRIORITIES[policy.id]?.[run.classId] || []
  const preferredEntries = entries.filter((entry) => preferred.includes(entry.archetypeId))
  const bestPreferredScore = Number(preferredEntries[0]?.score || 0)
  const commitmentScore = Math.max(0, Number(primary?.score || 0) - Number(secondary?.score || 0))

  let total = Number(primary?.score || 0) * 0.2 + commitmentScore * 0.35

  if (preferred.length > 0) {
    total += bestPreferredScore * 0.9
    if (primary && preferred.includes(primary.archetypeId)) {
      total += preferred[0] === primary.archetypeId ? 42 : 24
    } else if (primary) {
      total -= 28
    }
    if (secondary && preferred.includes(secondary.archetypeId)) {
      total += 10
    }
  }

  return total
}

export function scoreCard(card: CardDefinition | null | undefined, policy: BuildPolicyDefinition, matchingProficiencies: Set<string>) {
  if (!card) {
    return Number.NEGATIVE_INFINITY
  }
  const effectScore = (card.effects || []).reduce((sum, effect) => {
    const multiplier = policy.cardEffectMultipliers[effect.kind] || 1
    return sum + SIMULATION_SCORING_WEIGHTS.cardEffectBase[effect.kind] * Number(effect.value || 0) * multiplier
  }, 0)
  const tierBonus = Number(card.tier || 1) * 2.5
  const neutralTargetBonus = card.target === "none" ? 1 : 0
  const proficiencyBonus = card.proficiency && matchingProficiencies.has(card.proficiency) ? policy.matchingProficiencyWeight : 0
  return effectScore + tierBonus + neutralTargetBonus + proficiencyBonus - card.cost * 2.4
}

export function buildDeckStats(harness: AppHarness, run: RunState, policy: BuildPolicyDefinition) {
  const matchingProficiencies = new Set(getMatchingWeaponProficienciesForRun(harness, run))
  const preferredFamilyMatch = hasPreferredWeaponFamily(harness, run)
  const scores = run.deck
    .map((cardId) => scoreCard(harness.content.cardCatalog[cardId], policy, matchingProficiencies))
    .filter((score) => Number.isFinite(score))
    .sort((left, right) => right - left)
  const topCards = scores.slice(0, 10)
  const restCards = scores.slice(10)
  const deckScore =
    topCards.reduce((sum, score) => sum + score, 0) * policy.deckTopWeight +
    restCards.reduce((sum, score) => sum + score, 0) * policy.deckRestWeight -
    Math.max(0, run.deck.length - 16) * policy.deckBloatPenalty

  const proficiencyCounts = run.deck.reduce((counts, cardId) => {
    const proficiency = harness.content.cardCatalog[cardId]?.proficiency || "neutral"
    counts[proficiency] = (counts[proficiency] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const matchingProficiencyCount = [...matchingProficiencies].reduce((sum, proficiency) => {
    return sum + Number(proficiencyCounts[proficiency] || 0)
  }, 0)
  return {
    deckScore,
    matchingProficiencyCount,
    preferredFamilyMatch,
    topCards: run.deck
      .slice()
      .sort((leftId, rightId) => {
        return scoreCard(harness.content.cardCatalog[rightId], policy, matchingProficiencies) -
          scoreCard(harness.content.cardCatalog[leftId], policy, matchingProficiencies)
      })
      .slice(0, 5)
      .map((cardId) => harness.content.cardCatalog[cardId]?.title || cardId),
    proficiencyCounts,
  }
}

export function createScoringRun(harness: AppHarness, run: RunState, assumeFullResources: boolean) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T
  const clone = harness.runFactory.hydrateRun(deepClone(run), harness.content)
  if (assumeFullResources) {
    const bonuses = harness.runFactory.buildCombatBonuses(clone, harness.content, null)
    clone.hero.currentLife = clone.hero.maxLife + Number(bonuses.heroMaxLife || 0)
    clone.mercenary.currentLife = clone.mercenary.maxLife + Number(bonuses.mercenaryMaxLife || 0)
    clone.belt.current = clone.belt.max
  }
  return clone
}

export function evaluateRunScore(
  harness: AppHarness,
  run: RunState,
  policy: BuildPolicyDefinition,
  options: { assumeFullResources: boolean }
) {
  const scoringRun = createScoringRun(harness, run, options.assumeFullResources)
  const overrides = harness.runFactory.createCombatOverrides(scoringRun, harness.content, null)
  const weaponProfile = getWeaponProfile(harness, scoringRun)
  const armorProfile = harness.itemSystem.buildCombatMitigationProfile(scoringRun, harness.content) || null
  const deckStats = buildDeckStats(harness, scoringRun, policy)

  return (
    scoringRun.level * 6 +
    overrides.heroState.maxLife * policy.heroLifeWeight +
    overrides.heroState.maxEnergy * policy.heroEnergyWeight +
    Math.max(0, Number(overrides.heroState.handSize || 5) - 5) * 8 +
    Number(overrides.heroState.damageBonus || 0) * policy.heroDamageWeight +
    Number(overrides.heroState.guardBonus || 0) * policy.heroGuardWeight +
    Number(overrides.heroState.burnBonus || 0) * policy.heroBurnWeight +
    overrides.heroState.potionHeal * policy.heroPotionWeight +
    overrides.mercenaryState.maxLife * policy.mercenaryLifeWeight +
    overrides.mercenaryState.attack * policy.mercenaryAttackWeight +
    scoringRun.gold * policy.goldWeight +
    scoringRun.belt.current * policy.potionChargeWeight +
    scoringRun.hero.currentLife * policy.currentLifeWeight +
    Math.max(0, scoringRun.mercenary.currentLife) * policy.currentMercLifeWeight +
    deckStats.deckScore +
    deckStats.matchingProficiencyCount * policy.matchingProficiencyWeight +
    (deckStats.preferredFamilyMatch ? 24 : 0) +
    getLoadoutTierScore(harness, scoringRun) +
    scoreWeaponProfileForDeck(weaponProfile || undefined, deckStats.proficiencyCounts) * policy.weaponWeight +
    scoreArmorProfile(armorProfile || undefined) * policy.armorWeight +
    scoreRunewordProgress(harness, scoringRun) +
    scoreArchetypePlan(harness, scoringRun, policy) +
    Number(scoringRun.progression?.skillPointsAvailable || 0) * policy.bankedSkillPointWeight +
    Number(scoringRun.progression?.classPointsAvailable || 0) * policy.bankedClassPointWeight +
    Number(scoringRun.progression?.attributePointsAvailable || 0) * policy.bankedAttributePointWeight
  )
}

export function cloneRun(harness: AppHarness, run: RunState) {
  const deepClone = harness.browserWindow.ROUGE_UTILS.deepClone as <T>(value: T) => T
  return harness.runFactory.hydrateRun(deepClone(run), harness.content)
}

function isOptimizableTownAction(action: TownAction) {
  const actionId = action.id || ""
  if (action.disabled) {
    return false
  }
  if (actionId.startsWith("progression_")) {
    return true
  }
  if (
    actionId === "healer_restore_party" ||
    actionId === "quartermaster_refill_belt"
  ) {
    return true
  }
  if (
    actionId.startsWith("mercenary_contract_") ||
    actionId.startsWith("vendor_buy_") ||
    actionId.startsWith("inventory_equip_") ||
    actionId.startsWith("inventory_socket_") ||
    actionId.startsWith("inventory_commission_") ||
    actionId.startsWith("blacksmith_evolve_") ||
    actionId.startsWith("sage_purge_")
  ) {
    return true
  }
  return false
}

export function optimizeSafeZoneRun(
  harness: AppHarness,
  run: RunState,
  profile: ProfileState,
  policy: BuildPolicyDefinition,
  maxIterations = 24
) {
  const townServices = harness.browserWindow.ROUGE_TOWN_SERVICES
  const isGearFollowupAction = (actionId: string, allowVendorBuys = true) => {
    return (
      (allowVendorBuys && actionId.startsWith("vendor_buy_")) ||
      actionId.startsWith("inventory_equip_") ||
      actionId.startsWith("inventory_commission_") ||
      actionId.startsWith("inventory_socket_")
    )
  }

  function findBestImmediateGearFollowup(targetRun: RunState, allowVendorBuys: boolean) {
    const baseScore = evaluateRunScore(harness, targetRun, policy, { assumeFullResources: false })
    const actions = townServices
      .listActions(harness.content, targetRun, profile)
      .filter((action: TownAction) => {
        const actionId = action.id || ""
        return !action.disabled && isGearFollowupAction(actionId, allowVendorBuys)
      })

    let bestAction: TownAction | null = null
    let bestDelta = 0

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, targetRun)
      const result = townServices.applyAction(clone, profile, harness.content, action.id)
      if (!result.ok) {
        return
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false })
      const delta = nextScore - baseScore
      if (delta > bestDelta) {
        bestDelta = delta
        bestAction = action
      }
    })

    return { bestAction, bestDelta }
  }

  function settleGearFollowups(targetRun: RunState, maxFollowups = 4, allowVendorBuys = false) {
    for (let followupIndex = 0; followupIndex < maxFollowups; followupIndex += 1) {
      const { bestAction, bestDelta } = findBestImmediateGearFollowup(targetRun, allowVendorBuys && followupIndex === 0)
      if (!bestAction || bestDelta <= 0.05) {
        break
      }

      const result = townServices.applyAction(targetRun, profile, harness.content, bestAction.id)
      if (!result.ok) {
        break
      }
    }
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const baseScore = evaluateRunScore(harness, run, policy, { assumeFullResources: false })
    const actions = townServices
      .listActions(harness.content, run, profile)
      .filter((action: TownAction) => isOptimizableTownAction(action))

    let bestAction: TownAction | null = null
    let bestDelta = 0

    actions.forEach((action: TownAction) => {
      const clone = cloneRun(harness, run)
      const result = townServices.applyAction(clone, profile, harness.content, action.id)
      if (!result.ok) {
        return
      }

      if ((action.id || "") === "vendor_refresh_stock") {
        settleGearFollowups(clone, 4, true)
      } else if (isGearFollowupAction(action.id || "")) {
        settleGearFollowups(clone, 4, false)
      }

      const nextScore = evaluateRunScore(harness, clone, policy, { assumeFullResources: false })
      const delta = nextScore - baseScore
      if (delta > bestDelta) {
        bestDelta = delta
        bestAction = action
      }
    })

    if (!bestAction || bestDelta <= 0.05) {
      break
    }

    const result = townServices.applyAction(run, profile, harness.content, bestAction.id)
    if (!result.ok) {
      break
    }

    if ((bestAction.id || "") === "vendor_refresh_stock") {
      settleGearFollowups(run, 4, true)
    } else if (isGearFollowupAction(bestAction.id || "")) {
      settleGearFollowups(run, 4, false)
    }
  }
}
