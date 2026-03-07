const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

const recommendedRules = js.configs.recommended.rules;
const sharedRules = {
  ...recommendedRules,
  curly: ["error", "all"],
  eqeqeq: ["error", "always"],
  "no-unused-vars": "off",
  "no-var": "error",
  "prefer-const": "error",
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
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      ecmaVersion: "latest",
      sourceType: "module",
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
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "no-unused-vars": "off",
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // These files are still browser-global bridge modules; tighten types incrementally
    // without blocking the folder/domain migration on a big-bang typing pass.
    files: [
      "src/app/**/*.ts",
      "src/run/**/*.ts",
      "src/combat/**/*.ts",
      "src/ui/**/*.ts",
      "src/state/**/*.ts",
      "src/meta/**/*.ts",
      "src/character/**/*.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
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
    rules: sharedRules,
  },
];
