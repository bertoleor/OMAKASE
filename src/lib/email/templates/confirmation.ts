/**
 * Booking Confirmation Email Template
 *
 * Variables:
 * - {{customerName}}
 * - {{bookingDate}}
 * - {{bookingTime}}
 * - {{pax}}
 * - {{zoneName}}
 * - {{bookingId}}
 * - {{notes}}
 * - {{manageBookingUrl}}
 *
 * Estilo: Glassmorphism negro, fuente Geist, sin emojis, formal
 */

export const confirmationTemplate = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserva Confirmada - {{businessName}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #000000;
        color: #ffffff;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
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
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
      
      .email-content { padding: 40px; }
      
      .greeting { 
        font-size: 18px; 
        font-weight: 500;
        margin-bottom: 8px; 
        color: #ffffff;
      }
      
      .message { 
        color: rgba(255, 255, 255, 0.6); 
        margin-bottom: 32px;
        font-size: 15px;
      }
      
      .info-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      
      .info-row:last-child { border-bottom: none; }
      
      .info-label { 
        color: rgba(255, 255, 255, 0.4); 
        font-size: 13px; 
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .info-value { 
        color: #ffffff; 
        font-size: 15px; 
        font-weight: 600;
      }
      
      .notes-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
      }
      
      .notes-label {
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 12px;
      }
      
      .notes-text {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        line-height: 1.6;
      }
      
      .cta-button {
        display: inline-block;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 600;
        text-decoration: none;
        font-size: 13px;
        letter-spacing: 0.02em;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.2s ease;
      }
      
      .cta-button:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }
      
      .cta-container { text-align: center; margin-bottom: 32px; }
      
      .divider { 
        height: 1px; 
        background: rgba(255, 255, 255, 0.08); 
        margin: 24px 0; 
      }
      
      .info-section {
        text-align: center;
        padding: 20px;
        margin-bottom: 24px;
      }
      
      .info-section p { 
        color: rgba(255, 255, 255, 0.5); 
        font-size: 13px;
        margin: 6px 0;
      }
      
      .info-section a { 
        color: rgba(255, 255, 255, 0.8); 
        text-decoration: none;
      }
      
      .info-section a:hover {
        color: #ffffff;
      }
      
      .email-footer {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding: 28px 40px;
        text-align: center;
      }
      
      .footer-text { 
        color: rgba(255, 255, 255, 0.35); 
        font-size: 11px; 
      }
      
      @media (max-width: 600px) {
        .email-container { padding: 24px 16px; }
        .email-header { padding: 32px 24px; }
        .logo { font-size: 24px; letter-spacing: 0.2em; }
        .email-content { padding: 28px 24px; }
        .info-row { flex-direction: column; align-items: flex-start; gap: 4px; }
        .email-footer { padding: 24px; }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-card">
        <div class="email-header">
          <div class="logo">{{businessName}}</div>
          <div class="tagline">{{businessTagline}}</div>
        </div>
        
        <div class="email-content">
          <p class="greeting">Estimado/a {{customerName}},</p>
          
          <p class="message">
            Su reserva ha sido confirmada. Le esperamos para vivir una experiencia gastronomica exclusiva.
          </p>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Fecha</span>
              <span class="info-value">{{bookingDate}}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hora</span>
              <span class="info-value">{{bookingTime}}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Comensales</span>
              <span class="info-value">{{pax}} {{paxText}}</span>
            </div>
            {{#zoneName}}
            <div class="info-row">
              <span class="info-label">Zona</span>
              <span class="info-value">{{zoneName}}</span>
            </div>
            {{/zoneName}}
            {{#bookingId}}
            <div class="info-row">
              <span class="info-label">Referencia</span>
              <span class="info-value">#{{bookingIdShort}}</span>
            </div>
            {{/bookingId}}
          </div>

          {{#notes}}
          <div class="notes-card">
            <div class="notes-label">Nota especial</div>
            <p class="notes-text">{{notes}}</p>
          </div>
          {{/notes}}

          {{#manageBookingUrl}}
          <div class="cta-container">
            <a href="{{manageBookingUrl}}" class="cta-button">
              Gestionar mi reserva
            </a>
          </div>
          {{/manageBookingUrl}}

          <div class="divider"></div>

          <p class="message" style="font-size: 13px;">
            Por favor, llegue 5 minutos antes de su hora reservada.<br>
            Si necesita cancelar o modificar, avisenos con al menos 24 horas de anticipacion.
          </p>

          <div class="info-section">
            <p>{{businessAddress}}</p>
            <p><a href="tel:{{businessPhone}}">{{businessPhone}}</a></p>
            <p><a href="mailto:{{businessEmail}}">{{businessEmail}}</a></p>
          </div>
        </div>
        
        <div class="email-footer">
          <p class="footer-text">
            {{businessName}} - {{businessCopyright}}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
`.trim();

export default confirmationTemplate;
