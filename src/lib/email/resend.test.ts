import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
    constructor(public apiKey?: string) {}
  },
}));

process.env.RESEND_API_KEY = "test-key";

import {
  getResendClient,
  sendCancellationEmail,
  sendConfirmationEmail,
  sendMagicLinkEmail,
  sendReminderEmail,
  sendStatusUpdateEmail,
  type EmailData,
} from "@/lib/email/resend";

const baseData: EmailData = {
  to: "guest@example.com",
  customerName: "Test Guest",
  bookingDate: "2026-09-20",
  bookingTime: "20:00",
  pax: 2,
  zoneName: "Salon Principal",
  bookingId: "abcdef1234567890",
};

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
  process.env.RESEND_API_KEY = "test-key";
});

describe("getResendClient", () => {
  it("returns a client when RESEND_API_KEY is set", () => {
    expect(() => getResendClient()).not.toThrow();
  });

  it("reuses the singleton instance", () => {
    expect(getResendClient()).toBe(getResendClient());
  });

  it("throws when RESEND_API_KEY is missing", async () => {
    vi.resetModules();
    const saved = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    // Reset the module registry so the singleton is not reused
    const fresh = await import("@/lib/email/resend");
    expect(() => fresh.getResendClient()).toThrow(/RESEND_API_KEY/);
    process.env.RESEND_API_KEY = saved;
    vi.resetModules();
  });
});

describe("sendConfirmationEmail", () => {
  it("sends with confirmation subject and rendered html", async () => {
    const result = await sendConfirmationEmail(baseData);
    expect(result).toEqual({ success: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe("guest@example.com");
    expect(payload.subject).toContain("Reserva Confirmada");
    expect(payload.subject).toContain("2026-09-20");
    // No unrendered placeholders for variables we provide
    expect(payload.html).not.toContain("{{customerName}}");
    expect(payload.html).toContain("Test Guest");
  });

  it("returns success:false when Resend reports an error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "rejected" },
    });
    const result = await sendConfirmationEmail(baseData);
    expect(result).toEqual({ success: false, error: "rejected" });
  });

  it("returns success:false when send throws", async () => {
    sendMock.mockRejectedValue(new Error("network down"));
    const result = await sendConfirmationEmail(baseData);
    expect(result).toEqual({ success: false, error: "network down" });
  });
});

describe("sendReminderEmail", () => {
  it("sends with reminder subject", async () => {
    const result = await sendReminderEmail(baseData);
    expect(result).toEqual({ success: true });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.subject).toContain("Recordatorio");
    expect(payload.html).toContain("Test Guest");
  });

  it("returns error message when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "bad" } });
    const result = await sendReminderEmail(baseData);
    expect(result).toEqual({ success: false, error: "bad" });
  });
});

describe("sendCancellationEmail", () => {
  it("uses the customer template by default", async () => {
    const result = await sendCancellationEmail(baseData);
    expect(result).toEqual({ success: true });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.subject).toContain("Reserva Cancelada");
    expect(payload.html).toContain("Test Guest");
  });

  it("uses the restaurant template when cancelledBy is restaurante", async () => {
    const customer = await sendCancellationEmail(baseData);
    const customerHtml = sendMock.mock.calls[0][0].html as string;
    sendMock.mockClear();
    const restaurant = await sendCancellationEmail({
      ...baseData,
      cancelledBy: "restaurante",
      cancellationReason: "maintenance",
    });
    expect(customer).toEqual({ success: true });
    expect(restaurant).toEqual({ success: true });
    const restaurantHtml = sendMock.mock.calls[0][0].html as string;
    expect(restaurantHtml).not.toBe(customerHtml);
  });

  it("returns success:false when send throws", async () => {
    sendMock.mockRejectedValue(new Error("boom"));
    const result = await sendCancellationEmail(baseData);
    expect(result).toEqual({ success: false, error: "boom" });
  });
});

describe("sendMagicLinkEmail", () => {
  it("embeds the magic link in the html", async () => {
    const result = await sendMagicLinkEmail(
      "guest@example.com",
      "https://example.com/auth/cb?token=abc",
    );
    expect(result).toEqual({ success: true });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe("guest@example.com");
    expect(payload.subject).toContain("Enlace de Acceso");
    expect(payload.html).toContain("https://example.com/auth/cb?token=abc");
  });

  it("returns success:false when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "denied" } });
    const result = await sendMagicLinkEmail("a@b.c", "https://x");
    expect(result).toEqual({ success: false, error: "denied" });
  });
});

describe("sendStatusUpdateEmail", () => {
  it("renders the status label and message", async () => {
    const result = await sendStatusUpdateEmail({
      ...baseData,
      status: "confirmed",
      statusMessage: "Your table is ready.",
    });
    expect(result).toEqual({ success: true });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain("Confirmada");
    expect(payload.html).toContain("Your table is ready.");
  });

  it("falls back to the raw status for unknown values", async () => {
    await sendStatusUpdateEmail({
      ...baseData,
      status: "weird-status",
      statusMessage: "hello",
    });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain("weird-status");
  });
});

describe("pax singular/plural", () => {
  it("renders persona for 1 pax via confirmation path", async () => {
    await sendConfirmationEmail({ ...baseData, pax: 1 });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain("persona");
  });
});
