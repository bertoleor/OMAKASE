import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side usage (Server Components,
 * Server Actions, Route Handlers).
 *
 * When environment variables are missing (e.g. during build), returns a
 * fail-safe proxy that compiles but throws at runtime if any operation
 * is attempted, preventing silent "phantom" operations.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[Supabase Server] Environment variables are missing. " +
          "Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createFailSafeProxy() as any;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options }),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Returns a recursive Proxy that allows property access (so the app compiles
 * and renders) but throws a clear error on any function invocation.
 */
function createFailSafeProxy(): unknown {
  const handler: ProxyHandler<object> = {
    get(_, prop) {
      if (typeof prop === "symbol") return undefined;

      return new Proxy(() => {}, {
        get: (_t, nestedProp) => {
          if (typeof nestedProp === "symbol") return undefined;
          return new Proxy(() => {}, handler);
        },
        apply: () => {
          throw new Error(
            `Supabase not configured: cannot call "${String(prop)}". ` +
              "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
          );
        },
      });
    },
    apply() {
      throw new Error(
        "Supabase not configured. " +
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    },
  };

  return new Proxy(() => {}, handler);
}
