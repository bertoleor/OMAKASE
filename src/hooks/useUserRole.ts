"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  ADMIN_UI_ROLES,
  STAFF_UI_ROLES,
  getUserRole,
  type UserRole,
} from "@/lib/auth/roles";

const ADMIN_ROLES = ADMIN_UI_ROLES;
const STAFF_ROLES = STAFF_UI_ROLES;

export type { UserRole };

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

        setRole(getUserRole(user));
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
        setRole(getUserRole(session?.user));
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
