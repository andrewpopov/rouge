const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

const recommendedRules = js.configs.recommended.rules;
const tsRules = {
  ...tseslint.configs.recommended.rules,
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "guard-for-in": "error",
  "no-else-return": "error",
  "no-eval": "error",
  "no-implicit-coercion": "error",
  "no-implied-eval": "error",
  "no-lonely-if": "error",
  "no-param-reassign": "error",
  "no-return-assign": "error",
  "no-sequences": "error",
  "no-shadow": "off",
  "no-throw-literal": "error",
  "no-unneeded-ternary": "error",
  "no-unused-vars": "off",
  "no-useless-return": "error",
  "no-var": "error",
  "object-shorthand": ["error", "always"],
  "prefer-const": "error",
  "prefer-template": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-shadow": "error",
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
};
const sharedRules = {
  ...recommendedRules,
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "guard-for-in": "error",
  "no-else-return": "error",
  "no-eval": "error",
  "no-implicit-coercion": "error",
  "no-implied-eval": "error",
  "no-lonely-if": "error",
  "no-param-reassign": "error",
  "no-return-assign": "error",
  "no-sequences": "error",
  "no-shadow": "error",
  "no-throw-literal": "error",
  "no-unneeded-ternary": "error",
  "no-unused-vars": "off",
  "no-useless-return": "error",
  "no-var": "error",
  "object-shorthand": ["error", "always"],
  "prefer-const": "error",
  "prefer-template": "error",
};

const maxLineHotspots = [
  "src/app/app-engine.ts",
  "src/combat/combat-engine-turns.ts",
  "src/content/asset-map-data.ts",
  "src/content/encounter-registry-builders.ts",
  "src/content/encounter-registry-enemy-builders.ts",
  "src/content/rouge-art-manifest.ts",
  "src/items/item-catalog.ts",
  "src/items/item-data.ts",
  "src/items/item-system.ts",
  "src/rewards/reward-engine.ts",
  "src/ui/action-dispatcher-combat-fx.ts",
  "src/ui/combat-view.ts",
  "src/ui/inventory-view.ts",
  "src/ui/reward-view.ts",
  "src/ui/safe-zone-view.ts",
  "src/ui/world-map-view.ts",
  "src/app/main-card-preview.ts",
  "src/ui/combat-view-renderers.ts",
  "src/ui/action-dispatcher.ts",
];

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "generated/**",
      "assets/diablo2_downloads/**",
      "playwright-report/**",
      "test-results/**",
      "ecosystem.config.js",
    ],
  },
  {
    files: ["*.js"],
    ignores: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: sharedRules,
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/quests/world-node-engine.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tsRules,
      "max-depth": ["error", 4],
      "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 8],
      "no-console": "error",
      "no-nested-ternary": "error",
    },
  },
  {
    files: ["src/quests/world-node-engine.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tsRules,
      "max-depth": ["error", 4],
      "max-lines": "off",
      "max-params": ["error", 8],
      "no-console": "error",
      "no-nested-ternary": "error",
    },
  },
  {
    files: maxLineHotspots,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tsRules,
      "max-depth": ["error", 4],
      "max-lines": "off",
      "max-params": ["error", 8],
      "no-console": "error",
      "no-nested-ternary": "error",
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: tsRules,
  },
  {
    files: ["tests/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: sharedRules,
  },
  {
    files: ["scripts/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      ...sharedRules,
      "no-console": "off",
      "no-shadow": "off",
    },
  },
];
