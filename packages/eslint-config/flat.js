/**
 * Flat ESLint config (ESLint ≥9 / 10) — mirrors the rules in base.js.
 *
 * The legacy .eslintrc format is no longer supported by ESLint 10, so apps
 * load this file from their eslint.config.mjs. Type-aware linting
 * (parserOptions.project) is intentionally not enabled here so that test
 * configs and scripts outside tsconfig's program still lint cleanly.
 */
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");
const onlyWarn = require("eslint-plugin-only-warn");

module.exports = [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/build/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "only-warn": onlyWarn,
    },
    rules: {
      ...prettierConfig.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];