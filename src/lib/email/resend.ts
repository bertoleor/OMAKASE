import { Resend } from "resend";
import { BUSINESS } from "@/config/business";
import {
  confirmationTemplate,
  reminderTemplate,
  cancellationByCustomerTemplate,
  cancellationByRestaurantTemplate,
  renderTemplate,
  type TemplateVariables,
} from "./templates";

/**
 * Lazy initialize Resend client to avoid build-time errors.
 * Re-using a single instance improves performance.
 */
let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Resend] Critical error: RESEND_API_KEY is not defined in environment.");
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

// Email sender
const FROM_EMAIL = BUSINESS.emails.from;

// Extended email data interface
export interface EmailData {
  to: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  pax: number;
  zoneName?: string;
  bookingId?: string;
  phone?: string;
  address?: string;
  notes?: string;
  cancelledBy?: "cliente" | "restaurante";
  cancellationReason?: string;
  manageBookingUrl?: string;
}

/**
 * Build variables for template rendering
 */
function getTemplateVariables(data: EmailData): TemplateVariables {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const currentYear = new Date().getFullYear();

  return {
    customerName: data.customerName,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    pax: data.pax,
    paxText: data.pax === 1 ? "persona" : "personas",
    zoneName: data.zoneName || "",
    bookingId: data.bookingId || "",
    bookingIdShort: data.bookingId ? data.bookingId.slice(0, 8).toUpperCase() : "",
    notes: data.notes || "",
    cancellationReason: data.cancellationReason || "",

    businessName: BUSINESS.name,
    businessTagline: BUSINESS.tagline,
    businessAddress: data.address || BUSINESS.address,
    businessPhone: data.phone || BUSINESS.phone,
    businessEmail: BUSINESS.emails.reservations,
    businessCopyright: BUSINESS.copyright(currentYear),
    instagramUrl: BUSINESS.social.instagram,
    facebookUrl: BUSINESS.social.facebook,
    whatsappUrl: `https://wa.me/${BUSINESS.social.whatsapp}`,

    manageBookingUrl: data.manageBookingUrl || `${baseUrl}/mis-reservas/${data.bookingId || ""}`,
    bookingUrl: data.manageBookingUrl || `${baseUrl}/reservar`,

    currentYear,
  };
}

/**
 * Send booking confirmation email
 */
export async function sendConfirmationEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const variables = getTemplateVariables(data);
    const html = renderTemplate(confirmationTemplate, variables);

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Reserva Confirmada - ${data.bookingDate} a las ${data.bookingTime} | ${BUSINESS.name}`,
      html,
    });

    if (error) {
      console.error(`[Resend] Failed to send confirmation email to ${data.to}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Resend] Unexpected error sending confirmation email to ${data.to}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send 24h reminder email
 */
export async function sendReminderEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const variables = getTemplateVariables(data);
    const html = renderTemplate(reminderTemplate, variables);

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Recordatorio: Su reserva es manana - ${data.bookingTime} | ${BUSINESS.name}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send cancellation email
 * Supports cancellation by client or restaurant with different messaging
 */
export async function sendCancellationEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const isCancelledByRestaurant = data.cancelledBy === "restaurante";

    const template = isCancelledByRestaurant
      ? cancellationByRestaurantTemplate
      : cancellationByCustomerTemplate;

    const variables = getTemplateVariables(data);
    const html = renderTemplate(template, variables);

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Reserva Cancelada - ${data.bookingDate} | ${BUSINESS.name}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send Magic Link email for authentication
 */
export async function sendMagicLinkEmail(
  to: string,
  magicLink: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentYear = new Date().getFullYear();

    const html = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso a Mis Reservas - ${BUSINESS.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600;700&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #000000;
        color: #ffffff;
        line-height: 1.6;
      }
      
      .email-container { max-width: 560px; margin: 0 auto; padding: 48px 20px; }
      
      .email-card {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        overflow: hidden;
      }
      
      .email-header {
        background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
        padding: 40px;
        text-align: center;
      }
      
      .logo {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 0.25em;
        color: #ffffff;
        text-transform: uppercase;
      }
      
      .tagline {
        font-size: 11px;
        letter-spacing: 0.15em;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 8px;
        text-transform: uppercase;
      }
      
      .email-title {
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        text-align: center;
        padding: 32px 40px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-content { padding: 40px; text-align: center; }
      .greeting { font-size: 18px; margin-bottom: 8px; }
      .message { color: rgba(255, 255, 255, 0.6); margin-bottom: 32px; }
      
      .info-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        text-align: left;
      }
      
      .info-card p { color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 0; }
      
      .cta-button {
        display: inline-block;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 600;
        text-decoration: none;
        font-size: 13px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.2s ease;
      }
      
      .cta-button:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .email-footer {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding: 28px 40px;
        text-align: center;
      }
      
      .footer-text { color: rgba(255, 255, 255, 0.35); font-size: 11px; }
    </style>
      .copyright { color: #666666; font-size: 11px; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-card">
        <div class="email-header">
          <div class="logo">${BUSINESS.name}</div>
          <div class="tagline">${BUSINESS.tagline}</div>
        </div>
        
        <div class="email-title">Acceso a Mis Reservas</div>
        
        <div class="email-content">
          <p class="greeting">Bienvenido a <strong>${BUSINESS.name}</strong></p>
          <p class="message">
            Has solicitado acceso a la gestión de tus reservas. Haz clic en el botón de abajo para acceder de forma segura:
          </p>

          <div style="margin: 40px 0;">
            <a href="${magicLink}" class="cta-button">
              Acceder a Mis Reservas
            </a>
          </div>

          <div class="info-card">
            <p>Este enlace es válido por un único uso y expirará en breve.<br>
            Si no solicitaste este correo, puedes ignorarlo con seguridad.</p>
          </div>
          
          <p style="color: #666666; font-size: 12px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${magicLink}" style="color: #C9A962; word-break: break-all;">${magicLink}</a>
          </p>
        </div>
        
        <div class="email-footer">
          <div class="footer-text">
            📍 ${BUSINESS.address} • 📞 ${BUSINESS.phone}
          </div>
          <div class="copyright">
            © ${currentYear} ${BUSINESS.name}. ${BUSINESS.copyright(currentYear)}
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
    `.trim();

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Enlace de Acceso | ${BUSINESS.name}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send reservation status update email (e.g., confirmed, seated, completed)
 */
export async function sendStatusUpdateEmail(
  data: EmailData & { status: string; statusMessage: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Status labels (no emojis)
    const statusLabels: Record<string, string> = {
      confirmed: "Confirmada",
      seated: "Ocupada",
      completed: "Completada",
      "no-show": "No asistio",
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const currentYear = new Date().getFullYear();

    const html = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estado de Reserva - ${BUSINESS.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #0F0F0F;
        color: #FFFFFF;
        line-height: 1.6;
      }
      
      .email-container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      
      .email-card {
        background: linear-gradient(180deg, #1A1A1A 0%, #0F0F0F 100%);
        border: 1px solid rgba(201, 169, 98, 0.2);
        border-radius: 24px;
        overflow: hidden;
      }
      
      .email-header {
        background: linear-gradient(135deg, #C9A962 0%, #A88B4A 100%);
        padding: 48px 40px;
        text-align: center;
      }
      
      .logo {
        font-family: 'Playfair Display', serif;
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 0.3em;
        color: #0F0F0F;
        text-transform: uppercase;
      }
      
      .email-title {
        font-family: 'Playfair Display', serif;
        font-size: 28px;
        font-weight: 600;
        color: #C9A962;
        text-align: center;
        padding: 32px 40px 24px;
        border-bottom: 1px solid rgba(201, 169, 98, 0.2);
      }
      
      .email-content { padding: 40px; }
      .greeting { font-size: 18px; margin-bottom: 8px; }
      .message { color: #A0A0A0; margin-bottom: 32px; }
      
      .info-card {
        background: #252525;
        border: 1px solid rgba(201, 169, 98, 0.2);
        border-radius: 16px;
        padding: 28px;
        margin-bottom: 32px;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(201, 169, 98, 0.2);
      }
      
      .info-row:last-child { border-bottom: none; }
      .info-label { color: #666666; font-size: 14px; }
      .info-value { color: #FFFFFF; font-size: 16px; font-weight: 600; }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #C9A962 0%, #A88B4A 100%);
        color: #0F0F0F;
        padding: 16px 32px;
        border-radius: 12px;
        font-weight: 600;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 13px;
      }
      
      .cta-container { text-align: center; margin-bottom: 32px; }
      .email-footer { border-top: 1px solid rgba(201, 169, 98, 0.2); padding: 32px 40px; text-align: center; }
      .footer-text { color: #666666; font-size: 12px; }
      .copyright { color: #666666; font-size: 11px; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-card">
        <div class="email-header">
          <div class="logo">${BUSINESS.name}</div>
        </div>
        
        <div class="email-title">${statusLabels[data.status] || data.status}</div>
        
        <div class="email-content">
          <p class="greeting">Hola <strong>${data.customerName}</strong>,</p>
          <p class="message">${data.statusMessage}</p>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Fecha</span>
              <span class="info-value">${data.bookingDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora</span>
              <span class="info-value">${data.bookingTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Comensales</span>
              <span class="info-value">${data.pax}</span>
            </div>
          </div>

          <div class="cta-container">
            <a href="${data.manageBookingUrl || `${baseUrl}/mis-reservas/${data.bookingId || ""}`}" class="cta-button">
              Ver Mis Reservas
            </a>
          </div>
        </div>
        
        <div class="email-footer">
          <div class="footer-text">
            📍 ${BUSINESS.address} • 📞 ${BUSINESS.phone}
          </div>
          <div class="copyright">
            © ${currentYear} ${BUSINESS.name}. ${BUSINESS.copyright(currentYear)}
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
    `.trim();

    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Estado de Reserva: ${data.status} - ${data.bookingDate} | ${BUSINESS.name}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
