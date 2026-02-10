"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "manager" | "staff" | "cashier" | null;

const ADMIN_ROLES: ReadonlySet<UserRole> = new Set(["admin", "manager"]);
const STAFF_ROLES: ReadonlySet<UserRole> = new Set([
  "admin",
  "manager",
  "staff",
  "cashier",
]);

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchRole() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          setRole(null);
          return;
        }

        const userRole = (user.user_metadata?.role as UserRole) ?? null;
        setRole(userRole);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const userRole =
          (session?.user?.user_metadata?.role as UserRole) ?? null;
        setRole(userRole);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    isAdmin: ADMIN_ROLES.has(role),
    isStaff: STAFF_ROLES.has(role),
    loading,
  };
}
