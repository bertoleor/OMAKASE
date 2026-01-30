"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Settings,
  BarChart3,
  Layout,
  LogOut,
  Menu,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUIStore } from "@/store/admin-ui-store";
import { useUserRole } from "@/hooks/useUserRole";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/admin/dashboard",
    role: "all",
  },
  {
    icon: CalendarDays,
    label: "Calendario",
    href: "/admin/calendar",
    role: "all",
  },
  {
    icon: UtensilsCrossed,
    label: "Reservas",
    href: "/admin/reservations",
    role: "all",
  },
  { icon: Layout, label: "Plano", href: "/admin/floorplan", role: "all" },
  { icon: PartyPopper, label: "Eventos", href: "/admin/events", role: "admin" },
  { icon: BarChart3, label: "Reportes", href: "/admin/reports", role: "admin" },
  {
    icon: Settings,
    label: "Configuración",
    href: "/admin/settings",
    role: "admin",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useAdminUIStore();
  const { isAdmin, loading } = useUserRole();

  // Filter items based on role
  const filteredItems = menuItems.filter((item) => {
    if (loading) return true; // Show all (or skeletons) while loading
    if (item.role === "all") return true;
    if (item.role === "admin") return isAdmin;
    return true;
  });

  return (
    <>
      {/* Mobile Toggle Button (Visible only on mobile) */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-black/50 backdrop-blur rounded-lg border border-white/10 text-white"
        aria-label="Toggle Menu"
        title="Toggle Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay */}
      <button
        type="button"
        className={cn(
          "fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] transition-opacity duration-300 w-full h-full border-0 cursor-default",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close Sidebar Helper"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 border-r border-white/10 bg-black/95 backdrop-blur-2xl flex flex-col z-[60] transition-transform duration-300 shadow-2xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Branding */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <h1 className="text-xl font-bold tracking-[0.2em] text-white whitespace-nowrap">
            OMAKASE
            {isAdmin && (
              <span className="text-[10px] bg-red-500 px-1 rounded ml-2 align-top">
                ADMIN
              </span>
            )}
            {!isAdmin && !loading && (
              <span className="text-[10px] bg-blue-500 px-1 rounded ml-2 align-top">
                STAFF
              </span>
            )}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
          {loading
            ? // Loading Skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-10 w-full bg-white/5 rounded-xl animate-pulse"
                />
              ))
            : filteredItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        : "text-white/50 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />
                    )}
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                        isActive
                          ? "text-blue-400"
                          : "text-white/50 group-hover:text-white",
                      )}
                    />
                    <span className="ml-3 font-medium tracking-wide">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
        </nav>

        {/* Footer / User */}
        <div className="p-4 border-t border-white/5">
          <button
            className="flex items-center w-full px-4 py-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap space-x-3"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
