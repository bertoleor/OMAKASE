---
name: omakase-notifications-resend
description: >
  Resend-based transactional email for omakase. Trigger: sending email, building email templates, or wiring reminder/confirmation/cancellation/magic-link/status flows. Spanish copy, dark HTML cards.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Notifications — Resend

Transactional email rides on **Resend 6** via `src/lib/email/resend.ts` + `src/lib/email/templates/`. Business identity comes from `src/config/business.ts` (`BUSINESS`).

## Resend client (lazy)

`getResendClient()` holds a singleton `resendInstance` and throws if `RESEND_API_KEY` is unset — lazy-init'd to avoid build-time failures. `FROM_EMAIL = BUSINESS.emails.from`. Every sender method: build → send → return `{ success: boolean; error?: string }` (see `omakase-error` for why it never throws).

## Email senders

```ts
// confirmation
sendConfirmationEmail({ to, customerName, bookingDate, bookingTime, pax, zoneName?, bookingId?, ... });
// reminder (24h), subject "Recordatorio: Su reserva es manana -"
sendReminderEmail(data);
// by customer or restaurant; selects template via cancelledBy: "cliente" | "restaurante"
sendCancellationEmail({ ..., cancelledBy: "restaurante", cancellationReason? });
// auth
sendMagicLinkEmail(to, magicLink);
// ad-hoc alert from admin, subject: "Estado de Reserva: ..."
sendStatusUpdateEmail({ ...data, status, statusMessage });
```

All use `renderTemplate(template, getTemplateVariables(data))` where templates live in `src/lib/email/templates/{confirmation,reminder,cancellation}.ts`, exported via `templates/index.ts`.

## Templates

`renderTemplate(template, variables)` substitutes `TemplateVariables` into HTML (`{{var}}` style). Variables include customer name/date/time/pax (`paxText`: 1 → "persona", else "personas"), `bookingIdShort = bookingId.slice(0,8).toUpperCase()`, zone/notes/cancellation reason, plus `BUSINESS` fields (name/tagline/address/phone/email, `instagramUrl`, `facebookUrl`, `whatsappUrl` from `BUSINESS.social`, `manageBookingUrl = baseUrl + /mis-reservas/<id>`). Admin sender pulls business fields, not user-supplied ones.

## Styling conventions

Dark, premium sushi: `background-color: #000`/`#0F0F0F`, `color: #fff`, rounded `24px` borders, `#C9A962` gold accents. Confirmation/cancellation use Geist Sans; `sendStatusUpdateEmail` uses Playfair Display + Inter. Inline styles only in `<style>` (email-safe). Subjects are plain Spanish, no emoji.

## Where flows trigger email

- Server actions call senders after the DB write (e.g. `updateBookingStatus` → cancellation email only when `status === "cancelled"`, with `.catch(console.error)`; `sendAuthMagicLink` → generates via `auth.admin.generateLink` then sends via Resend).
- Edge function `send-reminders` is the TODO: wire it into these same senders (NOT a new service). See `omakase-supabase-functions`.

## Rules

- `MUST`: send only through the exported functions — never `new Resend()` at call sites; never duplicate HTML email bodies.
- `MUST`: Spanish default copy, no emojis in subject; keep `statusLabels` style mapping (`confirmed: "Confirmada"`, `seated: "Ocupada"`, `completed: "Completada"`, `no-show: "No asistio"`).
- `MUST`: pass a populated `bookingId` whenever available so `bookingIdShort`/`manageBookingUrl` build correctly.
- `SHOULD`: fire-and-forget email in the action layer (`.catch(console.error)`), return before send finishes; never block booking confirmation on it.
- `nunca`: never commit `RESEND_API_KEY` in code; never reuse `sendMagicLinkEmail`'s bespoke body for other flows; never diverge from `BUSINESS.emails.from` as the sender.
