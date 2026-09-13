/**
 * Supabase Database Types
 * Generated/adapted for the MESS Reservations system
 */

export type BookingStatusDb =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";
export type TableZoneDb = "indoor_tables" | "outdoor_pergola" | "indoor_bar";

export interface BookingRow {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // "20:30"
  pax: number;
  zone: TableZoneDb;
  zone_id?: string; // New: references zones table
  table_id?: string; // New: references tables table
  status: BookingStatusDb;
  notes: string | null;
  deposit_amount: number;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  payment_token?: string | null;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  card_brand?: string | null;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  card_last_four?: string | null;
  idempotency_key?: string | null;
  mp_payment_id?: string | null;
  mp_preference_id?: string | null;
}

export interface BookingInsert {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone: TableZoneDb;
  status?: BookingStatusDb;
  notes?: string | null;
  deposit_amount?: number;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  payment_token?: string | null;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  card_brand?: string | null;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  card_last_four?: string | null;
  idempotency_key?: string | null;
  mp_payment_id?: string | null;
  mp_preference_id?: string | null;
}

export interface BookingUpdate {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  booking_date?: string;
  booking_time?: string;
  pax?: number;
  zone?: TableZoneDb;
  status?: BookingStatusDb;
  notes?: string | null;
  deposit_amount?: number;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  payment_token?: string | null;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  card_brand?: string | null;
  /** @deprecated PCI: no longer written. Only MP reference IDs are persisted. */
  card_last_four?: string | null;
  idempotency_key?: string | null;
  mp_payment_id?: string | null;
  mp_preference_id?: string | null;
}

export interface ProfileRow {
  id: string;
  updated_at: string | null;
  full_name: string | null;
  role: "admin" | "manager" | "staff" | "cashier";
}

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: BookingRow;
        Insert: BookingInsert;
        Update: BookingUpdate;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileRow;
        Update: Partial<ProfileRow>;
      };
    };
  };
}
