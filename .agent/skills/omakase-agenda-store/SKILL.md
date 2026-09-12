---
name: omakase-agenda-store
description: >
  Zustand client-state store for omakase. Trigger: changing client UI state, wizard draft, admin reservations list, sidebar, or command palette. Covers booking-store, admin-ui-store, notification-store.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Agenda Store (Zustand)

Client-side UI/ephemeral state lives in **Zustand 5** stores under `src/store/`. Server/data state goes to **TanStack Query** + Supabase; don't duplicate it in a store.

## The three stores

### `booking-store.ts` — `useBookingStore`

Two concerns in one store (deliberate, existing design):

- **CLIENT WIZARD**: `currentStep`, `draftBooking` (`DraftReservation`), `resetDraft()`, `updateDraft(Partial<DraftReservation>)`, `setStep(n)`. `initialDraft` already includes personalization + payment-token defaults — spread it, don't rebuild.
- **ADMIN DATA**: `reservations: Reservation[]`, `reservationsLoading`, `reservationsError`, plus `addReservation` (dedupes by `id`), `updateStatus(id, status)`, `setReservations`, `getReservationsByDate(date)` (filters on `r.date`), `fetchReservations(date)`.

```ts
const { draftBooking, updateDraft } = useBookingStore((s) => ({
  draftBooking: s.draftBooking,
  updateDraft: s.updateDraft,
}));
updateDraft({ pax: 4, zone: "indoor-tables" });
```

`fetchSettings`/`fetchReservations` hit `createClient()` (`@/lib/supabase/client`) directly and are guarded against duplicate in-flight fetches — keep that guard if you touch them.

### `admin-ui-store.ts` — `useAdminUIStore`

`isSidebarOpen` (default `true` desktop) with `toggleSidebar()` / `setSidebarOpen(bool)`.

### `notification-store.ts` — `useNotificationStore`

`unreadCount` + `incrementUnread()` / `clearUnread()`; `isCommandPaletteOpen` + `setCommandPaletteOpen(bool)`. Feeds `AdminHeader`/`CommandPalette`.

## Rules

- `MUST`: select narrow slices (`useBookingStore(s => s.x)`) to avoid re-render storms; use `useShallow`/multiple selectors when taking an object.
- `MUST`: use `updateDraft`/`set` to update immutable state — never mutate `state.draftBooking` in place.
- `MUST`: keep wizard step transitions pure via `setStep`; `resetDraft` resets both step and draft.
- `SHOULD`: keep server-fetched `reservations` normalized and seeded empty (no mocks); load via server actions/Query on demand, not baked into the store.
- `nunca`: never store `Reservation` data duplicated from Supabase if TanStack Query owns it; never merge mutable patterns (`draftBooking.customer.firstName = x`).

## Example (dedupe on add)

```ts
addReservation: (reservation) => set((state) => {
  if (state.reservations.some((r) => r.id === reservation.id)) return state;
  return { reservations: [...state.reservations, reservation] };
}),
```

## Example (immutable draft update)

```ts
updateDraft: (data) => set((state) => ({
  draftBooking: { ...state.draftBooking, ...data },
})),
```
