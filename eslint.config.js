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
