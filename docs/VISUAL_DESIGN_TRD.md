# Visual Design TRD

Documentation note:
- Start with `PROJECT_MASTER.md`.
- Use `BLOOD_ROGUE_VISUAL_IDENTITY.md` as the canonical look-and-feel source.
- This document is the target UI surface plan.

## 1. Purpose

Define the front-door menu, character select, safe-zone/world-map surfaces, account/admin surfaces, and combat HUD as explicit UI components with clear build scope, dependencies, and acceptance criteria.

This document is for implementation planning and acceptance criteria, not the primary home for aesthetic direction. It should answer:

- what each UI component is for.
- what needs to be built or rebuilt.
- what order the work should happen in.
- how we know each component is done.

## 2. Scope

In scope:

- front-door menu and navigation.
- character select presentation.
- act safe-zone hotspot scenes.
- world-map traversal surfaces.
- icon system and gothic menu art direction.
- account, authentication, and admin-facing UI surfaces.
- combat HUD layout and visual hierarchy.
- menu/control layout.
- panel composition, spacing, hierarchy, and responsive behavior.
- component-level motion/feedback rules.
- alignment between existing IDs/hooks and a cleaner visual system.

Out of scope:

- new game mechanics.
- balance changes.
- asset licensing or asset acquisition workflow.
- deep copy/narrative rewrite outside surfaces directly touched by layout work.

## 3. Product Goal

The HUD should read like a deliberate command console. At a glance, the player must understand:

- who they are.
- what state the run is in.
- what action to take now.
- what threat resolves next.
- what long-term build systems are available.
- how to move between run start, character select, town, world traversal, history, progression, account, and admin tasks.

## 4. Design Principles

- Primary actions must be visually dominant over meta and settings actions.
- Top-level navigation must be icon-led and readable before text is parsed.
- Cards are the primary combat input; buttons are reserved for turn/system actions and accessibility.
- The layout must separate `combat now` information from `build later` information.
- Repeated panel types should share a small, consistent set of visual treatments.
- Desktop should feel like a cockpit. Mobile should feel like a stacked field kit, not a compressed desktop.
- Existing test-critical IDs should remain stable unless there is a strong reason to change them.

## 5. Current Layout Problems

- There is no real front-door menu or product navigation model yet.
- The product has persistent systems (run records, meta unlocks) but no clear home for them outside the combat screen.
- Account and admin tasks do not have defined UI surfaces.
- The current footer acts as a catch-all menu instead of a structured command surface.
- Primary combat actions, onboarding controls, build systems, and meta reset actions all compete in one panel.
- The screen hierarchy is uneven: battlefield information is strong, but action choice is visually noisy.
- The desktop layout uses three columns, but the right column lacks internal grouping.
- Mobile collapse behavior is functional, but not intentional.

## 6. Target Component Map

1. Front-door shell
2. Main navigation menu
3. Run history
4. Legacy progression hub
5. Account and authentication surfaces
6. Admin console surfaces
7. Global HUD shell
8. Status strip
9. Battlefield header
10. Track map and threat forecast
11. Enemy roster
12. Hand zone
13. Action menu
14. Guidance surfaces
15. Build and progression surfaces
16. Reward and interlude panels
17. Run summary panel
18. Tooltip, warning, and motion layer

## 7. Build Order

### Phase 1: Product Navigation Foundation

- front-door shell
- main navigation menu
- account and authentication surfaces
- run history
- legacy progression hub

### Phase 2: Admin and Permissions

- admin console surfaces
- role-aware navigation states
- auth-gated routes and empty states

### Phase 3: Combat Layout Foundation

- global HUD shell
- status strip
- action menu
- guidance surfaces

### Phase 4: Combat Readability

- battlefield header
- track map and threat forecast
- enemy roster
- hand zone

### Phase 5: Progression and Outcome Surfaces

- build and progression surfaces
- reward and interlude panels
- run summary panel

### Phase 6: Finish Pass

- tooltip layer
- motion pass
- responsive cleanup
- visual token cleanup

## 8. Component Requirements

### 8.1 Front-Door Shell

Purpose:
- Establish the non-combat home screen for the game and anchor top-level navigation.

Build:
- Create a dedicated start/menu layout separate from the combat HUD.
- Use a gothic expedition composition: framed hero area, carved-panel navigation, icon-first menu options, and atmospheric background art.
- Support desktop and mobile variants without turning the menu into generic app chrome.
- Define a reserved area for account state and admin visibility.

Definition of done:
- The product has a clear landing surface where a player can start playing, review history, manage progression, and access account features.

### 8.2 Main Navigation Menu

Purpose:
- Provide the primary top-level destinations for the product.

Required destinations:
- `Start Game`
- `Run History`
- `Legacy` (working replacement for `Unlocks`)
- `Account`
- `Admin` (visible only for authorized admin roles)

Icon and art direction:
- Every top-level destination gets a distinct icon.
- Icons should feel carved, ritualistic, and gothic: sigils, reliquaries, tomes, banners, seals, braziers, or weapon crests.
- Menu framing should use gothic stone, iron, parchment, ember, and shrine-like accents rather than modern flat app tabs.

Build:
- Define the navigation as a reusable menu component, not page-specific buttons.
- Support icon + label + short descriptor for each destination.
- Add active, hover, focus, disabled, and locked states.
- Design a conditional `Continue Run` treatment under `Start Game` when a valid snapshot exists.

Recommended icon mapping:
- `Start Game`: portal, crossed blade, or waypoint sigil.
- `Run History`: tome, scroll, or chronicle seal.
- `Legacy`: shrine sigil, reliquary, or bloodline crest.
- `Account`: portrait medallion or wax seal.
- `Admin`: iron keyring, ledger, or command seal.

Definition of done:
- The main menu is immediately understandable through icons and labels.
- The visual treatment reads as part of the game world rather than a generic launcher.

### 8.3 Run History

Purpose:
- Show prior runs, outcomes, classes used, build highlights, and restart/review actions.

Build:
- Turn existing run-record concepts into a dedicated browseable screen.
- Define a list/grid pattern for runs with filters such as result, class, act reached, and date.
- Support entry into a detailed run summary view.
- Add empty, loading, and signed-out states.

Dependencies:
- persistence model for run records
- account storage direction if history becomes account-scoped instead of local-only

Definition of done:
- A player can browse prior runs and identify a notable run without opening combat.

### 8.4 Legacy Progression Hub

Purpose:
- Present persistent unlocks, reward-tree progress, meta upgrades, and long-term account progression.

Naming:
- Working replacement for `Unlocks` is `Legacy`.
- Reason: it implies persistent power, account-level progress, and dark-fantasy lineage better than a utilitarian systems label.

Build:
- Define a dedicated destination rather than burying persistent progression inside combat strips.
- Organize meta progress into clearly separated sections: unlocked paths, branch choices, milestones, and next goals.
- Reuse reward-tree and upgrade motifs while elevating them into a more ceremonial hub.
- Add reset/destructive actions only in clearly isolated admin or advanced-settings areas.

Dependencies:
- meta progression and reward-tree data shape

Definition of done:
- Persistent progression feels like a destination, not a side effect of combat UI.

### 8.5 Account and Authentication Surfaces

Purpose:
- Show player identity, sign-in state, profile controls, and account-linked progression.

Required auth support:
- Google OAuth sign-in
- signed-in account summary
- sign-out flow
- auth error and retry states

Build:
- Define signed-out, signing-in, signed-in, and auth-error UI states.
- Add account summary content: display name, avatar, linked email, last play signal, and account-scoped progression summary.
- Decide whether guests can still play locally; if yes, design a clear guest path and upgrade prompt.
- Keep auth UI visually aligned with the menu and not styled like a generic SaaS form.

Dependencies:
- backend/session layer
- Google OAuth integration
- account data model

Definition of done:
- Account state is obvious, sign-in is recoverable, and the UI can support both guest and authenticated users if needed.

### 8.6 Admin Console Surfaces

Purpose:
- Give authorized staff a dedicated UI for user management and operational review.

Required admin areas:
- user list
- user detail view
- role and permission management
- account status controls
- support/audit context

Build:
- Keep admin UI visually related to the game but operationally distinct from player-facing screens.
- Design a user table/list with search, filters, and role/status chips.
- Add a user detail page with profile state, progression summary, run history access, and moderation/admin actions.
- Define safe affordances for destructive actions: suspend, reactivate, role change, reset, unlink account.
- Ensure admin routes are hidden from non-admin users and protected by role checks.

Dependencies:
- role-based access control
- admin API endpoints
- audit/event logging

Definition of done:
- Admins can find a user, inspect their state, and perform role/account management without touching player-facing screens.

### 8.7 Global HUD Shell

Purpose:
- Define top-level page rhythm, responsive columns, and panel spacing.

Build:
- Formalize the shell into named layout zones rather than relying on stacked panel order alone.
- Normalize gutter, panel padding, and max-width rules.
- Add explicit desktop, tablet, and mobile layout behavior for all major panels.
- Introduce a small layout token set for spacing, radii, and panel tiers.

Files:
- `index.html`
- `styles.css`

Definition of done:
- Desktop layout feels intentionally composed, not auto-flowed.
- Tablet layout preserves action clarity without crowding.
- Mobile layout keeps battle, hand, and actions readable without horizontal overflow.

### 8.8 Status Strip

Purpose:
- Surface run-critical state: hull, block, heat, turn, energy, lane, level, resources.

Build:
- Tighten the strip into three clear modules: survival, reactor, and run state.
- Reduce text density in the right cluster by grouping related stats into smaller stacks.
- Establish a stronger visual hierarchy for the current turn and current resource state.
- Ensure the strip remains scan-friendly on narrow widths.

Dependencies:
- global spacing tokens

Definition of done:
- The player can identify current survivability, heat risk, and turn resources in under two seconds.

### 8.9 Battlefield Header

Purpose:
- Establish scene identity and explain the current objective.

Build:
- Separate title, encounter instruction, and sector/location metadata into distinct text treatments.
- Reduce paragraph-like copy where labels can do the work.
- Create a reusable header pattern for battlefield, reward, interlude, and summary panels.

Definition of done:
- The heading area reads as context, not body copy.

### 8.10 Track Map and Threat Forecast

Purpose:
- Show player position, incoming threat timing, and lane-level risk.

Build:
- Keep map and forecast visually paired as one intelligence module.
- Improve internal hierarchy so the live map leads and the forecast supports.
- Standardize chip treatments for safe, warning, and lethal states.
- Define hover/focus/selected treatments that do not overpower the battlefield.

Dependencies:
- motion and state token pass

Definition of done:
- Threat timing and safe-lane decisions are readable without reading every line of text.

### 8.11 Enemy Roster

Purpose:
- Present targetable enemies, intent summaries, and aim state.

Build:
- Normalize enemy card height and internal spacing.
- Give elite, active target, and aiming states stronger but consistent treatments.
- Ensure the roster reads as a selectable set first and a detail surface second.
- Keep tooltip access secondary to target selection.

Definition of done:
- A player can pick the active target immediately and distinguish special enemies without searching.

### 8.12 Hand Zone

Purpose:
- Present the current playable card set and deck counters as the primary combat action surface.

Build:
- Strengthen the relationship between hand title, deck meta, and card row.
- Rebalance card density so the row reads as a tactical hand instead of a content wall.
- Define minimum and ideal card widths for desktop and mobile.
- Align card spacing and row behavior with the shell grid.
- Define the launch interaction model as `click card -> highlight valid targets -> click target`.
- Define immediate-resolve behavior for self, utility, and global cards that do not require a target.
- Treat drag-and-drop as optional future polish, not a requirement for the first usable version.

Definition of done:
- The active hand feels like a distinct play surface with clear room to inspect and click cards.
- A player can resolve a targeted card with no ambiguity using a click-first interaction flow.

### 8.13 Action Menu

Purpose:
- Act as the secondary command surface for turn/system actions, not the primary combat input.

Target structure:
- `Turn actions`: end turn and any mandatory confirm/cancel actions.
- `System actions`: overclock, potion, or other non-card systems that remain outside the hand.
- `Support actions`: larger targets, how to play, settings-level helpers.
- `Transitional actions`: any direct combat buttons that still exist before they are moved into cards or card-like abilities.
- `State rail`: turn loop, warning state, combat log.

Build:
- Split the current `.controls` panel into internal sub-panels with strong hierarchy.
- Visually subordinate the action menu to the hand zone so the cards remain the focus.
- Keep only truly systemic actions in the highest-priority button group.
- Pull support and onboarding actions out of the main combat button cluster.
- Group state messaging into a persistent rail instead of scattering it between sections.
- Visually separate system controls from build/progression controls.
- Treat existing direct-action buttons as candidates for migration into cards, skills, or card-adjacent abilities in a later design pass.

Dependencies:
- global shell update
- guidance surface update

Definition of done:
- The menu reads as a system rail, not a miscellaneous button pile.
- The player understands that cards are the main way to act, while buttons handle turn/system functions.
- Non-combat controls do not compete with hand play and targeting.

### 8.14 Guidance Surfaces

Purpose:
- Teach the player what to do next without overpowering core play.

Includes:
- quick guide
- onboarding panel
- inline role labels and helper copy

Build:
- Define one primary instructional surface and one secondary expandable teaching surface.
- Reduce duplicate messaging between battlefield labels, quick guide, and onboarding.
- Tie guidance layout to the action menu so “what to do next” lives near the controls.
- Make onboarding feel like an expandable field manual rather than another generic panel.

Definition of done:
- Guidance is visible when needed, dismissible when learned, and does not flood the screen with repeated instructions.

### 8.15 Build and Progression Surfaces

Purpose:
- Show class identity, skill progression, gear, artifacts, upgrades, and reward tree state.

Includes:
- class and skill panel
- reward tree strip
- gear strip
- upgrade strip
- artifact strip

Build:
- Separate run-scoped build state from account/meta state if both remain visible.
- Convert the current strip stack into a clearer inventory/progression group.
- Define consistent header, chip, and empty-state patterns across all progression surfaces.
- Move destructive meta reset controls out of the same visual level as build information.

Definition of done:
- Build systems feel organized and comparable instead of appended below the menu.

### 8.16 Reward and Interlude Panels

Purpose:
- Present between-combat choice points with clear reward comparison.

Build:
- Reuse the shared header pattern from combat panels.
- Define a consistent choice-card grid and action footer.
- Ensure these panels visually read as modal state transitions, even if they remain in-page.
- Preserve enough spacing and contrast for reward comparison on desktop and mobile.

Definition of done:
- Reward and interlude screens feel like intentional state changes, not hidden utility panels.

### 8.17 Run Summary Panel

Purpose:
- Explain outcome, run performance, records, timeline, and acquired artifacts.

Build:
- Create a clearer summary hierarchy: result, key stats, notable records, timeline.
- Reduce visual parity between minor stats and major outcome information.
- Keep artifact and timeline sections scannable without overpowering the headline result.

Definition of done:
- A failed or completed run is understandable in one pass, with obvious restart context.

### 8.18 Tooltip, Warning, and Motion Layer

Purpose:
- Provide local explanation, danger signaling, and responsive feedback.

Build:
- Standardize tooltip shell, spacing, and z-index behavior.
- Limit warning colors and glow effects to truly important state transitions.
- Define a minimal motion system for hover, press, resolve, highlight, and impact.
- Remove any motion that competes with live threat readability.

Definition of done:
- Feedback feels responsive and informative without turning the HUD into noise.

## 9. Shared Component System

The redesign should establish reusable primitives:

- panel tiers: `primary`, `secondary`, `support`, `modal-state`
- text roles: `headline`, `section-label`, `system-label`, `support-copy`
- state colors: `safe`, `cool`, `warning`, `danger`, `active`
- interaction states: `hover`, `focus`, `selected`, `disabled`, `recommended`, `risk-locked`
- chip styles: stat chips, warning pills, rarity chips, forecast chips
- navigation tiles: icon, title, descriptor, badge, lock state
- account/admin chips: role chip, status chip, provider chip, warning chip

## 10. Combat Loop and Interaction Model

Combat presentation should follow a tactical tableau style inspired by lane-based card battlers: the battlefield represents who is threatened, who is targeted, and what resolves next, while the hand is the main place where the player acts.

Core loop:

1. `Start Turn`: draw/refill, update threat telegraphs, show valid tactical state.
2. `Player Phase`: player acts primarily through cards in hand.
3. `Resolve Feedback`: card commits, target reacts, board state updates.
4. `Enemy Phase`: queued enemy intents resolve in readable order.
5. `Next Turn`: cleanup, death checks, next hand state.

Launch interaction rules:

- Targeted cards use `click card -> click target`.
- Valid enemies or lanes highlight when a selected card needs a target.
- Self, utility, or global cards resolve on click without a second target step.
- `Esc`, right click, or clicking the selected card again should cancel targeting.
- Drag-and-drop can be layered later as tactile polish, but it is not required for the first shipped interaction model.

UI implications:

- The hand zone should visually outrank the action menu during the player phase.
- Enemy cards and lane surfaces need clear `targetable`, `invalid`, `selected`, and `resolving` states.
- Card resolution should feel projected into the battlefield through animation, glow, impact, or motion.
- The battlefield is a representation surface first and a direct-input surface second.

## 11. Responsive Rules

- Front-door menu on desktop should support a hero area plus destination grid/rail.
- Front-door menu on mobile should collapse to a strong vertical stack with icon-led cards.
- Desktop: battlefield, hand, and action menu remain in separate columns.
- Tablet: action menu may move below hand, but primary actions must remain near the top of that section.
- Mobile: status -> battlefield -> enemies -> hand -> action menu -> build surfaces -> outcome surfaces.
- No component should require side-scrolling.
- No primary action button should fall below comfortable thumb target sizing.

## 12. Technical Constraints

- Keep current IDs used by runtime and tests unless migration is intentional.
- Prefer structural class additions over broad runtime rewrites.
- HTML changes should preserve script hook stability.
- CSS should move toward tokenized spacing and grouped component sections instead of continued one-off overrides.
- Auth and admin work require backend contracts; visual design alone is not sufficient to ship those surfaces.
- Player-facing and admin-facing routes should share tokens and component primitives, not identical layouts.

## 13. Acceptance Checklist

- Action menu is visually and structurally separated into action groups.
- Main menu has icon-first gothic navigation for all top-level destinations.
- `Legacy` replaces `Unlocks` as the player-facing progression destination label.
- Account supports Google OAuth states cleanly.
- Admin routes and user-management surfaces are defined separately from player UI.
- Cards are the primary combat input, using click card -> click target as the default targeted flow.
- Primary combat actions are the dominant interactive surface.
- Guidance content is reduced and organized.
- Build/progression surfaces read as one system group.
- Reward and summary panels share a consistent state-transition pattern.
- Desktop, tablet, and mobile layouts each have explicit rules.
- No existing onboarding or control binding behavior regresses.

## 14. Recommended First Execution Slice

Start with the front-door menu and top-level navigation surfaces, then move into the hand-driven combat surfaces.

Deliver in the first implementation slice:

- add a dedicated front-door/menu layout.
- build icon-led destination cards for `Start Game`, `Run History`, `Legacy`, and `Account`.
- reserve an auth-aware `Admin` entry that only renders for admins.
- establish the gothic menu art treatment and icon language.
- define signed-out and signed-in account states with Google OAuth entry points.

Then deliver:

- redefine the hand zone as the primary combat input surface.
- add click-select targeting states for cards, enemies, and lanes.
- reduce `.controls` so it reads as a turn/system rail rather than a second action surface.
- restructure `.controls` into grouped action sections.
- move onboarding/support buttons into a lower-priority support area.
- pair turn loop, warning state, and combat log into one state rail.
- move build/progression strips into a clearly separate lower section.
- update responsive rules for the menu before touching other panels.

Reason:

- the product currently has no real navigation shell even though it already has persistent systems.
- account and admin requirements need route and visibility decisions before combat polish.
- the current combat action menu remains the most overloaded in-combat surface and should follow immediately after navigation.
- it improves moment-to-moment usability without requiring gameplay changes.
- it creates the component pattern that the rest of the HUD can follow.
