-- ==========================================
-- GESTIÓN DE ROLES DE USUARIO (RBAC)
-- ==========================================
-- 1. ASIGNAR ROL DE MANAGER A TU USUARIO ACTUAL (Reemplaza con tu email)
-- Esto te dará acceso completo (Zones, Config, Settings).
UPDATE public.profiles
SET role = 'manager'
WHERE id IN (
        SELECT id
        FROM auth.users
        WHERE email = 'tu_email_aqui@gmail.com' -- <-- PONE TU EMAIL ACÁ
    );
-- 2. VERIFICAR TUS USUARIOS Y ROLES ACTUALES
-- Ejecuta esto para ver quién está registrado y qué rol tiene.
SELECT p.id,
    p.full_name,
    p.role,
    u.email
FROM public.profiles p
    JOIN auth.users u ON p.id = u.id;
-- ==========================================
-- PARA CREAR OTROS USUARIOS (Staff, Dueño)
-- ==========================================
-- Nota: La mejor forma es registrarlos desde la app (Sign Up) y luego correr estos scripts.
-- Al registrarse, por defecto serán 'staff'.
-- 3. PROMOVER A PROPIETARIO (Admin Total)
-- Si registraste un usuario 'dueño@suhi.com', corre esto:
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
        SELECT id
        FROM auth.users
        WHERE email = 'email_del_propietario@ejemplo.com'
    );
-- 4. EL ROL 'STAFF' ES EL DEFAULT
-- Si registras 'cajero@suhi.com', ya será staff automáticamente.
-- Pero si quieres forzarlo o bajar de rango a alguien:
UPDATE public.profiles
SET role = 'staff'
WHERE id IN (
        SELECT id
        FROM auth.users
        WHERE email = 'email_del_staff@ejemplo.com'
    );