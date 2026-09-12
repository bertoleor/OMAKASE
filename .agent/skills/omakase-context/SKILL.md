---
name: omakase-context
description: >
  Project-wide architecture map for the omakase restaurant reservation app. Trigger: starting any task, navigating the repo, or deciding where a change belongs. One-stop stack, layout, and data-flow reference.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Project Context

Reservation-agenda app for a premium sushi restaurant: customer booking wizard + full admin panel (dashboard, calendar, floorplan, reservations, events, settings, reports).

## Stack (from `package.json`)

- **Next.js 16** (App Router), **React 19**, TS strict.
- **@supabase/ssr 0.8** + `@supabase/supabase-js 2.93` — auth, DB, and **Deno edge functions** (`auto-confirm`, `no-show-handler`, `send-reminders`). Clients: `src/lib/supabase/{client,server,admin}.ts`.
- **TanStack Query 5** (`src/providers/QueryProvider.tsx`).
- **Zustand 5** — client stores (`src/store/`).
- **FullCalendar 6** — admin calendar; **dnd-kit 6/9/10** — floorplan drag & drop.
- **resend 6** — transactional email (`src/lib/email/resend.ts` + `templates/`).
- **zod 4** (`src/lib/validations.ts`), **Vitest 4** (dev dep, **no npm script** — run `npx vitest run`).
- **Tailwind 4**, shadcn-style `ui/` components, framer-motion, date-fns 4, react-day-picker 9.
- **Custom i18n** — hand-rolled `LanguageContext` with dictionaries (`es`/`en`/`pt`), **not** next-intl. See `omakase-i18n-custom`.

## Top-level layout

- `src/core/result.ts` — `Result<T>` / `Success` / `Failure`, six `ErrorCode`s, `traceId`. The domain error contract (see `omakase-error`).
- `src/contexts/LanguageContext.tsx` — manual i18n provider + `t()`.
- `src/store/` — `booking-store.ts` (wizard draft + admin reservations), `admin-ui-store.ts` (sidebar), `notification-store.ts` (toasts/palette). See `omakase-agenda-store`.
- `src/types/` — `booking.ts` (domain model), `settings.ts`, `database.types.ts`.
- `src/hooks/` — `useLanguage`, `useErrorHandler`, `useRealtime[Bookings]`, `useMediaQuery`, `useUserRole`, `queries.ts`.
- `src/lib/` — `logger`, `utils`, `validations`, `rate-limit`, `anti-abuse`, `seo`, `email/` (`resend.ts` + `templates/`), `supabase/`.
- `src/config/business.ts` — business constants (name, zones, social, emails). Source of `BUSINESS`.

## App routes

- Customer: `/` (landing), `/reservar` (`BookingWizard`), `/reservar/confirmacion/[id]`, `/mis-reservas` (+`/[id]`, `/login`), `/terminos`, `/privacidad`.
- Admin: `/admin/dashboard`, `/admin/calendar`, `/admin/floorplan`, `/admin/reservations`, `/admin/events`, `/admin/reports`, `/admin/settings/*` (tables, zones, staff, schedule, blocked dates), `/admin/login`.
- API/actions: `src/app/actions/{bookings,admin}.ts` (server actions), `src/app/api/{email,webhooks}/route.ts`.

## Domain vocabulary

Canonical names (see `omakase-reservations-domain`): **Reservation**, **MenuSection**, **TableInventory**, **KitchenOrder**. DB table: `bookings`; columns `booking_*`, `restaurant_settings` holds settings.

## Rules

- `MUST`: read the relevant skill for a slice before editing it — `omakase-error`, `omakase-i18n-custom`, `omakase-reservations-domain`, `omakase-agenda-store`, `omakase-supabase-functions`, `omakase-notifications-resend`.
- `MUST`: use `BUSINESS` from `src/config/business.ts` for name/address/phone/emails/zones — never hardcode.
- `MUST`: admin mutations go through server actions with `checkAdminPermission()` (admin/manager/staff roles).
- `SHOULD`: keep domain logic in actions/services, UI state in Zustand, server state in TanStack Query.
- `nunca`: never add next-intl; never write raw card PANs/CVC to the DB (tokenized only, `DraftReservation` uses `paymentToken`/`cardLastFour`).
