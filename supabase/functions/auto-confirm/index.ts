// supabase/functions/auto-confirm/index.ts
// Edge Function: Auto-confirm pending bookings after 2 hours
// Deploy: supabase functions deploy auto-confirm
// Schedule: Set up cron job in Supabase dashboard (every hour)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get settings for auto-confirm threshold
    // const { data: settings } = await supabase
    //   .from("restaurant_settings")
    //   .select("*")
    //   .single();

    const autoConfirmHours = 2; // Could make this configurable

    // Calculate cutoff time (2 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - autoConfirmHours);

    // Find pending bookings older than cutoff
    const { data: pendingBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_email, booking_date, booking_time")
      .eq("status", "pending")
      .lt("created_at", cutoffTime.toISOString());

    if (fetchError) throw fetchError;

    if (!pendingBookings || pendingBookings.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No pending bookings to auto-confirm",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auto-confirm all found bookings
    const bookingIds = pendingBookings.map((b) => b.id);
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        notes: "Auto-confirmed after 2 hours",
      })
      .in("id", bookingIds);

    if (updateError) throw updateError;

    // Log the action
    console.log(`Auto-confirmed ${bookingIds.length} bookings:`, bookingIds);

    return new Response(
      JSON.stringify({
        message: `Auto-confirmed ${bookingIds.length} bookings`,
        count: bookingIds.length,
        bookingIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Auto-confirm error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
