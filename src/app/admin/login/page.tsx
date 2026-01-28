"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Sign in with password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Successful login - router will middleware protect the rest
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      
      // Friendly error messages
      if (errorMsg === "Invalid login credentials") {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else {
        setError(errorMsg || "Error al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-[0.03] z-0" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-white/90" strokeWidth={1.2} />
          </div>
          <h1 className="text-4xl font-extralight tracking-[0.25em] text-white uppercase mb-2">
            OMAKASE
          </h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-medium">
            Acceso Administrativo · Staff Only
          </p>
        </div>

        {/* GLASSCARD LOGIN */}
        <div className="bg-white/[0.03] backdrop-blur-[24px] border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] uppercase tracking-widest text-white/50 font-semibold pl-1">
                Email Corporativo
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@omakase.restaurant"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition-all font-light text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1">
                <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-white/50 font-semibold">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition-all font-light text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
                <p className="text-red-400 text-xs text-center font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Gradient Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center space-x-2 py-4 relative group/btn overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-[0_12px_24px_-8px_rgba(255,255,255,0.1)]"
            >
              {/* Button Gradient Layer */}
              <div className="absolute inset-0 bg-white group-hover/btn:bg-neutral-100 transition-colors" />
              
              <span className="relative z-10 text-black text-xs font-bold uppercase tracking-[0.2em]">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Ingresar al Panel"
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-10">
          <Link
            href="/"
            className="group inline-flex items-center space-x-2 text-white/20 hover:text-white/60 text-[10px] transition-all uppercase tracking-[0.2em] font-medium"
          >
            <div className="w-4 h-px bg-white/10 group-hover:w-8 group-hover:bg-white/30 transition-all" />
            <span>Volver al sitio</span>
            <div className="w-4 h-px bg-white/10 group-hover:w-8 group-hover:bg-white/30 transition-all" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
