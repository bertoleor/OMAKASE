"use client";

import { BUSINESS } from "@/config/business";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative text-center space-y-8 max-w-md animate-in fade-in duration-700">
        {/* 404 number */}
        <p className="text-[8rem] leading-none font-extralight text-white/10 tracking-tight select-none">
          404
        </p>

        {/* Glass card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4 shadow-2xl">
          <h1 className="text-2xl font-light text-white uppercase tracking-wider">
            Página no encontrada
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            La página que buscás no existe o fue movida.
          </p>
        </div>

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/20 rounded-full text-white/80 text-sm uppercase tracking-wider hover:bg-white hover:text-black hover:border-white transition-all duration-300"
        >
          ← Volver a {BUSINESS.name}
        </Link>
      </div>
    </div>
  );
}
