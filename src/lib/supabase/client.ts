import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser-side usage.
 *
 * When environment variables are missing (e.g. during build), returns a
 * fail-safe proxy that compiles but throws at runtime if any operation
 * is attempted, preventing silent "phantom" operations.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase environment variables not configured. " +
        "Any runtime operation will throw.",
    );
    return createFailSafeProxy() as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Returns a recursive Proxy that allows property access (so the app compiles
 * and renders) but throws a clear error on any function invocation.
 */
function createFailSafeProxy(): unknown {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      // Allow Symbol.toPrimitive and similar built-ins to avoid crashes
      if (typeof prop === "symbol") return undefined;

      // Return a nested proxy for chained property access (e.g. supabase.auth.getUser)
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
