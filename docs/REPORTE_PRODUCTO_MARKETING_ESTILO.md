# Reporte Producto · Marketing · Estilo — OMAKASE

> **Fecha:** 2026-09-12
> **Estado:** UNVERIFIED — compilación de fuentes del repo (`docs/`, `src/config`, `src/i18n`, `src/lib/email`, `src/lib/seo`). Nada aquí inventado; todo derivado de archivos leídos. Requiere verificación humana antes de decidir.
> **Alcance:** producto, posicionamiento, marketing, y voz/estilo. No cubre la deuda técnica (ver `TRIAGE_GAPS.md`).

---

## 1. Qué es el producto

**OMAKASE** es un sistema web de reservas para un restaurante de sushi "premium / de autor". No es un e-commerce de menú ni un pedido online: el core es **reservar una mesa (o barra) con pago de seña mediante tarjeta (MercadoPago)**.

Stack (medido en auditoría previa): Next.js 16 + React 19 + TypeScript strict + Tailwind 4 + Supabase (auth/RLS/realtime) + Resend (emails) + Zustand + React Query + Zod 4.

### Flujo de cliente (wizard de 8 pasos)

1. Cantidad de comensales → 2. Fecha → 3. Hora → 4. Zona/experiencia → 5. Personalización (vegetarianos, restricciones, menores, pedidos) → 6. Datos de contacto (magic link o invitado) → 7. Garantía (seña con tarjeta vía MercadoPago) → 8. Resumen y confirmación.

### Módulos

- **Cliente:** wizard, selección de zona, preferencias dietarias, magic link, "Mis Reservas" (lista + detalle), cancelación, exportar a Google/ICS.
- **Admin (staff/cashier/manager/admin):** dashboard con KPIs, calendario, **floorplan drag-and-drop de sala**, CRUD de reservas, configuración de zonas/mesas, eventos especiales, horarios semanales, notificaciones.
- **Sistema:** RBAC, middleware de seguridad, RLS (11 tablas), emails transaccionales (Resend), webhooks realtime, edge functions de recordatorio / no-show / auto-confirm.

### Lo que NO es (no requerido aún)

- **MercadoPago no está integrado** — solo UI ("seña" es formulario, sin cobro real). Proyecto demo/presentación.
- **Sin procesamiento real de pagos.**

---

## 2. Posicionamiento y marca

### Identidad (de `src/config/business.ts`)

| Campo            | Valor                                           |
| ---------------- | ----------------------------------------------- |
| Nombre           | **OMAKASE**                                     |
| Meta título      | "Reservas Omakase"                              |
| Descripción/meta | "Experiencia Premium de Sushi"                  |
| Tagline          | "Experience"                                    |
| Dominio          | omakase.restaurant                              |
| Ubicación        | Av. del Libertador 1234, Palermo (Buenos Aires) |
| Teléfono         | +54 11 1234-5678                                |
| Email            | reservas@ / soporte@omakase.restaurant          |

> ⚠️ Toda la info de contacto es **placeholder/fallback** (teléfono `1234-5678`, WhatsApp `0000 0000`, Instagram `instagram.com/omakase` genérico). Marketing real no puede apoyarse en estos valores hoy.

### Propuesta de valor (implicada, no explicitada)

- **Sushi de autor en ambiente sofisticado** ("Experiencia gastronómica única de sushi de autor").
- **Experiencias segmentadas por zona** — no "una mesa", sino tres productos:
  - **Salón Principal** (mesas tradicionales, asignación por orden de reserva).
  - **Terraza Pérgola** (semicubierta + calefaccionada, sujeta a clima).
  - **Barra Omakase** (vista privilegiada, cercanía al cocinero — el corazón del "omakase").
- **Garantía con seña** descontable del total → reduce no-shows y posiciona como "reserva en serio".

### Palabras clave / campos semánticos

Premium, exclusiva, sofisticada, de autor, experiencia, única. Tono de lujo accesible, no informal.

---

## 3. Marketing — estado actual (y gaps)

### Lo que ya existe

- **SEO básico** (`src/lib/seo.ts`): metadata por página, OpenGraph, Twitter card, sitemap.xml, robots.txt, `hreflang` es/en/pt. Locale `es_AR`.
- **i18n real** en 3 idiomas: `es`, `en`, `pt` (wizard 100% traducido).
- **Emails transaccionales** estilizados (confirmación, recordatorio, cancelación).

### Gaps de marketing (para decidir)

1. **Sin identidad visual confirmada** — logo, paleta, tipografía viven solo como glassmorphism negro + Geist en los emails; no hay brand kit documentado ni assets (`/og-image.jpg` referenciado pero no verificado).
2. **Info de contacto placeholder** → no hay NAP real (nombre/dirección/teléfono) para SEO local / Google Business.
3. **Sin pruebas sociales ni contenido**: no hay landing con storytelling, fotos, testimonios, prensa. La "página de inicio" no está verificada.
4. **Canales sociales como placeholders** (Instagram/Facebook genéricos) → sin estrategia IG (clave para gastronomía premium).
5. **Sin analytics/marketing** (no se encontró PostHog/GA ni pixel; solo supabase realtime).
6. **Tagline "Experience"** débil — no comunica sushi ni autor; candidato a revisión de copy.
7. **`<html lang="en">` hardcodeado** (gap product-técnico con impacto SEO: Google ve inglés en contenido español).

### Oportunidades de marketing rápidas (no implementadas)

- Definir el "menú omakase" / chef como héroe de marca.
- Landing de storytelling ("el ritual del omakase") + SEO local Palermo.
- Instagram premium (foto de plato/autor) como canal principal.
- Reserva por WhatsApp como conversión alternativa.
- Programas de fidelización usando el historial de reservas ya existente.

---

## 4. Estilo, voz y tono

### Dirección de arte (de los assets leídos)

- **Glassmorphism negro** — fondo `#000`, tarjetas `rgba(0,0,0,0.4)` + `backdrop-blur`, bordes blancos al 8–15%, radios 16–24px.
- **Tipografía:** **Geist Sans** (400–700), tracking amplio en logos (0.25em), titulares uppercase.
- **Sin emojis** en emails (comentario explícito en el template: "sin emojis, formal").
- **Paleta:** monocromo negro/blanco con opacidades; acento de color no definido.
- **Formal, premium, minimalista.** Menos es más.

### Voz / tono en copy

- **Español neutro de CRM, con leve rioplatense** (voseo parcial: "intentá", "estás seguro", "te esperamos", "avisonos" mezclado con "usted/su" formal en emails — **inconsistencia de persona a corregir**: wizard usa "tú/vos", emails usan "usted/su").
- **You-form en la UI** ("¿Cuántos son?", "¿Dónde prefieren sentarse?"), **formal en emails** ("Estimado/a", "Su reserva", "Por favor, llegue").
- Caleidoscopio de tono: cálido + exclusivo, sin jerga ni lunfardo.

### Inconsistencias de estilo detectadas (lista para copywriting)

| #   | Problema                                                                                          | Dónde                                            |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Voseo vs. "usted" (UI vs. email)                                                                  | `es.ts` vs. `confirmation.ts`                    |
| 2   | Errores ortográficos sin tildes en emails ("gastronomica", "avisenos", "anticipacion", "intentá") | `email/templates/*.ts`                           |
| 3   | "EXTERIOR - PERGOLA" sin tilde ("PÉRGOLA")                                                        | `es.ts` (y `business.ts` "Pérgola" sí con tilde) |
| 4   | "Disfrute" (usted) en zona bar vs. "Selecciona" (tú) en el resto                                  | `es.ts` `zones.indoor_bar`                       |
| 5   | Tagline "Experience" en inglés, resto en español                                                  | `business.ts`                                    |
| 6   | Mezcla "Salón Principal" vs. "INTERIOR - MESAS" (discrepancia zona→label)                         | `business.ts` vs. `es.ts`                        |
| 7   | `<html lang="en">` con contenido default ES                                                       | layout                                           |
| 8   | Botón "Continuar como Invitado" duplicado (`guest` y `continue_guest` con mismo texto)            | `es.ts` `auth`                                   |

---

## 5. Recomendaciones priorizadas

### Producto

1. **Definir el MVP de pago**: la seña es hoy un formulario sin cobro. Decidir si se integra MercadoPago real o se saca el paso "Garantizar" para el demo.
2. **Cerrar la inconsistencia de rol `cashier`** (bloqueado en `/admin` pese a estar en `isStaff`) — fricción operativa visible para el staff.
3. **Resolver overbooking** (sin chequeo de capacidad/solape) antes de cualquier lanzamiento real.
4. **i18n del admin** (0% traducido) si se apunta a mercado EN/PT.

### Marketing

1. Reemplazar placeholders de contacto por datos reales (NAP + redes).
2. Reescribir tagline y descripción meta orientadas a "sushi de autor / omakase en Palermo" con SEO local.
3. Construir landing de storytelling + activos visuales (fotos, `/og-image.jpg`).
4. Estrategia Instagram como canal primario (gastronomía premium).

### Estilo

1. Unificar persona gramatical (decidir tú/vos vs. usted y aplicar en UI + emails).
2. Corregir tildes y mayúsculas en todos los templates de email.
3. Definir paleta de acento y brand kit (fuera del monocromo).
4. Fix `lang` dinámico del layout (es default).

---

## 6. Fuentes de este reporte

- `docs/TRIAGE_GAPS.md`, `docs/AUDIT_GENERAL_OMAKASE.md`, `docs/KANBAN_DRYRUN.md`, `CHANGELOG.md`, `OPTIMIZATION_REPORT.md`
- `src/config/business.ts`, `src/lib/seo.ts`, `src/i18n/locales/{es,en}.ts`, `src/lib/email/templates/confirmation.ts`

> Todo lo anterior es UNVERIFIED: compilado de archivos estáticos del repo, sin ejecución de build ni inspección visual de la UI en vivo.
