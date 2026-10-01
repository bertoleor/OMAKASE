import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/headers BEFORE any import that uses it
const headerGet = vi.fn((key: string) => null as string | null);
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headerGet })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
  })),
}));

const generateLinkMock = vi.fn(async () => ({
  data: { properties: { action_link: "https://example.com/magic" } },
  error: null,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        generateLink: generateLinkMock,
      },
    },
  })),
}));

const sendEmailMock = vi.fn(async () => ({ success: true, error: undefined }));

vi.mock("@/lib/email/resend", () => ({
  sendMagicLinkEmail: sendEmailMock,
  sendCancellationEmail: vi.fn(),
  getResendClient: vi.fn(),
  sendConfirmationEmail: vi.fn(),
}));

// Dynamic import AFTER mocks
const { sendAuthMagicLink } = await import("@/app/actions/admin");

async function resetRateLimiter() {
  vi.resetModules();
  // Re-import to get a fresh module with fresh rate-limit singleton state
  const adminModule = await import("@/app/actions/admin");
  return adminModule.sendAuthMagicLink;
}

describe("sendAuthMagicLink - rate limiting", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    headerGet.mockImplementation((key: string) => {
      if (key === "x-forwarded-for") return "192.168.0.1";
      return null;
    });
  });

  it("happy path: first 3 sends for same email succeed", async () => {
    const sendAuth = await resetRateLimiter();
    for (let i = 0; i < 3; i++) {
      const res = await sendAuth("user@example.com", "https://redirect.example.com");
      expect(res.success).toBe(true);
    }
    expect(sendEmailMock).toHaveBeenCalledTimes(3);
  });

  it("email limit: 4th send within 5min returns RATE_LIMITED and skips Resend", async () => {
    const sendAuth = await resetRateLimiter();
    for (let i = 0; i < 3; i++) {
      const res = await sendAuth("user@example.com", "https://redirect.example.com");
      expect(res.success).toBe(true);
    }
    sendEmailMock.mockClear();
    const res = await sendAuth("user@example.com", "https://redirect.example.com");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("RATE_LIMITED");
      expect(res.retryAfter).toBeGreaterThan(0);
      expect(Number.isInteger(res.retryAfter)).toBe(true);
    }
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("IP limit: 11th send from same IP across 4 emails returns RATE_LIMITED and skips Resend", async () => {
    const sendAuth = await resetRateLimiter();
    const emails = ["a@ex.com", "b@ex.com", "c@ex.com", "d@ex.com"];
    let callCount = 0;
    // Distribute calls so each email <= 3 but total exceeds IP limit of 10
    // 3+3+3+2 = 11 calls
    for (let e = 0; e < emails.length; e++) {
      const sends = e < 3 ? 3 : 2;
      for (let i = 0; i < sends; i++) {
        const res = await sendAuth(emails[e], "https://redirect.example.com");
        callCount++;
        if (callCount <= 10) {
          expect(res.success).toBe(true);
        } else {
          expect(res.success).toBe(false);
          if (!res.success) {
            expect(res.code).toBe("RATE_LIMITED");
            expect(res.retryAfter).toBeGreaterThan(0);
          }
          expect(sendEmailMock).toHaveBeenCalledTimes(10);
        }
      }
    }
  });

  it("distinct emails are tracked separately", async () => {
    const sendAuth = await resetRateLimiter();
    for (let i = 0; i < 3; i++) {
      await sendAuth("one@example.com", "https://redirect.example.com");
    }
    sendEmailMock.mockClear();
    const res = await sendAuth("two@example.com", "https://redirect.example.com");
    expect(res.success).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("retryAfter is a positive integer when limited", async () => {
    const sendAuth = await resetRateLimiter();
    for (let i = 0; i < 3; i++) {
      await sendAuth("user@example.com", "https://redirect.example.com");
    }
    const res = await sendAuth("user@example.com", "https://redirect.example.com");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(Number.isInteger(res.retryAfter)).toBe(true);
      expect(res.retryAfter).toBeGreaterThan(0);
    }
  });
});
