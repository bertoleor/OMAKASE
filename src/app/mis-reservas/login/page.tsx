"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MyReservationsLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Send magic link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/mis-reservas`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      console.error("Login error:", err);
      setError("Error al enviar el enlace. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-light tracking-[0.2em] text-white">
            OMAKASE
          </h1>
        </div>

        {sent ? (
          /* Success State */
          <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-light text-white mb-3 uppercase tracking-wider">
              ¡Enlace enviado!
            </h2>
            <p className="text-white/60 mb-6 font-light">
              Hemos enviado un enlace de acceso a{" "}
              <strong className="text-white font-normal">{email}</strong>.
              Revisa tu bandeja de entrada.
            </p>
            <p className="text-xs text-white/30 uppercase tracking-widest">
              El enlace expira en 1 hora
            </p>
          </div>
        ) : (
          /* Login Form */
          <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-xl p-8">
            <h2 className="text-lg font-light text-white text-center mb-8 uppercase tracking-widest text-white/80">
              Ingresar a Mis Reservas
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-widest text-white/40 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:border-white/30 focus:outline-none transition-colors font-light"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center font-light">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center space-x-2 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-sm"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Enviar enlace de acceso</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-white/30 uppercase tracking-widest">
                Ingreso seguro sin contraseña
              </p>
            </div>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
