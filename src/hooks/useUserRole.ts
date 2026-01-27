"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "manager" | "staff" | "cashier" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      try {
        const supabase = createClient();

        // Get current auth user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRole(null);
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setRole(profile.role as UserRole);
        } else {
          // Fallback: If no profile exists yet (should be created by trigger, but just in case)
          // default to 'staff' or null
          setRole("staff");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("staff"); // Safe fallback
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, []);

  const isAdmin = role === "admin" || role === "manager";
  const isStaff = role === "staff" || role === "cashier";

  return { role, isAdmin, isStaff, loading };
}
