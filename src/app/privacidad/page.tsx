import { BUSINESS } from "@/config/business";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.privacy();

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-light tracking-[0.2em] text-white uppercase hover:text-white/80 transition-colors"
          >
            {BUSINESS.name}
          </Link>
          <Link
            href="/"
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12">
          <h1 className="text-3xl lg:text-4xl font-light text-white mb-2 tracking-wide">
            Política de Privacidad
          </h1>
          <p className="text-white/40 mb-8">
            Última actualización: {currentYear}
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                1. Introducción
              </h2>
              <p className="text-white/60 leading-relaxed">
                En {BUSINESS.name}, respetamos su privacidad y estamos comprometidos 
                a proteger sus datos personales. Esta Política de Privacidad explica 
                cómo recopilamos, utilisons, compartimos y protegemos su información 
                cuando utiliza nuestro sistema de reservas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                2. Información que Recopilamos
              </h2>
              <p className="text-white/60 leading-relaxed">
                Recopilamos la siguiente información:
              </p>
              <ul className="text-white/60 leading-relaxed list-disc pl-6 space-y-2 mt-4">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Información de la reserva (fecha, hora, número de comensales)</li>
                <li>Preferencias alimentarias y restricciones</li>
                <li>Datos de pago (procesados de forma segura a través de terceros)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                3. Cómo Utilizamos su Información
              </h2>
              <p className="text-white/60 leading-relaxed">
                Utilizamos su información para:
              </p>
              <ul className="text-white/60 leading-relaxed list-disc pl-6 space-y-2 mt-4">
                <li>Procesar y gestionar sus reservas</li>
                <li>Comunicarnos con usted sobre sus reservas</li>
                <li>Enviar recordatorios de reservas</li>
                <li>Mejorar nuestros servicios</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                4. Compartir Información
              </h2>
              <p className="text-white/60 leading-relaxed">
                No vendemos su información personal. Compartimos sus datos solo con:
              </p>
              <ul className="text-white/60 leading-relaxed list-disc pl-6 space-y-2 mt-4">
                <li>Proveedores de servicios necesarios para operar el restaurante</li>
                <li>Procesadores de pago (para procesar señas)</li>
                <li>Autoridades legales cuando sea requerido por ley</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                5. Seguridad de los Datos
              </h2>
              <p className="text-white/60 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para 
                proteger su información personal, incluyendo:
              </p>
              <ul className="text-white/60 leading-relaxed list-disc pl-6 space-y-2 mt-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Acceso limitado a información personal</li>
                <li>Monitoreo regular de nuestros sistemas</li>
                <li>Protocolos de seguridadssl/TLS para transacciones</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                6. Retención de Datos
              </h2>
              <p className="text-white/60 leading-relaxed">
                Conservamos su información personal solo durante el tiempo necesario 
                para los fines descritos en esta política. Los datos de reservas se 
                mantienen durante un período razonable después de su visita para 
                cumplir con obligaciones legales y de servicio al cliente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                7. Sus Derechos
              </h2>
              <p className="text-white/60 leading-relaxed">
                Usted tiene derecho a:
              </p>
              <ul className="text-white/60 leading-relaxed list-disc pl-6 space-y-2 mt-4">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar información inexacta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Solicitar la portabilidad de sus datos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                8. Cookies y Tecnologías Similares
              </h2>
              <p className="text-white/60 leading-relaxed">
                Nuestro sitio web puede utilizar cookies y tecnologías similares 
                para mejorar su experiencia. Puede configurar su navegador para 
                rechazar todas las cookies o para indicar cuándo se envía una cookie.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                9. Cookies y Tecnologías Similares
              </h2>
              <p className="text-white/60 leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. 
                Le notificaremos sobre cambios significativos mediante un aviso 
                en nuestro sitio web o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                10. Contacto
              </h2>
              <p className="text-white/60 leading-relaxed">
                Si tiene preguntas sobre esta Política de Privacidad o desea ejercer 
                sus derechos, por favor contáctenos a través de{" "}
                <a
                  href={`mailto:${BUSINESS.emails.reservations}`}
                  className="text-white hover:underline"
                >
                  {BUSINESS.emails.reservations}
                </a>
              </p>
            </section>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              ← Volver a {BUSINESS.name}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/30 text-sm">
            © {currentYear} {BUSINESS.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
