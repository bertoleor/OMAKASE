# ADR-001 — Fuente de verdad para roles (UNVERIFIED, propuesta)

> Estado: PROPOSED (no decidido, no implementado).

## Contexto

El rol se lee de `user.user_metadata.role` en `proxy.ts`, `admin.ts` y `useUserRole.ts`,
mientras RLS usa `public.profiles.role`. Los sets difieren (cashier incluido/excluido según archivo).

## Decisión propuesta

Fuente de verdad: `public.profiles.role`, leída server-side (`auth.getUser` + select a profiles).
`user_metadata.role` como máximo caché con revalidación, nunca como autorización final.
Unificar sets en un único módulo `@/lib/roles`.

## Consecuencias

- Requiere migración de usuarios existentes (backfill metadata → profiles).
- Cierra riesgo de escalación por edición de metadata.
