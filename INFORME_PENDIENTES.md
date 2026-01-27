# Informe de Funcionalidades Pendientes y Estrategia

## 1. UX & Accesibilidad (Segura y Prioritaria)

- [x] **Auditoría Móvil:**
  - [x] Verificar desplazamiento (scroll) y redimensionamiento.
  - [x] Navegación por teclado (Siguiente/Enter).
  - [x] Legibilidad (tamaño de fuente y contraste).
- [x] **Accesibilidad (a11y):**
  - [x] Soporte para lectores de pantalla.
  - [x] Opciones de alto contraste (labels y titles agregados).
- [ ] **Idiomas:** Selector para Español, Inglés y Portugués en el formulario.

## 2. Mejoras Admin (Dashboard y Gestión)

- [x] **Dashboard - Acciones Rápidas:**
  - [x] **Panel de Disponibilidad:** Vista rápida para el staff.
  - [x] **Contacto Rápido:** Botones de WhatsApp y Email para reservas del día.
- [x] **Gestión de Zonas:**
  - [x] Agregar/Quitar zonas.
  - [x] Configurar cubiertos por mesa/zona.
- [x] **Configuración:**
  - [x] Límite global de comensales por mesa (ej: máx 10).

## 3. Nuevas Funcionalidades (Completadas)

- [x] **Gestión de Eventos:**
  - [x] Crear eventos (Catas, Omakase especial) con fecha, capacidad y precio.
  - [x] Habilitar zonas específicas para el evento.
- [x] **Operativa Tiempo Real:**
  - [x] **Walk-ins:** Ingreso inmediato de clientes sin reserva.
  - [x] **Liberación Manual:** Control total sobre cuándo se libera una mesa.

## 4. Próximos Pasos (Estrategia)

- [x] **Seguridad (RBAC):** ✅ COMPLETADO
  - [x] Schema DB (Tablas y Policies).
  - [x] Frontend: Hook de Roles y Protección de Rutas (`/settings`, `/users`, `/reports`, etc.).
  - [x] Frontend: Ocultar menú configuración a Staff.
- [ ] **Idiomas (i18n):** Soporte EN/PT.
- [ ] **Pagos (MercadoPago):** Integración para señas.
