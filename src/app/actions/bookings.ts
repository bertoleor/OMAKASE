"use server";

import { createClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateSubmission, MIN_ELAPSED_MS } from "@/lib/anti-abuse";
import { headers } from "next/headers";
import { BUSINESS } from "@/config/business";
import type { TableZoneDb } from "@/types/database.types";

interface CreateBookingData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  pax: number;
  zone: string;
  notes?: string;
  paymentToken?: string;
  cardBrand?: string;
  cardLastFour?: string;
  honeypot?: string;
  renderedAt?: string;
}

export async function createBooking(data: CreateBookingData) {
  const supabase = await createClient();

  const verdict = validateSubmission(
    { honeypot: data.honeypot, renderedAt: data.renderedAt },
    { minElapsedMs: MIN_ELAPSED_MS },
  );

  if (!verdict.ok && verdict.reason === "honeypot") {
    return { success: true };
  }

  if (!verdict.ok && verdict.reason === "time-trap") {
    return {
      success: false,
      code: "TIME_TRAP",
      error: "Please wait before confirming your booking.",
    };
  }

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "unknown";
  const ua = headerStore.get("user-agent") ?? "";
  const rateKey = `${ip}:${ua.slice(0, 50)}`;
  const limitCheck = checkRateLimit(rateKey, { limit: 20, windowMs: 60 * 1000 });

  if (!limitCheck.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      error: "Too many requests",
      retryAfter: limitCheck.retryAfter,
    };
  }

  // Map zone to database enum
  const zoneMap: Record<string, TableZoneDb> = {
    "indoor-tables": "indoor_tables",
    "outdoor-pergola": "outdoor_pergola",
    "indoor-bar": "indoor_bar",
  };

  const bookingData = {
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    booking_date: data.date,
    booking_time: data.timeSlot,
    pax: data.pax,
    zone: zoneMap[data.zone] || "indoor_tables",
    status: "pending",
    notes: data.notes || null,
    deposit_amount: 0,
    payment_token: data.paymentToken || null,
    card_brand: data.cardBrand || null,
    card_last_four: data.cardLastFour || null,
  };

  const { data: result, error } = await supabase
    .from("bookings")
    .insert(bookingData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Generate manage booking URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const manageBookingUrl = `${baseUrl}/mis-reservas/${result.id}`;

  // Send confirmation email with enhanced data
  try {
    await sendConfirmationEmail({
      to: data.customerEmail,
      customerName: data.customerName,
      bookingDate: data.date,
      bookingTime: data.timeSlot,
      pax: data.pax,
      zoneName: BUSINESS.zones[data.zone] || data.zone,
      bookingId: result.id,
      notes: data.notes,
      manageBookingUrl,
    });
  } catch (e) {
    console.error("Error sending confirmation email:", e);
    // We don't return error here because the booking was already created successfully
  }

  return { success: true, booking: result };
}
