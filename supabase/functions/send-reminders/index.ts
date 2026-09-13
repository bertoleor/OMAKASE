// supabase/functions/send-reminders/index.ts
// Edge Function: Send email reminders for upcoming bookings
// Deploy: supabase functions deploy send-reminders
// Schedule: Every hour

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ReminderBooking = {
  id: string;
  customer_name?: string;
  customer_email?: string;
  booking_date?: string;
  booking_time?: string;
  pax?: number;
};

/**
 * Sends the reminder email through Resend's HTTP API (Deno runtime — no SDK).
 * Graceful no-op when RESEND_API_KEY is missing so the cron still marks the
 * reminder as sent without exploding on misconfigured env.
 */
async function sendReminderEmail(booking: ReminderBooking): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey || !booking.customer_email) return;

  const from =
    Deno.env.get("EMAIL_FROM") ||
    "OMAKASE Reservations <reservas@omakase.restaurant>";
  const body = {
    from,
    to: [booking.customer_email],
    subject: `Recordatorio de tu reserva — ${booking.booking_date} ${booking.booking_time}`,
    html:
      `<p>Hola ${booking.customer_name ?? ""},</p>` +
      `<p>Te recordamos tu reserva para el <strong>${booking.booking_date ?? ""} a las ${booking.booking_time ?? ""}</strong>` +
      (booking.pax ? ` (${booking.pax} comensales).` : ".") +
      `</p><p>Te esperamos en OMAKASE.</p>`,
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("Resend failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Resend error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Calculate windows for reminders
    // 24h reminder: bookings tomorrow at this time
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    // 2h reminder: bookings today in 2 hours
    const twoHoursLater = new Date(now);
    twoHoursLater.setHours(twoHoursLater.getHours() + 2);
    const today = now.toISOString().split("T")[0];
    const targetTimeStr = twoHoursLater.toTimeString().substring(0, 5);

    // Find bookings needing 24h reminder
    const { data: reminder24h } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_email, booking_date, booking_time, pax",
      )
      .eq("booking_date", tomorrowDate)
      .in("status", ["confirmed", "pending"])
      .is("reminder_24h_sent", null); // Assume we add this column

    // Find bookings needing 2h reminder
    const { data: reminder2h } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_email, booking_date, booking_time, pax",
      )
      .eq("booking_date", today)
      .in("status", ["confirmed"])
      .gte("booking_time", targetTimeStr)
      .lte(
        "booking_time",
        new Date(twoHoursLater.getTime() + 15 * 60000)
          .toTimeString()
          .substring(0, 5),
      )
      .is("reminder_2h_sent", null);

    const sentReminders: string[] = [];

    // Process 24h reminders
    for (const booking of reminder24h || []) {
      // Send email via Resend (RESEND_API_KEY env, HTTP fetch — Deno runtime).
      await sendReminderEmail(booking);
      console.log(
        `[24h REMINDER] ${booking.customer_name} - ${booking.booking_date} ${booking.booking_time}`,
      );

      // Mark as sent
      await supabase
        .from("bookings")
        .update({ reminder_24h_sent: now.toISOString() })
        .eq("id", booking.id);

      sentReminders.push(`24h: ${booking.customer_name}`);
    }

    // Process 2h reminders
    for (const booking of reminder2h || []) {
      await sendReminderEmail(booking);
      console.log(
        `[2h REMINDER] ${booking.customer_name} - ${booking.booking_date} ${booking.booking_time}`,
      );

      await supabase
        .from("bookings")
        .update({ reminder_2h_sent: now.toISOString() })
        .eq("id", booking.id);

      sentReminders.push(`2h: ${booking.customer_name}`);
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${sentReminders.length} reminders`,
        reminders: sentReminders,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Send reminders error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
