import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected Routes Logic
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isCustomerRoute = path.startsWith("/mis-reservas");
  const isLoginRoute = path === "/mis-reservas/login";

  // 1. Admin Protection
  const isAdminLogin = path === "/admin/login";
  
  // MOCK: Disable middleware protection for admin
  /*
  if (isAdminRoute && !isAdminLogin) {
    if (!user) {
      // Not logged in -> Redirect to login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Role Check (Metadata)
    const role = user.user_metadata?.role;
    if (role !== "admin" && role !== "staff") {
      // Logged in but not admin -> Redirect to home or reservation
      // Use rewrite to show 403 or redirect? Redirect is safer.
      const url = new URL("/mis-reservas", request.url);
      url.searchParams.set("error", "unauthorized_admin_access");
      return NextResponse.redirect(url);
    }
  }
  */

  // 2. Customer Portal Protection
  if (isCustomerRoute && !isLoginRoute && !isAdminRoute) {
    // Note: isAdminRoute check is redundant due to if/else logic but added for clarity if blocks move
    if (!user) {
      return NextResponse.redirect(new URL("/mis-reservas/login", request.url));
    }
  }

  // 3. Login Redirect (if already logged in)
  if (isLoginRoute && user) {
    // If admin, go to admin dashboard
    if (user.user_metadata?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    // Otherwise go to customer portal
    return NextResponse.redirect(new URL("/mis-reservas", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/mis-reservas/:path*"],
};
