(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { LOADOUT_SLOT_LABELS } = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const { RARITY } = runtimeWindow.ROUGE_ITEM_CATALOG;

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
    if (equipment.rarity === RARITY.MAGIC) { rarityClass = "d2inv-tip--magic"; rarityLabel = "Magic"; }
    else if (equipment.rarity === RARITY.UNIQUE) { rarityClass = "d2inv-tip--unique"; rarityLabel = "Unique"; }
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
    if (rarity === RARITY.MAGIC) { return "d2inv--magic"; }
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

    return `
      <div class="d2inv-slot d2inv-slot--${slotKey} ${filledClass} ${colorClass}">
        ${equipment ? `
          <div class="d2inv-slot__item ${colorClass}">
            <span class="d2inv-slot__item-name">${escapeHtml(itemDef?.name || "?")}</span>
          </div>
          <button class="d2inv-slot__remove" data-action="use-town-action"
                  data-town-action-id="inventory_unequip_${slotKey}" title="Unequip">\u00d7</button>
        ` : `
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
    const isEquipment = entry.kind === "equipment";
    const name = isEquipment
      ? (getItemDefinition(content, entry.equipment?.itemId || "")?.name || "Unknown")
      : (getRuneDefinition(content, entry.runeId)?.name || "Unknown Rune");
    const colorClass = isEquipment ? getRarityColorClass(entry.equipment?.rarity) : "d2inv--rune";

    return `
      <div class="d2inv-grid-cell ${colorClass}" title="${escapeHtml(name)}">
        <span class="d2inv-grid-cell__name">${escapeHtml(name)}</span>
        ${isEquipment ? `
          <button class="d2inv-grid-cell__use" data-action="use-town-action"
                  data-town-action-id="inventory_equip_${entry.entryId}">Equip</button>
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
    const capacity = runtimeWindow.ROUGE_ITEM_LOADOUT.INVENTORY_CAPACITY;
    const carried = run.inventory?.carried || [];
    const emptyCount = Math.max(0, capacity - carried.length);

    // D2 layout: left = paperdoll with slots around silhouette, right = grid
    return `
      <div class="d2inv">
        <div class="d2inv__panel d2inv__panel--left">
          <div class="d2inv__panel-label">
            ${escapeHtml(run.className)} \u2014 Level ${run.level}
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
        </div>
        <div class="d2inv__panel d2inv__panel--right">
          <div class="d2inv__panel-label">
            Inventory <span class="d2inv__count">${carried.length}/${capacity}</span>
          </div>
          <div class="d2inv-grid">
            ${carried.map((entry: InventoryEntry) => buildGridCell(entry, content, escapeHtml)).join("")}
            ${Array.from({ length: emptyCount }, () => `<div class="d2inv-grid-cell d2inv-grid-cell--empty"></div>`).join("")}
          </div>
          <div class="d2inv__gold">
            <span class="d2inv__gold-icon">\u{1FA99}</span>
            <span class="d2inv__gold-amount">${run.gold}</span>
          </div>
        </div>
        <button class="d2inv__close" data-action="close-inventory">Close</button>
      </div>
    `;
  }

  runtimeWindow.ROUGE_INVENTORY_VIEW = {
    buildInventoryMarkup,
  };
})();
