/* eslint-disable max-lines */
(() => {
  type CardTextLine = { short: string; full: string };
  type CardTextApi = {
    keywordHints: Record<string, string>;
    describeCompactEffect(effect: CardEffect): CardTextLine;
    buildCompactCardText(effects: CardEffect[]): string;
    buildFullCardText(effects: CardEffect[], maxLines?: number): string;
    formatCompactRuleLine(
      line: string,
      escapeHtml: (value: string) => string,
      valueClass: string,
      keywordClass: string
    ): string;
  };

  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & { ROUGE_CARD_TEXT?: CardTextApi };

  const { hero, mercenaryCatalog } = runtimeWindow.__ROUGE_GC_MERCENARIES;
  const { consequenceEncounterPackages } = runtimeWindow.__ROUGE_GC_ENCOUNTERS;
  const { consequenceRewardPackages } = runtimeWindow.__ROUGE_GC_REWARDS;
  const { classCardCatalog, classStarterDecks, classRewardPools } = runtimeWindow.__ROUGE_CLASS_CARDS;

  const cardCatalog: Record<string, CardDefinition> = {
    swing: {
      id: "swing",
      title: "Swing",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage.",
      effects: [{ kind: "damage", value: 7 }],
    },
    measured_swing: {
      id: "measured_swing",
      title: "Measured Swing",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 4 },
      ],
    },
    mark_target: {
      id: "mark_target",
      title: "Mark Target",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Your mercenary deals +4 to this target.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "mark_enemy_for_mercenary", value: 4 },
      ],
    },
    kick: {
      id: "kick",
      title: "Kick",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Apply 1 Stun.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "apply_stun", value: 1 },
      ],
    },
    forward_guard: {
      id: "forward_guard",
      title: "Forward Guard",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 6 Guard. Mercenary next attack +3.",
      effects: [
        { kind: "gain_guard_party", value: 6 },
        { kind: "buff_mercenary_next_attack", value: 3 },
      ],
    },
    shove: {
      id: "shove",
      title: "Shove",
      cost: 2,
      target: "enemy",
      text: "Deal 6 damage. Apply 2 Slow.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "apply_slow", value: 2 },
      ],
    },
    rally_mercenary: {
      id: "rally_mercenary",
      title: "Rally Mercenary",
      cost: 1,
      target: "none",
      text: "Heal your mercenary 8. Mercenary taunts for 1 turn. Draw 1 card.",
      effects: [
        { kind: "heal_mercenary", value: 8 },
        { kind: "apply_taunt", value: 1 },
        { kind: "draw", value: 1 },
      ],
    },
    field_dressing: {
      id: "field_dressing",
      title: "Field Dressing",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 3 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 3 },
      ],
    },
    swing_plus: {
      id: "swing_plus",
      title: "Swing+",
      cost: 1,
      target: "enemy",
      text: "Deal 10 damage.",
      effects: [{ kind: "damage", value: 10 }],
    },
    measured_swing_plus: {
      id: "measured_swing_plus",
      title: "Measured Swing+",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage. Gain 6 Guard.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "gain_guard_self", value: 6 },
      ],
    },
    mark_target_plus: {
      id: "mark_target_plus",
      title: "Mark Target+",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Your mercenary deals +6 to this target.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "mark_enemy_for_mercenary", value: 6 },
      ],
    },
    kick_plus: {
      id: "kick_plus",
      title: "Kick+",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Apply 2 Stun.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "apply_stun", value: 2 },
      ],
    },
    forward_guard_plus: {
      id: "forward_guard_plus",
      title: "Forward Guard+",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 8 Guard. Mercenary next attack +4.",
      effects: [
        { kind: "gain_guard_party", value: 8 },
        { kind: "buff_mercenary_next_attack", value: 4 },
      ],
    },
    shove_plus: {
      id: "shove_plus",
      title: "Shove+",
      cost: 2,
      target: "enemy",
      text: "Deal 8 damage. Apply 3 Slow.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "apply_slow", value: 3 },
      ],
    },
    rally_mercenary_plus: {
      id: "rally_mercenary_plus",
      title: "Rally Mercenary+",
      cost: 1,
      target: "none",
      text: "Heal your mercenary 8. Draw 1 card.",
      effects: [
        { kind: "heal_mercenary", value: 8 },
        { kind: "draw", value: 1 },
      ],
    },
    field_dressing_plus: {
      id: "field_dressing_plus",
      title: "Field Dressing+",
      cost: 1,
      target: "none",
      text: "Heal 9. Gain 5 Guard.",
      effects: [
        { kind: "heal_hero", value: 9 },
        { kind: "gain_guard_self", value: 5 },
      ],
    },
    guard_stance: {
      id: "guard_stance",
      title: "Guard Stance",
      cost: 1,
      target: "none",
      text: "Gain 8 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_self", value: 8 },
        { kind: "draw", value: 1 },
      ],
    },
    crushing_blow: {
      id: "crushing_blow",
      title: "Crushing Blow",
      cost: 2,
      target: "enemy",
      text: "Deal 12 damage.",
      effects: [{ kind: "damage", value: 12 }],
    },
    press_the_attack: {
      id: "press_the_attack",
      title: "Press the Attack",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Your mercenary deals +8 to this target.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "mark_enemy_for_mercenary", value: 8 },
      ],
    },
    throw_oil: {
      id: "throw_oil",
      title: "Throw Oil",
      cost: 2,
      target: "none",
      text: "Deal 4 damage to all enemies. Apply 1 Burn.",
      effects: [
        { kind: "damage_all", value: 4 },
        { kind: "apply_burn_all", value: 1 },
      ],
    },
    brace: {
      id: "brace",
      title: "Brace",
      cost: 2,
      target: "none",
      text: "Gain 14 Guard.",
      effects: [{ kind: "gain_guard_self", value: 14 }],
    },
    scout_ahead: {
      id: "scout_ahead",
      title: "Scout Ahead",
      cost: 1,
      target: "none",
      text: "Draw 2 cards.",
      effects: [{ kind: "draw", value: 2 }],
    },
    hold_the_line: {
      id: "hold_the_line",
      title: "Hold the Line",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 5 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_party", value: 5 },
        { kind: "draw", value: 1 },
      ],
    },
    triage: {
      id: "triage",
      title: "Triage",
      cost: 1,
      target: "none",
      text: "Heal 5. Heal your mercenary 5.",
      effects: [
        { kind: "heal_hero", value: 5 },
        { kind: "heal_mercenary", value: 5 },
      ],
    },
    regroup: {
      id: "regroup",
      title: "Regroup",
      cost: 2,
      target: "none",
      text: "Gain 5 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_self", value: 5 },
        { kind: "draw", value: 1 },
      ],
    },
  };

  function formatMinionName(minionId: string | undefined): string {
    const parts = String(minionId || "")
      .split("_")
      .slice(1)
      .filter(Boolean);
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  const CARD_TEXT_KEYWORD_HINTS: Record<string, string> = {
    strike: "Deal this much damage to the target.",
    volley: "Deal this much damage to all enemies.",
    summon: "Create this allied minion.",
    guard: "Block incoming damage before it hits Life.",
    heal: "Restore this much Life.",
    aid: "Restore this much Life to your mercenary.",
    draw: "Draw this many cards from your deck.",
    weaken: "Your mercenary deals this much bonus damage to that target.",
    rally: "Your mercenary's next attack gains this much bonus damage.",
    burn: "Applies Burn over time.",
    poison: "Applies Poison over time.",
    slow: "Applies Slow to the target.",
    freeze: "Applies Freeze to the target.",
    stun: "Applies Stun to the target.",
    paralyze: "Applies Paralyze to the target.",
  };

  function describeCompactCardEffect(effect: CardEffect): CardTextLine {
    switch (effect.kind) {
      case "damage":
        return { short: `Strike ${effect.value}`, full: `Deal ${effect.value} damage.` };
      case "damage_all":
        return { short: `Volley ${effect.value}`, full: `Deal ${effect.value} damage to all enemies.` };
      case "summon_minion": {
        const minionName = formatMinionName(effect.minionId) || "Minion";
        return { short: `Summon ${minionName}`, full: `Summon ${minionName}.` };
      }
      case "gain_guard_self":
        return { short: `Guard ${effect.value}`, full: `Gain ${effect.value} Guard.` };
      case "gain_guard_party":
        return { short: `Guard All ${effect.value}`, full: `You and your mercenary gain ${effect.value} Guard.` };
      case "heal_hero":
        return { short: `Heal ${effect.value}`, full: `Heal ${effect.value}.` };
      case "heal_mercenary":
        return { short: `Aid ${effect.value}`, full: `Heal your mercenary ${effect.value}.` };
      case "draw":
        return { short: `Draw ${effect.value}`, full: `Draw ${effect.value} card${effect.value === 1 ? "" : "s"}.` };
      case "mark_enemy_for_mercenary":
        return { short: `Weaken +${effect.value}`, full: `Your mercenary deals +${effect.value} to this target.` };
      case "buff_mercenary_next_attack":
        return { short: `Rally +${effect.value}`, full: `Mercenary next attack +${effect.value}.` };
      case "apply_burn":
        return { short: `Burn ${effect.value}`, full: `Apply ${effect.value} Burn.` };
      case "apply_burn_all":
        return { short: `Burn All ${effect.value}`, full: `Apply ${effect.value} Burn to all enemies.` };
      case "apply_poison":
        return { short: `Poison ${effect.value}`, full: `Apply ${effect.value} Poison.` };
      case "apply_poison_all":
        return { short: `Poison All ${effect.value}`, full: `Apply ${effect.value} Poison to all enemies.` };
      case "apply_slow":
        return { short: `Slow ${effect.value}`, full: `Apply ${effect.value} Slow.` };
      case "apply_slow_all":
        return { short: `Slow All ${effect.value}`, full: `Apply ${effect.value} Slow to all enemies.` };
      case "apply_freeze":
        return { short: `Freeze ${effect.value}`, full: `Apply ${effect.value} Freeze.` };
      case "apply_freeze_all":
        return { short: `Freeze All ${effect.value}`, full: `Apply ${effect.value} Freeze to all enemies.` };
      case "apply_stun":
        return { short: `Stun ${effect.value}`, full: `Apply ${effect.value} Stun.` };
      case "apply_stun_all":
        return { short: `Stun All ${effect.value}`, full: `Apply ${effect.value} Stun to all enemies.` };
      case "apply_paralyze":
        return { short: `Paralyze ${effect.value}`, full: `Apply ${effect.value} Paralyze.` };
      case "apply_paralyze_all":
        return { short: `Paralyze All ${effect.value}`, full: `Apply ${effect.value} Paralyze to all enemies.` };
      default:
        return { short: "Special", full: "Special effect." };
    }
  }

  function buildCardTextLines(effects: CardEffect[]): CardTextLine[] {
    const lines: CardTextLine[] = [];

    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index];

      if (effect.kind === "damage" || effect.kind === "damage_all") {
        let totalDamage = effect.value;
        let hitCount = 1;
        let cursor = index + 1;
        while (cursor < effects.length && effects[cursor].kind === effect.kind) {
          totalDamage += effects[cursor].value;
          hitCount += 1;
          cursor += 1;
        }

        if (hitCount > 1) {
          const targetText = effect.kind === "damage_all" ? " to all enemies" : "";
          const keyword = effect.kind === "damage_all" ? "Volley" : "Strike";
          const hitLabel = hitCount === 1 ? "hit" : "hits";
          lines.push({
            short: `${keyword} ${totalDamage} (${hitCount} ${hitLabel})`,
            full: `Deal ${totalDamage} damage${targetText} in ${hitCount} ${hitLabel}.`,
          });
          index = cursor - 1;
          continue;
        }
      }

      lines.push(describeCompactCardEffect(effect));
    }

    return lines;
  }

  function formatCompactRuleLine(
    line: string,
    escapeHtml: (value: string) => string,
    valueClass: string,
    keywordClass: string
  ): string {
    let html = escapeHtml(line)
      .replace(/([+-]?\d+)/g, `<span class="${valueClass}">$1</span>`);

    html = html.replace(/\b(Strike|Volley|Summon|Guard|Heal|Aid|Draw|Weaken|Rally|Burn|Poison|Slow|Freeze|Stun|Paralyze)\b/gi, (match) => {
      const hint = CARD_TEXT_KEYWORD_HINTS[match.toLowerCase()];
      const titleAttr = hint ? ` title="${escapeHtml(hint)}"` : "";
      return `<span class="${keywordClass}"${titleAttr}>${match}</span>`;
    });

    return html;
  }

  function boostRefinedEffectValue(effect: CardEffect): CardEffect {
    const upgraded = { ...effect };
    switch (effect.kind) {
      case "damage":
      case "damage_all":
      case "gain_guard_self":
      case "gain_guard_party":
      case "heal_hero":
      case "heal_mercenary":
      case "mark_enemy_for_mercenary":
      case "buff_mercenary_next_attack":
        upgraded.value = effect.value + Math.max(2, Math.round(effect.value * 0.3));
        break;
      case "summon_minion":
        upgraded.value = effect.value + 1;
        if (typeof effect.secondaryValue === "number") {
          upgraded.secondaryValue = effect.secondaryValue + 1;
        }
        break;
      case "draw":
      case "apply_burn":
      case "apply_burn_all":
      case "apply_poison":
      case "apply_poison_all":
      case "apply_slow":
      case "apply_slow_all":
      case "apply_freeze":
      case "apply_freeze_all":
      case "apply_stun":
      case "apply_stun_all":
      case "apply_paralyze":
      case "apply_paralyze_all":
        upgraded.value = effect.value + 1;
        break;
      default:
        break;
    }
    return upgraded;
  }

  function joinCardTextLines(lines: CardTextLine[], mode: "short" | "full", maxLines?: number): string {
    return lines
      .slice(0, typeof maxLines === "number" ? Math.max(1, maxLines) : lines.length)
      .map((line) => line[mode])
      .filter(Boolean)
      .join(". ")
      .concat(".");
  }

  function buildCardText(effects: CardEffect[]): string {
    return joinCardTextLines(buildCardTextLines(effects), "short");
  }

  function buildFullCardText(effects: CardEffect[], maxLines?: number): string {
    return joinCardTextLines(buildCardTextLines(effects), "full", maxLines);
  }

  function normalizeCatalogCardText(catalog: Record<string, CardDefinition>): void {
    Object.values(catalog).forEach((card) => {
      if (!card || !Array.isArray(card.effects)) {
        return;
      }
      card.text = buildCardText(card.effects);
    });
  }

  function createGeneratedPlusVariant(card: CardDefinition): CardDefinition {
    const upgradedEffects = (Array.isArray(card.effects) ? card.effects : []).map((effect) => boostRefinedEffectValue(effect));
    return {
      ...card,
      id: `${card.id}_plus`,
      title: card.title.endsWith("+") ? card.title : `${card.title}+`,
      text: buildCardText(upgradedEffects),
      effects: upgradedEffects,
    };
  }

  function addGeneratedPlusVariants(catalog: Record<string, CardDefinition>) {
    const baseCards = Object.values(catalog).filter((card) => card && !card.id.endsWith("_plus"));
    for (const card of baseCards) {
      const plusId = `${card.id}_plus`;
      if (catalog[plusId]) {
        continue;
      }
      catalog[plusId] = createGeneratedPlusVariant(card);
    }
  }

  // Merge class-specific skill cards into the card catalog
  Object.assign(cardCatalog, classCardCatalog);
  addGeneratedPlusVariants(cardCatalog);
  normalizeCatalogCardText(cardCatalog);

  runtimeWindow.ROUGE_CARD_TEXT = {
    keywordHints: CARD_TEXT_KEYWORD_HINTS,
    describeCompactEffect: describeCompactCardEffect,
    buildCompactCardText: buildCardText,
    buildFullCardText,
    formatCompactRuleLine,
  };

  const starterDeck = [
    "swing",
    "swing",
    "swing",
    "measured_swing",
    "measured_swing",
    "mark_target",
    "mark_target",
    "kick",
    "kick",
    "forward_guard",
    "guard_stance",
    "rally_mercenary",
    "field_dressing",
  ];

  const starterDeckProfiles = {
    warrior: [
      "swing",
      "swing",
      "swing",
      "measured_swing",
      "measured_swing",
      "measured_swing",
      "forward_guard",
      "forward_guard",
      "mark_target",
      "guard_stance",
      "rally_mercenary",
      "field_dressing",
      "field_dressing",
    ],
    hunter: [
      "swing",
      "swing",
      "swing",
      "mark_target",
      "mark_target",
      "mark_target",
      "measured_swing",
      "kick",
      "guard_stance",
      "guard_stance",
      "rally_mercenary",
      "field_dressing",
      "forward_guard",
    ],
    caster: [
      "swing",
      "swing",
      "measured_swing",
      "mark_target",
      "kick",
      "kick",
      "kick",
      "guard_stance",
      "guard_stance",
      "rally_mercenary",
      "rally_mercenary",
      "field_dressing",
      "forward_guard",
    ],
  };

  const classDeckProfiles = {
    amazon: "hunter",
    assassin: "hunter",
    barbarian: "warrior",
    druid: "warrior",
    necromancer: "caster",
    paladin: "warrior",
    sorceress: "caster",
  };

  const rewardPools = {
    profileCards: {
      warrior: [
        "brace",
        "crushing_blow",
        "measured_swing_plus",
        "forward_guard_plus",
        "triage",
      ],
      hunter: [
        "press_the_attack",
        "throw_oil",
        "swing_plus",
        "mark_target_plus",
        "scout_ahead",
      ],
      caster: [
        "regroup",
        "shove",
        "kick_plus",
        "field_dressing_plus",
        "hold_the_line",
      ],
    },
    zoneRoleCards: {
      opening: [
        "guard_stance",
        "triage",
        "swing_plus",
      ],
      branchBattle: [
        "shove",
        "hold_the_line",
        "press_the_attack",
      ],
      branchMiniboss: [
        "crushing_blow",
        "throw_oil",
        "forward_guard_plus",
      ],
      boss: [
        "shove_plus",
        "forward_guard_plus",
        "field_dressing_plus",
      ],
    },
    bossCards: [
      "crushing_blow",
      "forward_guard_plus",
      "shove_plus",
      "scout_ahead",
      "rally_mercenary_plus",
    ],
  };

  const enemyCatalog: Record<string, EnemyTemplate> = {
    fallen_cutthroat: {
      templateId: "fallen_cutthroat",
      name: "Fallen Cutthroat",
      maxLife: 16,
      intents: [
        { kind: "attack", label: "Rust Knife", value: 5, target: "hero" },
        { kind: "guard", label: "Scramble", value: 3 },
      ],
    },
    fallen_shaman: {
      templateId: "fallen_shaman",
      name: "Fallen Shaman",
      maxLife: 20,
      intents: [
        { kind: "heal_ally", label: "Dark Prayer", value: 5 },
        { kind: "attack", label: "Cinder Hex", value: 4, target: "hero" },
      ],
    },
    bone_archer: {
      templateId: "bone_archer",
      name: "Bone Archer",
      maxLife: 15,
      intents: [
        { kind: "attack", label: "Aimed Shot", value: 6, target: "lowest_life" },
        { kind: "attack", label: "Barbed Arrow", value: 4, target: "hero" },
      ],
    },
    grave_brute: {
      templateId: "grave_brute",
      name: "Grave Brute",
      maxLife: 28,
      intents: [
        { kind: "guard", label: "Brace", value: 4 },
        { kind: "attack", label: "Maul", value: 8, target: "hero" },
      ],
    },
    corrupted_knight: {
      templateId: "corrupted_knight",
      name: "Corrupted Knight",
      maxLife: 22,
      intents: [
        { kind: "attack", label: "Cleaving Blow", value: 7, target: "hero" },
        { kind: "attack", label: "Shield Rush", value: 5, target: "lowest_life" },
      ],
    },
  };

  const encounterCatalog = {
    blood_moor_raiders: {
      id: "blood_moor_raiders",
      name: "Blighted Moor Raiders",
      description: "Two Fallen cutthroats rush the line while a shaman keeps them in the fight.",
      enemies: [
        { id: "fallen_a", templateId: "fallen_cutthroat" },
        { id: "fallen_b", templateId: "fallen_cutthroat" },
        { id: "shaman", templateId: "fallen_shaman" },
      ],
    },
    burial_grounds: {
      id: "burial_grounds",
      name: "Graveyard Ridge",
      description: "A brute anchors the front while skeletal ranged pressure picks at weak targets.",
      enemies: [
        { id: "grave_brute", templateId: "grave_brute" },
        { id: "bone_archer", templateId: "bone_archer" },
        { id: "fallen_shaman", templateId: "fallen_shaman" },
      ],
    },
    catacombs_gate: {
      id: "catacombs_gate",
      name: "Abbey Vault Gate",
      description: "A larger pack shows the target state: hero and mercenary against a mixed encounter group.",
      enemies: [
        { id: "knight", templateId: "corrupted_knight" },
        { id: "archer_a", templateId: "bone_archer" },
        { id: "archer_b", templateId: "bone_archer" },
        { id: "fallen", templateId: "fallen_cutthroat" },
      ],
    },
  };

  runtimeWindow.ROUGE_GAME_CONTENT = {
    hero,
    mercenaryCatalog,
    cardCatalog,
    starterDeck,
    starterDeckProfiles,
    classDeckProfiles,
    classStarterDecks,
    classRewardPools,
    rewardPools,
    consequenceEncounterPackages,
    consequenceRewardPackages,
    enemyCatalog,
    encounterCatalog,
  };
})();
