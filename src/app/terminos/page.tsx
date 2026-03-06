"use client";

import { BUSINESS } from "@/config/business";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.terms();

export default function TermsPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-3xl" />
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
            Términos y Condiciones
          </h1>
          <p className="text-white/40 mb-8">
            Última actualización: {currentYear}
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-white/60 leading-relaxed">
                Al acceder y utilizar este sistema de reservas de {BUSINESS.name}, 
                usted acepta quedar obligado por estos Términos y Condiciones. 
                Si no está de acuerdo con alguno de estos términos, por favor no 
                utilice este servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                2. Reservas y Confirmaciones
              </h2>
              <p className="text-white/60 leading-relaxed">
                Las reservas realizadas a través de este sistema están sujetas a 
                disponibilidad. {BUSINESS.name} se reserva el derecho de confirmar, 
                modificar o cancelar cualquier reserva. Se solicitará una seña para 
                garantizar su reserva, la cual se descontará del total de su cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                3. Política de Cancelación
              </h2>
              <p className="text-white/60 leading-relaxed">
                Las cancelaciones deben realizarse con al menos 24 horas de 
                anticipación para recibir el reembolso completo de la seña. 
                Cancelaciones con menos de 24 horas no serán reembolsadas. 
                No presentarse a la hora reservada resultará en la pérdida de la seña.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                4. Horario de Operación
              </h2>
              <p className="text-white/60 leading-relaxed">
                El restaurante opera en los horarios publicados. {BUSINESS.name} 
                se reserva el derecho de cerrar o modificar horarios en días 
                festivos o circunstancias especiales, notifycando a los clientes 
                previamente cuando sea posible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                5. Información del Cliente
              </h2>
              <p className="text-white/60 leading-relaxed">
                Al realizar una reserva, usted proporciona información precisa y 
                completa. {BUSINESS.name} utiliza esta información únicamente 
                para gestionar su reserva y comunicarnos con usted respecto a la 
                misma. No compartimos su información con terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                6. Restricciones Alimentarias
              </h2>
              <p className="text-white/60 leading-relaxed">
                Si usted o algún miembro de su grupo tiene alergias alimentarias 
                o restricciones dietéticas, por favor notifíquenos al momento de 
                realizar la reserva. Haremos nuestro mejor esfuerzo por acomodar 
                sus necesidades, sujeto a disponibilidad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                7. Uso del Sistema
              </h2>
              <p className="text-white/60 leading-relaxed">
                Usted se compromete a utilizar este sistema de reservas de manera 
                legítima y para su propósito previsto. Está prohibido cualquier 
                uso indebido, incluyendo pero no limitado a: realizar reservas 
                falsas, intentar acceder a áreas no autorizadas, o interferir con 
                el funcionamiento del sistema.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                8. Limitación de Responsabilidad
              </h2>
              <p className="text-white/60 leading-relaxed">
                {BUSINESS.name} no será responsable por daños directos, indirectos, 
                incidentales o consecuenciales derivados del uso de este sistema 
                de reservas, incluyendo但不限于 pérdidas económicas o daños a 
                la propiedad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                9. Propiedad Intelectual
              </h2>
              <p className="text-white/60 leading-relaxed">
                Todo el contenido de este sistema, incluyendo pero no limitado a 
                texto, gráficos, logotipos e imágenes, es propiedad de {BUSINESS.name} 
                y está protegido por las leyes de propiedad intelectual aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                10. Modificaciones
              </h2>
              <p className="text-white/60 leading-relaxed">
                {BUSINESS.name} se reserva el derecho de modificar estos Términos 
                y Condiciones en cualquier momento. Los cambios entrarán en vigor 
                inmediatamente após su publicación en este sitio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">
                11. Contacto
              </h2>
              <p className="text-white/60 leading-relaxed">
                Si tiene alguna pregunta sobre estos Términos y Condiciones, 
                por favor contáctenos a través de{" "}
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
