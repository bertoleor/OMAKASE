import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";
import promise from "eslint-plugin-promise";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Security + promise plugins (cost-zero, no type-aware needed)
  {
    plugins: { security, promise },
    rules: {
      // Security
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-unsafe-regex": "warn",
      "security/detect-buffer-noassert": "warn",
      "security/detect-child-process": "warn",
      // Promise
      "promise/always-return": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/catch-or-return": "warn",
      // Strict TypeScript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      // Strict JS
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-throw-literal": "error",
      "no-unsafe-negation": "error",
      "radix": "error",
      "use-isnan": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "src/lib/email-templates/**",
    "src/types/database.types.ts",
  ]),
]);

export default eslintConfig;
