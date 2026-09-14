# ADR-003 — Datos de tarjeta: delegación total a Mercado Pago (PCI)

> Estado: ACEPTADO · Implementado en `3767f14` (ORN-86) · Repo: `E:/sitios web E/suhi reservas`

## Contexto

El flujo de reserva de OMAKASE incluye un paso de "Garantizar" (depósito) en el que
el cliente paga un monto asociado a su reserva. Un flujo de pago con tarjeta es, por
definición, un entorno sujeto a PCI DSS: si el sistema tocara datos de tarjeta
(PAN, CVV, fecha de vencimiento) se volvería dependiente del alcance de SAQ / SAQ‑A,
con requisitos de seguridad, monitoreo y auditoría que un proyecto en etapa demo no
puede sostener.

Históricamente, el esquema `bookings` perseguía columnas de tarjeta legadas
(`payment_token`, `card_brand`, `card_last_four`). `payment_token` es el dato más
peligroso: es un token reutilizable capaz de autorizar cargos futuros, por lo que su
retención expande el riesgo y el alcance de cumplimiento sin beneficio para el negocio.
Este ADR registra la decisión PCI definitiva sobre qué se guarda y qué no.

El problema a resolver: **cuándo y cómo se manejan los datos de tarjeta, y qué queda
persistido en la base de datos de OMAKASE.**

## Opciones consideradas

### Opción A — Tokenización del proveedor (guardar token de Mercado Pago)

Mercado Pago captura el PAN dentro de su checkout y devuelve un token; el backend
persiste ese token para futuros cargos.

- Pros: permite carga diferida/cobros posteriores sin volver a pedir la tarjeta.
- Contras: un token reutilizable es material de alto valor (equivale a la autorización
  de un cargo); si se filtra, permite cargos no consentidos. Aumenta el alcance PCI y la
  superficie de ataque en la base de datos propia. El negocio (depósito único por
  reserva) no necesita cargos recurrentes.

### Opción B — Manejo propio de tarjetas (guardar PAN/CVV/expiry)

Capturar y persistir PAN/CVV localmente (con o sin cifrado).

- Pros: control total del dato.
- Contras: convierte a OMAKASE en un "merchant" con custodia de CHD; exige cifrado,
  segmentación, monitoreo, gestión de llaves, asesoramiento y probablemente un QSA;
  costo operativo y de cumplimiento desproporcionado para un proyecto demo. Descartada
  por el riesgo y el costo de no ser justificado por el flujo de pago actual.

### Opción C — Delegación total (tercerización / "zero‑PAN")

Mercado Pago (u otro PSP certificado) captura la tarjeta **en su dominio**; OMAKASE
nunca ve el PAN. El backend solo recibe y persiste **IDs de referencia del PSP**
(`mp_payment_id`, `mp_preference_id`), sin datos de tarjeta.

- Pros: OMAKASE queda fuera del alcance de custodia de CHD (SAQ‑A si no toca PAN);
  sin cifrado de tarjeta, sin tokens reutilizables, sin columnas de tarjeta en DB;
  cero superficie de fuga de datos de tarjeta en la infraestructura propia.
- Contras: dependencia del proveedor para reembolsos/cargos futuros (se opera con IDs
  del PSP, no con el dato de tarjeta); no aplicable si algún día se quisiera cobrar
  fuera del checkout de un tercero.

## Decisión tomada

**Opción C — Delegación total a Mercado Pago ("zero‑PAN").** OMAKASE no captura, no
persiste y no procesa datos de tarjeta. El PAN/CVV/expiry se manejan únicamente dentro
del dominio de Mercado Pago; el backend guarda exclusivamente identificadores de
referencia del PSP (`idempotency_key`, `mp_payment_id`, `mp_preference_id`) en
`public.bookings`, y `gateway_transaction_id`/`gateway_response` en `public.payments`,
sin contenido de tarjeta.

Confirmado por la confirmación del proveedor (referencia de pago Mercado Pago, flujo
"zero‑PAN" documentado en `SECURITY.md` → "Payments: MercadoPago zero‑PAN delegation
(no card data stored)") y por la revisión técnica que determinó que no existe ningún
flujo de tarjeta dentro de la infraestructura propia.

### Implementación aplicada (mergeado en `master`)

- `3767f14 feat(omakase): PCI — drop legacy card fields, MP IDs only + tests (ORN-86)`
- Migración `supabase/migrations/20260913000100_drop_legacy_card_columns.sql`: elimina
  `payment_token`, `card_brand`, `card_last_four` de `public.bookings`.
- Esquema `supabase/schema.sql` §117‑126: comentario PCI + columnas solo de referencia
  MP (`idempotency_key`, `mp_payment_id`, `mp_preference_id`).
- `src/lib/validations.ts` → `createBookingInputSchema` es `.strict()`: rechaza
  cualquier campo de tarjeta desconocido (card_number, cvv, expiry, paymentToken,
  cardBrand, cardLastFour); solo admite IDs MP.
- Test `src/lib/validations.test.ts`: cubre la aceptación de IDs MP y el rechazo de
  cada campo de tarjeta legado.

## Consecuencias

- **Alcance PCI reducido:** no se custodian CHD; el proyecto se mantiene en la casilla
  de baja fricción de cumplimiento (no expansión de alcance por custodia de PAN).
- **Sin tokens reutilizables en DB:** se elimina el dato de mayor riesgo sin perder el
  flujo de depósito (se usa ID de transacción del PSP para conciliar/reembolsar).
- **Dependencia del proveedor:** los cargos futuros/reembolsos se operan vía IDs de
  Mercado Pago; no se puede cobrar fuera del checkout de un tercero sin reabanir el
  tema.
- **Guardia durable:** el esquema `.strict()` + los tests impiden que un campo de
  tarjeta "vuelva a colarse" en `createBooking` (regresión protegida).
- **Acciones pendientes de seguimiento (no bloqueantes del lanzamiento):**
  - Confirmar formalmente por escrito (instrumento comercial) el acuerdo de servicio
    y la responsabilidad de custodia con Mercado Pago.
  - Conservar índice/política de retención del contenido de `payment_logs.jsonb`
    (verificar que `gateway_response` nunca contenga PAN) y de `gateway_response` en
    `payments`.
  - Verificar que los comprobantes/documentos subidos a `payment-proofs` (si existen en
    este proyecto) no contengan números de tarjeta embebidos en imágenes.

## Referencias

- Confirmación del proveedor: flujo Mercado Pago "zero‑PAN" — `SECURITY.md` §"Payments".
- Revisión técnica: commit `3767f14` (ORN-86) + `src/lib/validations.test.ts`
  (test PCI) + `supabase/schema.sql` §117‑126.
- Triage: `docs/TRIAGE_GAPS.md` P0-3 (cerrado por este ADR).
- Auditoría: `docs/AUDIT_GENERAL_OMAKASE.md`, `COMPREHENSIVE_AUDIT.md` §90.
