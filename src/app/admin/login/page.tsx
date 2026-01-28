"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Send magic link with admin redirect
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      console.error("Login error:", err);
      setError("Error al enviar el enlace. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03),_transparent)] z-0" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                <ShieldCheck className="w-8 h-8 text-white/80" strokeWidth={1.5} />
            </div>
          <h1 className="text-3xl font-light tracking-[0.2em] text-white/90 uppercase mb-2">
            OMAKASE
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            Acceso Administrativo
          </p>
        </div>

        {sent ? (
          /* Success State */
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="w-7 h-7 text-green-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-medium text-white mb-3 tracking-wide">
              Enlace enviado
            </h2>
            <p className="text-white/60 mb-6 font-light text-sm leading-relaxed">
              Hemos enviado un enlace de acceso seguro a <br/>
              <strong className="text-white font-normal">{email}</strong>
            </p>
            <button 
                onClick={() => setSent(false)}
                className="text-xs text-white/30 hover:text-white uppercase tracking-widest transition-colors"
            >
                Intentar con otro email
            </button>
          </div>
        ) : (
          /* Login Form */
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[10px] uppercase tracking-widest text-white/40 font-semibold pl-1"
                >
                  Email Corporativo
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@omakase.restaurant"
                    required
                    className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-white/30 focus:bg-black/40 focus:outline-none transition-all font-light text-sm"
                  />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-white/0 group-focus-within:ring-white/20 transition-all pointer-events-none" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-xs text-center font-medium">
                    {error}
                    </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-white text-black font-medium rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-white/20 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Ingresar al Panel</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-white/20 hover:text-white/60 text-xs transition-colors uppercase tracking-widest"
          >
            Volver al sitio principal
          </Link>
        </div>
      </div>
    </div>
  );
}
