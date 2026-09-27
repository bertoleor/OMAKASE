# Informe de Auditoría del Proyecto "Sushi Reservas"
> Parte de: [[projects/omakase/README]] · Relacionados: [[COMPREHENSIVE_AUDIT]], [[INFORME_GENERAL]], [[projects/omakase/docs/SECURITY]]

## Resumen Ejecutivo

El proyecto utiliza un stack tecnológico **extremadamente moderno** (Next.js 16, React 19, Tailwind 4), lo cual es excelente para la longevidad y performance. La estructura de carpetas es sólida y sigue buenas prácticas de "Feature-First".

Sin embargo, existen **RIESGOS CRÍTICOS DE SEGURIDAD** debido a la configuración del Middleware y la protección de rutas, así como áreas de mejora en la centralización de configuraciones para facilitar la clonación del proyecto.

---

## 1. Seguridad (CRÍTICO)

### 🔴 Middleware Inactivo

- **Hallazgo**: Existe un archivo `src/proxy.ts` con lógica de protección de rutas y manejo de sesiones, pero Next.js busca por defecto un archivo llamado `middleware.ts` en la raíz o en `src`. Al no existir `middleware.ts`, **toda la lógica de protección de rutas es ignorada**.
- **Impacto**: Las rutas `/admin` y `/mis-reservas` podrían estar expuestas públicamente sin validación de sesión (dependiendo de si hay validaciones adicionales a nivel de página, pero la capa de "guardian" global no funciona).
- **Código Comentado**: Dentro de `proxy.ts`, la lógica de protección de admin está comentada (`/* ... */`). Incluso si el middleware funcionara, la protección está desactivada explícitamente.

### 🟡 Variables de Entorno y Manejo de Errores

- **Supabase**: Se utiliza un cliente "Mock" si faltan las variables de entorno. Esto es útil para desarrollo, pero debe asegurarse que en producción falle de manera segura y no permita operaciones "fantasma".
- **Validación**: Se utiliza `Zod` y `card-validator`, lo cual es positivo para la seguridad de los datos.

---

## 2. Esquema y Organización

### ✅ Estructura de Carpetas

- La organización `src/app`, `src/components`, `src/lib`, `src/store` es correcta y escalable.
- `src/components` está bien subdividido en `admin`, `booking`, `ui`, lo que facilita el mantenimiento.

### 🟡 Mantenibilidad y Clonabilidad

- **Info del Cliente**: La información del cliente (redes sociales, teléfono) se maneja parcialmente dinámica via `settings` (base de datos), pero existen **valores harcodeados** en `src/components/Footer.tsx` (e.g., `reservas@omakase.restaurant`).
  - *Recomendación*: Crear un archivo `src/config/client.ts` o `src/constants.ts` para todos los valores por defecto. Esto hace que clonar el proyecto para otro cliente sea tan simple como editar un solo archivo.
- **Fuentes y Estilos**:
  - ✅ Las fuentes están centralizadas en `layout.tsx` y `globals.css`.
  - 🟡 `globals.css` contiene muchas clases personalizadas (`@theme inline`, animaciones). Si bien Tailwind 4 permite esto, se recomienda mover componentes complejos a React o usar plugins de Tailwind para mantener el CSS limpio.

---

## 3. Stack y Actualización

- **Estado**: ✅ **Excelente**.
  - Next.js 16.1.6
  - React 19.2.3
  - Tailwind CSS 4.0
  - Supabase SSR
- El proyecto está a la vanguardia. No requiere actualizaciones de dependencias por ahora.

---

## 4. UX y Optimización

### 🟡 Manejo de Errores y Páginas 404

- **Faltantes**: No existen los archivos `src/app/not-found.tsx` (Personalizada 404) ni `src/app/error.tsx` (Global Error Boundary).
- **Impacto**: Si ocurre un error o el usuario entra a una ruta que no existe, verá las páginas por defecto de Next.js, que rompen la inmersión y la estética "Premium" del sitio.

### ✅ Responsividad

- Se observa un buen uso de clases responsivas de Tailwind (`md:flex-row`, `max-w-md`, etc.).
- El componente `BookingWizard` está diseñado mobile-first.

---

## 5. Calidad de Código

### 🟡 Código Comentado

- Existen bloques de código comentado irrelevante o peligroso (como la lógica de seguridad desactivada en `proxy.ts`).
- En `Button.tsx`, hay comentarios sobre dependencias faltantes (`@radix-ui/react-slot`) y workaround aplicados.

### 🟡 Componentes UI

- `Button.tsx` tiene la estructura para ser polimórfico (actuar como `a` o `button`), pero está forzado a ser `button` (`const Comp = "button"`), limitando su flexibilidad.

---

## Plan de Acción Recomendado

1. **Seguridad Inmediata**: Renombrar `src/proxy.ts` a `src/middleware.ts` y descomentar la lógica de protección de admin.
2. **Centralización**: Crear `src/config/site.ts` con toda la info del cliente (teléfono, email, redes, textos legales) y usarlo en `Footer.tsx` y otros componentes.
3. **Experiencia de Usuario**: Crear `src/app/not-found.tsx` y `src/app/error.tsx` con el diseño oscuro/glassmorphism del sitio.
4. **Limpieza**: Eliminar código comentado obsoleto y estandarizar `Button.tsx`.
