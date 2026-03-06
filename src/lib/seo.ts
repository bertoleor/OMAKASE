/**
 * SEO Utilities
 * 
 * Provides metadata generation and sitemap functionality.
 */

import { Metadata } from "next";
import { BUSINESS } from "@/config/business";

/**
 * Base URL for the application
 */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://omakase.restaurant";

/**
 * Default SEO configuration
 */
const DEFAULT_SEO = {
  siteName: BUSINESS.name,
  title: BUSINESS.metaTitle,
  description: BUSINESS.description,
  image: `${BASE_URL}/og-image.jpg`,
  twitterHandle: "@omakase",
  locale: "es_AR",
};

/**
 * Generates basic metadata for a page
 */
export function generateMetadata(options?: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
}): Metadata {
  const { title, description, image, noIndex = false, canonical } = options || {};
  
  const pageTitle = title 
    ? `${title} | ${DEFAULT_SEO.siteName}` 
    : DEFAULT_SEO.title;
  
  const pageDescription = description || DEFAULT_SEO.description;
  const pageImage = image || DEFAULT_SEO.image;

  const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonical || BASE_URL,
      siteName: DEFAULT_SEO.siteName,
      locale: DEFAULT_SEO.locale,
      type: "website",
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: DEFAULT_SEO.twitterHandle,
    },
    alternates: {
      canonical: canonical || BASE_URL,
      languages: {
        es: BASE_URL,
        en: `${BASE_URL}/en`,
        pt: `${BASE_URL}/pt`,
      },
    },
  };

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

/**
 * Generates OpenGraph metadata for a page
 */
export function generateOpenGraph(options?: {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  url?: string;
}) {
  const { title, description, image, type = "website", url } = options || {};
  
  return {
    title: title || DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    url: url || BASE_URL,
    siteName: DEFAULT_SEO.siteName,
    locale: DEFAULT_SEO.locale,
    type,
    images: [
      {
        url: image || DEFAULT_SEO.image,
        width: 1200,
        height: 630,
        alt: title || DEFAULT_SEO.title,
      },
    ],
  };
}

/**
 * Page-specific metadata generators
 */
export const pageMetadata = {
  home: () =>
    generateMetadata({
      title: undefined, // Uses default
      description: "Reserva tu mesa en OMAKASE. Experiencia gastronómica única de sushi de autor en un ambiente sofisticado.",
    }),

  book: () =>
    generateMetadata({
      title: "Reservar Mesa",
      description: "Reserva tu experiencia culinaria en OMAKASE. Selecciona fecha, hora y número de comensales.",
    }),

  confirmation: (bookingId: string) =>
    generateMetadata({
      title: "Reserva Confirmada",
      description: "Tu reserva en OMAKASE ha sido confirmada. Gracias por elegirnos.",
      canonical: `${BASE_URL}/reservar/confirmacion/${bookingId}`,
    }),

  myReservations: () =>
    generateMetadata({
      title: "Mis Reservas",
      description: "Gestiona tus reservas en OMAKASE. Verifica, modifica o cancela tus próximas visitas.",
    }),

  login: () =>
    generateMetadata({
      title: "Iniciar Sesión",
      description: "Accede a tu cuenta para gestionar tus reservas en OMAKASE.",
    }),

  admin: (section?: string) =>
    generateMetadata({
      title: section ? `${section} | Admin` : "Admin",
      description: "Panel de administración de OMAKASE.",
      noIndex: true,
    }),
};

/**
 * Sitemap entry
 */
export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Static pages for sitemap
 */
const staticPages: SitemapEntry[] = [
  {
    url: BASE_URL,
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/reservar`,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/mis-reservas/login`,
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/admin/login`,
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

/**
 * Generates sitemap XML
 */
export function generateSitemap(): string {
  const today = new Date().toISOString().split("T")[0];
  
  const sitemapEntries = staticPages
    .map((page) => {
      return `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified || today}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;
}

/**
 * Robots.txt configuration
 */
export function generateRobotsTxt(): string {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow admin and private routes
Disallow: /admin/
Disallow: /api/
Disallow: /mis-reservas/
Disallow: /*/login

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;
}
