// src/__tests__/e2e_booking_flow.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentDispatcher } from "../skills/dispatcher";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock type for Supabase client chain
interface MockSupabaseChain {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

describe("E2E - Booking Lifecycle Integration", () => {
  let mockDb: MockSupabaseChain;
  let dispatcher: AgentDispatcher;

  beforeEach(() => {
    mockDb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn(),
      match: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    dispatcher = new AgentDispatcher(mockDb as unknown as SupabaseClient);
  });

  it("should complete availability check and booking creation cycle", async () => {
    const testDate = "2025-05-20";
    const bookingId = "550e8400-e29b-41d4-a716-446655440000";

    // 1. EL AGENTE CONSULTA DISPONIBILIDAD
    mockDb.in.mockResolvedValue({ data: [], error: null }); // Simula día vacío
    const availability = await dispatcher.run("check_availability", {
      date: testDate,
      zone: "indoor_tables",
    });
    expect(availability.success).toBe(true);

    // 2. EL AGENTE CREA LA RESERVA
    mockDb.match.mockResolvedValue({ data: [], error: null }); // No hay colisiones
    mockDb.single.mockResolvedValue({ data: { id: bookingId }, error: null }); // Inserción exitosa
    const booking = await dispatcher.run("create_booking", {
      customerName: "Senior Developer",
      customerEmail: "senior@dev.com",
      customerPhone: "+34600000000",
      date: testDate,
      time: "20:00",
      pax: 2,
      zone: "indoor_tables",
    });
    expect(booking.success).toBe(true);
    if (booking.success) {
      expect((booking.data as { bookingId: string }).bookingId).toBe(bookingId);
    }
  });

  it("should FAIL booking if slot is already taken (CONFLICT)", async () => {
    // Simulamos que el slot ya está ocupado
    mockDb.match.mockResolvedValue({
      data: [{ id: "existing-booking" }],
      error: null,
    });

    const result = await dispatcher.run("create_booking", {
      customerName: "Late Customer",
      customerEmail: "late@customer.com",
      customerPhone: "+34600111222",
      date: "2025-05-20",
      time: "20:00",
      pax: 4,
      zone: "outdoor_pergola",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("CONFLICT");
    }
  });

  it("should handle database errors gracefully", async () => {
    // Simulamos error de base de datos en availability check
    mockDb.in.mockResolvedValue({
      data: null,
      error: { message: "Connection Timeout" },
    });

    const result = await dispatcher.run("check_availability", {
      date: "2025-05-20",
      zone: "indoor_bar",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("DATABASE_ERROR");
    }
  });
});
