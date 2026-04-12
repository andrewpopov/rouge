# Town Services

> NPC vendors, services, stock generation, and safe zone actions per act.

Last updated: 2026-04-11

## Town Districts

Each town safe zone is organized into districts:

| District | Services |
|----------|----------|
| Recovery & Supplies | Healer + Quartermaster |
| Training Hall | Progression / Cain |
| Vendor Arcade | Vendor buy / refresh / runeword planning |
| Field Pack | Inventory / equip / sell |
| Profile Vault | Stash withdraw / deposit |
| Mercenary Barracks | Mercenary contract / revival |

---

## NPCs by Act

### Act 1 — Rogue Encampment

| NPC | Role | Services |
|-----|------|----------|
| **Akara** | Healer | Restore party life |
| **Charsi** | Blacksmith | Socket commissions, equip/sell, featured upgrades |
| **Gheed** | Vendor | Buy equipment & runes, refresh stock |
| **Kashya** | Mercenary Captain | Hire mercenaries (Blackwood Hunter, Tracker, Sentinel) |
| **Cain** | Sage | Rune/resource vendor, runeword codex |
| **Warriv** | Caravan Leader | Travel to Act 2 |
| **Stash** | Storage | Profile stash deposit/withdraw |

### Act 2 — Lut Gholein

| NPC | Role | Services |
|-----|------|----------|
| **Fara** | Healer & Blacksmith | Restore life, socket commissions, equip/sell |
| **Elzix** | Vendor | Buy equipment & runes, refresh stock, gambling |
| **Greiz** | Mercenary Leader | Hire mercenaries (Spearwall, Lancer, Warmage) |
| **Cain** | Sage | Rune vendor, runeword codex |
| **Meshif** | Ship Captain | Travel to Act 3 |
| **Stash** | Storage | Profile stash |

### Act 3 — Kurast Docks

| NPC | Role | Services |
|-----|------|----------|
| **Ormus** | Healer & Trade | Restore life, buy/sell equipment |
| **Hratli** | Blacksmith | Socket commissions, equipment trade |
| **Alkor** | Gambler & Trade | Buy equipment & runes, gambling |
| **Asheara** | Mercenary Leader | Hire mercenaries (Spellblade, Shadow, Sage) |
| **Cain** | Sage | Rune vendor, runeword codex |
| **Meshif** | Ship Captain | Travel to Act 4 |
| **Stash** | Storage | Profile stash |

### Act 4 — Pandemonium Fortress

| NPC | Role | Services |
|-----|------|----------|
| **Jamella** | Healer & Vendor | Restore life, buy/sell, gambling |
| **Halbu** | Blacksmith | Socket commissions, equipment trade |
| **Tyrael** | Mercenary | Mercenary services |
| **Cain** | Sage | Rune vendor, runeword codex |
| **Stash** | Storage | Profile stash |

### Act 5 — Harrogath

| NPC | Role | Services |
|-----|------|----------|
| **Malah** | Healer & Trade | Restore life, buy/sell equipment |
| **Larzuk** | Blacksmith | Socket commissions, equipment trade |
| **Anya** | Gambler & Trade | Buy equipment & runes, gambling |
| **Qual-Kehk** | Mercenary Leader | Hire mercenary (Frosthaven Berserker) |
| **Cain** | Sage | Rune vendor, runeword codex |
| **Stash** | Storage | Profile stash |

---

## Core Services

### Healer — Camp Relief (Restore Party)

Restores all missing hero and mercenary life to full.

**Cost Formula:**
```
cost = max(6, ceil(totalMissingLife / 4) + actNumber * 2)
```

| Act | Min Cost | Example (30 missing HP) |
|-----|----------|------------------------|
| 1 | 6 | max(6, 8+2) = 10 |
| 2 | 6 | max(6, 8+4) = 12 |
| 3 | 6 | max(6, 8+6) = 14 |
| 4 | 6 | max(6, 8+8) = 16 |
| 5 | 6 | max(6, 8+10) = 18 |

### Quartermaster — Refill Belt

Restores potion charges to maximum.

**Cost Formula:**
```
cost = missingCharges * (3 + actNumber)
```

| Act | Cost Per Charge |
|-----|----------------|
| 1 | 4 |
| 2 | 5 |
| 3 | 6 |
| 4 | 7 |
| 5 | 8 |

### Quartermaster — Deck Surgery

One-time card removal per run. Minimum deck size: 5.

**Unlock Conditions:** Clear any of these Act 1 zones:
- Den of Evil
- Burial Grounds / Black Pit
- Tristram
- Ashfall Hamlet

**Strategy:** Remove neutral filler cards (swing, measured_swing, kick, mark_target) to tighten deck toward the 14-17 optimal range.

---

## Vendor Stock System

### Stock Composition per Refresh

| Act | Weapons | Armor | Runes | Total |
|-----|---------|-------|-------|-------|
| 1-4 | 2-3 | 2-3 | 4 | ~8-10 |
| 5 | 3 | 3 | 5 | ~11 |

Base counts are increased by economy features — each feature adds +1 to weapon, armor, or rune counts.

### Vendor Tier Calculation

The maximum item tier available at the vendor scales with progression:

```
maxTier = max(1, actNumber + tierAllowance)

tierAllowance =
  + min(2, floor((level - 1) / 3))    -- level scaling
  + min(1, bossTrophies.length)         -- boss kill bonus
  + min(1, floor(refreshCount / 2))     -- refresh cycling bonus
  + advancedVendorStock bonus           -- economy feature
  + brokerageCharter (act 4+)           -- economy feature
  + artisanStock (act 5+)              -- economy feature
  + merchantPrincipate (act 5+)         -- economy feature
  + tradeHegemony (act 5+)             -- economy feature
  + chronicleExchange (act 4+)          -- economy feature
  + sovereignExchange (act 4+)          -- economy feature
  + paragonExchange (act 5+)            -- economy feature
  + ascendantExchange (act 5+)          -- economy feature
  + imperialExchange (act 5+)           -- economy feature
  + mythicExchange (act 5+)             -- economy feature
  + treasuryExchange (act 5+)           -- economy feature
```

### Vendor Offer Priority

Vendor stock slots are filled in this priority order — higher-priority slots get first pick:

| Priority | Offer Type | Condition |
|----------|-----------|-----------|
| 1 | **Planning Offer** | Active runeword plan match, highest socket count |
| 2 | **Sovereign Offer** | sovereignExchange feature, planning-aware |
| 3 | **Imperial Offer** | imperialExchange feature, planning-aware |
| 4 | **Chronicle Offer** | chronicleExchange feature, planning-aware |
| 5 | **Primary Upgrade** | Best tier upgrade in preferred weapon family |
| 6 | **Mythic Offer** | mythicExchange feature (Act 5+) |
| 7 | **Ascendant Offer** | ascendantExchange feature (Act 5+) |
| 8 | **Paragon Offer** | paragonExchange feature (Act 5+) |
| 9 | **Hegemony Offer** | tradeHegemony feature (Act 5+) |
| 10 | **Merchant Offer** | merchantPrincipate feature (Act 5+) |
| 11 | **Secondary Upgrade** | Next best tier upgrade |
| 12 | **Socket-Ready Offer** | High socket count (3+) |
| 13 | **Artisan Offer** | artisanStock feature (Act 5+) |
| 14 | **Treasury Offer** | treasuryExchange feature (Act 5+) |
| 15 | **Sidegrade** | Pseudo-random fallback in current tier |

### Rune Stock Selection

Rune slots are filled with this priority:

| Priority | Selection | Condition |
|----------|----------|-----------|
| 1 | Equipment target runes | Next rune needed for equipped item's runeword |
| 2 | Stash target runes | Next rune needed for stash item (treasuryExchange) |
| 3 | Planned runeword targets | Up to 2 + feature bonuses per feature |
| 4 | Premium rune | Highest tier available |
| 5 | Support rune | 2nd highest tier |
| 6 | Codex rune | 3rd highest tier (runewordCodex) |
| 7+ | Feature runes | Per economy feature |
| Last | Seeded rune | Pseudo-random |

With Runeword Codex: rune maxTier += 1, targets 2 runes instead of 1.

### Vendor Stock Seeding

Stock is deterministic but varies per refresh:
```
itemSeed = actNumber * 13 + refreshCount * 7 + level * 3 + zonesCleared
runeSeed = actNumber * 11 + refreshCount * 5 + encountersCleared
```

---

## Vendor Refresh

### Refresh Cost Formula

```
cost = max(8, 10 + (actNumber * 4) + (refreshCount * 6) - featureDiscounts)
```

| Act | First Refresh | Second Refresh | Third Refresh |
|-----|--------------|----------------|---------------|
| 1 | 14 | 20 | 26 |
| 2 | 18 | 24 | 30 |
| 3 | 22 | 28 | 34 |
| 4 | 26 | 32 | 38 |
| 5 | 30 | 36 | 42 |

(Before economy feature discounts. Features can reduce cost by up to ~26 gold.)

### Feature Refresh Discounts (Additive)

| Feature | Discount |
|---------|----------|
| advancedVendorStock | -2 |
| economyLedger | -4 |
| salvageTithes | -2 |
| artisanStock | -2 |
| brokerageCharter | -2 |
| treasuryExchange | -3 |
| merchantPrincipate | -2 |
| sovereignExchange | -2 |
| economyFocus | -1 |
| paragonExchange (Act 5+) | -1 |
| ascendantExchange (Act 5+) | -1 |
| tradeHegemony (Act 5+) | -2 |
| imperialExchange (Act 5+) | -2 |
| mythicExchange (Act 5+) | -2 |
| chronicleExchange | -1 to -2 |

---

## Socket Commission

### Commission Cost Formula

```
cost = 16 + (itemTier * 10) + (nextSocketCount * 7) + (actNumber * 3)
     + locationFee + planningLoadFee
     - featureDiscounts - planningDiscount - repeatForgeDiscount
```

**Location Fee:**
| Location | Fee |
|----------|-----|
| Stash | 7 gold |
| Loadout (equipped) | 3 gold |
| Inventory (carried) | 0 gold |

**Min Cost:** 16 (stash) or 12 (other)

**Rules:**
- Cannot commission if item already has a completed runeword
- Cannot commission beyond item's max socket count
- Existing inserted runes stay in place
- Stash commissions require treasuryExchange feature

### Commission Feature Discounts (Additive)

| Feature | Discount |
|---------|----------|
| economyLedger | -1 |
| salvageTithes | -1 |
| artisanStock | -1 |
| brokerageCharter | -1 |
| chronicleExchange | -1 |
| sovereignExchange | -1 |
| paragonExchange | -1 |
| economyFocus | -1 |
| treasuryExchange | -2 |
| merchantPrincipate | -2 |
| ascendantExchange | -2 |
| tradeHegemony | -2 |
| imperialExchange | -2 |
| mythicExchange | -2 |

Planning match discount: -3 base, -1 if unfulfilled, -1 if economyFocus
Repeat forge discount: -3 base, -1 if socket-ready

---

## Consignment System (Treasury Exchange)

Requires `treasuryExchange` feature (Act 5+). Buy vendor items directly into profile stash.

**Max stash capacity:** 5 entries (any mix of equipment/runes)

### Consignment Fee Formula

```
fee = baseFee + floor(buyPrice * 0.12) + stashLoadFee + planningFee - discounts
```

| Component | Value |
|-----------|-------|
| baseFee (rune) | 4 |
| baseFee (equipment) | 8 |
| buyPrice markup | 12% of buy price |
| stashLoadFee | min(6, stashEntries.length) |
| planningFee | socketReadyEntries + runewordEntries |

---

## Runeword Planning / Charter System

Players can set weapon and armor runeword targets. The system then:
- Biases vendor stock toward required runes
- Biases equipment offers toward compatible bases
- Reduces commission/consignment costs for planned items
- Tracks completion history in archive (repeat forges get discounts)

**Runeword Codex feature:** Targets 2 required runes (instead of 1), rune maxTier += 1

---

## Safe Zone Actions Summary

| Action | Service | Cost |
|--------|---------|------|
| Heal Party | Healer | Gold (formula) |
| Refill Potions | Quartermaster | Gold (formula) |
| Remove Card | Quartermaster | Free (one-time) |
| Buy Equipment | Vendor | Buy price |
| Buy Rune | Vendor | Buy price |
| Sell Equipment | Vendor | Sell price |
| Sell Rune | Vendor | Sell price |
| Refresh Stock | Vendor | Escalating gold |
| Acquire for Stash | Vendor | Buy price + consignment fee |
| Equip Item | Loadout | Free |
| Unequip Item | Loadout | Free |
| Commission Socket | Blacksmith | Gold (formula) |
| Plan Runeword | Vendor | Free (with codex) |
| Stash Item | Vault | Free |
| Withdraw Item | Vault | Free |
| Hire Mercenary | Captain | Varies |

## Source Files

- `src/items/item-town-actions.ts` — Town action implementations
- `src/items/item-town-vendor.ts` — Stock generation
- `src/items/item-town-vendor-offers.ts` — Offer prioritization
- `src/items/item-town-pricing.ts` — Pricing formulas
- `src/items/item-town-pricing-fees.ts` — Fee calculations
- `src/town/service-registry.ts` — Service registration
- `src/ui/safe-zone-view.ts` — Town UI layout
