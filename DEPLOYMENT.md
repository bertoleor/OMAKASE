# Guía de Despliegue - Omakase Reservas

Esta guía detalla los pasos para desplegar la aplicación en producción (Vercel) y configurar los servicios necesarios (Supabase).

## 1. Requisitos Previos

- Cuenta en [Vercel](https://vercel.com).
- Proyecto en [Supabase](https://supabase.com).
- Node.js 18+ instalado localmente (para builds de prueba).

## 2. Configuración de Variables de Entorno

En tu panel de Vercel (Settings > Environment Variables), debes configurar las siguientes claves. Estas mismas deben estar en `.env.local` para desarrollo.

```env
# Conexión a Supabase (Obligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta

# Configuración de URL (Obligatorio para Auth y Redirecciones)
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

> **Nota:** La `SUPABASE_SERVICE_ROLE_KEY` es crítica para que el backend pueda gestionar roles de usuario. **Nunca la expongas** en variables con prefijo `NEXT_PUBLIC_`.

## 3. Base de Datos (Supabase)

Asegúrate de haber ejecutado todos los scripts de migración en el "SQL Editor" de Supabase, en este orden:

1.  **Tablas Base:** Reservas, Clientes, Zonas, Mesas.
2.  **Configuración Global:** `restaurant_settings`, `weekly_schedule`, `events`.
3.  **Seguridad (RBAC):** `profiles` y políticas RLS.

_Los archivos SQL se encuentran en la carpeta `supabase/migrations/`._

### Roles Iniciales

Para crear el primer administrador, regístrate en la app y luego ejecuta el script `MANUAL_ROLES.sql` en Supabase:

```sql
-- Reemplaza con el email de tu usuario administrador
SELECT make_user_admin('tu-email@ejemplo.com');
```

## 4. Despliegue en Vercel

1.  Conecta tu repositorio de GitHub a Vercel.
2.  Importa el proyecto "suhi reservas".
3.  En **Build & Development Settings**, el comando por defecto `next build` es correcto.
4.  Agrega las variables de entorno configuradas en el paso 2.
5.  Haz clic en **Deploy**.

## 5. Verificación Post-Despliegue

1.  **Acceso:** Entra a la URL proporcionada por Vercel.
2.  **Login:** Inicia sesión con el usuario administrador.

- Deberías ver el badge "ADMIN" en el sidebar.
- Deberías tener acceso completo a Configuración (`/admin/settings`).

3.  **Prueba de Usuario:**

- Inicia sesión con otro usuario (rol 'staff').
- Verifica que **NO** tenga acceso a Configuración ni Reportes.

## Solución de Problemas

- **Error de Build:** Revisa los logs en Vercel. Asegúrate de que no haya errores de TypeScript (`npm run build` localmente debe pasar).
- **Problemas de Auth:** Verifica que la URL del sitio esté agregada en _Authentication > URL Configuration > Site URL_ en Supabase.
