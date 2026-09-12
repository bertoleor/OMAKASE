---
name: omakase-reservations-domain
description: >
  The omakase domain model: Reservation, BookingStatus, TableZone, Customer, DraftReservation. Trigger: modeling the reservation domain, fields, status transitions, or typing Supabase bookings.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Reservations Domain

The domain source of truth is `src/types/booking.ts` (`Reservation`, `BookingStatus`, `Customer`, `DraftReservation`) and `src/types/database.types.ts` (generated Supabase). Restaurant bounded context vocabulary: **Reservation**, **MenuSection**, **TableInventory**, **KitchenOrder**.

## Key types (verbatim anchors)

```ts
type BookingStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show";
type TableZone = "indoor-tables" | "outdoor-pergola" | "indoor-bar";
type BookingOccasion = "birthday" | "anniversary" | "business" | "casual";

interface Reservation {
  id: string;
  customer: Customer;
  date: string; // ISO date string, serialized
  timeSlot: string; // e.g. "20:30"
  pax: number;
  zone: TableZone;
  tableNumber?: string;
  status: BookingStatus;
  notes?: string;
  occasion?: BookingOccasion;
  depositPaid: boolean;
  createdAt: string;
}
```

`DraftReservation` = `Partial<Omit<Reservation, "id" | "createdAt" | "customer">>` & `{ customer?: Partial<Customer>; vegetarians?; kids?; restrictions?; policyAccepted?; customerDni?; paymentToken?; cardBrand?; cardLastFour? }`.

## Status lifecycle

Normal forward flow: `pending → confirmed → seated → completed`. Rejections/business rules: `cancelled` (customer or restaurant), `no-show`. Guard transitions — don't allow random jumps.

## ⚠️ The `no-show` / `no_show` split (known gotcha)

- The TS type is `"no-show"` (**hyphen**) — used across `Reservation.status`, `updateStatus`, UI, and dictionary keys.
- The **edge function `supabase/functions/no-show-handler` writes `"no_show"`** (**underscore**) into the `bookings` table: `update({ status: "no_show" })`.
- These must be reconciled in exactly one place (map to/from the DB at the boundary). **Never** introduce a third form (`noShow`, `no show`). Any fix should normalize reads so UI sees the hyphenated type only.

## Mapping to the DB

- Table is **`bookings`** (plural); `status` column, `booking_date`/`booking_time`/`booking_time` columns, `customer_name`/`customer_email`. The auto-confirm function also uses `created_at`, `reminder_24h_sent`, `reminder_2h_sent`.
- `restaurant_settings` table backs `Settings`.
- `src/store/booking-store.ts` fetches from `.from("bookings").eq("booking_date", date).order("booking_time")`.

## Domain vocabulary fidelity

- **Reservation** ↔ `Reservation`/`bookings`/`mis-reservas`.
- **MenuSection** ↔ `zone`/experiences (`indoor-tables`, `outdoor-pergola`, `indoor-bar`).
- **TableInventory** ↔ `tableNumber`/floorplan (`DroppableTable`, `DraggableBooking`).
- **KitchenOrder** ↔ the burn of a seated `Reservation`; triggered from an occupied `TableInventory`.

Keep these names; don't invent synonyms (`booking` is only literal where the schema says so).

## Rules

- `MUST`: use `BookingStatus` literals directly; map the DB `no_show` to type `no-show` at the boundary.
- `MUST`: full-width state shape comes from `settings`/`BUSINESS`, never mocked/admin-invented.
- `SHOULD`: put domain transitions in server actions (`src/app/actions/admin.ts` `updateBookingStatus`), not inline in components.
- `nunca`: never store raw card PAN/CVC (tokenized `paymentToken`/`cardLastFour` only); never add a third spelling for no-show; never widen a `booking_*` date/time format the UI assumes (`YYYY-MM-DD`, `HH:MM`).
