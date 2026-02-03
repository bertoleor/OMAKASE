# Informe General del Proyecto: Sistema de Reservas para Restaurante

## 1. Visión General

Este proyecto es una aplicación web moderna y robusta diseñada para la gestión integral de reservas de un restaurante. Proporciona una interfaz intuitiva para que los clientes realicen y gestionen sus reservas, y un panel de administración completo para que el personal controle la disponibilidad, el plano de mesas y obtenga reportes detallados.

## 2. Stack Tecnológico

La aplicación está construida sobre tecnologías de vanguardia enfocadas en rendimiento, seguridad y experiencia de usuario.

### Frontend & Core

- **Framework:** [Next.js 16.1.4](https://nextjs.org/) (App Router) - Renderizado híbrido y optimización.
- **Librería UI:** [React 19.2.3](https://react.dev/) - Componentes interactivos.
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) - Diseño utilitario y performante.
- **Animaciones:** Framer Motion - Micro-interacciones y transiciones fluidas.
- **Lenguaje:** TypeScript - Tipado estático para robustez y mantenimiento.

### Backend & Base de Datos

- **Plataforma:** [Supabase](https://supabase.com/) - Backend-as-a-Service (BaaS).
  - **Base de Datos:** PostgreSQL.
  - **Autenticación:** Supabase Auth (Magic Links, Gestión de usuarios).
  - **Real-time:** Suscripciones en tiempo real para actualizaciones instantáneas.

### Herramientas & Utilidades

- **Validación:** [Zod](https://zod.dev/) - Esquemas de validación de datos seguros.
- **Calendario:** [FullCalendar](https://fullcalendar.io/) - Gestión visual de fechas y eventos.
- **Email:** [Resend](https://resend.com/) + React Email - Envío de correos transaccionales.
- **Iconos:** Lucide React.
- **Estado Global:** Zustand.
- **Validación de Pagos:** card-validator.

## 3. Estructura del Proyecto

La arquitectura sigue el patrón estándar de Next.js App Router, priorizando la separación de preocupaciones.

```text
/src
├── /app                 # Rutas de la aplicación (File-system routing)
│   ├── /admin           # Panel de Administración (Protegido)
│   ├── /mis-reservas    # Portal del Cliente (Login & Gestión)
│   ├── /reservar        # Flujo de Reserva (Wizard)
│   ├── /api             # API Endpoints (e.g., webhooks, emails)
│   ├── globals.css      # Estilos globales y variables CSS
│   └── layout.tsx       # Layout raíz
├── /components          # Componentes Reutilizables
│   ├── /admin           # Componentes específicos de administración
│   ├── /booking         # Componentes del flujo de reserva
│   ├── /ui              # Biblioteca de componentes UI base (Botones, Inputs, etc.)
├── /lib                 # Utilidades y Configuraciones
│   ├── /supabase        # Cliente y servidor de Supabase
│   ├── /email           # Configuración de Resend
│   └── utils.ts         # Helpers generales
├── /types               # Definiciones de tipos TypeScript
└── /store               # Gestión de estado (Zustand)
```

## 4. Funcionalidades: Panel de Administración (`/admin`)

Dirigido al staff del restaurante para la gestión operativa.

- **Dashboard (`/admin/dashboard`):**
  - Vista general de reservas del día.
  - Métricas clave (KPIs) en tiempo real.
  - Notificaciones de nuevas reservas.

- **Calendario (`/admin/calendar`):**
  - Vista mensual/semanal/diaria de todas las reservas.
  - Gestión visual de ocupación.

- **Plano de Sala (`/admin/floorplan`):**
  - Representación visual de las mesas y zonas.
  - Estado de ocupación en tiempo real.
  - Gestión de asignación de mesas.

- **Reservas (`/admin/reservations`):**
  - Listado completo con filtros avanzados.
  - Edición y cancelación de reservas.

- **Roles y Permisos (RBAC):**
  - **Roles:** Propietario, Manager (Full Acceso), Staff (Operativo).
  - **Seguridad:** Protección de rutas sensibles (Configuración, Finanzas) para usuarios no autorizados.

- **Configuración (`/admin/settings`):**
  - Horarios de apertura y cierre.
  - Gestión de fechas bloqueadas (feriados, eventos privados).
  - Configuración de intervalos y capacidad.
  - **Información del Negocio:** Redes, contacto y legales.

- **Eventos (`/admin/events`):**
  - Gestión completa de eventos especiales (Catas, Cenas privadas).

- **Zonas (`/admin/zones`):**
  - Gestión de áreas del restaurante (Salón principal, Terraza, etc.).
  - Configuración de capacidad por zona.

- **Reportes (`/admin/reports`):**
  - Análisis de tendencias de reservas y pasajeros (PAX).
  - Estadísticas de ocupación.

- **Automatizaciones (Supabase Functions):**
  - **Recordatorios:** Envío automático de notificaciones 24h y 2h antes de la reserva.
  - **Auto-confirmación:** Procesamiento automático de reservas según disponibilidad.
  - **Gestión de No-Show:** Marcado automático de inasistencias para liberar mesas.

## 5. Funcionalidades: Portal Cliente

Experiencia fluida para el usuario final.

- **Reserva Web (`/reservar`):**
  - **Wizard Paso a Paso:** Selección intuitiva de fecha, hora, zona y datos personales.
  - **Validación en Tiempo Real:** Bloqueo de fechas no disponibles y validación de capacidad.
  - **Confirmación:** Pantalla de éxito con código QR y detalles únicos.

- **Mis Reservas (`/mis-reservas`):**
  - **Acceso Seguro:** Login mediante "Magic Link" enviado al correo (sin contraseñas).
  - **Gestión:** Visualización de reservas activas e historial con estética refinada ("dark glasscard").
  - **Autogestión:** Posibilidad de cancelar reservas y agregar eventos al calendario.

- **Garantía de Reserva:**
  - **Validación de Tarjeta:** Integración de validación de tarjetas de crédito/débito en tiempo real.
  - **Política de Cancelación:** Aceptación explícita de términos antes de confirmar.

## 6. Estado Actual del Proyecto

El proyecto se encuentra en una fase **avanzada, estable y optimizada**.

- ✅ **Seguridad Robusta:** Implementación de RBAC (Role-Based Access Control) protegiendo configuración y datos sensibles.
- ✅ **Operativa Real-Time:** Soporte completo para Walk-ins, Liberación Manual de mesas y sincronización instantánea.
- ✅ **Calidad de Código (Auditoría Stricta):**
  - **Zero Inline Styles:** Se han eliminado los atributos `style` en JSX, migrando a variables CSS dinámicas gestionadas por `refs`.
  - **Accesibilidad:** Cumplimiento con estándares `aria-label`, `htmlFor` y navegación semántica.
  - **Tipado Estricto:** Props de componentes marcadas como `readonly` y eliminación de tipos `any`.
- ✅ **Refinamiento UI/UX:** Interfaz de cliente premium con estética Glasscard consistente y libre de mockups.
- ✅ **Clean Code:** Extracción de lógica compleja de renderizado a funciones auxiliares descriptivas.
- ✅ **Optimizado:** Configuración de build optimizada para producción con enfoque en rendimiento.

Este sistema representa una solución sólida y escalable para la gestión de reservas, lista para su despliegue y operación.
