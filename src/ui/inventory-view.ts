(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { LOADOUT_SLOT_LABELS } = runtimeWindow.ROUGE_ITEM_LOADOUT;

  const SLOT_ICONS: Record<string, string> = {
    helm: "\u{1FA96}",
    amulet: "\u{1F4FF}",
    weapon: "\u2694",
    armor: "\u{1F6E1}",
    shield: "\u{1F6E1}",
    gloves: "\u{1F9E4}",
    ring1: "\u{1F48D}",
    ring2: "\u{1F48D}",
    belt: "\u{1F4BC}",
    boots: "\u{1F462}",
  };

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
    const bonusLines = describeBonusSet(combinedBonuses);
    let rarityClass = "";
    let rarityLabel = "";
    if (equipment.rarity === "yellow") { rarityClass = "inv-tooltip--magic"; rarityLabel = "Magic"; }
    else if (equipment.rarity === "brown") { rarityClass = "inv-tooltip--unique"; rarityLabel = "Unique"; }
    const socketLine = `Sockets: ${equipment.insertedRunes.length}/${equipment.socketsUnlocked}/${item.maxSockets}`;
    return `
      <div class="inv-tooltip ${rarityClass}">
        <div class="inv-tooltip__name">${rarityLabel ? `${escapeHtml(rarityLabel)} ` : ""}${escapeHtml(item.name)}</div>
        <div class="inv-tooltip__slot">${escapeHtml(item.family || item.slot)}</div>
        ${bonusLines.map((line: string) => `<div class="inv-tooltip__bonus">${escapeHtml(line)}</div>`).join("")}
        <div class="inv-tooltip__socket">${escapeHtml(socketLine)}</div>
      </div>
    `;
  }

  function buildSlotCell(
    slotKey: LoadoutSlotKey,
    equipment: RunEquipmentState | null,
    content: GameContent,
    escapeHtml: (s: string) => string
  ): string {
    const icon = SLOT_ICONS[slotKey] || "\u2B1C";
    const label = LOADOUT_SLOT_LABELS[slotKey] || slotKey;
    const itemDef = equipment ? runtimeWindow.ROUGE_ITEM_CATALOG.getItemDefinition(content, equipment.itemId) : null;
    const isEmpty = !equipment;
    let rarityClass = "";
    if (equipment?.rarity === "brown") { rarityClass = "inv-slot--unique"; }
    else if (equipment?.rarity === "yellow") { rarityClass = "inv-slot--magic"; }

    return `
      <div class="inv-slot ${isEmpty ? "inv-slot--empty" : ""} ${rarityClass} inv-slot--${slotKey}"
           data-action="${isEmpty ? "noop" : "toggle-inv-tooltip"}" data-slot-key="${slotKey}"
           title="${escapeHtml(itemDef?.name || label)}">
        <div class="inv-slot__icon">${isEmpty ? icon : ""}</div>
        ${itemDef ? `<div class="inv-slot__item-name">${escapeHtml(itemDef.name)}</div>` : `<div class="inv-slot__label">${escapeHtml(label)}</div>`}
        ${equipment ? `
          <button class="inv-slot__unequip" data-action="use-town-action" data-town-action-id="inventory_unequip_${slotKey}"
                  title="Unequip">×</button>
        ` : ""}
        ${buildEquipmentTooltip(equipment, content, escapeHtml)}
      </div>
    `;
  }

  function buildBackpackCell(
    entry: InventoryEntry,
    content: GameContent,
    escapeHtml: (s: string) => string
  ): string {
    const { getItemDefinition, getRuneDefinition } = runtimeWindow.ROUGE_ITEM_CATALOG;
    const isEquipment = entry.kind === "equipment";
    const name = isEquipment
      ? (getItemDefinition(content, entry.equipment?.itemId || "")?.name || "Unknown")
      : (getRuneDefinition(content, entry.runeId)?.name || "Unknown Rune");
    const slot = isEquipment ? (entry.equipment?.slot || "") : "";
    let rarityClass = "";
    if (isEquipment && entry.equipment?.rarity === "brown") { rarityClass = "inv-bp--unique"; }
    else if (isEquipment && entry.equipment?.rarity === "yellow") { rarityClass = "inv-bp--magic"; }
    const icon = isEquipment ? (SLOT_ICONS[slot] || "\u2B1C") : "\u{1F48E}";

    return `
      <div class="inv-bp-cell ${rarityClass}" title="${escapeHtml(name)}">
        <div class="inv-bp-cell__icon">${icon}</div>
        <div class="inv-bp-cell__name">${escapeHtml(name)}</div>
        ${isEquipment ? `
          <button class="inv-bp-cell__equip" data-action="use-town-action" data-town-action-id="inventory_equip_${entry.entryId}"
                  title="Equip">Equip</button>
        ` : ""}
      </div>
    `;
  }

  function buildInventoryMarkup(appState: AppState, services: UiRenderServices): string {
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const content = appState.content;
    const { buildHydratedLoadout } = runtimeWindow.ROUGE_ITEM_CATALOG;
    const loadout = buildHydratedLoadout(run, content);

    const capacity = runtimeWindow.ROUGE_ITEM_LOADOUT.INVENTORY_CAPACITY || 10;
    const carried = run.inventory?.carried || [];

    // Build paperdoll - D2 layout:
    //        [helm]
    //       [amulet]
    // [weapon][armor][shield]
    // [gloves]      [ring1]
    //  [belt]       [ring2]
    // [boots]
    const paperdoll = `
      <div class="inv-paperdoll">
        <div class="inv-paperdoll__row inv-paperdoll__row--top">
          ${buildSlotCell("helm", loadout.helm, content, escapeHtml)}
        </div>
        <div class="inv-paperdoll__row inv-paperdoll__row--neck">
          ${buildSlotCell("amulet", loadout.amulet, content, escapeHtml)}
        </div>
        <div class="inv-paperdoll__row inv-paperdoll__row--torso">
          ${buildSlotCell("weapon", loadout.weapon, content, escapeHtml)}
          ${buildSlotCell("armor", loadout.armor, content, escapeHtml)}
          ${buildSlotCell("shield", loadout.shield, content, escapeHtml)}
        </div>
        <div class="inv-paperdoll__row inv-paperdoll__row--hands">
          ${buildSlotCell("gloves", loadout.gloves, content, escapeHtml)}
          <div class="inv-paperdoll__spacer"></div>
          ${buildSlotCell("ring1", loadout.ring1, content, escapeHtml)}
        </div>
        <div class="inv-paperdoll__row inv-paperdoll__row--waist">
          ${buildSlotCell("belt", loadout.belt, content, escapeHtml)}
          <div class="inv-paperdoll__spacer"></div>
          ${buildSlotCell("ring2", loadout.ring2, content, escapeHtml)}
        </div>
        <div class="inv-paperdoll__row inv-paperdoll__row--feet">
          ${buildSlotCell("boots", loadout.boots, content, escapeHtml)}
        </div>
      </div>
    `;

    // Backpack grid
    const emptySlots = Math.max(0, capacity - carried.length);
    const backpackCells = carried.map((entry: InventoryEntry) => buildBackpackCell(entry, content, escapeHtml)).join("");
    const emptyCells = Array.from({ length: emptySlots }, () => `<div class="inv-bp-cell inv-bp-cell--empty"></div>`).join("");

    return `
      <div class="inv-screen">
        <div class="inv-screen__header">
          <h2 class="inv-screen__title">Equipment</h2>
          <div class="inv-screen__stats">
            ${escapeHtml(run.className)} Lv.${run.level}
          </div>
        </div>
        <div class="inv-screen__body">
          <div class="inv-screen__paperdoll">
            ${paperdoll}
          </div>
          <div class="inv-screen__backpack">
            <div class="inv-bp-header">
              <span class="inv-bp-header__title">Backpack</span>
              <span class="inv-bp-header__count">${carried.length}/${capacity}</span>
            </div>
            <div class="inv-bp-grid">
              ${backpackCells}
              ${emptyCells}
            </div>
          </div>
        </div>
        <div class="inv-screen__footer">
          <button class="merchant-leave" data-action="close-inventory">
            <span class="merchant-leave__arrow">\u2190</span> Close
          </button>
        </div>
      </div>
    `;
  }

  runtimeWindow.ROUGE_INVENTORY_VIEW = {
    buildInventoryMarkup,
  };
})();
