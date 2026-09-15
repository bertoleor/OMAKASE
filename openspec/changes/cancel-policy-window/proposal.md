# Proposal: Cancel Policy Window — isCancellationAllowed

> Slice 1 de la capacidad `cancel-policy` (contrato iniciado docs-only en
> `docs/sdd-ejemplo-cancel-policy/`). Este change la implementa en `src/`.

## Intent

La política de cancelación autogestionada está documentada (ventana gratuita
de 4h antes del turno) pero no hay código que la evalúe: no hay una función
única y testeable que decida si una cancelación libre es admisible para una
fecha/hora dadas. Un helper puro `isCancellationAllowed` centraliza esa regla,
la hace testeable y evita duplicar `Date` math en actions/UI.

## Scope

### In Scope
- Helper puro `isCancellationAllowed(now, bookingStart, windowHours = 4): boolean` en `src/lib/cancel-policy.ts`.
- Suite Vitest RED/GREEN en `src/lib/cancel-policy.test.ts`.
- Cadena SDD en `openspec/changes/cancel-policy-window/`.

### Out of Scope
- Integración con el action de cancelación ("Mis Reservas") y sus códigos CANCELLED_FREE / CANCELLED_LATE / CANCEL_WINDOW_CLOSED.
- Reembolso real MP, RLS, edge functions, persistencia de `cancelledAt` / `policyAcceptedAt`.
- Cambios a `src/lib/validations.test.ts` u otros cambios ajenos.

## Capabilities

### New Capabilities
- `cancel-policy`: evaluación del gate de cancelación libre según `windowHours` antes del inicio del turno.

### Modified Capabilities
- Ninguna.

## Approach

1. Spec: requisito RFC 2119 + escenarios Given/When/Then para el gate de ventana libre.
2. Strict TDD: test RED primero (falla sin feature), luego implementación mínima GREEN, typecheck y build.
3. Verificación real con `vitest run` / `tsc --noEmit` / `next build`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/cancel-policy.ts` | New | Helper puro `isCancellationAllowed` |
| `src/lib/cancel-policy.test.ts` | New | Suite Vitest del gate |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Límite de ventana ambiguo (inclusive vs exclusive) | Med | Spec define boundary >= (inclusive); tests lo fijan explícito |
| Default 4h arbitrario | Bajo | Coincide con FREE_CANCEL_MINUTES_BEFORE=240 del ejemplo docs; parametrizable |

## Rollback Plan

Helper nuevo, aditivo y sin consumidores todavía: revertir = borrar `cancel-policy.ts` + su test. No toca código existente.

## Dependencies

- Vitest 4 (runner calibrado, 16/16 verde) y TS 5 (`@/` alias OK).

## Success Criteria

- [ ] `vitest run` en verde incluyendo `cancel-policy.test.ts`.
- [ ] `tsc --noEmit` sin errores.
- [ ] `next build` sin errores.
- [ ] Trazabilidad: cada escenario del spec mapea a >= 1 test.