import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_ROUTE_ROLES, getUserRole } from "@/lib/auth/roles";

const ADMIN_LOGIN = "/admin/login";
const CUSTOMER_LOGIN = "/mis-reservas/login";
const ADMIN_DASHBOARD = "/admin/dashboard";
const CUSTOMER_HOME = "/mis-reservas";
const ADMIN_ROLES = ADMIN_ROUTE_ROLES;

/**
 * Proxy - Next.js 16 replacement for middleware
 * Handles authentication and route protection for the application
 */
export async function proxy(request: NextRequest) {
  // 1. Validar Configuración (Fail Closed)
  const configError = checkSecurityConfig();
  if (configError) {
    return configError;
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. Obtener Usuario con manejo de errores
  const user = await getAuthenticatedUser(supabase);

  // 3. Lógica de Rutas
  const path = request.nextUrl.pathname;
  const redirect = handleAuthRouting(request, user, path);
  if (redirect) {
    return redirect;
  }

  return response;
}

// Helpers
function checkSecurityConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Proxy Security: Missing Supabase Environment Variables!");
    return new NextResponse(
      JSON.stringify({
        error: "Configuration Error",
        message: "Security headers missing. Access denied for safety.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }
  return null;
}

async function getAuthenticatedUser(supabase: SupabaseClient) {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error("⚠️ Proxy Auth Error:", error);
    return null;
  }
}

function handleAuthRouting(
  request: NextRequest,
  user: User | null,
  path: string,
): NextResponse | null {
  const isAdminRoute = path.startsWith("/admin");
  const isAdminLogin = path === ADMIN_LOGIN;
  const isCustomerRoute = path.startsWith("/mis-reservas");
  const isCustomerLogin = path === CUSTOMER_LOGIN;

  // Protección Admin
  if (isAdminRoute && !isAdminLogin) {
    if (!user) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
    const role = getUserRole(user);
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL(CUSTOMER_HOME, request.url));
    }
  }

  // Protección Cliente
  if (isCustomerRoute && !isCustomerLogin) {
    if (!user) {
      return NextResponse.redirect(new URL(CUSTOMER_LOGIN, request.url));
    }
  }

  // Redirección si ya está logueado
  if ((isAdminLogin || isCustomerLogin) && user) {
    const role = getUserRole(user);
    const destination = role && ADMIN_ROLES.has(role) ? ADMIN_DASHBOARD : CUSTOMER_HOME;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return null;
}

export const config = {
  matcher: ["/admin/:path*", "/mis-reservas/:path*"],
};
