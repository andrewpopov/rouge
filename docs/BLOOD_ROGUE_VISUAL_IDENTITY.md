# Blood Rogue Visual Identity

Last updated: March 28, 2026.

Documentation note:
- Start with `PROJECT_MASTER.md`.
- This is the canonical visual identity and look-and-feel document for the project.
- The repo still uses `Rouge` in code and package naming, but the live player-facing presentation is `Blood Rogue`.
- Use `VISUAL_DESIGN_TRD.md` for screen/component scope and acceptance criteria.
- Use `ui-redesign-plan.md` for execution order and cleanup priorities.

## 1. Purpose

Define the visual standard for Blood Rogue so we can judge screens, art prompts, and interaction polish against one shared bar instead of relying on scattered notes or personal taste.

This document should answer:

- what the game should feel like at a glance.
- what visual language belongs in the product.
- what "good" looks like during reviews.
- what visual anti-patterns mean we are drifting.

## 2. Design Thesis

Blood Rogue should feel like a cursed expedition interface pulled from the game world: classic dark-fantasy ARPG atmosphere, modern deckbuilder readability, and original Blood Rogue branding.

The product should not feel like:

- a generic app launcher.
- a dashboard with fantasy paint on top.
- a wall of internal documentation.
- a flat mobile-game storefront.

## 3. Player Experience Goals

When a player lands on a screen, they should immediately understand:

- where to look first.
- what decision matters right now.
- what part of the scene is the stage versus support UI.
- what is threatening, actionable, or rewarding.

Emotionally, the game should feel:

- ominous.
- ceremonial.
- tactile.
- readable under pressure.
- premium rather than noisy.

## 4. Core Pillars

### 4.1 World First, UI Second

The interface should read like an artifact from the game world.
Panels, buttons, tiles, and overlays should feel framed, carved, sealed, pinned, or forged rather than flat and app-like.

### 4.2 Game First, Documentation Second

Primary screens should present decisions, status, and rewards.
Explanatory prose belongs in optional help, not as the main content.

### 4.3 One Dominant Focal Object

Each screen needs a clear primary object:

- title art on the front door
- lineup or dossier on character select
- hub stage or portrait rail in town
- board on the world map
- battleground in combat
- choice cards on reward screens

Support information must not compete with that focal object.

### 4.4 Dark Fantasy With Restraint

We want gothic atmosphere, not visual sludge.
The palette should feel heavy and cursed, but not so saturated or overdecorated that usability collapses.

### 4.5 Cards Are The Main Combat Input

In combat, the hand is the player's main instrument.
It should visually outrank support controls during the player phase, but it must not crowd out the battleground.

### 4.6 Original, Not Derivative

Classic dark-fantasy ARPG lineage is the reference energy, not the copy target.
We want that weight, materiality, and dread, but the final game should still read as Blood Rogue.

## 5. Visual Vocabulary

### 5.1 Materials

Primary materials:

- blackened iron
- soot and ash
- aged brass and tarnished gold
- old parchment and wax
- scorched leather
- weathered cloth
- ember glow

These materials should show up in frames, buttons, chips, cards, and decorative accents.

### 5.2 Color

Core palette:

- ash black
- coal gray
- ember orange
- blood crimson
- parchment tan
- brass/gold highlights

Rules:

- red is an accent and heat source, not the default wallpaper everywhere.
- bright glows are reserved for true emphasis.
- colder act-specific variants can appear, but they should still live inside the same Blood Rogue family.

### 5.3 Typography

- Display type should feel serifed, ceremonial, and dark-fantasy in tone.
- Labels and support copy should stay compact and highly readable.
- Headings can be dramatic; system text should stay disciplined.

### 5.4 Iconography And Motifs

Preferred motifs:

- seals
- reliquaries
- tomes
- shrine crests
- portal sigils
- blades
- braziers
- wax marks
- runes
- command medallions

Avoid generic modern UI icon sets when a world-authored mark or sigil would work better.

### 5.5 Surface Language

Repeated surfaces should come from a small set of families:

- primary framed panels
- secondary support panels
- compact chips and pills
- modal or ceremonial overlays
- art-backed stage surfaces

Rounded generic widgets, flat white cards, and dashboard tables are not part of the desired language.

## 6. Screen Rules

### 6.1 Front Door

- Feel cinematic first.
- Continue or begin actions should be obvious immediately.
- The title area should act like cover art, not a menu header.

### 6.2 Character Select

- The character stage should carry identity before the user reads.
- The selected class should feel clearly favored over the rest.
- Dossier/detail content should support the stage, not compete with it.

### 6.3 Town And NPC Overlays

- Town should feel like a living hub of services, not an admin tool.
- NPC overlays should feel like meetings with people or institutions, not plain forms.
- Portrait rails, service cards, and action grouping should do most of the storytelling.

### 6.4 World Map

- The board is the primary object.
- Route intel is optional support, not the default focus.
- Background illustration should never interfere with board readability.

### 6.5 Combat

- The battleground is the dominant region.
- Enemies and allies should feel grounded in the scene, not floating between labels.
- Enemy intent, target state, and pressure must be readable in one glance.
- The hand should feel powerful but controlled, never like visual clutter for its own sake.
- The log should support recall, not steal stage space.

### 6.6 Reward, Transition, And Summary

- These screens should feel like ceremonial aftermath.
- Choice cards or milestone objects should be central.
- Meta continuity and deep analytics should stay tucked behind optional panels.

### 6.7 Inventory And Account Surfaces

- These should be the most neutral surfaces in the game.
- Lean more on soot, leather, parchment, and iron than on saturated crimson washes.
- They should still feel in-world, but calmer than combat or key-art screens.

## 7. Art Direction Standards

### 7.1 Character And Monster Art

- Single subject.
- Strong readable silhouette.
- Clear anatomy and major shapes at thumbnail scale.
- Dirty, tactile materials over glossy rendering.
- No generic mobile fantasy look.

### 7.2 Prompting Standard

For generated art, prompts should follow this order:

1. character or subject description first
2. differentiation second
3. output requirements third
4. style last

This keeps prompts from collapsing into the same generic dark-fantasy archetype.

### 7.3 Differentiation Rule

When generating sets such as NPCs or enemies, each subject should be visually distinct in:

- silhouette
- costume language
- body type
- posture
- role read

If two characters could be mistaken for one another at a glance, the prompt is not specific enough.

## 8. Interaction And Motion

- Hover, focus, selected, disabled, risk, and resolving states should feel like one product family.
- Motion should explain state change, not decorate it.
- Use glow, shake, pulses, and banners sparingly and only where they help threat or outcome readability.
- Motion must never compete with combat threat reading or map comprehension.

## 9. What Good Looks Like

A screen is in good shape when:

- the main action is obvious within two seconds.
- the player can identify the dominant region immediately.
- support UI stays secondary to the stage, board, battleground, or reward choice.
- prose is short, optional, or absent.
- icons, chips, buttons, and panels feel like they belong to the same world.
- the screen feels authored and atmospheric without becoming muddy or crowded.

## 10. Review Checklist

Use this during UI and art reviews:

- What is the first thing the eye lands on?
- Is that the thing we want the player to care about?
- Is the primary action visually stronger than meta or debug information?
- Does the surface feel like part of the game world rather than a tool?
- Are we using crimson as emphasis or just flooding the whole screen with it?
- Is any text explaining what the layout should already show?
- Are hover, selected, locked, targetable, and dangerous states obvious?
- Does the art read clearly at the size it will actually ship?

## 11. PR Review Template

Use this short format when reviewing a screen in a PR, screenshot pass, or design check-in:

```text
Surface:

Primary focal object:

Primary action:

What is working:
- 
- 

What is off:
- 
- 

Decision:
- keep as is
- revise before merge
- revisit later
```

Review notes should stay tied to the identity rules in this document:

- call out whether the right thing owns the screen
- call out whether support UI is crowding the stage
- call out whether the screen feels authored and in-world
- call out whether any color, copy, or motion is louder than it should be

## 12. Drift Signals

These are signs we are off target:

- the screen reads like docs or internal notes.
- the player has to parse paragraphs before acting.
- everything is equally bright, equally framed, or equally important.
- the stage object is crowded out by support chrome.
- too much red makes the screen feel like a solid wash instead of a material space.
- portraits or sprites feel samey because prompts overused a generic dark-fantasy template.
- motion or glow effects make the HUD louder instead of clearer.

## 13. Current Strong References

Use these live captures as working examples of the current direction:

- `/Users/andrew/proj/rouge/screenshots/01-title-screen.png`
- `/Users/andrew/proj/rouge/screenshots/02-character-select.png`
- `/Users/andrew/proj/rouge/screenshots/03-town.png`
- `/Users/andrew/proj/rouge/screenshots/08-combat.png`

These are examples, not law.
If a screenshot and this document disagree, update the screen toward this document or revise this document deliberately.

## 14. Document Boundaries

- `BLOOD_ROGUE_VISUAL_IDENTITY.md`: canonical look, feel, and review standard
- `VISUAL_DESIGN_TRD.md`: screen/component scope, structure, and acceptance criteria
- `ui-redesign-plan.md`: execution order and cleanup priorities
- `SPRITE_GENERATION_BACKLOG.md`: art import workflow and sprite-specific generation constraints
- `NON_CHARACTER_ART_BACKLOG.md`: item, rune, and scenic-background batch generation workflow

Keep visual identity guidance here instead of restating it differently across multiple docs.
