"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface StaffUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

/**
 * Check if the current user is an admin
 */
async function checkAdminPermission() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * List all users (using Admin API)
 * Note: This might be limited by Supabase Free Tier pagination, but fine for small staff.
 */
export async function getStaffUsers(): Promise<{
  success: boolean;
  users?: StaffUser[];
  error?: string;
}> {
  try {
    await checkAdminPermission();
    const supabaseAdmin = createAdminClient();

    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    const staffUsers = users.map((u) => ({
      id: u.id,
      email: u.email || "",
      role: u.user_metadata?.role || "user",
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at || null,
    }));

    return { success: true, users: staffUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  userId: string,
  role: "admin" | "staff" | "user",
) {
  try {
    await checkAdminPermission();
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
