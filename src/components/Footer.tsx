import { Mail, Phone, Facebook, Instagram } from "lucide-react";
import type { Settings } from "@/types/settings";

interface FooterProps {
  settings: Settings | null;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const contactEmail = settings?.contact_email || "reservas@omakase.restaurant";
  const contactPhone = settings?.contact_phone || "+54 11 1234-5678";
  const instagramUrl = settings?.social_instagram || "https://instagram.com";
  const facebookUrl = settings?.social_facebook;

  return (
    <footer className="py-12 px-6 border-t border-white/10 bg-black text-white">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-[0.2em] mb-2">OMAKASE</h2>
          <p className="text-white/40 text-sm">
            © {currentYear} OMAKASE Restaurant. Todos los derechos reservados.
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <a
            href={`mailto:${contactEmail}`}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Email"
          >
            <Mail className="w-5 h-5" />
          </a>
          <a
            href={`tel:${contactPhone.replace(/\s/g, "")}`}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Teléfono"
          >
            <Phone className="w-5 h-5" />
          </a>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {facebookUrl && (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
