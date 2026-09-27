# Triage de Gaps — OMAKASE (UNVERIFIED)

> Todo UNVERIFIED. Severidad propuesta, no confirmada.
> Parte de: [[projects/omakase/README]] · Relacionados: [[AUDIT_GENERAL_OMAKASE]], [[KANBAN_DRYRUN]], [[STATUS-ORN-85]]

## P0 — Seguridad / integridad (atender primero)

1. **Roles desde `user_metadata`, no desde `profiles`** (`proxy.ts`, `admin.ts`, `useUserRole.ts`). Si el usuario puede editar su metadata → escalación. Acción: leer rol de `profiles` server-side; unificar sets (cashier definido en 3 lugares distintos).
2. **`bookings` INSERT público sin validación server** (`actions/bookings.ts` no usa `bookingSchema`). Acción: validar con Zod en el action + `WITH CHECK` más estricta o función `SECURITY DEFINER`.
3. **Datos de tarjeta en `bookings`** (`payment_token`, `card_brand`, `card_last_four`). ✅ **Resuelto** — decisión PCI documentada en [ADR-003-pci-tarjeta.md](ADR-003-pci-tarjeta.md): delegación total a Mercado Pago ("zero-PAN"), solo IDs de referencia MP, columnas legadas eliminadas (migración `20260913000100`), schema `.strict()` en `createBooking`. Sin PAN/tokens reutilizables en DB.
4. **Rate-limit in-memory** (`lib/rate-limit.ts`): bypass multi-instancia y reseteo en deploy. Acción: ADR-002 (Redis/Upstash o capa Supabase).

## P1 — Lógica de reserva

5. Sin chequeo de capacidad/solape por zona-mesa-horario → overbooking posible.
6. Sin chequeo de `blocked_dates` ni `weekly_schedule` en `createBooking`.
7. Sin idempotencia (doble click / retry crea duplicados).
8. Cliente sin policy de update/cancel propia (solo admin actualiza).
9. Sin límite `max_pax_per_booking` / `max_advance_days` / `min_advance_minutes` aplicados server-side (existen en settings, no se enforcean en el action).

## P2 — Calidad / deuda

10. Suite de tests vacía (0 archivos). Empezar por `anti-abuse`, `rate-limit`, `bookingSchema`, `zoneMap`.
11. `eslint .` completo nunca pasó en esta auditoría (timeout) → correr en CI (`ci.yml` existe untracked, verificar).
12. `cashier` inconsistente entre proxy / actions / hook / RLS (RLS ni lo menciona: staff genérico).
13. `<html lang="en">` hardcodeado con contenido default español.
14. README boilerplate; CHANGELOG creado mínimo (ver `CHANGELOG.md`).

## P3 — Observabilidad / producto

15. Email sin reintento ni dead-letter (`bookings.ts` solo `console.error`).
16. Sin log estructurado de quién cambió cada reserva (solo pg_notify genérico).
17. Realtime suscrito a 7 tablas en publicación única — revisar costo/ruido.
18. a11y del wizard y floorplan sin auditar.
