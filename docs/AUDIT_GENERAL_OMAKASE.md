# Auditoría General — OMAKASE Reservas (UNVERIFIED)

> Estado: **UNVERIFIED** — auditoría nocturna sin notificación, rama `feat/auditoria-abuse-rate-limit-pr2`.
> Fecha: 2026-09-12. Todo lo afirmado requiere verificación humana antes de actuar.

## Baseline (medido)

- Stack: Next.js 16.1.6, React 19.2.4, TypeScript strict, Tailwind 4, Supabase (ssr + js), Resend, Zustand, React Query, Zod 4.
- `tsc --noEmit`: **PASS** (0 errores).
- `vitest run`: **0 test files** — suite vacía (exit 1 "No test files found").
- `eslint .` completo: **TIMEOUT** (>240s, retry pendiente); per-file en `proxy.ts` + `anti-abuse.ts`: PASS tras fix.
- Git: rama feat con 7 archivos modificados + ~30 paths untracked (`.agent/skills/*`, `.github/*`, `openspec/`, `SECURITY.md`).

## Fix aplicado (menor, seguro)

- `src/proxy.ts`: 2 errores `curly` (`if` sin llaves, líneas 18/51) corregidos con `eslint --fix`.
- Re-verificado: eslint per-file PASS + `tsc` PASS. Sin borrados, sin cambios funcionales.

## Por rol (resumen)

- **Cliente (no auth → /reservar → /mis-reservas)**: wizard por pasos + `createBooking` server action con honeypot, time-trap 3s y rate-limit in-memory (20 req/min por IP+UA). **Gap**: sin validación Zod server-side (existe `bookingSchema` pero no se usa en el action); sin chequeo de capacidad/solape, `blocked_dates` ni horario semanal; `payment_token`/tarjeta se persisten en `bookings` (revisar PCI).
- **Staff (staff/cashier)**: ve reservas vía RLS; `admin.ts` acepta staff pero proxy `ADMIN_ROLES` = admin/manager/staff (cashier excluido) → **cashier bloqueado en /admin aunque `useUserRole.isStaff` lo incluye**. Inconsistencia.
- **Manager/Admin**: CRUD completo salvo delete restringido a admin/manager. Páginas settings/eventos/reportes con gate client-side `isAdmin` (= admin/manager) + proxy.
- **Sistema**: RLS habilitado en 11 tablas; `bookings` INSERT abierto (`WITH CHECK (true)`) — spam/DoS lógico posible; rate-limit in-memory no funciona multi-instancia; roles se leen de `user_metadata` (editable según configuración) en vez de `profiles` — **riesgo de escalación**.

## Booking (30 puntos, síntesis)

Puntos críticos con gap: validación server (no), idempotencia/retry seguro (no), capacidad por zona/mesa (no), solape de horarios (no), blocked_dates (no), schedule semanal (no), cancelación cliente (sin policy update propia), confirmación doble (no), emails transaccionales con fallback (parcial: try/catch sin reintento), auditoría de cambios (triggers pg_notify sí, log de quién/qué no). Ver `TRIAGE_GAPS.md`.

## No-técnico (ciclo sumado)

- **i18n**: locales es/en/pt existen; `<html lang="en">` hardcodeado en layout (debería seguir idioma, default `es`).
- **a11y**: sin auditoría instrumental; wizard multi-paso y floorplan drag-and-drop son focos de riesgo (foco, teclado, contraste en tema oscuro).
- **Legal**: `/privacidad` y `/terminos` existen con contenido; falta `CHANGELOG.md` (creado básico), README real (sigue boilerplate create-next-app — no tocado por regla no-borrar-custom), ADRs (creados 2 iniciales).
- **Producto/UIUX/contenido**: sin cambios aplicados; propuestas en `KANBAN_DRYRUN.md`.

## No ejecutado (requiere decisión o es pesado)

- `eslint .` completo, `next build`, `npm outdated` / upgrade de stack menor, instalación de skills nuevas.
- Motivo: timeout/red o riesgo de tocar dependencias sin autorización. Todo marcado UNVERIFIED.
