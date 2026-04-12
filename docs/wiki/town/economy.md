# Economy & Vendors

> Gold economy, buy/sell formulas, economy features, and vendor progression.

Last updated: 2026-04-11

## Buy / Sell Pricing

### Equipment Valuation (Base)

```
baseValue = max(8, tier * 18)
           + socketsUnlocked * 6
           + insertedRunes.length * 10
           + (hasRuneword ? 16 : 0)
```

| Item Tier | Base Value Range |
|-----------|-----------------|
| Normal | 8-26 |
| Exceptional | 26-44 |
| Elite | 44-62 |

### Rune Valuation (Base)

```
baseValue = max(6, tier * 12 + rank * 4)
```

| Rune Tier | Approximate Value |
|-----------|------------------|
| Tier 1 (El) | ~16 |
| Tier 2-3 | ~22-40 |
| Tier 4-5 | ~46-64 |
| Tier 6-7 | ~70-88 |
| Tier 8 (Pul-Mal) | ~94+ |

### Buy Price (What You Pay)

```
Equipment: buyPrice = max(14, floor(baseValue * 1.6 * discountMultiplier))
Rune:      buyPrice = max(10, floor(baseValue * 1.75 * discountMultiplier))
```

### Sell Price (What You Get)

```
Equipment: sellPrice = max(6, floor(baseValue * 0.65 * bonusMultiplier))
Rune:      sellPrice = max(4, floor(baseValue * 0.75 * bonusMultiplier))
```

### Pricing Constants

| Constant | Value |
|----------|-------|
| MIN_EQUIPMENT_BUY_PRICE | 14 |
| EQUIPMENT_BUY_MARKUP | 1.6x |
| MIN_RUNE_BUY_PRICE | 10 |
| RUNE_BUY_MARKUP | 1.75x |
| MIN_EQUIPMENT_SELL_PRICE | 6 |
| EQUIPMENT_SELL_RATE | 0.65x |
| MIN_RUNE_SELL_PRICE | 4 |
| RUNE_SELL_RATE | 0.75x |

---

## Economy Features (16 Total)

Economy features unlock progressively and stack. Each feature modifies buy discounts, sell bonuses, stock quality, refresh costs, and commission fees.

### Buy Discount Multipliers (Stack Multiplicatively)

| Feature | Discount | Effective |
|---------|----------|-----------|
| economyLedger | 0.90x | -10% |
| salvageTithes | 0.92x | -8% |
| tradeHegemony | 0.92x | -8% |
| merchantPrincipate | 0.94x | -6% |
| mythicExchange | 0.94x | -6% |
| brokerageCharter | 0.95x | -5% |
| ascendantExchange | 0.95x | -5% |
| artisanStock | 0.96x | -4% |
| imperialExchange | 0.96x | -4% |
| economyFocus | 0.97x | -3% |
| sovereignExchange | 0.97x | -3% |

**Max combined buy discount:** ~27% (all features active)

### Sell Bonus Multipliers (Stack Multiplicatively)

| Feature | Bonus | Effective |
|---------|-------|-----------|
| economyLedger | 1.15x | +15% |
| salvageTithes | 1.12x | +12% |
| tradeHegemony | 1.08x | +8% |
| treasuryExchange | 1.08x | +8% |
| merchantPrincipate | 1.08x | +8% |
| brokerageCharter | 1.06x | +6% |
| ascendantExchange | 1.06x | +6% |
| mythicExchange | 1.06x | +6% |
| economyFocus | 1.05x | +5% |
| sovereignExchange | 1.05x | +5% |
| imperialExchange | 1.05x | +5% |
| artisanStock | 1.04x | +4% |

**Max combined sell bonus:** ~65% (all features active)

### Feature Summary Table

| Feature | Act Req | Buy Disc | Sell Bonus | Stock Bonus | Refresh Disc | Special |
|---------|---------|----------|------------|-------------|--------------|---------|
| advancedVendorStock | — | — | — | +1 W/A/R | -2 | Tier allowance |
| runewordCodex | — | — | — | +1 R | — | 2 rune targets, +1 rune tier |
| economyLedger | — | 0.90x | 1.15x | — | -4 | Best ratio feature |
| salvageTithes | — | 0.92x | 1.12x | — | -2 | — |
| economyFocus | — | 0.97x | 1.05x | — | -1 | Cross-tree synergy |
| artisanStock | 5 | 0.96x | 1.04x | +1 equip | -2 | Socket-ready offers |
| brokerageCharter | 4 | 0.95x | 1.06x | — | -2 | Tier allowance |
| treasuryExchange | 5 | — | 1.08x | — | -3 | Enables stash consignment |
| chronicleExchange | 4 | — | — | +1-2 | -1/-2 | Planning-aware stock |
| merchantPrincipate | 5 | 0.94x | 1.08x | +1 equip | -2 | Special equip offers |
| sovereignExchange | 4 | 0.97x | 1.05x | — | -2 | Planning offers |
| paragonExchange | 5 | — | — | +1 equip | -1 | Equipment bias |
| ascendantExchange | 5 | 0.95x | 1.06x | — | -1 | Premium planning |
| tradeHegemony | 5 | 0.92x | 1.08x | +1-2 | -2 | Premium offers, deep discounts |
| imperialExchange | 5 | 0.96x | 1.05x | — | -2 | Planning-aware deep discounts |
| mythicExchange | 5 | 0.94x | 1.06x | — | -2 | Top-tier equipment |

---

## Gold Sources

### Encounter Rewards

| Zone Type | Base Gold | Act Scaling | Formula |
|-----------|----------|-------------|---------|
| Battle | 10 | +4/act | 10 + (actNumber * 4) |
| Miniboss | 16 | +6/act | 16 + (actNumber * 6) |
| Boss | 28 | +10/act | 28 + (actNumber * 10) |

**Economy Ledger bonus:** x1.25 multiplier on all gold (rounded up)

### Quest/Consequence Rewards

| Act | Gold Range | XP Range |
|-----|-----------|----------|
| Act 2 | 6-23 gold | 4-13 xp |
| Act 3 | 8-25 gold | 5-14 xp |
| Act 4 | 10-27 gold | 5-15 xp |
| Act 5 | 10-29 gold | 6-16 xp |

### Shrine Opportunities

| Act | Gold Range | XP Range |
|-----|-----------|----------|
| Act 1 | 4-12 gold | 6-8 xp |
| Act 2 | 8-15 gold | 10-13 xp |
| Act 3 | 10-25 gold | 12-14 xp |
| Act 4 | 12-27 gold | 12-15 xp |
| Act 5 | 10-29 gold | 6-16 xp |

Shrine choices also grant: max life, potion refills, merc attack, hero energy, merc life.

### Selling Items

Major gold source in mid-to-late game. Sell replaced equipment and surplus runes.

---

## Economy Strategy

### Early Game (Acts 1-2)
- Save gold for healing and potion refills
- Don't over-invest in vendor equipment
- Pick up economyLedger early for 10% buy discount + 15% sell bonus + 1.25x gold
- First vendor refresh is cheap (14-18g) — worth it for weapon upgrade

### Mid Game (Acts 2-3)
- Start investing in weapon upgrades and runeword components
- Runeword Codex helps target specific runes at vendor
- Sell replaced gear to fund upgrades
- Commission sockets on good bases for runeword prep

### Late Game (Acts 4-5)
- Economy features stack significantly — refreshes become cheaper, stock becomes premium
- Prioritize runeword completion over raw equipment
- Treasury Exchange (Act 5+) enables stash building for future runs
- Max economy features can reduce buy prices by ~27% and increase sell by ~65%

### Key Decision Points
- **Deck Surgery** is free but one-time — remove the worst filler card
- **Vendor refresh** costs scale linearly — first refresh is always best value
- **Runeword planning** is the most gold-efficient path to powerful equipment
- **Economy features** compound — early investment pays off in later acts

## Source Files

- `src/items/item-town-pricing.ts` — Valuation and feature calculations
- `src/items/item-town-pricing-fees.ts` — All fee formulas
- `src/items/item-town-vendor.ts` — Stock generation
- `src/items/item-town-vendor-offers.ts` — Offer prioritization
- `src/run/run-reward-flow.ts` — Encounter gold rewards
