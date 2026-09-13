/**
 * Booking Types - Premium Sushi Restaurant
 */

export type BookingStatus =
  "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no-show";

export type TableZone = "indoor-tables" | "outdoor-pergola" | "indoor-bar";

export type BookingOccasion = "birthday" | "anniversary" | "business" | "casual";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVIP?: boolean;
}

export interface Reservation {
  id: string;
  customer: Customer;
  date: string; // ISO date string for serialization
  timeSlot: string; // e.g., "20:30"
  pax: number;
  zone: TableZone;
  tableNumber?: string;
  status: BookingStatus;
  notes?: string;
  occasion?: BookingOccasion;
  depositPaid: boolean;
  createdAt: string; // ISO date string
}

// Helper type for the wizard draft
export type DraftReservation = Partial<Omit<Reservation, "id" | "createdAt" | "customer">> & {
  customer?: Partial<Customer>;
  // Personalization
  vegetarians?: number;
  kids?: number;
  restrictions?: boolean;
  policyAccepted?: boolean;
  // PCI (ORN-86): no card data is ever persisted or sent to the server. The
  // wizard keeps only client-side display hints below — a masked brand label
  // and the last-4 digits for the summary screen. They are dropped before the
  // createBooking server action and rejected by its strict schema regardless.
  customerDni?: string; // Argentina DNI/CUIT requirement
  cardBrand?: string; // client display only (brand name, e.g. "visa")
  cardLastFour?: string; // client display only (masked last 4, never full PAN)
};
