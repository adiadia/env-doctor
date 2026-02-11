const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "playground.mjs"]
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules ONLY for TS files
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ["src/**/*.ts", "test/**/*.ts"]
  })),

  // Node environment for TS files (so process/console are known if used)
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    }
  }
];
