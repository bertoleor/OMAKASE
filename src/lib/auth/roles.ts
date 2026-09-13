import type { User } from "@supabase/supabase-js";

export type StaffRole = "admin" | "manager" | "staff" | "cashier";
export type UserRole = StaffRole | "user" | null;

const KNOWN_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "manager",
  "staff",
  "cashier",
  "user",
]);

interface MetadataCarrier {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Single source of truth for reading a user's role.
 *
 * Authoritative source is `app_metadata.role` (server-issued via the Admin
 * API, not editable by the user). `user_metadata.role` is only honored as a
 * transitional fallback until every account is migrated.
 */
export function getUserRole(user: MetadataCarrier | User | null | undefined): UserRole {
  if (!user) {
    return null;
  }
  const fromApp = normalizeRole(user.app_metadata?.["role"]);
  if (fromApp) {
    return fromApp;
  }
  // Transitional fallback: legacy accounts still carry the role in user_metadata.
  return normalizeRole(user.user_metadata?.["role"]);
}

function normalizeRole(value: unknown): UserRole {
  if (typeof value !== "string") {
    return null;
  }
  const role = value.trim().toLowerCase();
  if (!KNOWN_ROLES.has(role)) {
    return null;
  }
  return role as UserRole;
}

/** Roles allowed into /admin routes and admin server actions. */
export const ADMIN_ROUTE_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "manager",
  "staff",
]);

/** Roles with full staff UI access (client-side display gating only). */
export const STAFF_UI_ROLES: ReadonlySet<UserRole> = new Set([
  "admin",
  "manager",
  "staff",
  "cashier",
]);

/** Roles with admin-level UI access (client-side display gating only). */
export const ADMIN_UI_ROLES: ReadonlySet<UserRole> = new Set(["admin", "manager"]);

export function hasAdminRouteAccess(
  user: MetadataCarrier | User | null | undefined,
): boolean {
  const role = getUserRole(user);
  return role !== null && ADMIN_ROUTE_ROLES.has(role);
}
