"use client";

import { Search, Bell, User } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="h-20 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10 w-96 focus-within:bg-white/10 focus-within:border-white/20 transition-all">
        <Search className="w-4 h-4 text-white/40 mr-3" />
        <input
          type="text"
          placeholder="Buscar reserva, cliente o mesa (Cmd+K)"
          className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <button
          className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
        </button>

        <div className="flex items-center space-x-3 text-sm border-l border-white/10 pl-4">
          <div className="text-right hidden md:block">
            <div className="text-white font-medium">Lucía M.</div>
            <div className="text-white/40 text-xs">Maître Manager</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-600 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-white/80" />
          </div>
        </div>
      </div>
    </header>
  );
}
