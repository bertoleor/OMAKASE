"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import {
  sendCancellationEmail,
  getResendClient,
  sendMagicLinkEmail,
} from "@/lib/email/resend";
import { BUSINESS } from "@/config/business";

export interface StaffUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

const ADMIN_ROLES = new Set(["admin", "manager", "staff"]);

/**
 * Verify the current user has admin or staff permissions.
 * Throws if not authenticated or role is insufficient.
 */
async function checkAdminPermission() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: authentication required");
  }

  const role = getUserRole(user);
  if (!role || !ADMIN_ROLES.has(role)) {
    throw new Error("Unauthorized: admin or staff access required");
  }
}

/**
 * List all users (using Admin API)
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
      role: getUserRole(u) ?? "user",
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (getUserRole(user) !== "admin")
      throw new Error("Only admins can update roles");

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      // app_metadata is authoritative (server-issued, not user-editable).
      // user_metadata is mirrored during the migration for backward compat.
      app_metadata: { role },
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

/**
 * Centralized booking status update with email triggers
 */
export async function updateBookingStatus(
  bookingId: string,
  status: string,
  notes?: string,
  cancellationReason?: string,
) {
  try {
    await checkAdminPermission();
    const supabase = await createClient();

    // 1. Get current booking info for email details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found");

    // 2. Update status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status, notes: notes || booking.notes })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // 3. Generate manage booking URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const manageBookingUrl = `${baseUrl}/mis-reservas/${bookingId}`;

    // 4. Trigger cancellation email if status is 'cancelled'
    if (status === "cancelled") {
      sendCancellationEmail({
        to: booking.customer_email,
        customerName: booking.customer_name,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        pax: booking.pax,
        zoneName: Object.entries(BUSINESS.zones).find(([key]) => key === booking.zone)?.[1] || booking.zone,
        bookingId: booking.id,
        notes: booking.notes,
        cancelledBy: "restaurante", // Admin is cancelling on behalf of restaurant
        cancellationReason,
        manageBookingUrl,
      }).catch((e) => console.error("Error sending cancellation email:", e));
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a custom quick contact email to a customer
 */
export async function sendQuickContactEmail(
  to: string,
  subject: string,
  message: string,
  customerName: string,
) {
  try {
    await checkAdminPermission();

    const resend = getResendClient();
    const FROM_EMAIL = BUSINESS.emails.from;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff; border-radius: 12px; border: 1px solid #333;">
          <h1 style="text-align: center; color: #fff; letter-spacing: 2px;">${BUSINESS.name}</h1>
          <p>Hola ${customerName},</p>
          <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #222; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">Este es un mensaje directo del equipo de ${BUSINESS.name}.</p>
        </div>
      `,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error sending quick contact email:", error);
    return {
      success: false,
      error: "No se pudo enviar el mensaje. Intente nuevamente.",
    };
  }
}

/**
 * Generates an auth magic link and sends it via Resend
 */
export async function sendAuthMagicLink(email: string, redirectTo: string) {
  try {
    // Rate limiting BEFORE generating/sending the magic link.
    // Keys are namespaced `ml:` to avoid collision with other limiters.
    // Email is normalized so "A@x.com" and "a@x.com" share a counter.
    // IP is extracted exactly like bookings.ts does (x-forwarded-for first segment,
    // fallback x-real-ip, fallback "unknown"). Redis backend deferred to ops slice D.
    const normalizedEmail = email.toLowerCase().trim();
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      "unknown";

    const emailCheck = checkRateLimit(`ml:email:${normalizedEmail}`, {
      limit: 3,
      windowMs: 5 * 60 * 1000,
    });
    const ipCheck = checkRateLimit(`ml:ip:${ip}`, {
      limit: 10,
      windowMs: 5 * 60 * 1000,
    });

    if (!emailCheck.allowed || !ipCheck.allowed) {
      return {
        success: false,
        code: "RATE_LIMITED",
        error: "Too many requests",
        retryAfter: Math.max(emailCheck.retryAfter, ipCheck.retryAfter),
      };
    }

    const supabase = createAdminClient();

    // Generate the magic link
    const { data, error: genError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (genError) throw genError;

    // Send the link via Resend
    const { success, error: sendError } = await sendMagicLinkEmail(
      email,
      data.properties.action_link,
    );

    if (!success) throw new Error(sendError);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in sendAuthMagicLink:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("sendAuthMagicLink detail:", errorMsg);
    return { success: false, error: "No se pudo enviar el enlace. Intente nuevamente." };
  }
}
