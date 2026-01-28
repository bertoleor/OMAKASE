"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendCancellationEmail, getResendClient, sendMagicLinkEmail } from "@/lib/email/resend";

export interface StaffUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

/**
 * Check if the current user is an admin or staff
 */
async function checkAdminPermission() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.user_metadata?.role !== "admin" && user.user_metadata?.role !== "staff")) {
    throw new Error("Unauthorized: Admin or Staff access required");
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.role !== "admin") throw new Error("Only admins can update roles");

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

/**
 * Centralized booking status update with email triggers
 */
export async function updateBookingStatus(
  bookingId: string,
  status: string,
  notes?: string,
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

    // 3. Trigger cancellation email if status is 'cancelled'
    if (status === "cancelled") {
      sendCancellationEmail({
        to: booking.customer_email,
        customerName: booking.customer_name,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        pax: booking.pax,
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
    const FROM_EMAIL = process.env.EMAIL_FROM || "OMAKASE Reservations <reservas@omakase.restaurant>";

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff; border-radius: 12px; border: 1px solid #333;">
          <h1 style="text-align: center; color: #fff; letter-spacing: 2px;">OMAKASE</h1>
          <p>Hola ${customerName},</p>
          <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #222; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">Este es un mensaje directo del equipo de OMAKASE.</p>
        </div>
      `,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error sending quick contact email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generates an auth magic link and sends it via Resend
 */
export async function sendAuthMagicLink(email: string, redirectTo: string) {
  try {
    const supabase = createAdminClient();
    
    // Generate the magic link
    const { data, error: genError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectTo
      }
    });

    if (genError) throw genError;

    // Send the link via Resend
    const { success, error: sendError } = await sendMagicLinkEmail(email, data.properties.action_link);
    
    if (!success) throw new Error(sendError);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in sendAuthMagicLink:", error);
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: errorMsg || "Error al enviar el enlace." };
  }
}
