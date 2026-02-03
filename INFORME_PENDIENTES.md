# Informe de Funcionalidades Pendientes y Estrategia

## 1. UX & Accesibilidad (Completada)

- [x] **Auditoría Móvil:**
  - [x] Verificar desplazamiento (scroll) y redimensionamiento.
  - [x] Navegación por teclado (Siguiente/Enter).
  - [x] Legibilidad (tamaño de fuente y contraste).
- [x] **Accesibilidad (a11y):**
  - [x] Soporte para lectores de pantalla.
  - [x] Opciones de alto contraste (labels y titles agregados).
- [x] **Refinamiento Estético:**
  - [x] Eliminación de mockups y datos de prueba.
  - [x] Consistencia visual en "Mis Reservas" (Glasscard style).

## 2. Mejoras Admin & Automatizaciones

- [x] **Dashboard - Acciones Rápidas:**
  - [x] **Panel de Disponibilidad:** Vista rápida para el staff.
  - [x] **Contacto Rápido:** Botones de WhatsApp y Email para reservas del día.
- [x] **Gestión de Zonas:**
  - [x] Agregar/Quitar zonas.
  - [x] Configurar cubiertos por mesa/zona.
- [x] **Configuración:**
  - [x] Límite global de comensales por mesa (ej: máx 10).
- [/] **Automatizaciones:**
  - [/] **Email Service:** Integrar envío real de emails en Supabase Functions (actualmente solo lógica en DB).

## 3. Próximos Pasos (Estrategia)

- [x] **Seguridad (RBAC):** ✅ COMPLETADO
- [ ] **Idiomas (i18n):** Soporte EN/PT (Selector en formulario).
- [/] **Pagos (MercadoPago):**
  - [x] Interfaz de Garantía integrada en Wizard (Paso 7).
  - [ ] Integración de tokenización real y procesamiento de señas.
