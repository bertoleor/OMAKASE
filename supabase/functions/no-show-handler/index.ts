// supabase/functions/no-show-handler/index.ts
// Edge Function: Mark confirmed bookings as no-show 30 min after booking time
// Deploy: supabase functions deploy no-show-handler
// Schedule: Set up cron job in Supabase dashboard (every 15 minutes during service hours)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Calculate cutoff time (30 minutes ago)
    const cutoffTime = new Date(now);
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);
    const cutoffTimeStr = cutoffTime.toTimeString().substring(0, 5); // "HH:MM"

    // Find confirmed bookings for today where booking_time is more than 30 min ago
    const { data: noShowCandidates, error: fetchError } = await supabase
      .from("bookings")
      .select("id, customer_name, booking_time")
      .eq("booking_date", today)
      .eq("status", "confirmed")
      .lt("booking_time", cutoffTimeStr);

    if (fetchError) throw fetchError;

    if (!noShowCandidates || noShowCandidates.length === 0) {
      return new Response(
        JSON.stringify({ message: "No no-show candidates found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark as no-show
    const bookingIds = noShowCandidates.map((b) => b.id);
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "no_show",
        notes: `Auto-marked as no-show at ${now.toISOString()}`,
      })
      .in("id", bookingIds);

    if (updateError) throw updateError;

    console.log(`Marked ${bookingIds.length} bookings as no-show:`, bookingIds);

    return new Response(
      JSON.stringify({
        message: `Marked ${bookingIds.length} bookings as no-show`,
        count: bookingIds.length,
        bookingIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("No-show handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
