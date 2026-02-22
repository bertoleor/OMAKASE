# Informe de Funcionalidades Pendientes y Estrategia

## 1. Calidad de Código y Accesibilidad (Completado)

- [x] **Calidad de Código (Strict Audit):**
  - [x] Eliminación total de estilos inline (`style={{...}}`) en favor de variables CSS.
  - [x] Extracción de ternarios anidados para mejorar la legibilidad.
  - [x] Uso de `refs` para actualizaciones dinámicas de estilo (Zoom, Progress bars).
  - [x] Marcado de props como `readonly` para inmutabilidad.
- [x] **Accesibilidad (a11y):**
  - [x] Asociación correcta de labels e inputs (`htmlFor` / `id`).
  - [x] Atributos `aria-label` y `title` en elementos interactivos.
  - [x] Navegación semántica mejorada.
- [x] **Refinamiento Estético:**
  - [x] Eliminación completa de mockups y placeholders.
  - [x] Unificación de interfaz "Mis Reservas" con estética Glasscard Dark.

## 2. Mejoras Admin & Automatizaciones

- [x] **Dashboard - Acciones Rápidas:**
  - [x] Panel de Disponibilidad operativa.
  - [x] Integración de contacto rápido (WhatsApp/Email).
- [x] **Gestión de Zonas y Mesas:**
  - [x] Gestión dinámica de zonas y asignación de mesas.
  - [x] Previsualización interactiva de plano de sala.
- [x] **Automatizaciones:**
  - [x] Lógica de recordatorios y confirmaciones automática en DB.
  - [x] Integración de API de envío (Resend) con manejo de errores robusto.
  - [ ] Implementación de Webhooks para actualizaciones en tiempo real.

## 3. Auditoría de Seguridad y Mantenimiento (Recién Completado)

- [x] **Seguridad (Hardening):**
  - [x] **Middleware Activo:** Renombrado y activado.
  - [x] **Fail Closed:** Implementado bloqueo ante falta de env vars.
  - [x] **Safe Auth:** Manejo de errores de red en autenticación.
- [x] **Centralización:**
  - [x] Configuración centralizada en `src/config/business.ts`.
  - [x] Refactor de Footer y Layouts.
- [x] **Limpieza de Código:**
  - [x] Resolución de warnings de iconos depreciados (SVG Nativos).
  - [x] Eliminación de código muerto y comentarios.

## 4. Estado del Módulo Admin (Auditado)

- [x] **Roles y Permisos (RBAC):**
  - [x] Middleware (`src/proxy.ts`) protege rutas `/admin` para roles `admin`, `manager`, `staff`.
  - [x] Hooks de cliente (`useUserRole`) para protección a nivel de componente.
- [x] **Gestión de Sala (Drag & Drop):**
  - [x] Implementado con `@dnd-kit` en `floorplan/page.tsx`.
  - [x] Asignación visual de reservas a mesas funcionando.
  - [x] Actualización en tiempo real (Polling de 30s).
- [x] **Configuración y Horarios:**
  - [x] Gestión semanal completa (`weekly_schedule`).
  - [x] Sub-páginas de configuración (`settings/*`) estructuradas y funcionales.
- [x] **Código:** Limpio, tipado y sin estilos inline.

## 5. Próximos Pasos (Estrategia)

- [x] **Seguridad (RBAC):** Sistema de roles y permisos 100% operativo.
- [ ] **Idiomas (i18n):** Traducción a Inglés y Portugués para comensales extranjeros.
- [/] **Pagos (MercadoPago):**
  - [x] Interfaz de validación de tarjetas integrada.
  - [ ] Procesamiento real de señas y reembolsos automáticos.
- [x] **Optimización de Build:** Resolución de conflictos WASM (Downgrade a Next.js 15 estable).
- [x] **Auditoría de Dependencias:** Árbol limpio y libre de conflictos críticos.

## 6. Siguientes Pasos Prioritarios

1.  **Integración de Pagos (MercadoPago):** Completar el flujo de procesamiento de señas.
2.  **Soporte Multi-idioma (i18n):** Preparar la app para turistas.
