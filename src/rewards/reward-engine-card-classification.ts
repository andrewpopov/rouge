(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const dataApi = registryWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES_DATA as {
    BUILD_PATHS: Record<string, Record<string, { primaryTrees: string[]; supportTrees: string[] }>>;
  };

  const DAMAGE_EFFECT_KINDS = new Set<CardEffectKind>(["damage", "damage_all"]);
  const CONTROL_EFFECT_KINDS = new Set<CardEffectKind>([
    "apply_slow",
    "apply_slow_all",
    "apply_freeze",
    "apply_freeze_all",
    "apply_stun",
    "apply_stun_all",
    "apply_paralyze",
    "apply_paralyze_all",
  ]);
  const SUPPORT_EFFECT_KINDS = new Set<CardEffectKind>([
    "gain_guard_self",
    "gain_guard_party",
    "heal_hero",
    "heal_mercenary",
    "mark_enemy_for_mercenary",
    "buff_mercenary_next_attack",
  ]);
  const SALVAGE_EFFECT_KINDS = new Set<CardEffectKind>(["draw", "heal_hero", "heal_mercenary"]);
  const SETUP_EFFECT_KINDS = new Set<CardEffectKind>(["mark_enemy_for_mercenary", "buff_mercenary_next_attack", "summon_minion"]);
  const SCALING_EFFECT_KINDS = new Set<CardEffectKind>(["apply_burn", "apply_burn_all", "apply_poison", "apply_poison_all", "summon_minion"]);

  function uniqueTags<T>(values: T[]) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
  }

  function getCard(cardId: string, content: GameContent | null = null) {
    return (
      content?.cardCatalog?.[cardId] ||
      runtimeWindow.ROUGE_GAME_CONTENT?.cardCatalog?.[cardId] ||
      runtimeWindow.__ROUGE_CLASS_CARDS?.classCardCatalog?.[cardId] ||
      null
    );
  }

  function getCardTree(cardId: string) {
    return runtimeWindow.__ROUGE_SKILL_EVOLUTION?.getCardTree?.(cardId) || "";
  }

  function getCardClassId(cardId: string, card: CardDefinition | null = null) {
    const source = String(card?.skillRef || cardId || "");
    const prefix = source.split("_")[0] || "";
    return dataApi.BUILD_PATHS[prefix] ? prefix : "";
  }

  function inferCardRewardRole(cardId: string, card: CardDefinition | null) {
    if (!card?.skillRef) {
      return "foundation" as CardRewardRole;
    }
    const effectKinds = new Set((Array.isArray(card.effects) ? card.effects : []).map((effect: CardEffect) => effect.kind));
    const hasDamage = [...effectKinds].some((kind) => DAMAGE_EFFECT_KINDS.has(kind));
    const hasControl = [...effectKinds].some((kind) => CONTROL_EFFECT_KINDS.has(kind));
    const hasSupport = [...effectKinds].some((kind) => SUPPORT_EFFECT_KINDS.has(kind));
    const hasDraw = effectKinds.has("draw");
    const hasArea = effectKinds.has("damage_all") || effectKinds.has("apply_burn_all") || effectKinds.has("apply_poison_all");
    const hasFreezeOrSlow = effectKinds.has("apply_freeze") || effectKinds.has("apply_freeze_all") || effectKinds.has("apply_slow") || effectKinds.has("apply_slow_all");

    if (hasControl) {
      if (hasDamage && !hasArea && !hasFreezeOrSlow && !hasSupport && !hasDraw) {
        return "engine";
      }
      return "tech";
    }
    if ((hasSupport || hasDraw) && !hasDamage) {
      return "support";
    }
    if (hasDamage && hasDraw && !hasSupport && !hasArea) {
      return "engine";
    }
    if (hasDamage && hasSupport && !hasArea) {
      return "support";
    }
    if (hasArea && !hasControl) {
      return "engine";
    }
    if (hasDamage) {
      return "engine";
    }
    return "support";
  }

  function inferCardRoleTag(cardId: string, card: CardDefinition | null): CardRoleTag {
    const role = inferCardRewardRole(cardId, card);
    const effectKinds = new Set((Array.isArray(card?.effects) ? card.effects : []).map((effect: CardEffect) => effect.kind));
    const hasDraw = effectKinds.has("draw");
    const hasSummon = effectKinds.has("summon_minion");
    const hasAreaDamage = effectKinds.has("damage_all");
    const hasSingleDamage = effectKinds.has("damage");
    const hasSupport = [...effectKinds].some((kind) => SUPPORT_EFFECT_KINDS.has(kind));
    const hasControl = [...effectKinds].some((kind) => CONTROL_EFFECT_KINDS.has(kind));

    if (hasDraw && !hasSingleDamage && !hasAreaDamage) {
      return "salvage";
    }
    if (hasSummon || effectKinds.has("mark_enemy_for_mercenary") || effectKinds.has("buff_mercenary_next_attack")) {
      return "setup";
    }
    if (hasAreaDamage || (hasSingleDamage && hasControl) || role === "engine") {
      return "payoff";
    }
    if (hasSupport && hasSingleDamage) {
      return "conversion";
    }
    if (role === "support" || role === "tech" || hasSupport || hasControl) {
      return "support";
    }
    return "answer";
  }

  function inferCardBehaviorTags(cardId: string, card: CardDefinition | null): CardBehaviorTag[] {
    const effectKinds = new Set((Array.isArray(card?.effects) ? card.effects : []).map((effect: CardEffect) => effect.kind));
    const tags: CardBehaviorTag[] = [];
    if ([...effectKinds].some((kind) => DAMAGE_EFFECT_KINDS.has(kind))) {
      tags.push("pressure");
    }
    if ([...effectKinds].some((kind) => CONTROL_EFFECT_KINDS.has(kind))) {
      tags.push("disruption", "tax");
    }
    if ([...effectKinds].some((kind) => SUPPORT_EFFECT_KINDS.has(kind))) {
      tags.push("mitigation", "protection");
    }
    if ([...effectKinds].some((kind) => SALVAGE_EFFECT_KINDS.has(kind))) {
      tags.push("salvage");
    }
    if ([...effectKinds].some((kind) => SETUP_EFFECT_KINDS.has(kind))) {
      tags.push("setup");
    }
    if ([...effectKinds].some((kind) => SCALING_EFFECT_KINDS.has(kind))) {
      tags.push("scaling");
    }
    const roleTag = inferCardRoleTag(cardId, card);
    if (roleTag === "payoff") {
      tags.push("payoff");
    }
    if (roleTag === "conversion") {
      tags.push("conversion");
    }
    if (tags.length === 0) {
      tags.push("pressure");
    }
    return uniqueTags(tags);
  }

  function inferCardCounterTags(cardId: string, card: CardDefinition | null): CounterTag[] {
    const effectKinds = new Set((Array.isArray(card?.effects) ? card.effects : []).map((effect: CardEffect) => effect.kind));
    const tags: CounterTag[] = [];
    if (
      effectKinds.has("gain_guard_self") ||
      effectKinds.has("gain_guard_party") ||
      effectKinds.has("heal_hero") ||
      effectKinds.has("heal_mercenary")
    ) {
      tags.push("anti_attrition", "anti_fire_pressure");
    }
    if (effectKinds.has("draw")) {
      tags.push("anti_tax");
    }
    if (effectKinds.has("damage_all") || effectKinds.has("apply_burn_all") || effectKinds.has("apply_poison_all")) {
      tags.push("anti_summon", "anti_backline");
    }
    if (effectKinds.has("apply_slow") || effectKinds.has("apply_slow_all") || effectKinds.has("apply_freeze") || effectKinds.has("apply_freeze_all")) {
      tags.push("telegraph_respect");
    }
    if (effectKinds.has("apply_stun") || effectKinds.has("apply_stun_all") || effectKinds.has("apply_paralyze") || effectKinds.has("apply_paralyze_all")) {
      tags.push("anti_support_disruption", "anti_backline");
    }
    if (effectKinds.has("summon_minion")) {
      tags.push("anti_attrition", "anti_control");
    }
    const tree = getCardTree(cardId);
    if (tree === "fire") {
      tags.push("anti_fire_pressure");
    }
    if (tree === "lightning") {
      tags.push("anti_lightning_pressure");
    }
    return uniqueTags(tags);
  }

  function buildCardArchetypeTags(cardId: string, card: CardDefinition | null = null) {
    const classId = getCardClassId(cardId, card);
    const tree = getCardTree(cardId);
    if (!classId || !tree) {
      return [];
    }
    return Object.entries(dataApi.BUILD_PATHS[classId] || {})
      .filter(([, path]) => path.primaryTrees.includes(tree) || path.supportTrees.includes(tree))
      .map(([pathId]) => pathId)
      .sort();
  }

  function inferCardSplashRole(cardId: string, card: CardDefinition | null): CardSplashRole {
    const roleTag = inferCardRoleTag(cardId, card);
    const effectKinds = new Set((Array.isArray(card?.effects) ? card.effects : []).map((effect: CardEffect) => effect.kind));
    const hasDamage = [...effectKinds].some((kind) => DAMAGE_EFFECT_KINDS.has(kind));
    const classId = getCardClassId(cardId, card);
    const tree = getCardTree(cardId);
    if (!hasDamage || roleTag === "salvage" || roleTag === "support") {
      return "utility_splash_ok";
    }
    if (
      classId === "sorceress" &&
      ["cold", "fire", "lightning"].includes(tree) &&
      (effectKinds.has("damage") || effectKinds.has("damage_all"))
    ) {
      return "hybrid_only";
    }
    const tags = buildCardArchetypeTags(cardId, card);
    if (tags.length > 1) {
      return "hybrid_only";
    }
    return "primary_only";
  }

  registryWindow.__ROUGE_REWARD_ENGINE_CARD_CLASSIFICATION = {
    getCard,
    getCardTree,
    getCardClassId,
    inferCardRewardRole,
    inferCardRoleTag,
    inferCardBehaviorTags,
    inferCardCounterTags,
    inferCardSplashRole,
    buildCardArchetypeTags,
  };
})();
