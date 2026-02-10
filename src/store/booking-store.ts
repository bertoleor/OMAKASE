import { create } from "zustand";
import type {
  Reservation,
  BookingStatus,
  DraftReservation,
} from "@/types/booking";
import type { Settings } from "@/types/settings";
import { createClient } from "@/lib/supabase/client";

interface BookingState {
  // CLIENT SIDE (WIZARD)
  currentStep: number;
  draftBooking: DraftReservation;
  settings: Settings | null;
  settingsError: string | null;
  setStep: (step: number) => void;
  updateDraft: (data: Partial<DraftReservation>) => void;
  resetDraft: () => void;
  fetchSettings: () => Promise<void>;

  // ADMIN SIDE (DATA) — sourced from Supabase, no mocks
  reservations: Reservation[];
  reservationsLoading: boolean;
  reservationsError: string | null;
  setReservations: (reservations: Reservation[]) => void;
  addReservation: (reservation: Reservation) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
  getReservationsByDate: (date: string) => Reservation[];
  fetchReservations: (date: string) => Promise<void>;
}

const initialDraft: DraftReservation = {
  pax: undefined,
  date: undefined,
  timeSlot: undefined,
  zone: undefined,
  status: "pending",
  depositPaid: false,
  customer: {},
  // Personalization defaults
  vegetarians: 0,
  kids: 0,
  restrictions: false,
  policyAccepted: false,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  // CLIENT STATE
  currentStep: 1,
  draftBooking: { ...initialDraft },
  settings: null,
  settingsError: null,

  setStep: (step) => set({ currentStep: step }),

  updateDraft: (data) =>
    set((state) => ({
      draftBooking: { ...state.draftBooking, ...data },
    })),

  resetDraft: () =>
    set({
      currentStep: 1,
      draftBooking: { ...initialDraft },
    }),

  fetchSettings: async () => {
    // Return early if already loaded
    if (get().settings) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("*")
        .single();

      if (error) {
        set({ settingsError: error.message });
        console.error("Failed to load settings:", error.message);
        return;
      }

      set({ settings: data, settingsError: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      set({ settingsError: message });
      console.error("Fetch settings error:", message);
    }
  },

  // ADMIN STATE — empty by default, populated from DB
  reservations: [],
  reservationsLoading: false,
  reservationsError: null,

  setReservations: (reservations) => set({ reservations }),

  fetchReservations: async (date: string) => {
    // Prevent duplicate fetches
    if (get().reservationsLoading) return;

    set({ reservationsLoading: true, reservationsError: null });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", date)
        .order("booking_time", { ascending: true });

      if (error) {
        set({ reservationsError: error.message, reservationsLoading: false });
        console.error("Error fetching reservations:", error.message);
        return;
      }

      set({ reservations: data ?? [], reservationsLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      set({ reservationsError: message, reservationsLoading: false });
      console.error("Fetch reservations error:", message);
    }
  },

  addReservation: (reservation) =>
    set((state) => {
      // Prevent duplicates by ID
      if (state.reservations.some((r) => r.id === reservation.id)) {
        return state;
      }
      return { reservations: [...state.reservations, reservation] };
    }),

  updateStatus: (id, status) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === id ? { ...r, status } : r,
      ),
    })),

  getReservationsByDate: (date) => {
    return get().reservations.filter((r) => r.date === date);
  },
}));
