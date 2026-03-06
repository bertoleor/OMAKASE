"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Loader2,
  Calendar,
  Users,
  MapPin,
  User,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
}

interface BookingFormProps {
  readonly zones: Zone[];
  readonly date?: string;
  readonly onClose: () => void;
  readonly onSuccess: (bookingId: string) => void;
}

const TIME_SLOTS = [
  "19:00",
  "19:15",
  "19:30",
  "19:45",
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
  "21:45",
  "22:00",
  "22:15",
  "22:30",
  "22:45",
  "23:00",
];

export default function BookingForm({
  zones,
  date: initialDate,
  onClose,
  onSuccess,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    booking_date: initialDate || new Date().toISOString().split("T")[0],
    booking_time: "20:00",
    pax: 2,
    zone_slug: zones[0]?.slug || "",
    notes: "",
    auto_confirm: true,
  });

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call API to create booking
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customer_name,
          customerEmail: formData.customer_email,
          customerPhone: formData.customer_phone,
          date: formData.booking_date,
          time: formData.booking_time,
          pax: formData.pax,
          zone: formData.zone_slug,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la reserva");
      }

      // If auto-confirm is checked, update status
      if (formData.auto_confirm && data.bookingId) {
        await fetch("/api/booking/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: data.bookingId,
            status: "confirmed",
          }),
        });
      }

      onSuccess(data.bookingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      />

      {/* Modal */}
      <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Plus className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Nueva Reserva</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Datos del Cliente</span>
            </h3>
            <div>
              <label
                htmlFor="customer_name"
                className="block text-sm text-white/60 mb-1"
              >
                Nombre
              </label>
              <input
                id="customer_name"
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => updateField("customer_name", e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customer_phone"
                  className="block text-sm text-white/60 mb-1"
                >
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="customer_phone"
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) =>
                      updateField("customer_phone", e.target.value)
                    }
                    placeholder="+34 600 000 000"
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="customer_email"
                  className="block text-sm text-white/60 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="customer_email"
                    type="email"
                    required
                    value={formData.customer_email}
                    onChange={(e) =>
                      updateField("customer_email", e.target.value)
                    }
                    placeholder="email@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Detalles de la Reserva</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="booking_date"
                  className="block text-sm text-white/60 mb-1"
                >
                  Fecha
                </label>
                <input
                  id="booking_date"
                  type="date"
                  required
                  value={formData.booking_date}
                  onChange={(e) => updateField("booking_date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="booking_time"
                  className="block text-sm text-white/60 mb-1"
                >
                  Hora
                </label>
                <select
                  id="booking_time"
                  value={formData.booking_time}
                  onChange={(e) => updateField("booking_time", e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  {TIME_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="pax"
                  className="block text-sm text-white/60 mb-1"
                >
                  Comensales
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="pax"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formData.pax}
                    onChange={(e) =>
                      updateField("pax", Number.parseInt(e.target.value) || 1)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="zone"
                  className="block text-sm text-white/60 mb-1"
                >
                  Zona
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    id="zone"
                    value={formData.zone_slug}
                    onChange={(e) => updateField("zone_slug", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.slug}>
                        {zone.name} ({zone.capacity_pax} pax)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm text-white/60 mb-1 flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Notas (opcional)</span>
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Alergias, celebraciones, preferencias..."
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Auto-confirm */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.auto_confirm}
              onChange={(e) => updateField("auto_confirm", e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors ${formData.auto_confirm ? "bg-blue-500" : "bg-gray-600"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${formData.auto_confirm ? "translate-x-5" : "translate-x-0.5"} mt-0.5`}
              />
            </div>
            <span className="text-sm text-white/60">
              Confirmar automáticamente
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Crear Reserva</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
