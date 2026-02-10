import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
    console.warn(
      "Supabase environment variables not configured. " +
        "Any runtime operation will throw.",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createFailSafeProxy() as any;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component context — cookie writes are expected to fail
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Component context — cookie writes are expected to fail
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
    get(_target, prop) {
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
    apply(_target, _thisArg, _args) {
      throw new Error(
        "Supabase not configured. " +
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    },
  };

  return new Proxy(() => {}, handler);
}
