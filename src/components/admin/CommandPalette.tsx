"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Users,
  MapPin,
  BarChart3,
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  Command,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CommandItem {
  id: string;
  type: "action" | "navigation" | "search_result";
  icon: React.ElementType;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  status: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Base commands
  const baseCommands: CommandItem[] = [
    {
      id: "new-booking",
      type: "action",
      icon: Plus,
      label: "Nueva Reserva",
      description: "Crear una nueva reserva manual",
      shortcut: "⌘N",
      action: () => {
        router.push("/admin/reservations");
        setIsOpen(false);
      },
    },
    {
      id: "nav-dashboard",
      type: "navigation",
      icon: LayoutDashboard,
      label: "Ir a Dashboard",
      action: () => {
        router.push("/admin/dashboard");
        setIsOpen(false);
      },
    },
    {
      id: "nav-reservations",
      type: "navigation",
      icon: UtensilsCrossed,
      label: "Ir a Reservas",
      action: () => {
        router.push("/admin/reservations");
        setIsOpen(false);
      },
    },
    {
      id: "nav-zones",
      type: "navigation",
      icon: MapPin,
      label: "Ir a Zonas",
      action: () => {
        router.push("/admin/zones");
        setIsOpen(false);
      },
    },
    {
      id: "nav-reports",
      type: "navigation",
      icon: BarChart3,
      label: "Ir a Reportes",
      action: () => {
        router.push("/admin/reports");
        setIsOpen(false);
      },
    },
    {
      id: "nav-settings",
      type: "navigation",
      icon: Settings,
      label: "Ir a Configuración",
      action: () => {
        router.push("/admin/settings");
        setIsOpen(false);
      },
    },
  ];

  // Filter commands based on search
  const filteredCommands = baseCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Search bookings when typing
  useEffect(() => {
    const fetchBookings = async () => {
      if (search.length < 2) {
        setSearchResults([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, customer_name, customer_phone, booking_date, booking_time, status",
        )
        .or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
        .order("booking_date", { ascending: false })
        .limit(5);

      setSearchResults(data || []);
    };

    const debounce = setTimeout(fetchBookings, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      // Cmd+N for new booking
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !isOpen) {
        e.preventDefault();
        router.push("/admin/reservations");
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, router]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSearch("");
        setSelectedIndex(0);
      }, 0);
    }
  }, [isOpen]);

  // Handle navigation
  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = filteredCommands.length + searchResults.length;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex < filteredCommands.length) {
          filteredCommands[selectedIndex].action();
        } else {
          const booking =
            searchResults[selectedIndex - filteredCommands.length];
          if (booking) {
            router.push(`/admin/reservations?id=${booking.id}`);
            setIsOpen(false);
          }
        }
      }
    },
    [filteredCommands, searchResults, selectedIndex, router],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        role="presentation"
        onClick={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
      />

      {/* Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 animate-fade-in">
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-white/10">
            <Search className="w-5 h-5 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyNav}
              placeholder="Buscar reservas, comandos..."
              className="flex-1 px-4 py-4 bg-transparent text-white placeholder-white/40 focus:outline-none"
            />
            <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded text-xs text-white/40">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Commands */}
            {filteredCommands.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-white/40 uppercase tracking-wider px-3 py-2">
                  Comandos
                </p>
                {filteredCommands.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      selectedIndex === i ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <cmd.icon className="w-4 h-4 text-white/60" />
                      <div className="text-left">
                        <p className="text-sm text-white">{cmd.label}</p>
                        {cmd.description && (
                          <p className="text-xs text-white/40">
                            {cmd.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider px-3 py-2">
                  Reservas
                </p>
                {searchResults.map((booking, i) => {
                  const idx = filteredCommands.length + i;
                  return (
                    <button
                      key={booking.id}
                      onClick={() => {
                        router.push(`/admin/reservations?id=${booking.id}`);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        selectedIndex === idx
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-white/60" />
                        <div className="text-left">
                          <p className="text-sm text-white">
                            {booking.customer_name}
                          </p>
                          <p className="text-xs text-white/40">
                            {booking.booking_date} {booking.booking_time} •{" "}
                            {booking.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {search &&
              filteredCommands.length === 0 &&
              searchResults.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-white/40">No se encontraron resultados</p>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center space-x-4">
              <span>↑↓ para navegar</span>
              <span>↵ para seleccionar</span>
              <span>esc para cerrar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
