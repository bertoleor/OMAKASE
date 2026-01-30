"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Settings,
  MapPin,
  BarChart3,
  Layout,
  LogOut,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight,
  Table2,
  Clock,
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
  { icon: MapPin, label: "Zonas", href: "/admin/zones", role: "admin" },
  { icon: Table2, label: "Mesas", href: "/admin/tables", role: "admin" },
  { icon: Clock, label: "Horarios", href: "/admin/schedule", role: "admin" },
  { icon: PartyPopper, label: "Eventos", href: "/admin/events", role: "admin" },
  { icon: BarChart3, label: "Reportes", href: "/admin/reports", role: "admin" },
  { icon: Shield, label: "Equipo", href: "/admin/staff", role: "admin" },
  { icon: Shield, label: "Equipo", href: "/admin/staff", role: "admin" },
  {
    icon: Settings,
    label: "Configuración",
    href: "/admin/settings",
    role: "admin",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useAdminUIStore();
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

      {/* Sidebar Overlay (Mobile) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setSidebarOpen(false);
          }
        }}
        aria-label="Close Sidebar Helper"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 h-full border-r border-white/10 bg-black/90 backdrop-blur-xl flex flex-col z-[60] transition-all duration-300",
          isSidebarOpen ? "md:w-64" : "md:w-20",
          isSidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Branding & Toggle */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/5 relative">
          <div
            className={cn(
              "flex items-center justify-center w-full transition-opacity duration-300",
              !isSidebarOpen && "md:opacity-0 hidden md:flex",
            )}
          >
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

          <div
            className={cn(
              "absolute left-0 right-0 flex items-center justify-center transition-opacity duration-300",
              isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100",
              "hidden md:flex",
            )}
          >
            <h1 className="text-xl font-bold tracking-[0.2em] text-white">M</h1>
          </div>

          <button
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-neutral-800 border border-white/10 rounded-full items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden relative">
          {loading
            ? // Loading Skeletons
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
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
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap",
                      isSidebarOpen
                        ? "justify-start space-x-3"
                        : "justify-center",
                      isActive
                        ? "bg-white text-black font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        : "text-white/60 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive
                          ? "text-black"
                          : "text-white/60 group-hover:text-white",
                      )}
                    />
                    <span
                      className={cn(
                        "transition-opacity duration-300",
                        isSidebarOpen ? "opacity-100" : "opacity-0 md:hidden",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
        </nav>

        {/* Footer / User */}
        <div className="p-4 border-t border-white/5">
          <button
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap",
              isSidebarOpen ? "justify-start space-x-3" : "justify-center",
            )}
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                "transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 md:hidden",
              )}
            >
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
