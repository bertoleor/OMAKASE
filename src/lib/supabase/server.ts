import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not configured.");
    // Return a basic mock for server-side
    // Return a better mock for server-side to prevent build crashes
    const mockBuilder = () => ({
      select: () => mockBuilder(),
      insert: () => mockBuilder(),
      update: () => mockBuilder(),
      delete: () => mockBuilder(),
      eq: () => mockBuilder(),
      neq: () => mockBuilder(),
      gt: () => mockBuilder(),
      lt: () => mockBuilder(),
      gte: () => mockBuilder(),
      lte: () => mockBuilder(),
      in: () => mockBuilder(),
      order: () => mockBuilder(),
      limit: () => mockBuilder(),
      single: () =>
        Promise.resolve({ data: null, error: { message: "Mock error" } }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    });

    return {
      from: () => mockBuilder(),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
      },
    } as any;
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
          // Server Component - ignore
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Component - ignore
        }
      },
    },
  });
}
