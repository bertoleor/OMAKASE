> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[ADR-001-roles]], [[ADR-002-rate-limit]], [[ADR-003-pci-tarjeta]]

# OMAKASE — Sistema de reservas para restaurante de sushi (Omakase)

> Path: `E:/Hermes/projects/omakase` · Stack: Next.js 16.3.5 (App Router, Turbopack) + React 19.2.4 + Supabase (Postgres 17, Auth, Realtime, RPC) + Resend · Estado: ACTIVO
> Registry: `E:/Hermes/projects/registry` (branch `master`, priority 2, window `02:00`) · Mapa: `E:/Hermes/docs/plans/project-map.md`
> Última verificación: 2026-09-27 (escaneo F0 — ver `docs/F0-2026-09-27.md`)

## 1. Qué es

- Sistema de reservas online para restaurante de sushi (omakase): wizard de reserva de 8 pasos (fecha/hora, zona, pax, auth por magic link, garantía, confirmación).
- Módulo admin: dashboard con KPIs, calendario de reservas, plano de sala con drag & drop (dnd-kit), gestión de zonas/mesas/eventos especiales, horarios semanales, notificaciones en vivo (Supabase Realtime).
- Reglas de negocio nucleares: capacidad y solapamiento por zona-mesa-horario, fechas bloqueadas, horario semanal y ventana de avance — **enforzadas server-side en la RPC `try_create_booking`** (desde ORN-124 Fase 2b, 2026-09-27), con ventana de cancelación y emails transaccionales vía Resend.
- Usuario final: comensales (reserva self-service); usuario staff: admin/cashier (dashboard operativo).

## 2. Cómo correr

- Requisitos: Node 20+, npm, proyecto Supabase (Postgres + Auth + Realtime), API key de Resend, secrets en env (ver `.env.example`).
- Comandos:
  - `npm install` — instalar dependencias
  - `npm run dev` — servidor de desarrollo (`next dev`)
  - `npm test` — suite unit (Vitest, 65 tests en 6 archivos)
  - `npm run typecheck` — `tsc --noEmit` (strict)
  - `npm run lint` — ESLint 9 (flat config)
  - `npm run format` / `npm run format:check` — Prettier
  - `npm run build` — build de producción (requiere env de Supabase: falla en prerender sin `NEXT_PUBLIC_SUPABASE_URL`)
  - `npm run test:e2e` — E2E (⚠ script existe pero Playwright no está instalado en devDeps)
  - `npm run changeset` / `npm run release` — versionado con Changesets
- Migraciones: `supabase/migrations/` — aplicar contra el proyecto Supabase; esquema completo en `supabase/schema.sql`; edge functions (Deno) en `supabase/functions/` (`auto-confirm`, `no-show-handler`, `send-reminders`).

## 3. Estructura de carpetas (solo primer nivel)

- `src/app` — rutas App Router (pages del wizard cliente, `admin/*`, `mis-reservas/*`, `api/webhooks`), server actions (`src/app/actions/`)
- `src/components` — UI organizada por dominio: `booking/` (wizard + steps), `admin/` (dashboard, floorplan, reservas), `ui/` (16 primitivos tipo shadcn con CVA)
- `src/lib` — lógica de dominio: `booking-availability`, `cancel-policy`, `email/` (Resend + templates), `validations` (Zod), `auth/roles`, `supabase/` (client/server/admin), `logger`
- `src/hooks` — hooks de realtime (`useRealtime`, `useRealtimeBookings`), `useUserRole`, i18n
- `src/i18n` — traducciones (ES/EN/PT)
- `src/proxy.ts` — middleware de seguridad y roles
- `supabase/` — `schema.sql`, `migrations/`, `functions/` (edge functions Deno)
- `docs/` — ADRs (roles, rate-limit, PCI), auditorías, PRD, planes
- `reports/` — logs de evidencia de tests/TDD y health reports
- `odd/` — features ODD (ver `odd/tasks/booking-server-gates.md`, cerrado 2026-09-27)
- `openspec/` — cambios SDD
- `plans/` — análisis UI/auditoría

## 4. Documentación canónica

- Producto (PRD): `docs/plans/PRD-omakase-minimo.md` (⚠ es la plantilla canónica sin extender — el PRD real sigue pendiente)
- Plan activo: `odd/tasks/booking-server-gates.md` (cerrado 2026-09-27)
- ADRs: `docs/ADR-001-roles.md` (⚠ desactualizado vs implementación), `docs/ADR-002-rate-limit.md`, `docs/ADR-003-pci-tarjeta.md`
- Auditorías: `docs/AUDIT_GENERAL_OMAKASE.md`, `docs/audits/COMPREHENSIVE_AUDIT.md`, `docs/TRIAGE_GAPS.md`, `docs/STATUS-ORN-85.md`
- Escaneo F0: `docs/F0-2026-09-27.md` (estado del proyecto + deuda inventariada)
- Espejo en Hermes: `E:/Hermes/docs/proyectos/omakase.md`

## 5. Estado actual

- Rama: `master` (al día con `origin/master` = `github.com/bertoleor/OMAKASE`) · CI: **FAIL** (últimos 8 runs de "Verify build and lint" en rojo — errores lint `curly`; `ci.yml` no triggerea en master)
- Tests: 65/65 PASS · Typecheck: PASS · Build: FAIL sin env de Supabase
- Próximo hito: **F3 — volver CI/build a verde** (ver `docs/F0-2026-09-27.md` §9)
- Tickets abiertos: ORN-85 (roles desde profiles + unificar cashier — PARCIAL), ORN-124 (server-side gates — implementado 2026-09-27, migración pendiente de aplicar a DB live, card t_6991e705), ORN-202 (realtime p95 922ms — sin instrumentación, verificar con medición fresca), launch-gate DB (RLS en `agent_audit_logs`, health 2/5)
