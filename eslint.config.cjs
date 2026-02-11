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

  // Shared rules for TS files
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
  },

  // Node bin scripts (CommonJS) - allow require()
  {
    files: ["bin/**/*.cjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly"
      }
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];
