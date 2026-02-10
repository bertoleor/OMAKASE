import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const ADMIN_LOGIN = "/admin/login";
const CUSTOMER_LOGIN = "/mis-reservas/login";
const ADMIN_DASHBOARD = "/admin/dashboard";
const CUSTOMER_HOME = "/mis-reservas";
const ADMIN_ROLES = new Set(["admin", "manager", "staff"]);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isAdminLogin = path === ADMIN_LOGIN;
  const isCustomerRoute = path.startsWith("/mis-reservas");
  const isCustomerLogin = path === CUSTOMER_LOGIN;

  if (isAdminRoute && !isAdminLogin) {
    if (!user) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }

    const role = user.user_metadata?.role as string | undefined;
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL(CUSTOMER_HOME, request.url));
    }
  }

  if (isCustomerRoute && !isCustomerLogin) {
    if (!user) {
      return NextResponse.redirect(new URL(CUSTOMER_LOGIN, request.url));
    }
  }

  if ((isAdminLogin || isCustomerLogin) && user) {
    const role = user.user_metadata?.role as string | undefined;
    const destination =
      role && ADMIN_ROLES.has(role) ? ADMIN_DASHBOARD : CUSTOMER_HOME;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/mis-reservas/:path*"],
};
