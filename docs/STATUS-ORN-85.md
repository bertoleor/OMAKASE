# STATUS — ORN-85 [OMAKASE] Roles desde profiles + unificar cashier

> Verificado 2026-09-15 (turno liviano). **Estado: PARCIAL / NO COMPLETO.** El riesgo de
> escalación se mitigó por la vía de `app_metadata`, pero **"roles desde `profiles`"** y
> **"unificar `cashier`"** siguen abiertos (el segundo está bloqueado por RLS).
> Parte de: [[projects/omakase/README]] · Relacionados: [[ADR-001-roles]], [[AUDIT_GENERAL_OMAKASE]]

## Lo que SÍ está en el código (hechos verificados)

- Rol resuelto server-side desde **`app_metadata.role`** (autoritativo) con fallback a
  `user_metadata.role`: `src/lib/auth/roles.ts` → `getUserRole()`.
- Escritura de rol a metadata vía Admin API (mirrors `app_metadata` + `user_metadata`):
  `src/app/actions/admin.ts:98-103`. Origen: commit `a0ae886` "roles via app_metadata".
- Consumido en middleware y UI: `src/proxy.ts`, `src/hooks/useUserRole.ts`,
  `src/app/actions/admin.ts`.

## Deuda confirmada

1. **"Roles desde `profiles`" NO adoptado (ADR-001 desactualizado).**
   - `docs/ADR-001-roles.md` sigue `PROPOSED` proponiendo `public.profiles.role` como fuente
     de verdad, pero la implementación real eligió `app_metadata`. El ADR no refleja lo
     implementado (debería marcarse SUPERSEDED o reescribirse).
2. **Escalación residual por fallback a `user_metadata`.**
   - `roles.ts:34-35` honra `user_metadata.role` cuando falta `app_metadata.role`.
   - `user_metadata` es editable por el usuario → una cuenta legacy (sin `app_metadata.role`)
     podría autofijarse `role=admin` y `getUserRole` lo aceptaría. Es un vector real
     mientras no se migren todas las cuentas; luego el fallback debe eliminarse.
3. **`cashier` sin unificar — definido pero bloqueado en todas partes.**
   - Valor permitido en: `src/types/database.types.ts:66`, `src/lib/validations.ts:347`,
     `supabase/schema.sql` (check del rol) y sets de `src/lib/auth/roles.ts`.
   - **Excluido de la autorización** pese a ser rol válido:
     - `roles.ts` `ADMIN_ROUTE_ROLES` = admin|manager|staff (sin cashier).
     - `src/app/actions/admin.ts:21` `ADMIN_ROLES` = admin|manager|staff.
     - `src/proxy.ts` redirige a cashier fuera de `/admin`.
   - **RLS no lo menciona**: ninguna policy de `public.*` en `supabase/schema.sql` incluye
     `cashier` → no accede a bookings/payments/resto.
   - **Contradicción visible**: `useUserRole.isStaff` (`STAFF_UI_ROLES`) SÍ incluye cashier →
     la UI ofrece operar reservas pero server/RLS lo deniegan (UX rota).

## Por qué no se completó en este turno

- Completar "roles desde `profiles`" (lectura server-side a DB + backfill) y dar a `cashier`
  acceso operativo requieren **cambios de RLS, schema y/o migración** — prohibidos en un
  turno liviano sin schema/migraciones/deploys/refactors.

## Fix recomendado (futuro)

1. Eliminar el fallback a `user_metadata` (`roles.ts:35`) tras backfill completo de cuentas.
2. Decidir unívoco para `cashier`: (a) darle acceso operativo — añadirlo a
   `ADMIN_ROUTE_ROLES` (`roles.ts`), `ADMIN_ROLES` (`admin.ts`) **y** a las policies RLS de
   bookings/payments en `schema.sql`, o (b) eliminarlo del set de roles. Cualquier camino
   toca RLS.
3. Actualizar/marcar `docs/ADR-001-roles.md` según la fuente finalmente elegida.
