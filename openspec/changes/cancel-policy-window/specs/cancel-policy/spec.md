# cancel-policy Specification

## Purpose

Evaluación pura y testeable del gate de cancelación libre de una reserva: una
función booleana `isCancellationAllowed` que decide si, dadas una fecha/hora de
consulta y el inicio del turno, quedan al menos `windowHours` antes del turno
como ventana de cancelación gratuita.

## Requirements

### Requirement: Free-window gate

The function `isCancellationAllowed(now, bookingStart, windowHours)` MUST
return `true` when the time remaining until `bookingStart` is at least
`windowHours`, and `false` otherwise (including after the slot has started).
The `windowHours` parameter MUST default to `4` when omitted.

#### Scenario: Far ahead of start — allowed

- GIVEN bookingStart at 20:00 and now at 12:00
- WHEN `isCancellationAllowed(now, bookingStart)` is called
- THEN it returns `true`

#### Scenario: Exactly at the window boundary — allowed

- GIVEN bookingStart at 20:00, now at 16:00, and windowHours = 4
- WHEN `isCancellationAllowed(now, bookingStart, 4)` is called
- THEN it returns `true`

#### Scenario: Inside the window — not allowed free

- GIVEN bookingStart at 20:00, now at 19:00, and windowHours = 4
- WHEN `isCancellationAllowed(now, bookingStart, 4)` is called
- THEN it returns `false`

#### Scenario: After slot start — not allowed

- GIVEN bookingStart at 20:00 and now at 21:00
- WHEN `isCancellationAllowed(now, bookingStart)` is called
- THEN it returns `false`

#### Scenario: Custom window honored

- GIVEN bookingStart at 20:00, now at 17:00, and windowHours = 2
- WHEN `isCancellationAllowed(now, bookingStart, 2)` is called
- THEN it returns `true`