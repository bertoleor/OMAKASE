---
name: omakase-error
description: >
  Error contract and handling for omakase. Trigger: writing error handling, server actions, validation, or debugging failures. The Result type, six ErrorCodes, useErrorHandler/ErrorBoundary/Toast patterns.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Error Handling

One canonical error model lives in `src/core/result.ts`. There is **no `AppError` class** — never define or import one.

## The `Result<T>` contract

Discriminated by the `success` field; both branches carry a `traceId` string:

```ts
type Result<T> =
  | { success: true; data: T; traceId: string }
  | {
      success: false;
      error: { code: ErrorCode; message: string; details?: unknown };
      traceId: string;
    };
```

Construction helpers (always route new errors through these):

```ts
Success(data, traceId); // { success: true, data, traceId }
Failure("NOT_FOUND", "Booking not found", traceId, { bookingId }); // { success: false, error:{...}, traceId }
```

## The six `ErrorCode`s

`VALIDATION_ERROR` | `DATABASE_ERROR` | `PAYMENT_FAILED` | `NOT_FOUND` | `CONFLICT` | `INTERNAL_ERROR`

Pick the closest code; never invent a new literal — TS strict will reject it, and it should.

## Where each layer surfaces errors

- **Server actions** return the plain-object shape `{ success: boolean; error?: string }` (see `src/app/actions/admin.ts`, `bookings.ts`). They `console.error` the cause and map user-safe copy into `error`. Keep user-facing messages in the customer's language; use `BUSINESS`/i18n where needed.
- **Components** do **not** `try/catch` + throw. Use:
  - `useErrorHandler()` → `{ error, isError, handleError(err, fallback), clearError }`. It normalizes `Error`/`string`, and extracts `code`/`details` from Supabase error objects. Also `useAsyncHandler(asyncFn, {onSuccess,onError})` for loading-state async op.
  - `ErrorBoundary` (class, `src/components/ui/ErrorBoundary.tsx`) wrapping fragile trees; pass `componentName` for the `logError` context. `fallback` prop for custom UI. `useErrorBoundary()` hook rethrows in function components.
  - `useToast()` (from `src/components/ui/ErrorToast.tsx`) → `{ success, error, warning, info, toasts, dismissToast, ToastContainer }`. Fire `error.toast()` after `handleError`.
- **Logger**: `import { logError, logWarn } from "@/lib/logger"`. Always log the root cause + context (component, errorCode) — cheaper and more truthful than swallowing.

## Rules

- `MUST`: every thrown/interrupted domain flow returns `Success`/`Failure` or `{ success: boolean; error?: string }` — never `undefined` + `console.log`.
- `MUST`: log the actual cause, not just the user copy: `console.error("ctx:", e)` or `logError`.
- `SHOULD`: map Supabase errors into a stable `ErrorCode` at the action boundary; don't leak raw DB messages to clients.
- `nunca`: never `throw` inside a component without an `ErrorBoundary`; never bypass validation to send raw data onward; never invent an error code or an `AppError` class.

## Example

```ts
// server action
"use server";
export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    await checkAdminPermission();
    const supabase = await createClient();
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
```
