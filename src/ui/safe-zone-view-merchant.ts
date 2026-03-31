(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const merchantPresentation = (runtimeWindow as Window & {
    __ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION: {
      MERCHANT_PRESENTATIONS: Record<string, { epithet: string; quote: string; footer: string }>;
      toTitleCase(value: string): string;
      toPortraitKey(value: string): string;
      getNpcThemeKey(npc: SafeZoneNpcViewModel): string;
      getMerchantActionLabel(action: TownAction): string;
      getMerchantActionIcon(action: TownAction): string;
      buildNpcServiceLayout(
        npc: SafeZoneNpcViewModel,
        themeKey: string,
        escapeHtml: (value: string) => string
      ): string;
      buildEmptyOverlayState(
        npc: SafeZoneNpcViewModel,
        themeKey: string,
        escapeHtml: (value: string) => string
      ): string;
    };
  }).__ROUGE_SAFE_ZONE_VIEW_MERCHANT_PRESENTATION;
  const {
    MERCHANT_PRESENTATIONS,
    toTitleCase,
    toPortraitKey,
    getNpcThemeKey,
    getMerchantActionLabel,
    getMerchantActionIcon,
    buildNpcServiceLayout,
    buildEmptyOverlayState,
  } = merchantPresentation;

  function getVendorItemEyebrow(action: TownAction): string {
    if (action.runeSourceId) {
      return action.runeTier ? `Tier ${action.runeTier} Rune` : "Rune";
    }
    if (action.itemFamily) {
      return action.itemFamily;
    }
    if (action.itemSlot) {
      return toTitleCase(action.itemSlot);
    }
    return "Stock";
  }

  function getVendorItemTone(action: TownAction): string {
    if (action.runeSourceId) {
      const tier = Math.max(1, action.runeTier || 1);
      if (tier >= 7) { return "rune-legend"; }
      if (tier >= 5) { return "rune-rare"; }
      if (tier >= 3) { return "rune-uncommon"; }
      return "rune-common";
    }

    switch (action.itemRarity) {
      case "green":
        return "set";
      case "brown":
        return "unique";
      case "yellow":
        return "rare";
      case "blue":
        return "magic";
      default:
        return "normal";
    }
  }

  function buildVendorItemArt(action: TownAction, content: GameContent, escapeHtml: (s: string) => string): string {
    const assetMap = runtimeWindow.ROUGE_ASSET_MAP;
    if (action.itemSourceId) {
      const sprite = assetMap?.getItemSprite?.(action.itemSourceId, action.itemRarity, action.itemSlot);
      if (sprite) {
        return `
          <div class="merchant-item__art merchant-item__art--equipment" aria-hidden="true">
            <img class="merchant-item__sprite" src="${escapeHtml(sprite)}" alt="" draggable="false" />
          </div>
        `;
      }
    }

    if (action.runeSourceId) {
      const runeDefinition = runtimeWindow.ROUGE_ITEM_CATALOG.getRuneDefinition(content, action.runeSourceId);
      const tier = Math.max(1, Math.min(9, action.runeTier || runeDefinition?.progressionTier || 1));
      const sprite = assetMap?.getRuneSprite?.(action.runeSourceId);
      if (sprite) {
        return `
          <div class="merchant-item__art merchant-item__art--rune merchant-item__art--rune-tier-${tier}" aria-hidden="true">
            <img class="merchant-item__sprite merchant-item__sprite--rune" src="${escapeHtml(sprite)}" alt="" draggable="false" />
            <span class="merchant-item__rune-tier">T${tier}</span>
          </div>
        `;
      }
      const glyph = (runeDefinition?.name || action.runeSourceId || "Rune").slice(0, 3).toUpperCase();
      return `
        <div class="merchant-item__art merchant-item__art--rune merchant-item__art--rune-tier-${tier}" aria-hidden="true">
          <span class="merchant-item__rune-glyph">${escapeHtml(glyph)}</span>
          <span class="merchant-item__rune-tier">T${tier}</span>
        </div>
      `;
    }

    return `
      <div class="merchant-item__art merchant-item__art--fallback" aria-hidden="true">
        <span class="merchant-item__fallback-glyph">+</span>
      </div>
    `;
  }

  function buildMerchantCard(action: TownAction, escapeHtml: (s: string) => string): string {
    const canAfford = !action.disabled;
    const isGamblerCard = action.category === "gambler" || action.id.startsWith("gambler_");
    return `
      <button class="merchant-card ${isGamblerCard ? "merchant-card--gambler" : ""} ${action.disabled ? "merchant-card--disabled" : ""}"
              data-action="use-town-action" data-town-action-id="${escapeHtml(action.id)}">
        <div class="merchant-card__icon">${getMerchantActionIcon(action)}</div>
        ${isGamblerCard ? `<div class="merchant-card__badge merchant-card__badge--gambler">Risk / Reward</div>` : ""}
        <div class="merchant-card__name">${escapeHtml(action.title)}</div>
        ${action.subtitle ? `<div class="merchant-card__sub">${escapeHtml(action.subtitle)}</div>` : ""}
        ${action.description ? `<div class="merchant-card__desc">${escapeHtml(action.description)}</div>` : ""}
        ${action.cost > 0
          ? `<div class="merchant-card__price ${canAfford ? "" : "merchant-card__price--cant-afford"}">
              <span class="merchant-card__coin">\u{1F4B0}</span> ${action.cost}
            </div>`
          : `<div class="merchant-card__price merchant-card__price--free">FREE</div>`
        }
      </button>
    `;
  }

  function buildVendorItemCard(action: TownAction, content: GameContent, escapeHtml: (s: string) => string): string {
    return `
      <button class="merchant-item merchant-item--tone-${escapeHtml(getVendorItemTone(action))} ${action.disabled ? "merchant-item--disabled" : ""}"
              data-action="use-town-action" data-town-action-id="${escapeHtml(action.id)}">
        ${buildVendorItemArt(action, content, escapeHtml)}
        <div class="merchant-item__content">
          <div class="merchant-item__eyebrow">${escapeHtml(getVendorItemEyebrow(action))}</div>
          <div class="merchant-item__name">${escapeHtml(action.title)}</div>
          <div class="merchant-item__footer">
            <span class="merchant-item__price ${action.disabled ? "merchant-item__price--cant-afford" : ""}">
              <span class="merchant-card__coin">\u{1F4B0}</span> ${action.cost}
            </span>
            <span class="merchant-item__btn">${escapeHtml(action.actionLabel)}</span>
          </div>
        </div>
      </button>
    `;
  }

  function buildVendorSection(title: string, actions: TownAction[], content: GameContent, escapeHtml: (s: string) => string): string {
    return `
      <div class="merchant-section">
        <div class="merchant-section__head merchant-section__head--stock">
          <div class="merchant-section__title">${title}<span class="merchant-section__inline-count">${actions.length}</span></div>
        </div>
        <div class="merchant-section__grid">
          ${actions.map((action) => buildVendorItemCard(action, content, escapeHtml)).join("")}
        </div>
      </div>
    `;
  }

  function buildVendorActionSection(title: string, actions: TownAction[], escapeHtml: (s: string) => string): string {
    return `
      <div class="merchant-section">
        <div class="merchant-section__head merchant-section__head--stock">
          <div class="merchant-section__title">${title}<span class="merchant-section__inline-count">${actions.length}</span></div>
        </div>
        <div class="merchant-grid merchant-grid--section">
          ${actions.map((action) => buildMerchantCard(action, escapeHtml)).join("")}
        </div>
      </div>
    `;
  }

  function buildVendorStockLayout(actions: TownAction[], content: GameContent, escapeHtml: (s: string) => string): string {
    const refreshAction = actions.find((action) => action.id === "vendor_refresh_stock");
    const buyActions = actions.filter((action) => action.id.startsWith("vendor_buy"));
    const consignActions = actions.filter((action) => action.id.startsWith("vendor_consign"));
    const gamblerActions = actions.filter((action) => action.category === "gambler" || action.id.startsWith("gambler_"));
    const otherActions = actions.filter((action) =>
      action.id !== "vendor_refresh_stock" &&
      !action.id.startsWith("vendor_buy") &&
      !action.id.startsWith("vendor_consign") &&
      action.category !== "gambler" &&
      !action.id.startsWith("gambler_")
    );

    const equipmentBuys = buyActions.filter((action) => action.previewLines.some((line) => line.startsWith("Equipment stock")));
    const runeBuys = buyActions.filter((action) => action.previewLines.some((line) => line.startsWith("Rune stock")));
    let html = "";

    if (refreshAction) {
      html += `
        <div class="merchant-refresh">
          <div class="merchant-refresh__info">
            <span class="merchant-refresh__icon">\u21BB</span>
            <div class="merchant-refresh__copy">
              <span class="merchant-refresh__eyebrow">Stock Rotation</span>
              <span class="merchant-refresh__label">${escapeHtml(refreshAction.title)}</span>
            </div>
          </div>
          <button class="merchant-refresh__btn ${refreshAction.disabled ? "merchant-refresh__btn--disabled" : ""}"
                  data-action="use-town-action" data-town-action-id="${escapeHtml(refreshAction.id)}"
                  ${refreshAction.disabled ? "disabled" : ""}>
            ${refreshAction.cost > 0
              ? `<span class="merchant-card__coin">\u{1F4B0}</span> ${refreshAction.cost}`
              : escapeHtml(refreshAction.actionLabel)}
          </button>
        </div>
      `;
    }

    if (equipmentBuys.length > 0) {
      html += buildVendorSection("\u2694 Equipment", equipmentBuys, content, escapeHtml);
    }
    if (runeBuys.length > 0) {
      html += buildVendorSection("\u2726 Runes", runeBuys, content, escapeHtml);
    }
    if (gamblerActions.length > 0) {
      html += buildVendorActionSection("\u{1F3B2} Gambling", gamblerActions, escapeHtml);
    }
    if (consignActions.length > 0) {
      html += buildVendorSection("\u26B0 Stash Consignment", consignActions, content, escapeHtml);
    }
    if (otherActions.length > 0) {
      html += `<div class="merchant-grid">${otherActions.map((action) => buildMerchantCard(action, escapeHtml)).join("")}</div>`;
    }

    return html;
  }

  function buildNpcOverlay(
    npc: SafeZoneNpcViewModel,
    gold: number,
    content: GameContent,
    escapeHtml: (s: string) => string
  ): string {
    const themeKey = getNpcThemeKey(npc);
    const presentation = MERCHANT_PRESENTATIONS[themeKey] || MERCHANT_PRESENTATIONS[npc.id] || MERCHANT_PRESENTATIONS.default;
    const portraitKey = toPortraitKey(npc.name);
    const portraitSrc = `./assets/curated/town-portraits/${portraitKey}.webp`;
    const portraitFallbackSrc = `./assets/curated/town-portraits/${npc.id}.svg`;
    const serviceChips = [...new Set(npc.actions.map((action) => getMerchantActionLabel(action)))]
      .slice(0, 4)
      .map((label) => `<span class="merchant-portrait__chip">${escapeHtml(label)}</span>`)
      .join("");
    const isVendorStock = npc.actions.some((action) => action.id === "vendor_refresh_stock");
    const isEmptyOverlay = npc.actions.length === 0;
    let actionCards = buildNpcServiceLayout(npc, themeKey, escapeHtml);
    if (isEmptyOverlay) {
      actionCards = buildEmptyOverlayState(npc, themeKey, escapeHtml);
    } else if (isVendorStock) {
      actionCards = buildVendorStockLayout(npc.actions, content, escapeHtml);
    }

    return `
      <div class="town-npc-overlay" data-action="close-town-npc">
        <div class="merchant-screen merchant-screen--${escapeHtml(npc.id)} merchant-screen--theme-${escapeHtml(themeKey)} merchant-screen--name-${escapeHtml(portraitKey)}" data-action="noop">
          <div class="merchant-layout">
            <aside class="merchant-portrait merchant-portrait--${escapeHtml(npc.id)} merchant-portrait--theme-${escapeHtml(themeKey)} merchant-portrait--name-${escapeHtml(portraitKey)} merchant-portrait--fallback">
              <div class="merchant-portrait__art">
                <img class="merchant-portrait__image"
                     src="${escapeHtml(portraitSrc)}"
                     alt="${escapeHtml(npc.name)}"
                     data-fallback-src="${escapeHtml(portraitFallbackSrc)}"
                     draggable="false"
                     onload="this.closest('.merchant-portrait')?.classList.remove('merchant-portrait--fallback')"
                     onerror="if (this.dataset.fallbackSrc && this.src.indexOf(this.dataset.fallbackSrc) === -1) { this.src = this.dataset.fallbackSrc; } else { this.style.display='none'; }" />
                <div class="merchant-portrait__fallback-art" aria-hidden="true">
                  <span class="merchant-portrait__sigil">${npc.icon}</span>
                </div>
              </div>
              <div class="merchant-portrait__content">
                <p class="merchant-portrait__eyebrow">${escapeHtml(presentation.epithet)}</p>
                <h2 class="merchant-portrait__name">${escapeHtml(npc.name)}</h2>
                <p class="merchant-portrait__role">${escapeHtml(npc.role)}</p>
                <p class="merchant-portrait__quote">${escapeHtml(presentation.quote)}</p>
                <div class="merchant-portrait__chips">
                  ${serviceChips || `<span class="merchant-portrait__chip">${escapeHtml(toTitleCase(npc.role))}</span>`}
                </div>
                <p class="merchant-portrait__footer">${escapeHtml(presentation.footer)}</p>
              </div>
            </aside>
            <section class="merchant-panel">
              <div class="merchant-header">
                <div class="merchant-header__identity">
                  <span class="merchant-header__icon">${npc.icon}</span>
                  <div>
                    <h3 class="merchant-header__name">${escapeHtml(npc.name)}</h3>
                    <span class="merchant-header__role">${escapeHtml(npc.role)}</span>
                  </div>
                </div>
                <div class="merchant-header__gold">
                  <span class="merchant-header__coin">\u{1F4B0}</span> ${gold}g
                </div>
              </div>
              <div class="merchant-body ${isEmptyOverlay ? "merchant-body--empty" : ""}">
                ${actionCards}
              </div>
              <div class="merchant-footer">
                <p class="merchant-footer__note">${escapeHtml(presentation.footer)}</p>
                <button class="merchant-leave" data-action="close-town-npc">
                  <span class="merchant-leave__arrow">\u2190</span> Leave
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  runtimeWindow.__ROUGE_SAFE_ZONE_VIEW_MERCHANT = {
    buildNpcOverlay,
  };
})();
