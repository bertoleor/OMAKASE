"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // MOCK: Auto-login / Redirect
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="p-4 bg-white/5 border border-white/10 rounded-full mb-6 animate-pulse">
          <ShieldCheck className="w-12 h-12 text-white/90" strokeWidth={1.2} />
        </div>
        <h1 className="text-2xl font-light tracking-[0.2em] text-white uppercase mb-2">
          OMAKASE
        </h1>
        <p className="text-white/40 mb-8">Accediendo al sistema...</p>
        <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
      </div>
    </div>
  );
}
