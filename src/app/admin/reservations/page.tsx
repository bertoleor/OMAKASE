"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, RefreshCw, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReservationDetail from "@/components/admin/reservations/ReservationDetail";
import BookingForm from "@/components/admin/reservations/BookingForm";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  status: string;
  notes?: string;
  duration_minutes?: number;
  created_at?: string;
}

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "seated", label: "Sentados" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "no_show", label: "No Show" },
];

export default function ReservationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "",
    zone: "",
    search: "",
  });



  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch zones
      const { data: zonesData } = await supabase
        .from("zones")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      setZones(zonesData || []);

      // Build query
      let query = supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", filters.date)
        .order("booking_time");

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.zone) {
        query = query.eq("zone_id", filters.zone);
      }

      const { data: bookingsData } = await query;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.status, filters.zone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter by search locally
  const filteredBookings = bookings.filter((b) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      b.customer_name.toLowerCase().includes(searchLower) ||
      b.customer_phone.includes(filters.search)
    );
  });

  const handleAction = async (bookingId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      await fetchData();

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Error al actualizar la reserva");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleBookingCreated = async (bookingId: string) => {
    setShowCreateForm(false);
    await fetchData();
    // Optionally open the detail view
    const newBooking = bookings.find((b) => b.id === bookingId);
    if (newBooking) {
      setSelectedBooking(newBooking);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reservas</h1>
          <p className="text-white/40 mt-1">
            Gestiona todas las reservas del restaurante
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date */}
          <div className="flex-1">
            <label htmlFor="filter-date" className="sr-only">
              Fecha
            </label>
            <input
              id="filter-date"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div className="flex-1">
            <label htmlFor="filter-status" className="sr-only">
              Estado
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div className="flex-1">
            <label htmlFor="filter-zone" className="sr-only">
              Zona
            </label>
            <select
              id="filter-zone"
              value={filters.zone}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas las zonas</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-3 bg-black/30 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refrescar"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center space-x-4 text-sm text-white/60">
        <span>{filteredBookings.length} reservas</span>
        <span>•</span>
        <span>
          {filteredBookings.reduce((sum, b) => sum + b.pax, 0)} pax totales
        </span>
        <span>•</span>
        <span>
          {filteredBookings.filter((b) => b.status === "confirmed").length}{" "}
          confirmadas
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      ) : (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/20 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Zona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  PAX
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleBookingClick(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    {booking.booking_time}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white">{booking.customer_name}</p>
                      <p className="text-xs text-white/60">
                        {booking.customer_phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white/80">
                    {zones.find((z) => z.id === booking.zone_id)?.name ||
                      "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {booking.pax}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <QuickActions
                      booking={booking}
                      onAction={handleAction}
                      loading={actionLoading}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBookings.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-white/40">
                No hay reservas para estos filtros
              </p>
            </div>
          )}
        </div>
      )}

      {/* Detail Slide-over */}
      {selectedBooking && (
        <ReservationDetail
          booking={selectedBooking}
          zones={zones}
          onClose={() => setSelectedBooking(null)}
          onAction={handleAction}
          isLoading={actionLoading}
        />
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <BookingForm
          zones={zones}
          date={filters.date}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleBookingCreated}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    confirmed: { bg: "bg-blue-500/20", text: "text-blue-400" },
    seated: { bg: "bg-green-500/20", text: "text-green-400" },
    completed: { bg: "bg-gray-500/20", text: "text-gray-400" },
    cancelled: { bg: "bg-red-500/20", text: "text-red-400" },
    no_show: { bg: "bg-red-500/20", text: "text-red-400" },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}
    >
      {status}
    </span>
  );
}

function QuickActions({
  booking,
  onAction,
  loading,
}: {
  booking: Booking;
  onAction: (id: string, status: string) => void;
  loading: boolean;
}) {
  const actions = [];

  if (booking.status === "pending") {
    actions.push({
      label: "Confirmar",
      status: "confirmed",
      color: "text-blue-400",
    });
  }
  if (booking.status === "confirmed") {
    actions.push({
      label: "Sentar",
      status: "seated",
      color: "text-green-400",
    });
  }
  if (booking.status === "seated") {
    actions.push({
      label: "Completar",
      status: "completed",
      color: "text-gray-400",
    });
  }

  if (actions.length === 0) return null;

  return (
    <div
      className="flex justify-end space-x-2"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.status}
          onClick={() => onAction(booking.id, action.status)}
          disabled={loading}
          className={`px-3 py-1 text-xs font-medium ${action.color} hover:underline disabled:opacity-50`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
