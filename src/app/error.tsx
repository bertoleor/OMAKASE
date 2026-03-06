"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BUSINESS } from "@/config/business";

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative text-center space-y-8 max-w-md animate-in fade-in duration-700">
        {/* Glass card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl">!</span>
          </div>

          <h1 className="text-2xl font-light text-white uppercase tracking-wider">
            Algo salió mal
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Ocurrió un error inesperado. Podés reintentar o volver al inicio.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-8 py-3 bg-white/5 border border-white/20 rounded-full text-white/80 text-sm uppercase tracking-wider hover:bg-white hover:text-black hover:border-white transition-all duration-300"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-8 py-3 text-white/40 text-sm uppercase tracking-wider hover:text-white transition-colors"
          >
            Ir a {BUSINESS.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
