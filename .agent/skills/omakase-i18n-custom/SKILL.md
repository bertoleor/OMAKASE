---
name: omakase-i18n-custom
description: >
  Custom hand-rolled i18n for omakase (es/en/pt), NO next-intl. Trigger: adding/editing any visible string, working with LanguageContext, t(), or locale dictionaries.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Custom i18n

Omakase uses its own i18n, not next-intl. A `LanguageProvider` exposes `t()` against plain TypeScript dictionaries.

## How it works

- **Provider**: `src/contexts/LanguageContext.tsx` (`<LanguageProvider>`). Provides `{ language, setLanguage, t, dictionary }`.
- **Hook alias**: `src/hooks/useLanguage.ts` re-exports `useLanguage` from the context.
- **Languages**: `type Language = "es" | "en" | "pt"` (`src/i18n/types.ts`). **es** is the default and the fallback (`defaultDictionary`).
- **Dictionaries**: one module per locale in `src/i18n/locales/{es,en,pt}.ts`, each typed `Dictionary` (from `./types`). Registered in `src/i18n/index.ts` as `dictionaries` with `defaultDictionary = es`.
- **Persistence**: language is read/written on `localStorage["language"]`. Server-side (`globalThis.window === undefined`) falls back to `"es"` / `defaultDictionary`.
- **Lookup**: `t(path)` splits on `.` and walks the nested object, e.g. `t("confirmation.title")`. If a key is missing it `console.warn`s and returns the raw `path` (never crashes).

```tsx
"use client";
import { useLanguage } from "@/hooks/useLanguage";
const { t, language, setLanguage } = useLanguage();
const title = t("myReservations.title");
setLanguage("en");
```

## The `Dictionary` shape

Types are the contract in `src/i18n/types.ts` (sections: `common`, `wizard`, `quantity`, `date`, `time`, `zones`, `personalize`, `auth`, `guarantee`, `summary`, `confirmation`, `myReservations`, `reservationDetail`, `login`). Each locale must implement the **entire** interface — a missing key is a TS error.

## Adding a new string — the full checklist (MUST all)

1. Add the typed field to `src/i18n/types.ts`.
2. Add the value to **all three** of `src/i18n/locales/es.ts`, `en.ts`, `pt.ts` (es is authoritative copy).
3. Consume via `t("section.key")` from `useLanguage()`.
4. For statuses/booleans, keep enum labels in the dictionary (e.g. `myReservations.status_confirmed`), not inline strings.

## Rules

- `MUST`: use `t()` for every user-visible string — no hardcoded copy in components (except genuinely non-translatable identifiers).
- `MUST`: keep the three locales in lockstep (same keys). Any comment header (`// Mis Reservas`) is fine.
- `SHOULD`: use `dictionary` only for renders needing the whole object; prefer targeted `t()` keys.
- `máxima`/`never`: never add next-intl; never skip a locale; never leak a raw translation key to the user.

## Examples

Good: `<h1>{t("wizard.pax")}</h1>` and `setLanguage("es")` on a picker.
Bad: `<h1>Cargando...</h1>`; missing `pt.ts` entry; switching to next-intl's `<FormattedMessage>`.
