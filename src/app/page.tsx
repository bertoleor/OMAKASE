import Link from "next/link";
import { Calendar, Clock, MapPin, Phone, ArrowRight, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("*")
    .single();

  const openTime = settings?.opening_time || "20:00";
  const closeTime = settings?.closing_time || "00:00";
  const address = settings?.address || "Av. del Libertador 1234, Palermo";
  const phone = settings?.contact_phone || "+54 11 1234-5678";
  const email = settings?.contact_email || "reservas@omakase.restaurant";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
          {/* Glass Card for readability */}
          <div className="bg-black/20 backdrop-blur-lg border border-white/5 rounded-[3rem] p-10 md:p-14 shadow-2xl">
            <h1 className="text-5xl md:text-7xl font-light tracking-[0.2em] mb-6 text-white uppercase">
              OMAKASE
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-light tracking-widest mb-8 uppercase">
              Experiencia gastronómica única
            </p>
            <p className="text-white/60 mb-10 max-w-sm mx-auto text-sm md:text-base leading-relaxed">
              Cocina de autor en un ambiente sofisticado. Reserva tu mesa y vive
              una experiencia inolvidable.
            </p>

            <div className="flex flex-col items-center gap-4 w-full">
              <Link
                href="/reservar"
                className="group w-full max-w-xs flex items-center justify-center space-x-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all transform hover:scale-[1.02] shadow-lg shadow-white/10"
              >
                <span className="tracking-widest text-sm">RESERVAR MESA</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/mis-reservas"
                className="w-full max-w-xs px-8 py-3 text-white/50 text-xs uppercase tracking-widest hover:text-white transition-colors border-b border-transparent hover:border-white/20 pb-0.5"
              >
                Tengo una reserva
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Schedule */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Clock className="w-7 h-7 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold mb-4 tracking-wide">
                HORARIOS
              </h3>
              <p className="text-white/60 leading-relaxed">
                Lunes a Sábado
                <br />
                {openTime} - {closeTime}
              </p>
              <p className="text-white/40 text-sm mt-2">Domingos cerrado</p>
            </div>

            {/* Location */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold mb-4 tracking-wide">
                UBICACIÓN
              </h3>
              <p className="text-white/60 leading-relaxed">{address}</p>
            </div>

            {/* Contact */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Phone className="w-7 h-7 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold mb-4 tracking-wide">
                CONTACTO
              </h3>
              <p className="text-white/60 leading-relaxed">
                {phone}
                <br />
                {email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="w-5 h-5 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-6">
            &ldquo;Una experiencia culinaria excepcional&rdquo;
          </h2>
          <p className="text-white/50 mb-12">Reserva anticipada recomendada</p>
          <Link
            href="/reservar"
            className="inline-flex items-center space-x-3 px-10 py-5 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all transform hover:scale-105"
          >
            <Calendar className="w-5 h-5" />
            <span className="tracking-wider">RESERVAR AHORA</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer settings={settings} />
    </div>
  );
}
