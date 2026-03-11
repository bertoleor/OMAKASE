/**
 * Email Templates Index
 *
 * Centralized template management for all email types.
 * Each template is stored in its own file for easy maintenance.
 */

export { default as confirmationTemplate } from "./confirmation";
export { default as reminderTemplate } from "./reminder";
export {
  default as cancellationTemplate,
  cancellationByCustomerTemplate,
  cancellationByRestaurantTemplate,
} from "./cancellation";

/**
 * Template variables interface
 */
export interface TemplateVariables {
  // Customer data
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  pax: number;
  paxText: string;
  zoneName?: string;
  bookingId?: string;
  bookingIdShort?: string;
  notes?: string;
  cancellationReason?: string;

  // Business data
  businessName: string;
  businessTagline: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessCopyright: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappUrl: string;

  // URLs
  manageBookingUrl?: string;
  bookingUrl?: string;

  // Metadata
  currentYear: number;
}

/**
 * Helper to get plural text for pax
 */
export function getPaxText(pax: number): string {
  return pax === 1 ? "persona" : "personas";
}

/**
 * Simple template renderer - replaces {{variable}} placeholders
 * For more complex templates, consider using a template engine like handlebars
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;

  // Replace simple variables
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null) {
      // Handle {{variable}} format
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
  }

  // Handle conditional blocks {{#if variable}}...{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    const value = variables[varName];
    return value ? content : "";
  });

  // Handle conditional blocks {{#ifNotEmpty variable}}...{{/ifNotEmpty}}
  result = result.replace(
    /{{#ifNotEmpty\s+(\w+)}}([\s\S]*?){{\/ifNotEmpty}}/g,
    (match, varName, content) => {
      const value = variables[varName];
      return value && value.trim() ? content : "";
    },
  );

  // Handle loops/blocks {{#variable}}...{{/variable}} for optional sections
  result = result.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, varName, content) => {
    const value = variables[varName];
    if (value) {
      // Replace inner variables in the block
      let blockContent = content;
      for (const [key, val] of Object.entries(variables)) {
        if (val !== undefined && val !== null) {
          blockContent = blockContent.replace(new RegExp(`{{${key}}}`, "g"), String(val));
        }
      }
      return blockContent;
    }
    return "";
  });

  return result;
}

/**
 * Pre-built variable sets for common scenarios
 */
export function buildTemplateVariables(data: {
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  pax: number;
  zoneName?: string;
  bookingId?: string;
  notes?: string;
  cancellationReason?: string;
  manageBookingUrl?: string;
}) {
  const { BUSINESS } = require("@/config/business");
  const currentYear = new Date().getFullYear();

  return {
    customerName: data.customerName,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    pax: data.pax,
    paxText: getPaxText(data.pax),
    zoneName: data.zoneName || "",
    bookingId: data.bookingId || "",
    bookingIdShort: data.bookingId ? data.bookingId.slice(0, 8).toUpperCase() : "",
    notes: data.notes || "",
    cancellationReason: data.cancellationReason || "",

    businessName: BUSINESS.name,
    businessTagline: BUSINESS.tagline,
    businessAddress: BUSINESS.address,
    businessPhone: BUSINESS.phone,
    businessEmail: BUSINESS.emails.reservations,
    businessCopyright: BUSINESS.copyright(currentYear),
    instagramUrl: BUSINESS.social.instagram,
    facebookUrl: BUSINESS.social.facebook,
    whatsappUrl: `https://wa.me/${BUSINESS.social.whatsapp}`,

    manageBookingUrl: data.manageBookingUrl || "",
    bookingUrl: data.manageBookingUrl || "",

    currentYear,
  };
}
