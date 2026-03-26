(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { LOADOUT_SLOT_LABELS } = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const { RARITY, buildEquipmentArmorProfile, buildEquipmentWeaponProfile, getRarityLabel } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const { ENTRY_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  const TAB_CHARACTER = "character";
  const TAB_INVENTORY = "inventory";

  const SLOT_GLYPHS: Record<string, string> = {
    helm: "\u25B3",
    amulet: "\u25C7",
    weapon: "\u2694",
    armor: "\u25A2",
    shield: "\u25D5",
    ring1: "\u25CB",
    ring2: "\u25CB",
    belt: "\u2261",
    gloves: "\u2726",
    boots: "\u25BD",
  };

  function svgIcon(src: string, cls: string, alt: string): string {
    return src ? `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />` : "";
  }

  function toTitleCase(input: string | undefined): string {
    return String(input || "")
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function buildEquipmentTooltip(equipment: RunEquipmentState | null, content: GameContent, escapeHtml: (s: string) => string): string {
    if (!equipment) { return ""; }
    const item = runtimeWindow.ROUGE_ITEM_CATALOG.getItemDefinition(content, equipment.itemId);
    if (!item) { return ""; }
    const { describeBonusSet } = runtimeWindow.ROUGE_RUN_STATE;
    const combinedBonuses = { ...item.bonuses };
    if (equipment.rarityBonuses) {
      Object.entries(equipment.rarityBonuses).forEach(([k, v]: [string, number]) => {
        (combinedBonuses as Record<string, number>)[k] = ((combinedBonuses as Record<string, number>)[k] || 0) + v;
      });
    }
    const weaponProfile = buildEquipmentWeaponProfile(equipment, content);
    const armorProfile = buildEquipmentArmorProfile(equipment, content);
    const bonusLines = [
      ...describeBonusSet(combinedBonuses),
      ...runtimeWindow.ROUGE_RUN_STATE.describeWeaponProfile(weaponProfile),
      ...runtimeWindow.ROUGE_RUN_STATE.describeArmorProfile(armorProfile),
    ];
    let rarityClass = "";
    const rarityLabel = getRarityLabel(equipment.rarity);
    if (equipment.rarity === RARITY.MAGIC) { rarityClass = "d2inv-tip--magic"; }
    else if (equipment.rarity === RARITY.RARE) { rarityClass = "d2inv-tip--rare"; }
    else if (equipment.rarity === RARITY.UNIQUE) { rarityClass = "d2inv-tip--unique"; }
    else if (equipment.rarity === RARITY.SET) { rarityClass = "d2inv-tip--set"; }
    const socketLine = `Sockets: ${equipment.insertedRunes.length}/${equipment.socketsUnlocked}/${item.maxSockets}`;
    return `
      <div class="d2inv-tip ${rarityClass}">
        <div class="d2inv-tip__name">${rarityLabel ? `${escapeHtml(rarityLabel)} ` : ""}${escapeHtml(item.name)}</div>
        <div class="d2inv-tip__type">${escapeHtml(item.family || item.slot)}</div>
        ${bonusLines.map((line: string) => `<div class="d2inv-tip__stat">${escapeHtml(line)}</div>`).join("")}
        <div class="d2inv-tip__socket">${escapeHtml(socketLine)}</div>
      </div>
    `;
  }

  function getRarityColorClass(rarity: string | undefined): string {
    if (rarity === RARITY.UNIQUE) { return "d2inv--unique"; }
    if (rarity === RARITY.RARE) { return "d2inv--rare"; }
    if (rarity === RARITY.MAGIC) { return "d2inv--magic"; }
    if (rarity === RARITY.SET) { return "d2inv--set"; }
    if (rarity === RARITY.WHITE) { return "d2inv--normal"; }
    return "";
  }

  function buildSlot(
    slotKey: LoadoutSlotKey,
    equipment: RunEquipmentState | null,
    content: GameContent,
    escapeHtml: (s: string) => string
  ): string {
    const label = LOADOUT_SLOT_LABELS[slotKey] || slotKey;
    const itemDef = equipment ? runtimeWindow.ROUGE_ITEM_CATALOG.getItemDefinition(content, equipment.itemId) : null;
    const colorClass = equipment ? getRarityColorClass(equipment.rarity) : "";
    const filledClass = equipment ? "d2inv-slot--filled" : "";
    const sprite = itemDef ? runtimeWindow.ROUGE_ASSET_MAP.getItemSprite(itemDef.sourceId, equipment?.rarity, equipment?.slot) : null;

    return `
      <div class="d2inv-slot d2inv-slot--${slotKey} ${filledClass} ${colorClass}">
        ${equipment ? `
          <div class="d2inv-slot__item ${colorClass}">
            ${sprite
              ? `<img class="d2inv-slot__sprite" src="${escapeHtml(sprite)}" alt="${escapeHtml(itemDef?.name || "")}">`
              : `<span class="d2inv-slot__item-name">${escapeHtml(itemDef?.name || "?")}</span>`}
          </div>
          <button class="d2inv-slot__remove" data-action="use-town-action"
                  data-town-action-id="inventory_unequip_${slotKey}" title="Unequip">\u00d7</button>
        ` : `
          <span class="d2inv-slot__glyph">${SLOT_GLYPHS[slotKey] || ""}</span>
          <span class="d2inv-slot__empty-label">${escapeHtml(label)}</span>
        `}
        ${buildEquipmentTooltip(equipment, content, escapeHtml)}
      </div>
    `;
  }

  function buildGridCell(
    entry: InventoryEntry,
    content: GameContent,
    escapeHtml: (s: string) => string
  ): string {
    const { getItemDefinition, getRuneDefinition } = runtimeWindow.ROUGE_ITEM_CATALOG;
    const assetMap = runtimeWindow.ROUGE_ASSET_MAP;
    const isEquipment = entry.kind === ENTRY_KIND.EQUIPMENT;
    const itemDef = isEquipment ? getItemDefinition(content, entry.equipment?.itemId || "") : null;
    const runeDef = !isEquipment ? getRuneDefinition(content, entry.runeId || "") : null;
    const name = isEquipment
      ? (itemDef?.name || "Unknown")
      : (runeDef?.name || "Unknown Rune");
    const runeTier = Math.max(1, Math.min(9, runeDef?.progressionTier || 1));
    const colorClass = isEquipment ? getRarityColorClass(entry.equipment?.rarity) : `d2inv--rune d2inv--rune-tier-${runeTier}`;
    const sprite = isEquipment
      ? (itemDef ? assetMap.getItemSprite(itemDef.sourceId, entry.equipment?.rarity, entry.equipment?.slot) : null)
      : (runeDef ? assetMap.getRuneSprite(runeDef.sourceId) : null);
    const meta = isEquipment
      ? toTitleCase(itemDef?.family || itemDef?.slot || "Equipment")
      : `Tier ${runeTier} Rune`;

    return `
      <div class="d2inv-grid-cell ${colorClass}" title="${escapeHtml(name)}">
        <span class="d2inv-grid-cell__meta">${escapeHtml(meta)}</span>
        ${sprite
          ? `<img class="d2inv-grid-cell__sprite" src="${escapeHtml(sprite)}" alt="${escapeHtml(name)}">`
          : `<span class="d2inv-grid-cell__name">${escapeHtml(name)}</span>`}
        <span class="d2inv-grid-cell__label">${escapeHtml(name)}</span>
        ${isEquipment ? `
          <button class="d2inv-grid-cell__use" data-action="use-town-action"
                  data-town-action-id="inventory_equip_${entry.entryId}">Equip</button>
        ` : ""}
      </div>
    `;
  }

  function buildCharmCell(
    charm: CharmDefinition,
    equipped: boolean,
    canEquip: boolean,
    classId: string,
    escapeHtml: (s: string) => string
  ): string {
    const charmSystem = runtimeWindow.ROUGE_CHARM_SYSTEM;
    const { describeBonusSet } = runtimeWindow.ROUGE_RUN_STATE;
    const bonusLines = describeBonusSet(charm.bonuses);
    let sizeLabel = "Small";
    if (charm.size === "grand") { sizeLabel = "Grand"; }
    else if (charm.size === "large") { sizeLabel = "Large"; }
    const classInactive = charm.classId && charm.classId !== classId;
    const sizeClass = `d2inv-charm--${charm.size}`;
    const stateClass = equipped ? "d2inv-charm--equipped" : "";
    const inactiveClass = classInactive ? "d2inv-charm--inactive" : "";

    const actionId = equipped
      ? `${charmSystem.ACTION_UNEQUIP_PREFIX}${charm.id}`
      : `${charmSystem.ACTION_EQUIP_PREFIX}${charm.id}`;
    const actionLabel = equipped ? "Remove" : "Equip";
    const disabled = !equipped && !canEquip;

    return `
      <div class="d2inv-charm ${sizeClass} ${stateClass} ${inactiveClass}" title="${escapeHtml(charm.name)}">
        <div class="d2inv-charm__name">${escapeHtml(charm.name)}</div>
        <div class="d2inv-charm__size">${escapeHtml(sizeLabel)} (${charm.slotCost})</div>
        ${!disabled ? `
          <button class="d2inv-charm__action" data-action="use-town-action"
                  data-town-action-id="${escapeHtml(actionId)}">${escapeHtml(actionLabel)}</button>
        ` : ""}
        <div class="d2inv-tip d2inv-tip--charm">
          <div class="d2inv-tip__name">${escapeHtml(charm.name)}</div>
          <div class="d2inv-tip__type">${escapeHtml(sizeLabel)} Charm \u00b7 ${charm.slotCost} slot${charm.slotCost === 1 ? "" : "s"}</div>
          ${bonusLines.map((line: string) => `<div class="d2inv-tip__stat">${escapeHtml(line)}</div>`).join("")}
          ${charm.classId ? `<div class="d2inv-tip__stat">${escapeHtml(charm.classId)} only</div>` : ""}
          <div class="d2inv-tip__socket">${escapeHtml(charm.source)}</div>
        </div>
      </div>
    `;
  }

  function buildCharmPouchMarkup(appState: AppState, escapeHtml: (s: string) => string): string {
    const charmSystem = runtimeWindow.ROUGE_CHARM_SYSTEM;
    if (!charmSystem || !appState.profile?.meta?.charms) {
      return "";
    }
    const summary = charmSystem.getCharmPouchSummary(appState.profile);
    if (summary.unlockedCount === 0) {
      return "";
    }

    const classId = appState.run?.classId || "";
    const equippedCells = summary.equippedCharms.map(
      (charm: CharmDefinition) => buildCharmCell(charm, true, false, classId, escapeHtml)
    );
    const unequippedCells = summary.unequippedCharms.map(
      (charm: CharmDefinition) => buildCharmCell(charm, false, charmSystem.canEquipCharm(appState.profile, charm.id), classId, escapeHtml)
    );
    const emptySlots = Math.max(0, summary.capacity - summary.slotsUsed);

    return `
      <div class="d2inv-pouch">
        <div class="d2inv__panel-head d2inv__panel-head--pouch">
          <div>
            <div class="d2inv__panel-label">
              Charm Pouch <span class="d2inv__count">${summary.slotsUsed}/${summary.capacity}</span>
            </div>
            <p class="d2inv__panel-copy">Account-bound relics that can be set before the next march.</p>
          </div>
        </div>
        <div class="d2inv-pouch__grid">
          ${equippedCells.join("")}
          ${Array.from({ length: emptySlots }, () => `<div class="d2inv-charm d2inv-charm--empty"></div>`).join("")}
        </div>
        ${unequippedCells.length > 0 ? `
          <div class="d2inv__panel-label d2inv__panel-label--sub">
            Available <span class="d2inv__count">${unequippedCells.length}</span>
          </div>
          <div class="d2inv-pouch__grid">
            ${unequippedCells.join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  function buildTabNav(activeTab: string, escapeHtml: (s: string) => string): string {
    const tabs = [
      { id: TAB_CHARACTER, label: "Bloodline" },
      { id: TAB_INVENTORY, label: "Field Pack" },
    ];
    return `
      <div class="d2inv__tab-nav">
        ${tabs.map((tab) => {
          const active = tab.id === activeTab;
          return `<button class="d2inv__tab ${active ? "d2inv__tab--active" : ""}"
                    data-action="switch-inv-tab" data-inv-tab="${escapeHtml(tab.id)}">${escapeHtml(tab.label)}</button>`;
        }).join("")}
      </div>
    `;
  }

  function buildStatRow(label: string, value: string | number, escapeHtml: (s: string) => string, tone?: string): string {
    const toneClass = tone ? `d2char__stat-value--${tone}` : "";
    return `
      <div class="d2char__stat-row">
        <span class="d2char__stat-label">${escapeHtml(label)}</span>
        <span class="d2char__stat-value ${toneClass}">${escapeHtml(String(value))}</span>
      </div>
    `;
  }

  function getResistanceValue(profile: ArmorMitigationProfile | null | undefined, type: DamageType): number {
    return (profile?.resistances || [])
      .filter((entry) => entry.type === type)
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  }

  function deriveInventoryModel(appState: AppState, services: UiRenderServices) {
    const run = appState.run;
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const derivedParty = common.getDerivedPartyState(run, appState.content, services.itemSystem);
    const bonuses = derivedParty.bonuses;
    const attrs = run.progression?.attributes || { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
    const lifePct = derivedParty.hero.maxLife > 0 ? Math.round((derivedParty.hero.currentLife / derivedParty.hero.maxLife) * 100) : 0;
    const mercLifePct = derivedParty.mercenary.maxLife > 0 ? Math.round((derivedParty.mercenary.currentLife / derivedParty.mercenary.maxLife) * 100) : 0;

    return { run, derivedParty, bonuses, attrs, lifePct, mercLifePct };
  }

  function buildSummaryChip(label: string, value: string | number, escapeHtml: (s: string) => string): string {
    return `
      <div class="d2inv__summary-chip">
        <span class="d2inv__summary-label">${escapeHtml(label)}</span>
        <strong class="d2inv__summary-value">${escapeHtml(String(value))}</strong>
      </div>
    `;
  }

  function buildLifeMeter(
    label: string,
    current: number,
    max: number,
    escapeHtml: (s: string) => string,
    tone: "hero" | "merc"
  ): string {
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
    return `
      <div class="d2inv-hero__life-block">
        <div class="d2inv-hero__life-copy">
          <span class="d2inv-hero__life-label">${escapeHtml(label)}</span>
          <span class="d2inv-hero__life-value">${current}/${max}</span>
        </div>
        <div class="d2inv-hero__life-track">
          <span class="d2inv-hero__life-fill d2inv-hero__life-fill--${tone} ${pct > 0 && pct <= 30 ? "d2inv-hero__life-fill--low" : ""}" style="width:${pct}%"></span>
        </div>
      </div>
    `;
  }

  function buildHeroDossierMarkup(services: UiRenderServices, vm: ReturnType<typeof deriveInventoryModel>): string {
    const { escapeHtml } = services.renderUtils;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const { run, derivedParty } = vm;
    const capacity = runtimeWindow.ROUGE_ITEM_LOADOUT.INVENTORY_CAPACITY;
    const carried = run.inventory?.carried?.length || 0;
    const heroPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";
    const mercPortraitSrc = assets?.getMercenarySprite(run.mercenary.id) || "";
    const heroPortrait = heroPortraitSrc
      ? svgIcon(heroPortraitSrc, "d2inv-hero__portrait-image", run.className)
      : `<span class="d2inv-hero__monogram">${escapeHtml((run.className || "?").slice(0, 2).toUpperCase())}</span>`;
    const mercPortrait = mercPortraitSrc
      ? svgIcon(mercPortraitSrc, "d2inv-hero__companion-image", run.mercenary.name || run.mercenary.role || "Mercenary")
      : `<span class="d2inv-hero__companion-mark">${escapeHtml((run.mercenary.name || run.mercenary.role || "M").charAt(0).toUpperCase())}</span>`;

    return `
      <section class="d2inv-hero">
        <div class="d2inv-hero__art">
          <div class="d2inv-hero__sigil">
            <div class="d2inv-hero__eclipse"></div>
            <div class="d2inv-hero__portrait">${heroPortrait}</div>
          </div>
          <div class="d2inv-hero__identity">
            <div class="d2inv-hero__eyebrow">${escapeHtml(run.safeZoneName || "Safe Haven")}</div>
            <div class="d2inv-hero__name">${escapeHtml(run.className)}</div>
            <div class="d2inv-hero__role">Level ${run.level} · ${escapeHtml(run.actTitle || "Current route")}</div>
            ${buildLifeMeter("Hero Vitality", derivedParty.hero.currentLife, derivedParty.hero.maxLife, escapeHtml, "hero")}
          </div>
        </div>

        <div class="d2inv-hero__resources">
          <div class="d2inv-hero__resource">
            <span class="d2inv-hero__resource-label">Gold</span>
            <strong class="d2inv-hero__resource-value">${run.gold}</strong>
          </div>
          <div class="d2inv-hero__resource">
            <span class="d2inv-hero__resource-label">Deck</span>
            <strong class="d2inv-hero__resource-value">${run.deck?.length || 0}</strong>
          </div>
          <div class="d2inv-hero__resource">
            <span class="d2inv-hero__resource-label">Belt</span>
            <strong class="d2inv-hero__resource-value">${run.belt.current}/${run.belt.max}</strong>
          </div>
          <div class="d2inv-hero__resource">
            <span class="d2inv-hero__resource-label">Pack</span>
            <strong class="d2inv-hero__resource-value">${carried}/${capacity}</strong>
          </div>
        </div>

        <div class="d2inv-hero__companion">
          <div class="d2inv-hero__companion-portrait">${mercPortrait}</div>
          <div class="d2inv-hero__companion-copy">
            <div class="d2inv-hero__companion-label">Mercenary</div>
            <div class="d2inv-hero__companion-name">${escapeHtml(run.mercenary.name || run.mercenary.role || "Companion")}</div>
            ${buildLifeMeter("Companion Vitality", derivedParty.mercenary.currentLife, derivedParty.mercenary.maxLife, escapeHtml, "merc")}
          </div>
        </div>
      </section>
    `;
  }

  function buildInventoryHeader(services: UiRenderServices, activeTab: string, vm: ReturnType<typeof deriveInventoryModel>): string {
    const { escapeHtml } = services.renderUtils;
    const capacity = runtimeWindow.ROUGE_ITEM_LOADOUT.INVENTORY_CAPACITY;
    const carried = vm.run.inventory?.carried?.length || 0;
    const title = activeTab === TAB_CHARACTER ? "Bloodline Dossier" : "Field Pack";
    const subtitle = activeTab === TAB_CHARACTER
      ? "Audit wounds, attributes, and progression before the road turns hostile."
      : "Shift steel and runes between the loadout and your carried relics while the fire still burns.";

    return `
      <div class="d2inv__header">
        <div class="d2inv__header-copy">
          <div class="d2inv__eyebrow">Encampment Ledger</div>
          <h2 class="d2inv__title">${escapeHtml(title)}</h2>
          <p class="d2inv__subtitle">${escapeHtml(subtitle)}</p>
        </div>

        <div class="d2inv__summary">
          ${buildSummaryChip("Bloodline", `${vm.run.className} Lv.${vm.run.level}`, escapeHtml)}
          ${buildSummaryChip("Companion", vm.run.mercenary.name || vm.run.mercenary.role || "Mercenary", escapeHtml)}
          ${buildSummaryChip("Gold", `${vm.run.gold} G`, escapeHtml)}
          ${buildSummaryChip("Pack", `${carried}/${capacity}`, escapeHtml)}
        </div>

        <button class="d2inv__close" data-action="close-inventory">Close</button>
      </div>
    `;
  }

  function buildCharacterMarkup(appState: AppState, services: UiRenderServices, vm: ReturnType<typeof deriveInventoryModel>): string {
    const { escapeHtml } = services.renderUtils;
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const getBonusValue = common.getBonusValue;
    const { run, derivedParty, bonuses, attrs, lifePct } = vm;
    const armorProfile = derivedParty.armorProfile || null;
    const immunityLabel = (armorProfile?.immunities || []).length > 0
      ? (armorProfile.immunities || [])
          .map((type) => toTitleCase(type))
          .join(", ")
      : "None";

    return `
      <div class="d2inv__body d2inv__body--character">
        ${buildHeroDossierMarkup(services, vm)}

        <div class="d2char">
          <div class="d2char__cards">
            <section class="d2char__card">
              <div class="d2char__section-head">Attributes</div>
              ${buildStatRow("Strength", attrs.strength, escapeHtml)}
              ${buildStatRow("Dexterity", attrs.dexterity, escapeHtml)}
              ${buildStatRow("Vitality", attrs.vitality, escapeHtml)}
              ${buildStatRow("Energy", attrs.energy, escapeHtml)}
            </section>

            <section class="d2char__card">
              <div class="d2char__section-head">Progression</div>
              ${buildStatRow("Skill Points", run.progression?.skillPointsAvailable || 0, escapeHtml, (run.progression?.skillPointsAvailable || 0) > 0 ? "highlight" : "")}
              ${buildStatRow("Class Points", run.progression?.classPointsAvailable || 0, escapeHtml, (run.progression?.classPointsAvailable || 0) > 0 ? "highlight" : "")}
              ${buildStatRow("Attribute Points", run.progression?.attributePointsAvailable || 0, escapeHtml, (run.progression?.attributePointsAvailable || 0) > 0 ? "highlight" : "")}
              ${buildStatRow("Experience", run.xp, escapeHtml)}
            </section>

            <section class="d2char__card">
              <div class="d2char__section-head">Hero</div>
              <div class="d2char__stat-row">
                <span class="d2char__stat-label">Life</span>
                <span class="d2char__stat-value ${lifePct < 50 ? "d2char__stat-value--danger" : ""}">${derivedParty.hero.currentLife} / ${derivedParty.hero.maxLife}</span>
              </div>
              ${buildStatRow("Max Energy", derivedParty.hero.maxEnergy, escapeHtml)}
              ${buildStatRow("Potion Heal", derivedParty.hero.potionHeal, escapeHtml)}
              ${buildStatRow("Damage", `+${getBonusValue(bonuses.heroDamageBonus)}`, escapeHtml, getBonusValue(bonuses.heroDamageBonus) > 0 ? "magic" : "")}
              ${buildStatRow("Guard", `+${getBonusValue(bonuses.heroGuardBonus)}`, escapeHtml, getBonusValue(bonuses.heroGuardBonus) > 0 ? "magic" : "")}
              ${buildStatRow("Burn", `+${getBonusValue(bonuses.heroBurnBonus)}`, escapeHtml, getBonusValue(bonuses.heroBurnBonus) > 0 ? "magic" : "")}
              ${buildStatRow("Physical Resist", `+${getResistanceValue(armorProfile, "physical")}`, escapeHtml, getResistanceValue(armorProfile, "physical") > 0 ? "magic" : "")}
              ${buildStatRow("Fire Resist", `+${getResistanceValue(armorProfile, "fire")}`, escapeHtml, getResistanceValue(armorProfile, "fire") > 0 ? "magic" : "")}
              ${buildStatRow("Cold Resist", `+${getResistanceValue(armorProfile, "cold")}`, escapeHtml, getResistanceValue(armorProfile, "cold") > 0 ? "magic" : "")}
              ${buildStatRow("Lightning Resist", `+${getResistanceValue(armorProfile, "lightning")}`, escapeHtml, getResistanceValue(armorProfile, "lightning") > 0 ? "magic" : "")}
              ${buildStatRow("Poison Resist", `+${getResistanceValue(armorProfile, "poison")}`, escapeHtml, getResistanceValue(armorProfile, "poison") > 0 ? "magic" : "")}
              ${buildStatRow("Immunities", immunityLabel, escapeHtml, immunityLabel !== "None" ? "highlight" : "")}
            </section>

            <section class="d2char__card">
              <div class="d2char__section-head">Mercenary</div>
              <div class="d2char__stat-row">
                <span class="d2char__stat-label">Life</span>
                <span class="d2char__stat-value ${derivedParty.mercenary.currentLife <= 0 ? "d2char__stat-value--danger" : ""}">${derivedParty.mercenary.currentLife} / ${derivedParty.mercenary.maxLife}</span>
              </div>
              ${buildStatRow("Attack", derivedParty.mercenary.attack, escapeHtml)}
              ${buildStatRow("Role", run.mercenary.name || run.mercenary.role || "Mercenary", escapeHtml)}
            </section>
          </div>

          <div class="d2char__footer">
            <div class="d2char__footer-pill">
              <span class="d2char__footer-label">Gold</span>
              <strong class="d2char__footer-value">${run.gold}</strong>
            </div>
            <div class="d2char__footer-pill">
              <span class="d2char__footer-label">Belt</span>
              <strong class="d2char__footer-value">${run.belt.current}/${run.belt.max}</strong>
            </div>
            <div class="d2char__footer-pill">
              <span class="d2char__footer-label">Deck</span>
              <strong class="d2char__footer-value">${run.deck?.length || 0} cards</strong>
            </div>
          </div>

          ${buildCharmPouchMarkup(appState, escapeHtml)}
        </div>
      </div>
    `;
  }

  function buildInventoryTabMarkup(appState: AppState, services: UiRenderServices, vm: ReturnType<typeof deriveInventoryModel>): string {
    const { escapeHtml } = services.renderUtils;
    const { run } = vm;
    const content = appState.content;
    const { buildHydratedLoadout } = runtimeWindow.ROUGE_ITEM_CATALOG;
    const loadout = buildHydratedLoadout(run, content);
    const capacity = runtimeWindow.ROUGE_ITEM_LOADOUT.INVENTORY_CAPACITY;
    const carried = run.inventory?.carried || [];
    const emptyCount = Math.max(0, capacity - carried.length);

    return `
      <div class="d2inv__body d2inv__body--inventory">
        <div class="d2inv__rail">
          ${buildHeroDossierMarkup(services, vm)}

          <section class="d2inv__panel d2inv__panel--loadout">
            <div class="d2inv__panel-head">
              <div>
                <div class="d2inv__panel-label">Loadout</div>
                <p class="d2inv__panel-copy">Steel already bound to the bloodline. Remove pieces here to return them to the pack.</p>
              </div>
            </div>

            <div class="d2inv-doll">
              <div class="d2inv-doll__row d2inv-doll__row--head">
                ${buildSlot("helm", loadout.helm, content, escapeHtml)}
              </div>
              <div class="d2inv-doll__row d2inv-doll__row--shoulders">
                ${buildSlot("amulet", loadout.amulet, content, escapeHtml)}
              </div>
              <div class="d2inv-doll__row d2inv-doll__row--torso">
                ${buildSlot("weapon", loadout.weapon, content, escapeHtml)}
                <div class="d2inv-doll__body">
                  ${buildSlot("armor", loadout.armor, content, escapeHtml)}
                </div>
                ${buildSlot("shield", loadout.shield, content, escapeHtml)}
              </div>
              <div class="d2inv-doll__row d2inv-doll__row--lower">
                ${buildSlot("ring1", loadout.ring1, content, escapeHtml)}
                ${buildSlot("belt", loadout.belt, content, escapeHtml)}
                ${buildSlot("ring2", loadout.ring2, content, escapeHtml)}
              </div>
              <div class="d2inv-doll__row d2inv-doll__row--feet">
                ${buildSlot("gloves", loadout.gloves, content, escapeHtml)}
                <div class="d2inv-doll__spacer"></div>
                ${buildSlot("boots", loadout.boots, content, escapeHtml)}
              </div>
            </div>
          </section>
        </div>

        <div class="d2inv__stage">
          <section class="d2inv__panel d2inv__panel--inventory">
            <div class="d2inv__panel-head">
              <div>
                <div class="d2inv__panel-label">
                  Carried Inventory <span class="d2inv__count">${carried.length}/${capacity}</span>
                </div>
                <p class="d2inv__panel-copy">Equip what deserves a place on the road. Empty cells mark how much burden the pack can still bear.</p>
              </div>
              <div class="d2inv__gold">
                <span class="d2inv__gold-icon">\u{1FA99}</span>
                <span class="d2inv__gold-amount">${run.gold}</span>
              </div>
            </div>

            <div class="d2inv-grid">
              ${carried.map((entry: InventoryEntry) => buildGridCell(entry, content, escapeHtml)).join("")}
              ${Array.from({ length: emptyCount }, () => `<div class="d2inv-grid-cell d2inv-grid-cell--empty"></div>`).join("")}
            </div>
          </section>

          ${buildCharmPouchMarkup(appState, escapeHtml)}
        </div>
      </div>
    `;
  }

  function buildInventoryMarkup(appState: AppState, services: UiRenderServices): string {
    const { escapeHtml } = services.renderUtils;
    const activeTab = appState.ui.inventoryTab || TAB_INVENTORY;
    const vm = deriveInventoryModel(appState, services);

    const tabContent = activeTab === TAB_CHARACTER
      ? buildCharacterMarkup(appState, services, vm)
      : buildInventoryTabMarkup(appState, services, vm);

    return `
      <div class="d2inv">
        ${buildInventoryHeader(services, activeTab, vm)}
        ${buildTabNav(activeTab, escapeHtml)}
        ${tabContent}
      </div>
    `;
  }

  runtimeWindow.ROUGE_INVENTORY_VIEW = {
    buildInventoryMarkup,
  };
})();
