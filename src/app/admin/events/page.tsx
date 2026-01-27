"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Archive,
  PartyPopper,
  Building,
  History,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

interface Zone {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_type: "restaurant" | "private" | "rental";
  event_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number | null;
  current_guests: number;
  price_per_person: number;
  deposit_required: number;
  zones_enabled: string[];
  blocks_regular_bookings: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: "scheduled" | "active" | "completed" | "cancelled";
  created_at: string;
}

interface EventHistory {
  id: string;
  event_name: string;
  event_date: string;
  event_type: string;
  guests_attended: number;
  revenue: number;
  notes: string | null;
  archived_at: string;
}

interface FormData {
  name: string;
  description: string;
  event_type: "restaurant" | "private" | "rental";
  event_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  price_per_person: number;
  deposit_required: number;
  zones_enabled: string[];
  blocks_regular_bookings: boolean;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  event_type: "restaurant",
  event_date: new Date().toISOString().split("T")[0],
  start_time: "19:00",
  end_time: "23:00",
  max_capacity: 50,
  price_per_person: 0,
  deposit_required: 0,
  zones_enabled: [],
  blocks_regular_bookings: true,
  contact_name: "",
  contact_phone: "",
  contact_email: "",
};

const EVENT_TYPES = {
  restaurant: { label: "Restaurante", icon: Building, color: "blue" },
  private: { label: "Privado", icon: PartyPopper, color: "purple" },
  rental: { label: "Alquiler", icon: Users, color: "amber" },
};

export default function EventsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<EventHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming",
  );
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const [{ data: zonesData }, { data: eventsData }, { data: historyData }] =
        await Promise.all([
          supabase.from("zones").select("id, name").eq("is_active", true),
          supabase
            .from("events")
            .select("*")
            .in("status", ["scheduled", "active"])
            .order("event_date"),
          supabase
            .from("event_history")
            .select("*")
            .order("archived_at", { ascending: false })
            .limit(50),
        ]);

      setZones(zonesData || []);
      setEvents(eventsData || []);
      setHistory(historyData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingEvent(null);
    setFormData({
      ...defaultFormData,
      zones_enabled: zones.map((z) => z.id),
    });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsCreating(false);
    setFormData({
      name: event.name,
      description: event.description || "",
      event_type: event.event_type,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      max_capacity: event.max_capacity || 50,
      price_per_person: event.price_per_person,
      deposit_required: event.deposit_required,
      zones_enabled: event.zones_enabled || [],
      blocks_regular_bookings: event.blocks_regular_bookings,
      contact_name: event.contact_name || "",
      contact_phone: event.contact_phone || "",
      contact_email: event.contact_email || "",
    });
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setIsCreating(false);
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.event_date) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const eventData = {
        name: formData.name,
        description: formData.description || null,
        event_type: formData.event_type,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_capacity: formData.max_capacity,
        price_per_person: formData.price_per_person,
        deposit_required: formData.deposit_required,
        zones_enabled: formData.zones_enabled,
        blocks_regular_bookings: formData.blocks_regular_bookings,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        updated_at: new Date().toISOString(),
      };

      if (isCreating) {
        const { error } = await supabase.from("events").insert(eventData);
        if (error) throw error;
      } else if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);
        if (error) throw error;
      }

      await fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error al guardar el evento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: Event) => {
    if (
      !confirm(`¿Eliminar "${event.name}"? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleArchive = async (event: Event) => {
    const guests = prompt(
      "¿Cuántos invitados asistieron?",
      String(event.current_guests),
    );
    if (guests === null) return;

    const revenue = prompt("Ingreso total del evento:", "0");
    if (revenue === null) return;

    const notes = prompt("Notas finales (opcional):", "");

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("archive_completed_event", {
        p_event_id: event.id,
        p_guests: parseInt(guests) || 0,
        p_revenue: parseFloat(revenue) || 0,
        p_notes: notes || null,
      });

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error archiving event:", error);
      alert("Error al archivar el evento");
    }
  };

  const handleCancel2 = async (event: Event) => {
    if (!confirm(`¿Cancelar "${event.name}"?`)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", event.id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error cancelling event:", error);
    }
  };

  const toggleZone = (zoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      zones_enabled: prev.zones_enabled.includes(zoneId)
        ? prev.zones_enabled.filter((z) => z !== zoneId)
        : [...prev.zones_enabled, zoneId],
    }));
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Eventos</h1>
          <p className="text-white/40 mt-1">
            Crea y administra eventos especiales, alquileres y celebraciones
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "upcoming"
              ? "bg-blue-600 text-white"
              : "bg-black/30 border border-white/10 text-white/60 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Próximos ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "bg-black/30 border border-white/10 text-white/60 hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          Historial ({history.length})
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingEvent) && (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {isCreating ? "Nuevo Evento" : `Editar: ${editingEvent?.name}`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name */}
            <div className="lg:col-span-2">
              <label className="block text-sm text-white/60 mb-1">
                Nombre del Evento
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="Ej: Cata de Sake Premium"
                title="Nombre del Evento"
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm text-white/60 mb-1">Tipo</label>
              <div className="flex gap-2">
                {(
                  Object.keys(EVENT_TYPES) as Array<keyof typeof EVENT_TYPES>
                ).map((type) => {
                  const { label, icon: Icon, color } = EVENT_TYPES[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, event_type: type })
                      }
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border transition-colors text-sm ${
                        formData.event_type === type
                          ? `bg-${color}-600 border-${color}-600 text-white`
                          : "bg-black/30 border-white/10 text-white/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm text-white/60 mb-1">Fecha</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Fecha del evento"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Hora Inicio
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Hora de inicio"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Hora Fin
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Hora de fin"
              />
            </div>

            {/* Max Capacity */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Capacidad Máx.
              </label>
              <input
                type="number"
                value={formData.max_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_capacity: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Capacidad máxima"
              />
            </div>

            {/* Price per person */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Precio/Persona
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="number"
                  value={formData.price_per_person}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_per_person: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                  title="Precio por persona"
                />
              </div>
            </div>

            {/* Deposit */}
            <div>
              <label className="block text-sm text-white/60 mb-1">Seña</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="number"
                  value={formData.deposit_required}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deposit_required: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                  title="Monto de la seña"
                />
              </div>
            </div>

            {/* Description */}
            <div className="lg:col-span-3">
              <label className="block text-sm text-white/60 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white resize-none"
                placeholder="Detalles del evento..."
                title="Descripción del evento"
              />
            </div>

            {/* Zones */}
            <div className="lg:col-span-2">
              <label className="block text-sm text-white/60 mb-1">
                Zonas Habilitadas
              </label>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => toggleZone(zone.id)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
                      formData.zones_enabled.includes(zone.id)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-black/30 border-white/10 text-white/60"
                    }`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Blocks Regular Bookings */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="blocks"
                checked={formData.blocks_regular_bookings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    blocks_regular_bookings: e.target.checked,
                  })
                }
                className="w-4 h-4"
                title="Bloquear reservas normales"
              />
              <label htmlFor="blocks" className="text-sm text-white/80">
                Bloquear reservas normales
              </label>
            </div>

            {/* Contact Info (for private/rental) */}
            {(formData.event_type === "private" ||
              formData.event_type === "rental") && (
              <>
                <div>
                  <label className="block text-sm text-white/60 mb-1">
                    Nombre Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                    title="Nombre del contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                    title="Teléfono del contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                    title="Email del contacto"
                  />
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {activeTab === "upcoming" && (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          {events.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              No hay eventos programados. Crea uno nuevo.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {events.map((event) => {
                const { icon: TypeIcon, color } = EVENT_TYPES[event.event_type];
                return (
                  <div
                    key={event.id}
                    className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                      <TypeIcon className={`w-6 h-6 text-${color}-400`} />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-white">{event.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.event_date).toLocaleDateString(
                            "es-AR",
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.start_time} - {event.end_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.current_guests}/{event.max_capacity}
                        </span>
                        {event.price_per_person > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {event.price_per_person}/persona
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArchive(event)}
                        className="p-2 rounded-lg text-green-400 hover:bg-green-500/10"
                        title="Completar y archivar"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancel2(event)}
                        className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10"
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              No hay eventos en el historial.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{h.event_name}</h3>
                    <p className="text-sm text-white/60">
                      {new Date(h.event_date).toLocaleDateString("es-AR")} •{" "}
                      {h.guests_attended} invitados
                      {h.notes && ` • ${h.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-400">
                      ${h.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/40">
                      {new Date(h.archived_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
