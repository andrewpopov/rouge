(() => {
  type CardTextLine = { short: string; full: string };
  type CardTextApi = {
    describeCompactEffect(effect: CardEffect): CardTextLine;
    formatCompactRuleLine(
      line: string,
      escapeHtml: (value: string) => string,
      valueClass: string,
      keywordClass: string
    ): string;
  };

  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window & { ROUGE_CARD_TEXT?: CardTextApi };
  const { getCardElement } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;
  const preview = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const pressure = runtimeWindow.__ROUGE_COMBAT_VIEW_PRESSURE;
  const cardText = runtimeWindow.ROUGE_CARD_TEXT;
  const CARD_DISPLAY_TITLES: Record<string, string> = {
    rally_mercenary: "Rally Merc.",
    merciless_command: "Merciless Cmd.",
  };

  function svgIcon(src: string, cls: string, alt: string): string {
    return `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  function isTemplatedIllustrationSrc(src: string | null | undefined): boolean {
    return typeof src === "string" && src.includes("/themes/diablo-inspired/icons/cards/");
  }

  type CombatCardRoleKey = "attack" | "guard" | "affliction" | "draw" | "summon" | "setup" | "support" | "utility";
  type CombatCardFamilyKey = "attack" | "skill" | "hex" | "summon";

  function deriveCombatCardRole(card: CardDefinition): { key: CombatCardRoleKey; label: string } {
    const kinds = new Set(card.effects.map((effect) => effect.kind));
    if (kinds.has("summon_minion")) {
      return { key: "summon", label: "Summon" };
    }
    if ([...kinds].some((kind) => kind.startsWith("apply_"))) {
      return { key: "affliction", label: "Hex" };
    }

    switch (card.roleTag) {
      case "answer": return { key: "guard", label: "Guard" };
      case "setup": return { key: "setup", label: "Setup" };
      case "payoff": return { key: "attack", label: "Strike" };
      case "support": return { key: "support", label: "Support" };
      case "salvage": return { key: "draw", label: "Draw" };
      case "conversion": return { key: "utility", label: "Convert" };
    }

    if (kinds.has("gain_guard_self") || kinds.has("gain_guard_party") || kinds.has("heal_hero") || kinds.has("heal_mercenary")) {
      return { key: "guard", label: "Guard" };
    }
    if (kinds.has("draw")) {
      return { key: "draw", label: "Draw" };
    }
    if (kinds.has("mark_enemy_for_mercenary") || kinds.has("buff_mercenary_next_attack")) {
      return { key: "setup", label: "Setup" };
    }
    if (kinds.has("damage") || kinds.has("damage_all")) {
      return { key: "attack", label: "Strike" };
    }

    return { key: "utility", label: "Tactic" };
  }

  function deriveCombatCardFamily(card: CardDefinition, role: { key: CombatCardRoleKey }): { key: CombatCardFamilyKey; label: string } {
    const kinds = new Set(card.effects.map((effect) => effect.kind));
    if (kinds.has("summon_minion")) {
      return { key: "summon", label: "Summon" };
    }
    if (kinds.has("damage") || kinds.has("damage_all")) {
      return { key: "attack", label: "Attack" };
    }
    if ([...kinds].some((kind) => kind.startsWith("apply_"))) {
      return { key: "hex", label: "Hex" };
    }
    if (role.key === "summon") {
      return { key: "summon", label: "Summon" };
    }
    return { key: "skill", label: "Skill" };
  }

  function describeCompactEffect(effect: CardEffect): { short: string; full: string } {
    return cardText?.describeCompactEffect(effect) || { short: "Special", full: "Special effect." };
  }

  function formatCompactRuleLine(line: string, escapeHtml: (s: string) => string, valueClass: string, keywordClass: string): string {
    return cardText?.formatCompactRuleLine(line, escapeHtml, valueClass, keywordClass) || escapeHtml(line);
  }

  function getHandCardTitleFitClass(title: string): string {
    if (title.length >= 16) { return " fan-card--title-very-long"; }
    if (title.length >= 13) { return " fan-card--title-long"; }
    return "";
  }

  function getDisplayCardTitle(cardId: string, title: string): string {
    const upgraded = cardId.endsWith("_plus");
    const baseId = upgraded ? cardId.slice(0, -5) : cardId;
    const mapped = CARD_DISPLAY_TITLES[baseId] || title;
    return upgraded && !mapped.endsWith("+") ? `${mapped}+` : mapped;
  }

  function getAfflictionStateClasses(options: { burn?: number; poison?: number }): string {
    const classes: string[] = [];
    if ((options.burn || 0) > 0) {
      classes.push("sprite--afflicted-burn");
    }
    if ((options.poison || 0) > 0) {
      classes.push("sprite--afflicted-poison");
    }
    return classes.join(" ");
  }

  function renderAfflictionLayers(options: { burn?: number; poison?: number }): string {
    const burn = options.burn || 0;
    const poison = options.poison || 0;
    if (burn <= 0 && poison <= 0) {
      return "";
    }

    return `
      <div class="sprite__affliction-layers" aria-hidden="true">
        ${burn > 0 ? `<span class="sprite__affliction sprite__affliction--burn"></span>` : ""}
        ${poison > 0 ? `<span class="sprite__affliction sprite__affliction--poison"></span>` : ""}
      </div>
    `;
  }

  const TRAIT_BADGE: Record<string, { icon: string; label: string; css: string }> = {
    swift: { icon: "\u{1F4A8}", label: "Swift", css: "trait--swift" }, frenzy: { icon: "\u{1F4A2}", label: "Frenzy", css: "trait--frenzy" },
    thorns: { icon: "\u{1FAB6}", label: "Thorns", css: "trait--thorns" }, regeneration: { icon: "\u{1F49A}", label: "Regen", css: "trait--regen" },
    death_explosion: { icon: "\u{1F4A5}", label: "Volatile", css: "trait--death" }, death_poison: { icon: "\u2620", label: "Toxic Death", css: "trait--death" },
    death_spawn: { icon: "\u{1F95A}", label: "Spawner", css: "trait--death" }, flee_on_ally_death: { icon: "\u{1F4A8}", label: "Cowardly", css: "trait--flee" },
    extra_fast: { icon: "\u26A1", label: "Extra Fast", css: "trait--fast" }, extra_strong: { icon: "\u{1F4AA}", label: "Extra Strong", css: "trait--strong" },
    cursed: { icon: "\u{1F480}", label: "Cursed", css: "trait--cursed" }, cold_enchanted: { icon: "\u2744", label: "Cold Enchanted", css: "trait--cold" },
    fire_enchanted: { icon: "\u{1F525}", label: "Fire Enchanted", css: "trait--fire" }, lightning_enchanted: { icon: "\u26A1", label: "Lightning", css: "trait--lightning" },
    stone_skin: { icon: "\u{1F6E1}", label: "Stone Skin", css: "trait--stone" }, mana_burn: { icon: "\u{1F50B}", label: "Mana Burn", css: "trait--mana" },
  };

  function renderTraitBadges(traits: MonsterTraitKind[] | undefined): string {
    if (!traits || traits.length === 0) { return ""; }
    return traits
      .map((t) => TRAIT_BADGE[t])
      .filter(Boolean)
      .map((badge) => `<span class="sprite__trait ${badge.css}" title="${badge.label}">${badge.icon}</span>`)
      .join("");
  }

  function renderEffectStrip(
    effects: Array<{ css: string; icon: string; value: string; label: string }>
  ): string {
    if (effects.length === 0) {
      return `<div class="sprite__effect-strip sprite__effect-strip--empty" aria-hidden="true"></div>`;
    }
    return `
      <div class="sprite__effect-strip">
        ${effects.map((effect) => `
          <span class="sprite__effect ${effect.css}" title="${effect.label}">
            <span class="sprite__effect-icon">${effect.icon}</span>
            <span class="sprite__effect-value">${effect.value}</span>
          </span>
        `).join("")}
      </div>
    `;
  }

  function renderAllySprite({
    unit,
    figureClass,
    portraitHtml,
    potionAction,
    potionDisabled,
    extraStatusHtml,
    incomingPressureHtml,
    threatened,
    persistentAfflictions,
    escapeHtml,
  }: {
    unit: { alive: boolean; life: number; maxLife: number; guard: number; name: string };
    figureClass: string;
    portraitHtml: string;
    potionAction: string;
    potionDisabled: boolean;
    extraStatusHtml: string;
    incomingPressureHtml: string;
    threatened: boolean;
    persistentAfflictions?: { burn?: number; poison?: number };
    escapeHtml: (s: string) => string;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const hpPct = Math.round((unit.life / unit.maxLife) * 100);
    const lowHp = hpPct > 0 && hpPct <= 25;
    const afflictionStateClasses = getAfflictionStateClasses(persistentAfflictions || {});
    const afflictionLayerHtml = renderAfflictionLayers(persistentAfflictions || {});
    return `
      <div class="sprite ${unit.alive ? "" : "sprite--dead"} ${threatened ? "sprite--incoming-threat" : ""} ${afflictionStateClasses}">
        <div class="sprite__figure ${figureClass}">${afflictionLayerHtml}${portraitHtml}</div>
        <div class="sprite__bars">
          <div class="sprite__hp-bar">
            <div class="sprite__hp-fill sprite__hp-fill--${figureClass === "sprite__figure--hero" ? "hero" : "merc"} ${lowHp ? "sprite__hp-fill--low" : ""}" style="width:${hpPct}%"></div>
            <span class="sprite__hp-text">${unit.life}/${unit.maxLife}</span>
          </div>
          ${unit.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${unit.guard}</div>` : ""}
          ${extraStatusHtml}
        </div>
        <div class="sprite__meta-row">${incomingPressureHtml}</div>
        <div class="sprite__label-row"><div class="sprite__label">${escapeHtml(unit.name)}</div></div>
        <div class="sprite__action-row">
          <button class="sprite__potion" data-action="${potionAction}"
            ${potionDisabled ? "disabled" : ""}>\u{1F9EA}</button>
        </div>
      </div>
    `;
  }

  function renderMinionRack(
    minions: CombatMinionState[],
    escapeHtml: (s: string) => string,
    variant: "stage" | "command" = "stage"
  ): string {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const maxMinions = turns?.MAX_ACTIVE_MINIONS || 3;
    const activeMinions = Array.isArray(minions) ? minions : [];
    return `
      <div class="minion-rack minion-rack--${variant} ${activeMinions.length === 0 ? "minion-rack--empty" : ""}">
        <div class="minion-rack__head">
          <span class="minion-rack__label">${variant === "command" ? "Summons" : "Minions"}</span>
          <span class="minion-rack__count">${activeMinions.length}/${maxMinions}</span>
        </div>
        <div class="minion-rack__list">
          ${activeMinions.length === 0
            ? '<div class="minion-rack__empty">No summons in play.</div>'
            : activeMinions.map((minion) => {
              const summary = turns?.getMinionSkillSummary?.(minion) || minion.skillLabel;
              const durationLabel = minion.persistent ? "Persistent" : `${minion.remainingTurns}t`;
              const toneClass = minion.persistent ? "combat-minion--persistent" : "combat-minion--temporary";
              const previewScopes = (() => {
                const scopes = new Set<string>();
                if (minion.actionKind === "attack_all_burn" || minion.actionKind === "attack_all_paralyze") {
                  scopes.add("enemy_line");
                } else if (minion.targetRule === "selected_enemy" || minion.targetRule === "lowest_life") {
                  scopes.add("selected_enemy");
                }
                if (minion.actionKind === "attack_guard_party" || minion.actionKind === "heal_party" || minion.actionKind === "buff_mercenary_guard_party") {
                  scopes.add("party");
                  if (minion.actionKind === "buff_mercenary_guard_party") {
                    scopes.add("mercenary");
                  }
                } else {
                  if (minion.actionKind === "attack_heal_hero") {
                    scopes.add("hero");
                  }
                  if (minion.actionKind === "attack_mark") {
                    scopes.add("mercenary");
                  }
                }
                return Array.from(scopes);
              })();
              const previewOutcome = summary;
              return `
                <div class="combat-minion ${toneClass}"
                  data-preview-minion-id="${escapeHtml(minion.id)}"
                  data-preview-scope="${escapeHtml(previewScopes.join(","))}"
                  data-preview-label="${escapeHtml(previewScopes.length > 0 ? previewScopes.map((scope) => {
                    if (scope === "selected_enemy") { return "Target"; }
                    if (scope === "enemy_line") { return "Enemy Line"; }
                    if (scope === "party") { return "Party"; }
                    if (scope === "hero") { return "Self"; }
                    if (scope === "mercenary") { return "Mercenary"; }
                    return scope;
                  }).join(" + ") : "Summon")}"
                  data-preview-title="${escapeHtml(`${minion.name} · ${minion.skillLabel}`)}"
                  data-preview-outcome="${escapeHtml(previewOutcome)}">
                  <div class="combat-minion__topline">
                    <span class="combat-minion__name">${escapeHtml(minion.name)}</span>
                    <span class="combat-minion__duration">${escapeHtml(durationLabel)}</span>
                  </div>
                  <div class="combat-minion__skill">${escapeHtml(minion.skillLabel)}</div>
                  <div class="combat-minion__summary">${escapeHtml(summary)}</div>
                </div>
              `;
            }).join("")}
        </div>
      </div>
    `;
  }

  function getEnemyStageProfile(enemy: CombatEnemyState): string {
    const haystack = [
      enemy.family || "",
      enemy.templateId || "",
      enemy.name || "",
      enemy.role || "",
    ]
      .join(" ")
      .toLowerCase();

    const matches = (patterns: readonly string[]): boolean => patterns.some((pattern) => haystack.includes(pattern));

    if (matches(["quill_rat", "spike_fiend", "scarab", "sand_maggot", "rock worm", "devourer", "pain_worm", "beetle", "maggot"])) {
      return "enemy-stage--crawler";
    }

    if (matches(["claw_viper", "pit viper", "tomb_viper", "serpent", "salamander", "viper"])) {
      return "enemy-stage--serpentine";
    }

    if (matches(["wraith", "ghost", "specter", "apparition", "willowisp", "gloam", "burning soul", "black soul"])) {
      return "enemy-stage--spectral";
    }

    if (
      (enemy.role || "").toLowerCase() === "brute" ||
      matches(["thorned_hulk", "balrog", "frozen_horror", "grave_brute", "corrupted_knight", "wendigo", "yeti", "mauler", "hulk", "brute"])
    ) {
      return "enemy-stage--brute";
    }

    if (
      (enemy.role || "").toLowerCase() === "support" ||
      matches(["fallen_shaman", "fetish_shaman", "greater_mummy", "oblivion_knight", "overseer", "vampire", "succubus"])
    ) {
      return "enemy-stage--caster";
    }

    if (
      (enemy.role || "").toLowerCase() === "ranged" ||
      matches(["archer", "slinger", "rogue_archer", "mage"])
    ) {
      return "enemy-stage--ranged";
    }

    if (
      (enemy.role || "").toLowerCase() === "raider" ||
      matches(["fallen", "fetish", "bone_fetish", "rat man"])
    ) {
      return "enemy-stage--skirmisher";
    }

    return "enemy-stage--standard";
  }

  function renderEnemySprite(
    combat: CombatState,
    enemy: CombatEnemyState,
    isSelected: boolean,
    isMarked: boolean,
    hasOutcome: boolean,
    intentDesc: string,
    escapeHtml: (s: string) => string
  ): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const isDead = !enemy.alive;
    const isBoss = enemy.role === "boss" || enemy.templateId.endsWith("_boss");
    const isElite = !isBoss && enemy.templateId.includes("_elite");
    let enemyTierClass = "";
    if (isBoss) {
      enemyTierClass = "sprite--boss";
    } else if (isElite) {
      enemyTierClass = "sprite--elite";
    }
    const enemyStageClass = getEnemyStageProfile(enemy);
    const afflictionStateClasses = getAfflictionStateClasses({ burn: enemy.burn, poison: enemy.poison });
    const afflictionLayerHtml = renderAfflictionLayers({ burn: enemy.burn, poison: enemy.poison });
    const enemyHpPct = Math.round((enemy.life / enemy.maxLife) * 100);
    const enemyIcon = assets ? assets.getEnemyIcon(enemy.templateId || enemy.id) : "";
    const intentSvg = assets ? svgIcon(assets.getIntentIcon(intentDesc), "intent-icon", intentDesc) : "";
    const lowerIntent = intentDesc.toLowerCase();
    let intentTone = "";
    if (lowerIntent.includes("dmg") || lowerIntent.includes("sunder")) { intentTone = "sprite__intent--damage"; }
    else if (lowerIntent.includes("guard") || lowerIntent.includes("heal")) { intentTone = "sprite__intent--defend"; }
    else if (lowerIntent.includes("summon") || lowerIntent.includes("resurrect") || lowerIntent.includes("amplify")) { intentTone = "sprite__intent--special"; }
    const heavyIntentKinds = new Set(["attack_all", "attack_burn_all", "attack_lightning_all", "attack_poison_all", "charge", "corpse_explosion"]);
    if (!isDead && (heavyIntentKinds.has(enemy.currentIntent?.kind) || ((enemy.currentIntent?.value || 0) >= 7 && intentTone === "sprite__intent--damage"))) {
      intentTone = `${intentTone} sprite__intent--heavy`.trim();
    }
    const intentPresentation = pressure.buildEnemyIntentPresentation(combat, enemy.currentIntent);
    const intentClasses = [intentTone, intentPresentation.intentClass].filter(Boolean).join(" ");
    const effectItems = [
      enemy.guard > 0 ? { css: "sprite__effect--guard", icon: assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}", value: String(enemy.guard), label: `Guard ${enemy.guard}` } : null,
      enemy.burn > 0 ? { css: "sprite__effect--burn", icon: "\u{1F525}", value: String(enemy.burn), label: `Burn ${enemy.burn}` } : null,
      enemy.poison > 0 ? { css: "sprite__effect--poison", icon: "\u2620", value: String(enemy.poison), label: `Poison ${enemy.poison}` } : null,
      enemy.slow > 0 ? { css: "sprite__effect--slow", icon: "\u{1F422}", value: String(enemy.slow), label: `Slow ${enemy.slow}` } : null,
      enemy.freeze > 0 ? { css: "sprite__effect--freeze", icon: "\u2744", value: String(enemy.freeze), label: `Freeze ${enemy.freeze}` } : null,
      enemy.stun > 0 ? { css: "sprite__effect--stun", icon: "\u26A1", value: String(enemy.stun), label: `Stun ${enemy.stun}` } : null,
      enemy.paralyze > 0 ? { css: "sprite__effect--paralyze", icon: "\u{1F50C}", value: String(enemy.paralyze), label: `Paralyze ${enemy.paralyze}` } : null,
    ].filter(Boolean) as Array<{ css: string; icon: string; value: string; label: string }>;
    const effectStrip = effectItems.length > 0 ? renderEffectStrip(effectItems) : "";
    const traitsContent = [
      isMarked && !isDead ? `<span class="sprite__mark-badge">Marked</span>` : "",
      renderTraitBadges(enemy.traits),
    ].filter(Boolean).join("");
    const enemyBadgeRail = traitsContent ? `<div class="sprite__badge-rail">${traitsContent}</div>` : "";
    const enemyFooter = effectStrip || "";
    return `
      <button class="sprite sprite--enemy ${enemyTierClass} ${enemyStageClass} ${isSelected ? "sprite--targeted" : ""} ${isMarked ? "sprite--marked" : ""} ${isDead ? "sprite--dead" : ""} ${afflictionStateClasses}"
              data-action="select-enemy" data-enemy-id="${escapeHtml(enemy.id)}" data-enemy-name="${escapeHtml(enemy.name)}"
              ${isDead || hasOutcome ? "disabled" : ""}>
        ${!isDead && !hasOutcome ? `<div class="sprite__intent ${intentClasses}"><span class="sprite__intent-icon">${intentSvg || "\u2753"}</span><span class="sprite__intent-label">${escapeHtml(intentDesc)}</span>${intentPresentation.targetLabel ? `<span class="sprite__intent-target">${escapeHtml(intentPresentation.targetLabel)}</span>` : ""}</div>` : ""}
        ${enemyBadgeRail}
        <div class="sprite__figure sprite__figure--enemy">${afflictionLayerHtml}${assets ? svgIcon(enemyIcon, "sprite__portrait sprite__portrait--enemy", enemy.name) : escapeHtml(enemy.name.charAt(0))}</div>
        <div class="sprite__bars">
          <div class="sprite__hp-bar">
            <div class="sprite__hp-fill sprite__hp-fill--enemy" style="width:${enemyHpPct}%"></div>
            <span class="sprite__hp-text">${enemy.life}/${enemy.maxLife}</span>
          </div>
        </div>
        <div class="sprite__label-row"><div class="sprite__label">${escapeHtml(enemy.name)}</div></div>
        <div class="sprite__action-row sprite__action-row--enemy">
          ${enemyFooter ? `<div class="sprite__enemy-footer">${enemyFooter}</div>` : '<span class="sprite__action-spacer" aria-hidden="true"></span>'}
        </div>
      </button>
    `;
  }

  function renderHandCard({
    instance,
    index,
    card,
    effectiveCost,
    previewOutcome,
    maxRuleLines = 4,
    stateClass,
    stateLabel,
    cantPlay,
    escapeHtml,
  }: {
    instance: { instanceId: string; cardId: string };
    index: number;
    card: CardDefinition;
    effectiveCost: number;
    previewOutcome: string;
    maxRuleLines?: number;
    stateClass: string;
    stateLabel: string;
    cantPlay: boolean;
    escapeHtml: (s: string) => string;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const element = getCardElement(card);
    const isUpgraded = instance.cardId.endsWith("_plus");
    const previewScopes = preview.derivePreviewScopes(card);
    const previewLabel = preview.describePreviewScopes(previewScopes);
    const rotation = 0;
    const translateY = 0;
    const sigilSrc = assets ? assets.getCardIcon(instance.cardId, card.effects) : "";
    const customIllustrationSrc = assets?.getCardIllustration ? assets.getCardIllustration(instance.cardId) : null;
    const templatedIllustration = isTemplatedIllustrationSrc(customIllustrationSrc);
    const role = deriveCombatCardRole(card);
    const family = deriveCombatCardFamily(card, role);
    const frameSrc = assets?.getCardFrame ? assets.getCardFrame(role.key) : null;
    const typeLine = family.label;
    const emblemSrc = templatedIllustration ? customIllustrationSrc : sigilSrc;
    const displayTitle = getDisplayCardTitle(instance.cardId, card.title);
    const titleFitClass = getHandCardTitleFitClass(displayTitle);
    const cardStyle = `--fan-rotate:${rotation}deg; --fan-lift:${translateY}px; --fan-index:${index}${frameSrc ? `; --card-frame-url:url('${escapeHtml(frameSrc)}')` : ""}`;
    const ruleLines = card.effects
      .map((effect) => describeCompactEffect(effect))
      .slice(0, Math.max(1, maxRuleLines));
    const rulesText = ruleLines.length > 0
      ? ruleLines.map((line) => line.full).join(" ")
      : card.text;
    const cardRulesHtml = `<p class="fan-card__rules-paragraph">${formatCompactRuleLine(rulesText, escapeHtml, "fan-card__text-value", "fan-card__text-keyword")}</p>`;
    const emblemInner = `
      <div class="fan-card__art-emblem">
        ${emblemSrc ? svgIcon(emblemSrc, `fan-card__art-emblem-icon fan-card__art-emblem-icon--${element}${templatedIllustration ? " fan-card__art-emblem-icon--templated" : ""}`, card.title) : `<div class="fan-card__art-fallback" aria-hidden="true">${card.target === "enemy" ? "\u2694" : "\u{1F6E1}"}</div>`}
      </div>
    `;
    return `
      <button class="fan-card ${cantPlay ? "fan-card--disabled" : "fan-card--playable"} ${stateClass} fan-card--${element} fan-card--role-${role.key} fan-card--family-${family.key}${isUpgraded ? " fan-card--upgraded" : ""}${customIllustrationSrc ? " fan-card--illustrated" : " fan-card--icon-forward"}${templatedIllustration ? " fan-card--templated" : ""}${frameSrc ? " fan-card--framed" : ""}${titleFitClass}"
              data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}"
              data-card-id="${escapeHtml(instance.cardId)}"
              data-card-title="${escapeHtml(card.title)}"
              data-card-target="${escapeHtml(card.target)}"
              data-card-playable="${cantPlay ? "false" : "true"}"
              data-preview-scope="${escapeHtml(previewScopes.join(","))}"
              data-preview-label="${escapeHtml(previewLabel)}"
              data-preview-outcome="${escapeHtml(previewOutcome)}"
              title="${escapeHtml(stateLabel || card.text)}"
              style="${cardStyle}">
        <div class="fan-card__surface">
          <div class="fan-card__header">
            <div class="fan-card__cost ${effectiveCost < card.cost ? "fan-card__cost--discounted" : ""}">${effectiveCost}</div>
            <div class="fan-card__title-ribbon">
              <div class="fan-card__name" title="${escapeHtml(card.title)}">
                <span class="fan-card__name-text">${escapeHtml(displayTitle)}</span>
              </div>
            </div>
          </div>
          <div class="fan-card__art">
            <div class="fan-card__art-stage fan-card__art-stage--${element}${customIllustrationSrc ? " fan-card__art-stage--illustrated" : " fan-card__art-stage--sigil"}${templatedIllustration ? " fan-card__art-stage--templated" : ""}">
              ${customIllustrationSrc ? `
                ${templatedIllustration ? emblemInner : ""}
                <img src="${customIllustrationSrc}" class="fan-card__art-illustration fan-card__art-illustration--${element}${templatedIllustration ? " fan-card__art-illustration--templated" : ""}" alt="" aria-hidden="true" loading="eager" decoding="async" onerror="this.style.display='none'" />
                ${sigilSrc ? `<span class="fan-card__sigil">${svgIcon(sigilSrc, `fan-card__sigil-icon fan-card__sigil-icon--${element}`, card.title)}</span>` : ""}
              ` : `
                ${emblemInner}
              `}
              <div class="fan-card__art-rim" aria-hidden="true"></div>
            </div>
          </div>
          <div class="fan-card__type-line">
            <span class="fan-card__type-label">${escapeHtml(typeLine)}</span>
          </div>
          <div class="fan-card__copy">
            <div class="fan-card__rules">
              <div class="fan-card__desc">${cardRulesHtml}</div>
            </div>
          </div>
        </div>
      </button>
    `;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS = {
    renderAllySprite,
    renderMinionRack,
    renderEnemySprite,
    renderHandCard,
    svgIcon,
    getCardElement,
    isTemplatedIllustrationSrc,
    deriveCombatCardRole,
    deriveCombatCardFamily,
    getHandCardTitleFitClass,
    getDisplayCardTitle,
    describeCompactEffect,
    formatCompactRuleLine,
  };
})();
