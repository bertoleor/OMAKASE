import { create } from "zustand";
import type {
  Reservation,
  BookingStatus,
  DraftReservation,
} from "@/types/booking";
import type { Settings } from "@/types/settings";
import { createClient } from "@/lib/supabase/client";

// Generate mock data for initial state
const generateMockReservations = (): Reservation[] => {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  return [
    {
      id: "res-001",
      customer: {
        id: "cust-001",
        firstName: "María del Carmen",
        lastName: "Fernández García",
        email: "maria.fernandez@email.com",
        phone: "+34 612 345 678",
        isVIP: true,
      },
      date: todayISO,
      timeSlot: "20:00",
      pax: 4,
      zone: "indoor-tables",
      tableNumber: "A3",
      status: "confirmed",
      notes: "Alergia a mariscos. Celebración de cumpleaños.",
      occasion: "birthday",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "res-002",
      customer: {
        id: "cust-002",
        firstName: "John",
        lastName: "Williams",
        email: "jwilliams@business.com",
        phone: "+1 555 123 4567",
      },
      date: todayISO,
      timeSlot: "20:00",
      pax: 2,
      zone: "indoor-bar",
      tableNumber: "B1",
      status: "seated",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "res-003",
      customer: {
        id: "cust-003",
        firstName: "Alejandro",
        lastName: "Rodríguez Martínez",
        email: "a.rodriguez@periodico.es",
        phone: "+34 678 901 234",
        isVIP: true,
      },
      date: todayISO,
      timeSlot: "20:15",
      pax: 6,
      zone: "indoor-tables",
      status: "pending",
      notes: "VIP - Periodista gastronómico. Necesita mesa tranquila.",
      occasion: "business",
      depositPaid: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "res-004",
      customer: {
        id: "cust-004",
        firstName: "Yuki",
        lastName: "Tanaka",
        email: "yuki.t@mail.jp",
        phone: "+81 90 1234 5678",
      },
      date: todayISO,
      timeSlot: "20:30",
      pax: 3,
      zone: "outdoor-pergola",
      tableNumber: "C2",
      status: "confirmed",
      notes: "Vegetariano estricto. Prefiere tatami si disponible.",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "res-005",
      customer: {
        id: "cust-005",
        firstName: "Isabella",
        lastName: "Rossi de la Torre",
        email: "isabella.rossi@luxmail.it",
        phone: "+39 333 456 7890",
        isVIP: true,
      },
      date: todayISO,
      timeSlot: "20:45",
      pax: 2,
      zone: "indoor-tables",
      tableNumber: "A1",
      status: "no-show",
      notes: "Cliente habitual. Siempre pide Omakase.",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "res-006",
      customer: {
        id: "cust-006",
        firstName: "Carlos",
        lastName: "Mendoza",
        email: "carlos.m@gmail.com",
        phone: "+34 699 888 777",
      },
      date: todayISO,
      timeSlot: "21:00",
      pax: 5,
      zone: "outdoor-pergola",
      tableNumber: "D4",
      status: "seated",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "res-007",
      customer: {
        id: "cust-007",
        firstName: "Sophie",
        lastName: "Dupont-Leblanc",
        email: "sophie.dl@orange.fr",
        phone: "+33 6 12 34 56 78",
      },
      date: todayISO,
      timeSlot: "21:15",
      pax: 2,
      zone: "indoor-tables",
      tableNumber: "B3",
      status: "confirmed",
      notes: "Alergia a nueces. Aniversario de boda.",
      occasion: "anniversary",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "res-008",
      customer: {
        id: "cust-008",
        firstName: "David",
        lastName: "Chen Wei",
        email: "d.chen@enterprise.cn",
        phone: "+86 138 0000 1234",
      },
      date: todayISO,
      timeSlot: "21:30",
      pax: 8,
      zone: "indoor-tables",
      status: "pending",
      notes: "Grupo empresarial. Necesitan mesa privada y factura corporativa.",
      occasion: "business",
      depositPaid: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "res-009",
      customer: {
        id: "cust-009",
        firstName: "Ana Belén",
        lastName: "García Vega",
        email: "anabelen.gv@hotmail.com",
        phone: "+34 650 111 222",
      },
      date: todayISO,
      timeSlot: "22:00",
      pax: 4,
      zone: "indoor-tables",
      tableNumber: "A2",
      status: "completed",
      depositPaid: true,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "res-010",
      customer: {
        id: "cust-010",
        firstName: "Mohammed",
        lastName: "Al-Rashid",
        email: "m.alrashid@dubai.ae",
        phone: "+971 50 987 6543",
      },
      date: todayISO,
      timeSlot: "22:00",
      pax: 3,
      zone: "indoor-bar",
      tableNumber: "C1",
      status: "pending",
      notes: "Halal only. No alcohol en bebidas.",
      depositPaid: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];
};

interface BookingState {
  // CLIENT SIDE (WIZARD)
  currentStep: number;
  draftBooking: DraftReservation;
  settings: Settings | null;
  setStep: (step: number) => void;
  updateDraft: (data: Partial<DraftReservation>) => void;
  resetDraft: () => void;
  fetchSettings: () => Promise<void>;

  // ADMIN SIDE (DATA)
  reservations: Reservation[];
  addReservation: (reservation: Reservation) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
  getReservationsByDate: (date: string) => Reservation[];
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

      if (!error && data) {
        set({ settings: data });
      } else {
        console.error("Failed to load settings from DB");
      }
    } catch (e) {
      console.error("Fetch settings error", e);
    }
  },

  // ADMIN STATE
  reservations: generateMockReservations(),

  addReservation: (reservation) =>
    set((state) => ({
      reservations: [...state.reservations, reservation],
    })),

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
