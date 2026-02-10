import { Mail, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import type { Settings } from "@/types/settings";
import { BUSINESS } from "@/config/business";

interface FooterProps {
  readonly settings: Settings | null;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const contactEmail = settings?.contact_email || BUSINESS.emails.reservations;
  const contactPhone = settings?.contact_phone || BUSINESS.phone;
  const instagramUrl = settings?.social_instagram || BUSINESS.social.instagram;
  const facebookUrl = settings?.social_facebook || BUSINESS.social.facebook;

  return (
    <footer className="py-12 px-6 border-t border-white/10 bg-black text-white">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-[0.2em] mb-2">{BUSINESS.name}</h2>
          <p className="text-white/40 text-sm">
            {BUSINESS.copyright(currentYear)}
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
            href={`tel:${contactPhone.replaceAll(/\s/g, "")}`}
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
              <InstagramIcon className="w-5 h-5" />
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
              <FacebookIcon className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
