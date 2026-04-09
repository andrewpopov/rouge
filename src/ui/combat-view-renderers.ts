(() => {
  type CardTextLine = { short: string; full: string };
  type CardTextApi = {
    describeCompactEffect(effect: CardEffect): CardTextLine;
    buildFullCardText?(effects: CardEffect[], maxLines?: number): string;
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

  function renderStatusIcon(key: string, label: string, extraClasses = ""): string {
    const src = runtimeWindow.ROUGE_ASSET_MAP?.getUiIcon?.(key) || "";
    if (!src) {
      return "";
    }
    return svgIcon(src, ["status-icon", `status-icon--${key}`, extraClasses].filter(Boolean).join(" "), label);
  }

  function isTemplatedIllustrationSrc(src: string | null | undefined): boolean {
    return typeof src === "string" && src.includes("/themes/diablo-inspired/icons/cards/");
  }

  type CombatCardRoleKey = "attack" | "guard" | "affliction" | "draw" | "summon" | "setup" | "support" | "utility";
  type CombatCardFamilyKey = "attack" | "skill" | "hex" | "summon";
  type CombatCardShellClass = "fan-card" | "dl-card";

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

  function getCardTitleFitClass(shellClass: CombatCardShellClass, title: string): string {
    if (title.length >= 16) { return ` ${shellClass}--title-very-long`; }
    if (title.length >= 13) { return ` ${shellClass}--title-long`; }
    return "";
  }

  function getHandCardTitleFitClass(title: string): string {
    return getCardTitleFitClass("fan-card", title);
  }

  function getDisplayCardTitle(cardId: string, title: string): string {
    const upgraded = cardId.endsWith("_plus");
    const baseId = upgraded ? cardId.slice(0, -5) : cardId;
    const mapped = CARD_DISPLAY_TITLES[baseId] || title;
    return upgraded && !mapped.endsWith("+") ? `${mapped}+` : mapped;
  }

  function renderCombatCardComponent({
    shellClass,
    rootTag,
    rootAttrs = "",
    rootStyle = "",
    extraRootClasses = "",
    headerRightHtml = "",
    cardId,
    card,
    effectiveCost,
    escapeHtml,
    maxRuleLines = 4,
  }: {
    shellClass: CombatCardShellClass;
    rootTag: "article" | "button";
    rootAttrs?: string;
    rootStyle?: string;
    extraRootClasses?: string;
    headerRightHtml?: string;
    cardId: string;
    card: CardDefinition;
    effectiveCost: number;
    escapeHtml: (s: string) => string;
    maxRuleLines?: number;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const element = getCardElement(card);
    const isUpgraded = cardId.endsWith("_plus");
    const sigilSrc = assets ? assets.getCardIcon(cardId, card.effects) : "";
    const customIllustrationSrc = assets?.getCardIllustration ? assets.getCardIllustration(cardId) : null;
    const templatedIllustration = isTemplatedIllustrationSrc(customIllustrationSrc);
    const role = deriveCombatCardRole(card);
    const family = deriveCombatCardFamily(card, role);
    const frameSrc = assets?.getCardFrame ? assets.getCardFrame(role.key) : null;
    const typeLine = family.label;
    const emblemSrc = templatedIllustration ? customIllustrationSrc : sigilSrc;
    const displayTitle = getDisplayCardTitle(cardId, card.title);
    const titleFitClass = getCardTitleFitClass(shellClass, displayTitle);
    let genericTitleFitClass = "";
    if (displayTitle.length >= 16) { genericTitleFitClass = " combat-card--title-very-long"; }
    else if (displayTitle.length >= 13) { genericTitleFitClass = " combat-card--title-long"; }
    const fallbackRuleLines = card.effects
      .map((effect) => describeCompactEffect(effect))
      .slice(0, Math.max(1, maxRuleLines));
    const rulesText = Array.isArray(card.effects) && card.effects.length > 0
      ? (cardText?.buildFullCardText?.(card.effects, maxRuleLines) || fallbackRuleLines.map((line) => line.full).join(" "))
      : card.text;
    const shellVariant = shellClass === "dl-card" ? "deck" : "hand";
    const rootClassName = `${shellClass} combat-card combat-card--${shellVariant}${extraRootClasses} ${shellClass}--${element} combat-card--${element} ${shellClass}--role-${role.key} combat-card--role-${role.key} ${shellClass}--family-${family.key} combat-card--family-${family.key}${isUpgraded ? ` ${shellClass}--upgraded combat-card--upgraded` : ""}${customIllustrationSrc ? ` ${shellClass}--illustrated combat-card--illustrated` : ` ${shellClass}--icon-forward combat-card--icon-forward`}${templatedIllustration ? ` ${shellClass}--templated combat-card--templated` : ""}${frameSrc ? ` ${shellClass}--framed combat-card--framed` : ""}${titleFitClass}${genericTitleFitClass}`;
    const styleParts = [
      rootStyle.trim(),
      frameSrc ? `--card-frame-url:url('${escapeHtml(frameSrc)}')` : "",
    ].filter(Boolean);
    const styleAttr = styleParts.length > 0 ? `style="${styleParts.join("; ")}"` : "";
    const artFrameModeClasses = `${customIllustrationSrc ? " combat-card__art-frame--illustrated" : " combat-card__art-frame--sigil"}${templatedIllustration ? " combat-card__art-frame--templated" : ""}`;
    const emblemIconClass = `combat-card__art-emblem-icon combat-card__art-emblem-icon--${element}${templatedIllustration ? " combat-card__art-emblem-icon--templated" : ""}`;
    const illustrationClass = `combat-card__art-illustration combat-card__art-illustration--${element}${templatedIllustration ? " combat-card__art-illustration--templated" : ""}`;
    const rulesParagraphClass = "combat-card__rules-paragraph";
    const valueClass = "combat-card__text-value";
    const keywordClass = "combat-card__text-keyword";
    const rulesHtml = `<p class="${rulesParagraphClass}">${formatCompactRuleLine(rulesText, escapeHtml, valueClass, keywordClass)}</p>`;
    const emblemInner = `
      <div class="combat-card__art-emblem">
        ${emblemSrc ? svgIcon(emblemSrc, emblemIconClass, card.title) : `<div class="combat-card__art-fallback" aria-hidden="true">${card.target === "enemy" ? "\u2694" : "\u{1F6E1}"}</div>`}
      </div>
    `;
    const artInner = customIllustrationSrc ? `
      ${templatedIllustration ? emblemInner : ""}
      <img src="${customIllustrationSrc}" class="${illustrationClass}" alt="" aria-hidden="true" loading="eager" decoding="async" onerror="this.style.display='none'" />
    ` : emblemInner;

    return `
      <${rootTag} class="${rootClassName.trim()}"${rootAttrs ? ` ${rootAttrs}` : ""}${styleAttr ? ` ${styleAttr}` : ""}>
        <div class="combat-card__surface">
          <div class="combat-card__header">
            <div class="combat-card__cost ${effectiveCost < card.cost ? `${shellClass}__cost--discounted combat-card__cost--discounted` : ""}">${effectiveCost}</div>
            <div class="combat-card__title-ribbon">
              <span class="combat-card__name" title="${escapeHtml(card.title)}">
                <span class="combat-card__name-text">${escapeHtml(displayTitle)}</span>
              </span>
            </div>
            ${headerRightHtml}
          </div>
          <div class="combat-card__art">
            <div class="combat-card__art-frame${artFrameModeClasses}">
              ${artInner}
            </div>
          </div>
          <div class="combat-card__type-line">
            <span class="combat-card__type-label">${escapeHtml(typeLine)}</span>
          </div>
          <div class="combat-card__body">
            <div class="combat-card__rules">
              ${rulesHtml}
            </div>
          </div>
        </div>
      </${rootTag}>
    `;
  }

  interface AfflictionOptions {
    burn?: number;
    poison?: number;
    slow?: number;
    freeze?: number;
    stun?: number;
    paralyze?: number;
  }

  function getAfflictionStateClasses(options: AfflictionOptions): string {
    const classes: string[] = [];
    if ((options.burn || 0) > 0) { classes.push("sprite--afflicted-burn"); }
    if ((options.poison || 0) > 0) { classes.push("sprite--afflicted-poison"); }
    if ((options.freeze || 0) > 0) { classes.push("sprite--afflicted-freeze"); }
    if ((options.stun || 0) > 0) { classes.push("sprite--afflicted-stun"); }
    if ((options.paralyze || 0) > 0) { classes.push("sprite--afflicted-paralyze"); }
    if ((options.slow || 0) > 0) { classes.push("sprite--afflicted-slow"); }
    return classes.join(" ");
  }

  function renderAfflictionLayers(options: AfflictionOptions): string {
    const entries = [
      (options.burn || 0) > 0 ? "burn" : "",
      (options.poison || 0) > 0 ? "poison" : "",
      (options.freeze || 0) > 0 ? "freeze" : "",
      (options.stun || 0) > 0 ? "stun" : "",
      (options.paralyze || 0) > 0 ? "paralyze" : "",
      (options.slow || 0) > 0 ? "slow" : "",
    ].filter(Boolean);
    if (entries.length === 0) {
      return "";
    }
    return `
      <div class="sprite__affliction-layers" aria-hidden="true">
        ${entries.map((kind) => `<span class="sprite__affliction sprite__affliction--${kind}"></span>`).join("")}
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
          ${unit.guard > 0 ? `<div class="sprite__status sprite__status--guard">${renderStatusIcon("guard", "Guard") || "\u{1F6E1}"} ${unit.guard}</div>` : ""}
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
              const stackCount = turns?.getMinionStackCount?.(minion)
                || Math.max(1, Number((minion as { stackCount?: number }).stackCount || 1));
              const artTier = turns?.getMinionArtTier?.(minion, 5)
                || Math.min(5, stackCount);
              const illustrationSrc = runtimeWindow.ROUGE_ASSET_MAP?.getMinionIllustration?.(minion.templateId, artTier) || null;
              const previewScopes = (() => {
                const scopes = new Set<string>();
                if (minion.actionKind === "attack_all" || minion.actionKind === "attack_all_burn" || minion.actionKind === "attack_all_paralyze") {
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
                <div class="combat-minion ${toneClass}${illustrationSrc ? " combat-minion--illustrated" : ""}"
                  data-preview-minion-id="${escapeHtml(minion.id)}"
                  data-minion-stack-count="${escapeHtml(String(stackCount))}"
                  data-minion-art-tier="${escapeHtml(String(artTier))}"
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
                  ${illustrationSrc ? `
                    <div class="combat-minion__visual" aria-hidden="true">
                      <div class="combat-minion__art-frame">
                        <img src="${escapeHtml(illustrationSrc)}" class="combat-minion__art" alt="" loading="lazy" decoding="async" onerror="this.closest('.combat-minion__visual').style.display='none'" />
                      </div>
                      <span class="combat-minion__stack">x${escapeHtml(String(stackCount))}</span>
                    </div>
                  ` : ""}
                  <div class="combat-minion__content">
                    <div class="combat-minion__topline">
                      <span class="combat-minion__name">${escapeHtml(minion.name)}</span>
                      <span class="combat-minion__duration">${escapeHtml(durationLabel)}</span>
                    </div>
                    <div class="combat-minion__skill">${escapeHtml(minion.skillLabel)}</div>
                    <div class="combat-minion__summary">${escapeHtml(summary)}</div>
                  </div>
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
    const afflictionStateClasses = getAfflictionStateClasses({ burn: enemy.burn, poison: enemy.poison, slow: enemy.slow, freeze: enemy.freeze, stun: enemy.stun, paralyze: enemy.paralyze });
    const afflictionLayerHtml = renderAfflictionLayers({ burn: enemy.burn, poison: enemy.poison, slow: enemy.slow, freeze: enemy.freeze, stun: enemy.stun, paralyze: enemy.paralyze });
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
    const intentPresentation = pressure.buildEnemyIntentPresentation(combat, enemy);
    const intentClasses = [intentTone, intentPresentation.intentClass].filter(Boolean).join(" ");
    const effectItems = [
      enemy.guard > 0 ? { css: "sprite__effect--guard", icon: renderStatusIcon("guard", "Guard") || "\u{1F6E1}", value: String(enemy.guard), label: `Guard ${enemy.guard}` } : null,
      enemy.burn > 0 ? { css: "sprite__effect--burn", icon: renderStatusIcon("burn", "Burn") || "\u{1F525}", value: String(enemy.burn), label: `Burn ${enemy.burn}` } : null,
      enemy.poison > 0 ? { css: "sprite__effect--poison", icon: renderStatusIcon("poison", "Poison") || "\u2620", value: String(enemy.poison), label: `Poison ${enemy.poison}` } : null,
      enemy.slow > 0 ? { css: "sprite__effect--slow", icon: renderStatusIcon("slow", "Slow") || "\u23F3", value: String(enemy.slow), label: `Slow ${enemy.slow}` } : null,
      enemy.freeze > 0 ? { css: "sprite__effect--freeze", icon: renderStatusIcon("freeze", "Freeze") || "\u2744", value: String(enemy.freeze), label: `Freeze ${enemy.freeze}` } : null,
      enemy.stun > 0 ? { css: "sprite__effect--stun", icon: renderStatusIcon("stun", "Stun") || "\u26A1", value: String(enemy.stun), label: `Stun ${enemy.stun}` } : null,
      enemy.paralyze > 0 ? { css: "sprite__effect--paralyze", icon: renderStatusIcon("paralyze", "Paralyze") || "\u{1F50C}", value: String(enemy.paralyze), label: `Paralyze ${enemy.paralyze}` } : null,
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
        ${!isDead && !hasOutcome ? `<div class="sprite__intent ${intentClasses}"><span class="sprite__intent-icon">${intentSvg || "\u2753"}</span><span class="sprite__intent-label">${escapeHtml(intentDesc)}</span>${intentPresentation.targetLabel ? `<span class="sprite__intent-target">${escapeHtml(intentPresentation.targetLabel)}</span>` : ""}${intentPresentation.stateLabel ? `<span class="sprite__intent-state">${escapeHtml(intentPresentation.stateLabel)}</span>` : ""}</div>` : ""}
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

  const STATUS_DESCRIPTIONS: Record<string, { iconKey: string; fallbackIcon: string; name: string; color: string; desc: string }> = {
    burn: { iconKey: "burn", fallbackIcon: "\u{1F525}", name: "Burn", color: "#f4a87c", desc: "Takes damage each turn. Stacks decay by 1." },
    poison: { iconKey: "poison", fallbackIcon: "\u2620", name: "Poison", color: "#7cd48c", desc: "Takes damage each turn. Stacks decay by 1." },
    slow: { iconKey: "slow", fallbackIcon: "\u23F3", name: "Slow", color: "#8cc8e8", desc: "Delayed actions. Reduces by 1 each turn." },
    freeze: { iconKey: "freeze", fallbackIcon: "\u2744", name: "Freeze", color: "#a0d8f4", desc: "Cannot act this turn. Reduces by 1." },
    stun: { iconKey: "stun", fallbackIcon: "\u26A1", name: "Stun", color: "#f4e87c", desc: "Cannot act this turn. Reduces by 1." },
    paralyze: { iconKey: "paralyze", fallbackIcon: "\u{1F50C}", name: "Paralyze", color: "#c8a0f4", desc: "Attack power weakened. Reduces by 1." },
  };

  function renderEnemyInspectPanel(
    combat: CombatState,
    enemy: CombatEnemyState,
    escapeHtml: (s: string) => string
  ): string {
    const hpPct = Math.round((enemy.life / enemy.maxLife) * 100);
    const intentDesc = runtimeWindow.ROUGE_COMBAT_ENGINE?.describeIntent?.(enemy.currentIntent) || "Unknown";

    const statuses: Array<{ iconKey: string; fallbackIcon: string; name: string; stacks: number; color: string; desc: string }> = [];
    if (enemy.guard > 0) {
      statuses.push({ iconKey: "guard", fallbackIcon: "\u{1F6E1}", name: "Guard", stacks: enemy.guard, color: "#7caaf4", desc: "Absorbs damage before life is lost." });
    }
    for (const [key, meta] of Object.entries(STATUS_DESCRIPTIONS)) {
      const value = Number((enemy as unknown as Record<string, number>)[key] || 0);
      if (value > 0) {
        statuses.push({ ...meta, stacks: value });
      }
    }

    const traits = Array.isArray(enemy.traits) && enemy.traits.length > 0
      ? enemy.traits.map((trait) => escapeHtml(String(trait).replace(/_/g, " "))).join(", ")
      : "";

    return `
      <div class="enemy-inspect" data-action="close-enemy-inspect" aria-label="Enemy details">
        <div class="enemy-inspect__card">
          <header class="enemy-inspect__header">
            <h3 class="enemy-inspect__name">${escapeHtml(enemy.name)}</h3>
            <span class="enemy-inspect__hp">${enemy.life} / ${enemy.maxLife} HP (${hpPct}%)</span>
          </header>
          ${enemy.alive ? `
            <div class="enemy-inspect__intent">
              <span class="enemy-inspect__intent-label">Intent:</span>
              <span class="enemy-inspect__intent-value">${escapeHtml(intentDesc)}</span>
            </div>
          ` : `<div class="enemy-inspect__intent"><span class="enemy-inspect__intent-value">Defeated</span></div>`}
          ${statuses.length > 0 ? `
            <ul class="enemy-inspect__statuses">
              ${statuses.map((status) => `
                <li class="enemy-inspect__status" style="border-color: ${status.color}33">
                  <span class="enemy-inspect__status-icon">${renderStatusIcon(status.iconKey, status.name, "enemy-inspect__status-icon-asset") || status.fallbackIcon}</span>
                  <div class="enemy-inspect__status-body">
                    <span class="enemy-inspect__status-name" style="color: ${status.color}">${escapeHtml(status.name)} <strong>${status.stacks}</strong></span>
                    <span class="enemy-inspect__status-desc">${escapeHtml(status.desc)}</span>
                  </div>
                </li>
              `).join("")}
            </ul>
          ` : `<p class="enemy-inspect__clean">No active effects.</p>`}
          ${traits ? `<div class="enemy-inspect__traits"><span class="enemy-inspect__traits-label">Traits:</span> ${traits}</div>` : ""}
          <button class="enemy-inspect__close" data-action="close-enemy-inspect">Dismiss</button>
        </div>
      </div>
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
    const previewScopes = preview.derivePreviewScopes(card);
    const previewLabel = preview.describePreviewScopes(previewScopes);
    const rotation = 0;
    const translateY = 0;
    const cardStyle = `--fan-rotate:${rotation}deg; --fan-lift:${translateY}px; --fan-index:${index}`;
    return renderCombatCardComponent({
      shellClass: "fan-card",
      rootTag: "button",
      rootAttrs: `data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}"
              data-card-id="${escapeHtml(instance.cardId)}"
              data-card-title="${escapeHtml(card.title)}"
              data-card-target="${escapeHtml(card.target)}"
              data-card-playable="${cantPlay ? "false" : "true"}"
              data-preview-scope="${escapeHtml(previewScopes.join(","))}"
              data-preview-label="${escapeHtml(previewLabel)}"
              data-preview-outcome="${escapeHtml(previewOutcome)}"
              title="${escapeHtml(stateLabel || card.text)}"`,
      rootStyle: cardStyle,
      extraRootClasses: `${cantPlay ? " fan-card--disabled" : " fan-card--playable"} ${stateClass}`,
      cardId: instance.cardId,
      card,
      effectiveCost,
      escapeHtml,
      maxRuleLines,
    });
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS = {
    renderAllySprite,
    renderMinionRack,
    renderEnemySprite,
    renderEnemyInspectPanel,
    renderHandCard,
    renderCombatCardComponent,
    svgIcon,
    getCardElement,
    isTemplatedIllustrationSrc,
    deriveCombatCardRole,
    deriveCombatCardFamily,
    getCardTitleFitClass,
    getHandCardTitleFitClass,
    getDisplayCardTitle,
    describeCompactEffect,
    formatCompactRuleLine,
  };
})();
