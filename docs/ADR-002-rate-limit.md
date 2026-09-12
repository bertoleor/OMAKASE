# ADR-002 — Rate-limit distribuido (UNVERIFIED, propuesta)

> Estado: PROPOSED (no decidido, no implementado).

## Contexto

`lib/rate-limit.ts` es in-memory por instancia: no protege con múltiples workers/serverless
y se resetea en cada deploy. `createBooking` lo usa (20 req/min por IP+UA).

## Opciones

1. Upstash Redis (serverless, simple; costo externo).
2. Tabla Supabase + ventana deslizante vía RPC (sin dependencia nueva; latencia mayor).
3. Protección en edge (Vercel WAF / Supabase limits) + in-memory como defensa local.

## Decisión propuesta

Pendiente de decisión humana. Recomendación inicial: opción 3 a corto plazo (costo cero),
opción 1 si el spam persiste.
