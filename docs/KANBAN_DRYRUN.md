# Kanban Dry-Run — OMAKASE (UNVERIFIED, sin mover trabajo real)

> Propuesta de tablero. Nada fue creado en ningún sistema externo. Todo UNVERIFIED.

## Backlog (orden sugerido)

- [ ] P0-1 Unificar fuente de rol (profiles) + sets de roles — owner: backend
- [ ] P0-2 Validación Zod server-side en `createBooking` — owner: backend
- [ ] P0-3 Decisión PCI sobre `payment_token`/tarjeta — owner: producto + backend
- [ ] P0-4 Rate-limit distribuido (ADR-002) — owner: backend
- [ ] P1-5/6 Chequeos capacidad + blocked_dates + schedule en create — owner: backend
- [ ] P1-7 Idempotency-Key en booking — owner: backend + frontend
- [ ] P1-8 Policy cancelación cliente — owner: backend (migración RLS)
- [ ] P2-10 Tests base (anti-abuse, rate-limit, schema, zoneMap) — owner: QA/dev
- [ ] P2-11 CI verde con eslint+typecheck+test — owner: devops
- [ ] P2-13 `lang` dinámico + revisión i18n — owner: frontend
- [ ] P3-15 Reintento de emails — owner: backend

## Doing (vacío — auditoría no mueve trabajo)

_(sin notificación: no se asignó ni movió nada)_

## Done (en esta pasada)

- [x] Baseline typecheck PASS
- [x] Fix `curly` en `proxy.ts` (2 líneas)
- [x] Reporte general + triage + este kanban (UNVERIFIED)
- [x] CHANGELOG mínimo + ADR-001/002 (UNVERIFIED)
