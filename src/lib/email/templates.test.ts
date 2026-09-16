import { describe, expect, it } from "vitest";
import {
  buildTemplateVariables,
  cancellationByCustomerTemplate,
  cancellationByRestaurantTemplate,
  confirmationTemplate,
  getPaxText,
  reminderTemplate,
  renderTemplate,
} from "@/lib/email/templates";

describe("getPaxText", () => {
  it("returns persona for 1 and personas otherwise", () => {
    expect(getPaxText(1)).toBe("persona");
    expect(getPaxText(2)).toBe("personas");
    expect(getPaxText(0)).toBe("personas");
  });
});

describe("renderTemplate", () => {
  it("replaces {{variable}} placeholders", () => {
    expect(
      renderTemplate("Hola {{customerName}}!", { customerName: "Ana" }),
    ).toBe("Hola Ana!");
  });

  it("keeps unknown placeholders untouched", () => {
    expect(renderTemplate("Hola {{missing}}!", {})).toBe("Hola {{missing}}!");
  });

  it("handles {{#if}} conditional blocks", () => {
    const tpl = "A{{#if zoneName}} zone={{zoneName}}{{/if}}B";
    expect(renderTemplate(tpl, { zoneName: "Terraza" })).toBe(
      "A zone={{zoneName}}B".replace("{{zoneName}}", "Terraza"),
    );
    expect(renderTemplate(tpl, { zoneName: "" })).toBe("AB");
  });

  it("handles {{#ifNotEmpty}} blocks with whitespace-only values", () => {
    const tpl = "A{{#ifNotEmpty notes}}N{{/ifNotEmpty}}B";
    expect(renderTemplate(tpl, { notes: "  " })).toBe("AB");
    expect(renderTemplate(tpl, { notes: "vegan" })).toBe("ANB");
  });
});

describe("email templates", () => {
  it("confirmation template renders without leftover core placeholders", () => {
    const vars = buildTemplateVariables({
      customerName: "Ana",
      bookingDate: "2026-09-20",
      bookingTime: "20:00",
      pax: 2,
      zoneName: "Salon",
      bookingId: "abcdef1234567890",
      manageBookingUrl: "https://example.com/mis-reservas/x",
    });
    const html = renderTemplate(confirmationTemplate, vars);
    for (const key of [
      "customerName",
      "bookingDate",
      "bookingTime",
      "businessName",
    ]) {
      expect(html).not.toContain(`{{${key}}}`);
    }
    expect(html).toContain("Ana");
  });

  it("reminder and cancellation templates render the guest name", () => {
    const vars = buildTemplateVariables({
      customerName: "Beto",
      bookingDate: "2026-09-20",
      bookingTime: "21:00",
      pax: 4,
    });
    expect(renderTemplate(reminderTemplate, vars)).toContain("Beto");
    expect(
      renderTemplate(cancellationByCustomerTemplate, vars),
    ).toContain("Beto");
    expect(
      renderTemplate(cancellationByRestaurantTemplate, vars),
    ).toContain("Beto");
  });

  it("customer and restaurant cancellation templates differ", () => {
    expect(cancellationByCustomerTemplate).not.toBe(
      cancellationByRestaurantTemplate,
    );
  });
});

describe("buildTemplateVariables", () => {
  it("derives paxText and short booking id", () => {
    const vars = buildTemplateVariables({
      customerName: "Ceci",
      bookingDate: "2026-09-20",
      bookingTime: "20:00",
      pax: 1,
      bookingId: "abcdef1234567890",
    });
    expect(vars.paxText).toBe("persona");
    expect(vars.bookingIdShort).toBe("ABCDEF12");
    expect(vars.currentYear).toBe(new Date().getFullYear());
  });
});
