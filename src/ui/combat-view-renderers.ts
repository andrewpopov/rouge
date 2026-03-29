(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { getCardElement, ELEMENT_LABELS } = runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION;
  const preview = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const pressure = runtimeWindow.__ROUGE_COMBAT_VIEW_PRESSURE;

  function svgIcon(src: string, cls: string, alt: string): string {
    return `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  const TRAIT_BADGE: Record<string, { icon: string; label: string; css: string }> = {
    swift: { icon: "\u{1F4A8}", label: "Swift", css: "trait--swift" },
    frenzy: { icon: "\u{1F4A2}", label: "Frenzy", css: "trait--frenzy" },
    thorns: { icon: "\u{1FAB6}", label: "Thorns", css: "trait--thorns" },
    regeneration: { icon: "\u{1F49A}", label: "Regen", css: "trait--regen" },
    death_explosion: { icon: "\u{1F4A5}", label: "Volatile", css: "trait--death" },
    death_poison: { icon: "\u2620", label: "Toxic Death", css: "trait--death" },
    death_spawn: { icon: "\u{1F95A}", label: "Spawner", css: "trait--death" },
    flee_on_ally_death: { icon: "\u{1F4A8}", label: "Cowardly", css: "trait--flee" },
    extra_fast: { icon: "\u26A1", label: "Extra Fast", css: "trait--fast" },
    extra_strong: { icon: "\u{1F4AA}", label: "Extra Strong", css: "trait--strong" },
    cursed: { icon: "\u{1F480}", label: "Cursed", css: "trait--cursed" },
    cold_enchanted: { icon: "\u2744", label: "Cold Enchanted", css: "trait--cold" },
    fire_enchanted: { icon: "\u{1F525}", label: "Fire Enchanted", css: "trait--fire" },
    lightning_enchanted: { icon: "\u26A1", label: "Lightning", css: "trait--lightning" },
    stone_skin: { icon: "\u{1F6E1}", label: "Stone Skin", css: "trait--stone" },
    mana_burn: { icon: "\u{1F50B}", label: "Mana Burn", css: "trait--mana" },
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
    escapeHtml: (s: string) => string;
  }): string {
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const hpPct = Math.round((unit.life / unit.maxLife) * 100);
    const lowHp = hpPct > 0 && hpPct <= 25;
    return `
      <div class="sprite ${unit.alive ? "" : "sprite--dead"} ${threatened ? "sprite--incoming-threat" : ""}">
        <div class="sprite__figure ${figureClass}">${portraitHtml}</div>
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
    let threatBadge = "";
    if (isBoss) {
      threatBadge = `<span class="sprite__threat-badge sprite__threat-badge--boss">Boss</span>`;
    } else if (isElite) {
      threatBadge = `<span class="sprite__threat-badge sprite__threat-badge--elite">Elite</span>`;
    }
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
      threatBadge,
      isMarked && !isDead ? `<span class="sprite__mark-badge">Marked</span>` : "",
      renderTraitBadges(enemy.traits),
    ].filter(Boolean).join("");
    const enemyFooter = [effectStrip, traitsContent ? `<div class="sprite__traits">${traitsContent}</div>` : ""]
      .filter(Boolean)
      .join("");
    return `
      <button class="sprite sprite--enemy ${enemyTierClass} ${enemyStageClass} ${isSelected ? "sprite--targeted" : ""} ${isMarked ? "sprite--marked" : ""} ${isDead ? "sprite--dead" : ""}"
              data-action="select-enemy" data-enemy-id="${escapeHtml(enemy.id)}" data-enemy-name="${escapeHtml(enemy.name)}"
              ${isDead || hasOutcome ? "disabled" : ""}>
        ${!isDead && !hasOutcome ? `<div class="sprite__intent ${intentClasses}"><span class="sprite__intent-icon">${intentSvg || "\u2753"}</span><span class="sprite__intent-label">${escapeHtml(intentDesc)}</span>${intentPresentation.targetLabel ? `<span class="sprite__intent-target">${escapeHtml(intentPresentation.targetLabel)}</span>` : ""}</div>` : ""}
        ${isSelected && !isDead ? `<div class="sprite__selection-badge">Locked</div>` : ""}
        <div class="sprite__figure sprite__figure--enemy">${assets ? svgIcon(enemyIcon, "sprite__portrait sprite__portrait--enemy", enemy.name) : escapeHtml(enemy.name.charAt(0))}</div>
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
    cardCount,
    card,
    effectiveCost,
    previewOutcome,
    stateClass,
    stateLabel,
    cantPlay,
    escapeHtml,
  }: {
    instance: { instanceId: string; cardId: string };
    index: number;
    cardCount: number;
    card: CardDefinition;
    effectiveCost: number;
    previewOutcome: string;
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
    const previewSummary = preview.summarizePreviewOutcome(previewOutcome);
    const mid = (cardCount - 1) / 2;
    const offset = index - mid;
    const rotation = offset * 1.4;
    const translateY = Math.abs(offset) * 2;
    return `
      <button class="fan-card ${cantPlay ? "fan-card--disabled" : "fan-card--playable"} ${stateClass} fan-card--${element}${isUpgraded ? " fan-card--upgraded" : ""}"
              data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}"
              data-card-title="${escapeHtml(card.title)}"
              data-card-target="${escapeHtml(card.target)}"
              data-card-playable="${cantPlay ? "false" : "true"}"
              data-preview-scope="${escapeHtml(previewScopes.join(","))}"
              data-preview-label="${escapeHtml(previewLabel)}"
              data-preview-outcome="${escapeHtml(previewOutcome)}"
              title="${escapeHtml(stateLabel || card.text)}"
              style="--fan-rotate:${rotation}deg; --fan-lift:${translateY}px; --fan-index:${index}">
        <div class="fan-card__cost ${effectiveCost < card.cost ? "fan-card__cost--discounted" : ""}">${effectiveCost}</div>
        <div class="fan-card__art">${(() => { if (assets) { return svgIcon(assets.getCardIcon(instance.cardId, card.effects), `fan-card__icon fan-card__icon--${element}`, card.title); } return card.target === "enemy" ? "\u2694" : "\u{1F6E1}"; })()}</div>
        <div class="fan-card__name">${escapeHtml(card.title)}</div>
        <div class="fan-card__desc">${escapeHtml(card.text)}</div>
        <div class="fan-card__intel">
          <span class="fan-card__intel-scope">${escapeHtml(previewLabel)}</span>
          <strong class="fan-card__intel-outcome">${escapeHtml(previewSummary)}</strong>
        </div>
        <div class="fan-card__footer">
          <div class="fan-card__type">${ELEMENT_LABELS[element] || "Skill"}</div>
          ${stateLabel ? `<div class="fan-card__state">${escapeHtml(stateLabel)}</div>` : ""}
        </div>
      </button>
    `;
  }

  type CombatLogTone = "strike" | "status" | "surge" | "summon" | "loss" | "maneuver" | "report";

  function classifyCombatLogEntry(entry: string): { tone: CombatLogTone; icon: string; label: string } {
    const lower = entry.toLowerCase();
    if (lower.includes("encounter lost") || lower.includes(" falls") || lower.includes("falls.")) {
      return { tone: "loss", icon: "\u2620", label: "Loss" };
    }
    if (lower.includes("explodes") || lower.includes("erupts in flame") || lower.includes("frost nova")) {
      return { tone: "loss", icon: "\u2739", label: "Burst" };
    }
    if (lower.includes("resurrect") || lower.includes("spawn") || lower.includes("summon")) {
      return { tone: "summon", icon: "\u2726", label: "Summon" };
    }
    if (
      lower.includes("burn") ||
      lower.includes("poison") ||
      lower.includes("chill") ||
      lower.includes("freeze") ||
      lower.includes("stun") ||
      lower.includes("paralyze") ||
      lower.includes("amplifies") ||
      lower.includes("drains")
    ) {
      return { tone: "status", icon: "\u2727", label: "Affliction" };
    }
    if (lower.includes("guard") || lower.includes("heal") || lower.includes("heals") || lower.includes("gains")) {
      return { tone: "surge", icon: "\u26E8", label: "Surge" };
    }
    if (lower.includes("charging") || lower.includes("flees") || lower.includes("blinking") || lower.includes("teleport")) {
      return { tone: "maneuver", icon: "\u21BB", label: "Shift" };
    }
    if (lower.includes("uses") || lower.includes("attacks") || lower.includes("deals") || lower.includes("zaps")) {
      return { tone: "strike", icon: "\u2694", label: "Strike" };
    }
    return { tone: "report", icon: "\u2022", label: "Report" };
  }

  function formatCombatLogEntryText(entry: string, escapeHtml: (s: string) => string): string {
    return escapeHtml(entry)
      .replace(/(\d+)/g, '<span class="combat-log-entry__value">$1</span>')
      .replace(
        /\b(Burn|Poison|Chill|Freeze|Stun|Paralyze|Slow|Guard|damage|fire|lightning|cold|energy|heals?|drains?|spawns?|resurrects?)\b/gi,
        '<span class="combat-log-entry__keyword">$1</span>'
      );
  }

  function renderCombatLogPanel(combat: CombatState, escapeHtml: (s: string) => string): string {
    const latestEntry = combat.log[0] || "No exchanges yet.";
    const latestMeta = classifyCombatLogEntry(latestEntry);

    return `
      <details class="combat-log" aria-label="Battle Log">
        <summary class="combat-log__toggle">
          <span class="combat-log__toggle-label">Battle Log</span>
          <span class="combat-log__toggle-latest">
            <span class="combat-log__toggle-icon" aria-hidden="true">${latestMeta.icon}</span>
            <span class="combat-log__toggle-text">${escapeHtml(latestEntry)}</span>
          </span>
          <span class="combat-log__toggle-count">${combat.log.length} event${combat.log.length === 1 ? "" : "s"}</span>
        </summary>
        ${combat.log.length > 0 ? `
          <ol class="log-list combat-log-list">
            ${combat.log.map((entry, index) => {
              const { tone, icon, label } = classifyCombatLogEntry(entry);
              return `
                <li class="combat-log-entry combat-log-entry--${tone}${index === 0 ? " combat-log-entry--latest" : ""}">
                  <div class="combat-log-entry__meta">
                    <span class="combat-log-entry__when">${index === 0 ? "Latest" : `${index} beat${index === 1 ? "" : "s"} ago`}</span>
                    <span class="combat-log-entry__tag">${escapeHtml(label)}</span>
                  </div>
                  <div class="combat-log-entry__line">
                    <span class="combat-log-entry__icon" aria-hidden="true">${icon}</span>
                    <p class="combat-log-entry__text">${formatCombatLogEntryText(entry, escapeHtml)}</p>
                  </div>
                </li>
              `;
            }).join("")}
          </ol>
        ` : `
          <div class="combat-log__empty">No exchanges yet. The field is still holding its breath.</div>
        `}
      </details>
    `;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_RENDERERS = {
    renderAllySprite,
    renderEnemySprite,
    renderHandCard,
    renderCombatLogPanel,
  };
})();
