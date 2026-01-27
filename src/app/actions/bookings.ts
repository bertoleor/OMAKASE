"use server";

import { createClient } from "@/lib/supabase/server";
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
}

export async function createBooking(data: CreateBookingData) {
  const supabase = await createClient();

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

  return { success: true, booking: result };
}
