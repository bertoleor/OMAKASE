---
name: restaurant-auditor
description: >
  Code-integrity auditor for the omakase restaurant reservation app. Trigger: writing, reviewing, or refactoring any code in this repo, or before committing. Enforces domain nomenclature, component composition, error consistency, and UI-hook separation.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Restaurant System Integrity

Audit and gate every change against the omakase domain and codebase conventions. This is a workspace-wide rule set, not a one-off script.

## Domain Nomenclature (MUST)

Name domain entities strictly by the restaurant bounded context the code implements. The persistent domain language is:

- **Reservation** — a booking record (`Reservation` type, `bookings` table, `booking-*` fields).
- **MenuSection** — grouping of menu items/experiences (zones/experiences are the restaurant framing: `zone`, `indoor-tables`, `outdoor-pergola`, `indoor-bar`).
- **TableInventory** — assignable tables and floorplan occupancy (floorplan page, `DroppableTable`, `DraggableBooking`).
- **KitchenOrder** — order/kitchen-triggered flow tied to a table once a `Reservation` is `seated`.

Never swap these for generic names (`booking` may only appear where the DB schema literally says `bookings`/`booking_*`). `MUST`: a type, store field, function, or column that implements one of these four concepts carries the domain name, surfaced here, not an invented synonym.

## Invariants (MUST)

1. **No descriptive comment noise.** Remove comments that restate what the code obviously does. Keep a comment only when it explains a non-obvious why, a business rule, or a gotcha (e.g. the `no-show` vs `no_show` split).
2. **Errors go through the `Result` contract.** The real error model is `src/core/result.ts`: discriminated union `Result<T>` with `Success(data, traceId)` / `Failure(code, message, traceId, details?)` and the six `ErrorCode`s (`VALIDATION_ERROR`, `DATABASE_ERROR`, `PAYMENT_FAILED`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`). There is **no** `AppError` class in this codebase — do not add or import one; encode domain error codes via `Failure(...)` or the `{ success: boolean; error?: string }` action-return pattern.
3. **Logic hooks never live in `/components/ui`.** `src/components/ui/*` holds pure presentational atoms. Any hook (`useX`, `useState`, `useQuery`, router, store) inside a `ui/` component is a violation; presentational components receive props and callbacks from parents.
4. **Component-Composition pattern.** Assemble UI from small focused presentational components + composition, not one monolithic block per file. Break wizard steps, admin panels, and dashboard widgets into composable parts.
5. **The `result.ts` `Result` return is reserved for the domain error contract.** Components surface errors through `useErrorHandler`, `ErrorBoundary`, and `error.toast()` — not raw `try/catch` + `throw` inside a component.

## Review Checklist (run on every diff, not scripted)

For each changed file, verify:

- [ ] Domain entities use the canonical restaurant nomenclature (no invented synonyms).
- [ ] No descriptive comments were added; only non-obvious `why` comments remain.
- [ ] `src/components/ui/**` contains no logic hooks, provider access, or store subscriptions.
- [ ] Any thrown error uses `Failure(...)`/`{ success: false }` and a valid `ErrorCode`; no `AppError`.
- [ ] Components follow composition (small focused pieces), not a single mega-block.

## Rules

- `MUST`: keep domain tokens exactly as defined (including `no-show` for the TS `BookingStatus` and `no_show` for the edge-function DB value — both are the real schema; reconcile in one place, never invent a third form).
- `SHOULD`: keep wizard steps and admin panels small enough to read in one screen.
- `nunca` / `never`: never import or define `AppError`; never invent or require a custom audit CLI before commit — code review by this checklist is the gate.
