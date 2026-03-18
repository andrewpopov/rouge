# Rouge - Project Rules

## Build & Test

```bash
npx tsc --project tsconfig.runtime.json   # compile runtime
npx tsc --project tsconfig.tests.json     # compile tests
npm test                                   # run tests (258 specs)
npx eslint <files>                         # lint (max-lines: 500, skipBlankLines/skipComments)
```

## Architecture

- IIFE-based runtime module system: all source files use `(() => { ... })()` assigning to `runtimeWindow`
- Script load order controlled via `index.html` and `tests/helpers/browser-harness.ts`
- Types are in `src/types/*.d.ts` (declaration files, not modules)
- Window globals declared in `src/types/ui.d.ts`

## Code Rules

### No Magic Strings

Never use bare string literals for values that appear in more than one place. Define named constants and reference them everywhere. Examples:

- **Trait kinds**: Use `TRAIT` constants from `combat-engine-monster-actions.ts` (exported via `runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS.TRAIT`)
- **Intent kinds**: Use `INTENT` constants and shared intent kind Sets from `combat-modifiers.ts` (exported via `runtimeWindow.ROUGE_COMBAT_MODIFIERS`)
- **Roles, variant names, modifier kinds**: Define constants, don't scatter string literals

When adding a new categorical string value (trait, intent kind, role, modifier, etc.), define it as a constant in the appropriate module and import/reference it everywhere it's used.

### Max Lines

All source files must stay under 500 effective lines (blank lines and comments excluded). Split into separate IIFE modules when approaching the limit, following the pattern of `combat-engine-monster-actions.ts` / `combat-engine-mercenary.ts`.

### Runtime Window Pattern

New modules must:
1. Be wrapped in an IIFE
2. Export via `runtimeWindow.MODULE_NAME = { ... }`
3. Declare the window property in `src/types/ui.d.ts`
4. Be added to `index.html` AND `tests/helpers/browser-harness.ts` in correct load order
