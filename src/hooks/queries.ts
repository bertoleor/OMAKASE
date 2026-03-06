/**
 * Custom React Query hooks for data fetching.
 * Replaces the repetitive useEffect + useState patterns.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { logSupabaseError } from "@/lib/logger";

// ============================================
// TYPES
// ============================================

export interface Booking {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_dni?: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone: string;
  zone_id?: string;
  table_id?: string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
  notes?: string;
  deposit_amount: number;
  payment_token?: string;
  card_brand?: string;
  card_last_four?: string;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
  is_active: boolean;
  display_order: number;
}

export interface Table {
  id: string;
  zone_id: string;
  name: string;
  seats: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  shape: "rectangle" | "circle" | "square";
  rotation: number;
  is_active: boolean;
  display_order: number;
}

export interface Settings {
  id: string;
  default_duration_minutes: number;
  gap_minutes: number;
  max_advance_days: number;
  opening_time: string;
  closing_time: string;
  max_pax_per_booking: number;
  min_advance_minutes: number;
  terms_and_conditions?: string;
  contact_email?: string;
  contact_phone?: string;
  social_instagram?: string;
  social_facebook?: string;
  address?: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  zone_id?: string;
}

// ============================================
// QUERY KEYS
// ============================================

export const queryKeys = {
  bookings: {
    all: ["bookings"] as const,
    byDate: (date: string) => ["bookings", "byDate", date] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
    byCustomer: (email: string) => ["bookings", "byCustomer", email] as const,
  },
  zones: {
    all: ["zones"] as const,
    detail: (id: string) => ["zones", "detail", id] as const,
  },
  tables: {
    all: ["tables"] as const,
    byZone: (zoneId: string) => ["tables", "byZone", zoneId] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  blockedDates: {
    all: ["blockedDates"] as const,
  },
} as const;

// ============================================
// BOOKING HOOKS
// ============================================

/**
 * Fetch bookings by date
 */
export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: queryKeys.bookings.byDate(date),
    queryFn: async (): Promise<Booking[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", date)
        .order("booking_time", { ascending: true });

      if (error) {
        logSupabaseError(error as Error, { action: "fetchBookingsByDate", date });
        throw error;
      }

      return data || [];
    },
    enabled: !!date,
  });
}

/**
 * Fetch single booking by ID
 */
export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: async (): Promise<Booking | null> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();

      if (error) {
        logSupabaseError(error as Error, { action: "fetchBooking", bookingId: id });
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch bookings by customer email
 */
export function useBookingsByCustomer(email: string) {
  return useQuery({
    queryKey: queryKeys.bookings.byCustomer(email),
    queryFn: async (): Promise<Booking[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_email", email)
        .order("booking_date", { ascending: false });

      if (error) {
        logSupabaseError(error as Error, { action: "fetchBookingsByCustomer", email });
        throw error;
      }

      return data || [];
    },
    enabled: !!email,
  });
}

/**
 * Update booking status mutation
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking["status"] }) => {
      const supabase = createClient();
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);

      if (error) {
        logSupabaseError(error as Error, { action: "updateBookingStatus", bookingId: id });
        throw error;
      }

      return { id, status };
    },
    onSuccess: () => {
      // Invalidate all booking queries
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

/**
 * Create new booking mutation
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Partial<Booking>) => {
      const supabase = createClient();
      const { data, error } = await supabase.from("bookings").insert(booking).select().single();

      if (error) {
        logSupabaseError(error as Error, { action: "createBooking" });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

// ===========================================
// ZONE OCCUPANCY HOOKS
// ============================================

/**
 * Zone with occupancy data for a specific date
 */
export interface ZoneWithOccupancy extends Zone {
  occupied: number;
}

/**
 * Dashboard KPIs data
 */
export interface DashboardKPIData {
  todayBookings: number;
  confirmedCount: number;
  totalPax: number;
  seatedPax: number;
  next7DaysCount: number;
  totalCapacity: number;
}

/**
 * Fetch dashboard KPI data for a specific date
 */
export function useDashboardKPIs(date: string) {
  return useQuery({
    queryKey: ["dashboardKPIs", date],
    queryFn: async (): Promise<DashboardKPIData> => {
      const supabase = createClient();

      // Fetch today's bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", date)
        .order("booking_time", { ascending: true });

      if (bookingsError) {
        logSupabaseError(bookingsError, { action: "fetchTodayBookings", date });
        throw bookingsError;
      }

      // Fetch Zones for capacity
      const { data: zonesData, error: zonesError } = await supabase
        .from("zones")
        .select("id, capacity_pax")
        .eq("is_active", true);

      if (zonesError) {
        logSupabaseError(zonesError, { action: "fetchZonesForKPIs" });
        throw zonesError;
      }

      // Fetch Next 7 Days count
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const { count, error: countError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("booking_date", today)
        .lte("booking_date", nextWeekStr)
        .neq("status", "cancelled");

      if (countError) {
        logSupabaseError(countError, { action: "fetchNext7DaysCount" });
        throw countError;
      }

      // Calculate stats
      const bookings = bookingsData || [];
      const totalPax = bookings.reduce(
        (acc: number, b: { pax: number; status: string }) =>
          b.status !== "cancelled" ? acc + b.pax : acc,
        0,
      );
      const seatedPax = bookings.reduce(
        (acc: number, b: { pax: number; status: string }) =>
          b.status === "seated" ? acc + b.pax : 0,
        0,
      );
      const totalCapacity =
        zonesData?.reduce(
          (acc: number, z: { capacity_pax: number }) => acc + (z.capacity_pax || 0),
          0,
        ) || 0;

      return {
        todayBookings: bookings.length,
        confirmedCount: bookings.filter((b: { status: string }) => b.status === "confirmed").length,
        totalPax,
        seatedPax,
        next7DaysCount: count || 0,
        totalCapacity,
      };
    },
    enabled: !!date,
  });
}

/**
 * Fetch zone occupancy for a specific date
 * Combines zones with seated bookings count
 */
export function useZoneOccupancy(date: string) {
  return useQuery({
    queryKey: ["zoneOccupancy", date],
    queryFn: async (): Promise<ZoneWithOccupancy[]> => {
      const supabase = createClient();

      // Fetch all active zones
      const { data: zonesData, error: zonesError } = await supabase
        .from("zones")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (zonesError) {
        logSupabaseError(zonesError, { action: "fetchZonesForOccupancy", date });
        throw zonesError;
      }

      // For each zone, calculate current occupancy
      const enrichedZones = await Promise.all(
        (zonesData || []).map(async (zone: Zone) => {
          const { data: seatedBookings } = await supabase
            .from("bookings")
            .select("pax")
            .eq("booking_date", date)
            .eq("zone_id", zone.id)
            .eq("status", "seated");

          const occupied =
            seatedBookings?.reduce((sum: number, b: { pax: number }) => sum + b.pax, 0) || 0;
          return { ...zone, occupied };
        }),
      );

      return enrichedZones;
    },
    enabled: !!date,
  });
}

// ============================================
// ZONE HOOKS
// ============================================

/**
 * Fetch all zones
 */
export function useZones() {
  return useQuery({
    queryKey: queryKeys.zones.all,
    queryFn: async (): Promise<Zone[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        logSupabaseError(error as Error, { action: "fetchZones" });
        throw error;
      }

      return data || [];
    },
  });
}

// ============================================
// TABLE HOOKS
// ============================================

/**
 * Fetch all tables
 */
export function useTables() {
  return useQuery({
    queryKey: queryKeys.tables.all,
    queryFn: async (): Promise<Table[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        logSupabaseError(error as Error, { action: "fetchTables" });
        throw error;
      }

      return data || [];
    },
  });
}

/**
 * Fetch tables by zone
 */
export function useTablesByZone(zoneId: string) {
  return useQuery({
    queryKey: queryKeys.tables.byZone(zoneId),
    queryFn: async (): Promise<Table[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("zone_id", zoneId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        logSupabaseError(error as Error, { action: "fetchTablesByZone", zoneId });
        throw error;
      }

      return (data || []) as Table[];
    },
    enabled: !!zoneId,
  });
}

// ============================================
// SETTINGS HOOKS
// ============================================

/**
 * Fetch restaurant settings
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: async (): Promise<Settings | null> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("restaurant_settings").select("*").single();

      if (error) {
        logSupabaseError(error as Error, { action: "fetchSettings" });
        throw error;
      }

      return data;
    },
  });
}

/**
 * Update settings mutation
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Settings>) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurant_settings")
        .update(settings)
        .eq("id", settings.id)
        .select()
        .single();

      if (error) {
        logSupabaseError(error as Error, { action: "updateSettings" });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}

// ============================================
// BLOCKED DATES HOOKS
// ============================================

/**
 * Fetch blocked dates
 */
export function useBlockedDates() {
  return useQuery({
    queryKey: queryKeys.blockedDates.all,
    queryFn: async (): Promise<BlockedDate[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        logSupabaseError(error as Error, { action: "fetchBlockedDates" });
        throw error;
      }

      return data || [];
    },
  });
}

/**
 * Add blocked date mutation
 */
export function useAddBlockedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedDate: Partial<BlockedDate>) => {
      const supabase = createClient();
      const { error } = await supabase.from("blocked_dates").insert(blockedDate);

      if (error) {
        logSupabaseError(error as Error, { action: "addBlockedDate" });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockedDates.all });
    },
  });
}

/**
 * Delete blocked date mutation
 */
export function useDeleteBlockedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

      if (error) {
        logSupabaseError(error as Error, { action: "deleteBlockedDate", blockedDateId: id });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockedDates.all });
    },
  });
}
