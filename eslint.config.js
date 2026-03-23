import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      pluginReact.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      // React 17+ — JSX transform, no need to import React
      "react/react-in-jsx-scope": "off",

      // TypeScript handles prop types — react/prop-types is redundant
      "react/prop-types": "off",

      // Allow explicit any with a warning during migration
      "@typescript-eslint/no-explicit-any": "warn",

      // Unused vars — warn only (TypeScript already enforces noUnusedLocals if needed)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // Console statements — warn only in production codebase
      "no-console": "warn",

      // Ukrainian/multilingual text often contains apostrophes — don't require escaping
      "react/no-unescaped-entities": "off",

      // Empty blocks — warn only
      "no-empty": ["warn", { allowEmptyCatch: true }],

      // Allow alert/confirm in non-critical code paths
      "no-alert": "warn",

      // Lexical declarations in case blocks — warn only
      "no-case-declarations": "warn",

      // next/image is not used (this is Vite, not Next.js)
      "@next/no-img-element": "off",

      // cmdk uses custom HTML attributes — allow them
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],

      // Empty object type (use {} for now during migration)
      "@typescript-eslint/no-empty-object-type": "warn",

      // Allow ts-comment directives (used for legacy code workarounds)
      "@typescript-eslint/ban-ts-comment": "warn",

      // React hooks rules
      ...pluginReactHooks.configs.recommended.rules,

      // React refresh
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
);
