"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Calendar, X, Loader2, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  zone_id?: string; // null = all zones
}

interface Zone {
  id: string;
  name: string;
  slug: string;
}

export default function BlockedDatesManager() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
    zone_id: "", // empty = all zones
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const supabase = createClient();

      const [{ data: datesData }, { data: zonesData }] = await Promise.all([
        supabase.from("blocked_dates").select("*").order("date"),
        supabase.from("zones").select("*").eq("is_active", true),
      ]);

      setBlockedDates(datesData || []);
      setZones(zonesData || []);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!formData.date) return;

    setSaving(true);
    setAddError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("blocked_dates").insert({
        date: formData.date,
        reason: formData.reason || null,
        zone_id: formData.zone_id || null,
      });

      if (error) throw error;
      await fetchData();
      setIsAdding(false);
      setFormData({ date: "", reason: "", zone_id: "" });
    } catch (error) {
      console.error("Error adding blocked date:", error);
      setAddError("Error al bloquear fecha. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este bloqueo?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error deleting blocked date:", error);
    }
  };

  const getZoneName = (zoneId?: string) => {
    if (!zoneId) return "Todas las zonas";
    return zones.find((z) => z.id === zoneId)?.name || "Unknown";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Ban className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Días Bloqueados
            </h2>
            <p className="text-sm text-white/60">
              Bloquea fechas para eventos privados o vacaciones
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Bloquear Fecha</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 border-b border-white/10 bg-red-500/5">
          {addError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {addError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Fecha
                <div className="mt-2">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    aria-label="Fecha a bloquear"
                  />
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Zona (opcional)
                <div className="mt-2">
                  <select
                    value={formData.zone_id}
                    onChange={(e) =>
                      setFormData({ ...formData, zone_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-red-500 focus:outline-none"
                    aria-label="Seleccionar zona"
                  >
                    <option value="">Todas las zonas</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Motivo (opcional)
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Ej: Evento privado"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </label>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              disabled={saving || !formData.date}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Bloquear</span>
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setFormData({ date: "", reason: "", zone_id: "" });
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Blocked Dates List */}
      <div className="divide-y divide-white/5">
        {blockedDates.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No hay fechas bloqueadas</p>
          </div>
        ) : (
          blockedDates.map((item) => (
            <div
              key={item.id}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Ban className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-white capitalize">
                    {formatDate(item.date)}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-white/60">
                    <span>{getZoneName(item.zone_id)}</span>
                    {item.reason && (
                      <>
                        <span>•</span>
                        <span>{item.reason}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                title="Eliminar bloqueo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
