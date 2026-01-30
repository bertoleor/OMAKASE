"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "manager" | "staff" | "cashier" | null;

export function useUserRole() {
  // MOCK: Always return admin role
  const role: UserRole = "admin";
  const loading = false;

  const isAdmin = true;
  const isStaff = true;

  return { role, isAdmin, isStaff, loading };
}
