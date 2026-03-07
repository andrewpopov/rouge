const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

const recommendedRules = js.configs.recommended.rules;
const sharedRules = {
  ...recommendedRules,
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "no-implicit-coercion": "error",
  "no-shadow": "error",
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
      ...tseslint.configs.recommended.rules,
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "max-lines": ["error", { max: 950, skipBlankLines: true, skipComments: true }],
      "no-console": "error",
      "no-implicit-coercion": "error",
      "no-nested-ternary": "error",
      "no-shadow": "off",
      "no-unused-vars": "off",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "prefer-template": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
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
      ...tseslint.configs.recommended.rules,
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "max-lines": "off",
      "no-console": "error",
      "no-implicit-coercion": "error",
      "no-nested-ternary": "error",
      "no-shadow": "off",
      "no-unused-vars": "off",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "prefer-template": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
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
    rules: {
      ...tseslint.configs.recommended.rules,
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-implicit-coercion": "error",
      "no-shadow": "off",
      "no-unused-vars": "off",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "prefer-template": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
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
