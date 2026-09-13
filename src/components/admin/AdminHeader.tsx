"use client";

import { Search, Bell, User, Menu } from "lucide-react";
import { useAdminUIStore } from "@/store/admin-ui-store";
import { useNotificationStore } from "@/store/notification-store";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getUserRole } from "@/lib/auth/roles";

export default function AdminHeader() {
  const { toggleSidebar } = useAdminUIStore();
  const { unreadCount } = useNotificationStore();
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch user data from Supabase Auth
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        // Get name from user_metadata or email
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || null;
        const role = getUserRole(user) ?? "staff";

        setUserName(name);
        setUserRole(role);
      }
    };

    fetchUser();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] || null;
        const role = session.user ? (getUserRole(session.user) ?? "staff") : "staff";

        setUserName(name);
        setUserRole(role);
      } else {
        setUserName(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle search focus - open CommandPalette
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Dispatch custom event to open CommandPalette
    globalThis.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  // Handle search blur with delay to allow click events
  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 200);
  };

  // Get display name and role label
  const displayName = userName || "Invitado";
  const displayRole = userRole
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
    : "Staff";

  return (
    <header className="h-20 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left: Toggle & Search */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <label
          htmlFor="admin-search-input"
          className={`flex items-center bg-white/5 rounded-full px-4 py-2 border transition-all w-96 cursor-text ${
            isSearchFocused
              ? "bg-white/10 border-white/20"
              : "border-white/10 hover:border-white/15"
          }`}
        >
          <Search className="w-4 h-4 text-white/40 mr-3" />
          <input
            id="admin-search-input"
            type="text"
            placeholder="Buscar reserva, cliente o mesa (Cmd+K)"
            aria-label="Buscar reserva"
            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20"
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                globalThis.dispatchEvent(new CustomEvent("open-command-palette"));
              }
            }}
          />
        </label>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <button
          className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          aria-label="Notificaciones"
          title="Notificaciones"
          onClick={() => {
            // Could open a notifications dropdown in the future
          }}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border border-black animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center space-x-3 text-sm border-l border-white/10 pl-4">
          <div className="text-right hidden md:block">
            <div className="text-white font-medium truncate max-w-[150px]">
              {displayName}
            </div>
            <div className="text-white/40 text-xs">{displayRole}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-600 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-white/80" />
          </div>
        </div>
      </div>
    </header>
  );
}
