/**
 * Centralized business configuration.
 *
 * Every reference to the restaurant name, emails, social media, or
 * contact details should import from this file. This makes it trivial
 * to rebrand or update information in a single place.
 */

export const BUSINESS = {
  /** Display name used in headers, footers, emails, and metadata */
  name: "OMAKASE",

  /** SEO / metadata title */
  metaTitle: "Reservas Omakase",

  /** Tagline shown in the footer */
  tagline: "Experience",

  /** Contact emails — used as fallbacks when DB settings are missing */
  emails: {
    reservations: "reservas@omakase.restaurant",
    support: "soporte@omakase.restaurant",
    /** Sender identity for outbound emails (Resend) */
    from:
      process.env.EMAIL_FROM ||
      "OMAKASE Reservations <reservas@omakase.restaurant>",
  },

  /** Social media URLs */
  social: {
    instagram: "https://instagram.com/omakase",
    whatsapp: "+54 9 11 0000 0000",
  },

  /** Zone display names — maps internal IDs to human-readable labels */
  zones: {
    "indoor-tables": "Salón Principal",
    "outdoor-pergola": "Terraza Pérgola",
    "indoor-bar": "Barra Omakase",
  } as Record<string, string>,

  /** Location used for calendar events and sharing */
  location: "OMAKASE Restaurant",

  /** Copyright */
  copyright: (year: number) =>
    `© ${year} OMAKASE Restaurant. Todos los derechos reservados.`,
} as const;
