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
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-unsafe-regex": "warn",
      "security/detect-buffer-noassert": "warn",
      "security/detect-child-process": "warn",
      // Promise
      "promise/always-return": "warn",
      "promise/no-return-wrap": "warn",
      "promise/param-names": "warn",
      "promise/catch-or-return": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Strict TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_"} ],
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      // Strict JS
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "eqeqeq": ["warn", "always"],
      "curly": ["warn", "all"],
      "no-eval": "warn",
      "no-implied-eval": "warn",
      "no-new-func": "warn",
      "no-throw-literal": "warn",
      "no-unsafe-negation": "warn",
      "radix": "warn",
      "use-isnan": "warn",
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
