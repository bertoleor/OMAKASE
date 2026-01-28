import { Resend } from "resend";

// Lazy initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// Email sender
const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  "OMAKASE Reservations <reservas@omakase.restaurant>";

export interface EmailData {
  to: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  pax: number;
  zoneName?: string;
}

/**
 * Send booking confirmation email
 */
export async function sendConfirmationEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Reserva Confirmada - ${data.bookingDate} a las ${data.bookingTime}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, rgba(30,30,30,0.8), rgba(20,20,20,0.9)); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="text-align: center; font-size: 32px; letter-spacing: 0.2em; margin-bottom: 30px; color: #ffffff;">OMAKASE</h1>
              
              <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #22c55e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Reserva Confirmada</p>
              </div>
              
              <div style="padding: 30px 0;">
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">Hola ${data.customerName},</p>
                <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">Tu reserva ha sido confirmada. Te esperamos:</p>
              </div>
              
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                  <span style="color: rgba(255,255,255,0.5);">Fecha</span>
                  <span style="color: #ffffff; font-weight: 600;">${data.bookingDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                  <span style="color: rgba(255,255,255,0.5);">Hora</span>
                  <span style="color: #ffffff; font-weight: 600;">${data.bookingTime}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                  <span style="color: rgba(255,255,255,0.5);">Personas</span>
                  <span style="color: #ffffff; font-weight: 600;">${data.pax}</span>
                </div>
                ${
                  data.zoneName
                    ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: rgba(255,255,255,0.5);">Zona</span>
                  <span style="color: #ffffff; font-weight: 600;">${data.zoneName}</span>
                </div>
                `
                    : ""
                }
              </div>
              
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
                  Si necesitas modificar o cancelar tu reserva, por favor contáctanos con al menos 24 horas de antelación.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send 24h reminder email
 */
export async function sendReminderEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Recordatorio: Tu reserva es mañana - ${data.bookingTime}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, rgba(30,30,30,0.8), rgba(20,20,20,0.9)); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="text-align: center; font-size: 32px; letter-spacing: 0.2em; margin-bottom: 30px; color: #ffffff;">OMAKASE</h1>
              
              <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #3b82f6; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">📅 Recordatorio de Reserva</p>
              </div>
              
              <div style="padding: 30px 0;">
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">Hola ${data.customerName},</p>
                <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">Te recordamos que tienes una reserva con nosotros <strong style="color: #ffffff;">mañana</strong>:</p>
              </div>
              
              <div style="background: rgba(59,130,246,0.1); border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid rgba(59,130,246,0.2);">
                <div style="text-align: center; margin-bottom: 16px;">
                  <span style="color: #3b82f6; font-size: 36px; font-weight: bold;">${data.bookingTime}</span>
                </div>
                <div style="text-align: center; color: rgba(255,255,255,0.6);">
                  ${data.bookingDate} • ${data.pax} personas
                </div>
              </div>
              
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
                  ¡Te esperamos! Si no puedes venir, por favor avísanos lo antes posible.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
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
 */
export async function sendCancellationEmail(
  data: EmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Reserva Cancelada - ${data.bookingDate}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, rgba(30,30,30,0.8), rgba(20,20,20,0.9)); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="text-align: center; font-size: 32px; letter-spacing: 0.2em; margin-bottom: 30px; color: #ffffff;">OMAKASE</h1>
              
              <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #ef4444; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Reserva Cancelada</p>
              </div>
              
              <div style="padding: 30px 0;">
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">Hola ${data.customerName},</p>
                <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">Tu reserva para el día <strong style="color: #ffffff;">${data.bookingDate}</strong> a las <strong style="color: #ffffff;">${data.bookingTime}</strong> ha sido cancelada.</p>
              </div>
              
              <div style="background: rgba(239,68,68,0.1); border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid rgba(239,68,68,0.2);">
                <p style="color: rgba(255,255,255,0.6); margin: 0; text-align: center;">
                  Si no solicitaste esta cancelación o crees que es un error, por favor contáctanos.
                </p>
              </div>
              
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
                  Esperamos verte pronto en OMAKASE.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
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
    const { error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Acceso a Mis Reservas - OMAKASE",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, rgba(30,30,30,0.8), rgba(20,20,20,0.9)); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="text-align: center; font-size: 32px; letter-spacing: 0.2em; margin-bottom: 30px; color: #ffffff;">OMAKASE</h1>
              
              <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Enlace de Acceso</p>
              </div>
              
              <div style="padding: 30px 0; text-align: center;">
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 30px;">Haz clic en el siguiente botón para acceder a la gestión de tus reservas:</p>
                
                <a href="${magicLink}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; transition: all 0.2s;">
                  Ingresar a Mis Reservas
                </a>
                
                <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 30px;">
                  Este enlace expirará en breve y solo puede ser usado una vez.
                </p>
              </div>
              
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 0;">
                  Si no solicitaste este enlace, puedes ignorar este correo.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
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
