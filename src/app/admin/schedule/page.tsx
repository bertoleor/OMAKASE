"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Clock,
  Calendar,
  DollarSign,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DaySchedule {
  id: string;
  day_of_week: number;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  deposit_amount: number;
  notes: string | null;
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

export default function SchedulePage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("weekly_schedule")
          .select("*")
          .order("day_of_week");

        if (error) throw error;
        setSchedule(data || []);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setMessage({ type: "error", text: "Error cargando horarios" });
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  const updateDay = (
    dayOfWeek: number,
    field: keyof DaySchedule,
    value: string | number | boolean,
  ) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      for (const day of schedule) {
        const { error } = await supabase
          .from("weekly_schedule")
          .update({
            is_open: day.is_open,
            opening_time: day.opening_time,
            closing_time: day.closing_time,
            deposit_amount: day.deposit_amount,
            notes: day.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", day.id);

        if (error) throw error;
      }

      setMessage({ type: "success", text: "Horarios guardados correctamente" });
    } catch (error) {
      console.error("Error saving schedule:", error);
      setMessage({ type: "error", text: "Error al guardar horarios" });
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold text-white">
            Configuración Semanal
          </h1>
          <p className="text-white/40 mt-1">
            Define horarios, días abiertos y precios de reserva por día
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Cambios
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Schedule Grid */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Horario Semanal</h2>
        </div>

        <div className="divide-y divide-white/5">
          {schedule.map((day) => (
            <div
              key={day.id}
              className={`p-4 transition-colors ${
                !day.is_open ? "bg-white/5 opacity-60" : ""
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                {/* Day Name + Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateDay(day.day_of_week, "is_open", !day.is_open)
                    }
                    className={`p-1 transition-colors ${
                      day.is_open ? "text-green-400" : "text-white/40"
                    }`}
                  >
                    {day.is_open ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                  <span
                    className={`font-medium ${
                      day.is_open ? "text-white" : "text-white/50"
                    }`}
                  >
                    {DAY_NAMES[day.day_of_week]}
                  </span>
                </div>

                {/* Opening Time */}
                <div>
                  <label className="block text-xs text-white/40 mb-1">
                    Apertura
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    <input
                      type="time"
                      value={day.opening_time}
                      onChange={(e) =>
                        updateDay(
                          day.day_of_week,
                          "opening_time",
                          e.target.value,
                        )
                      }
                      disabled={!day.is_open}
                      className="px-2 py-1 bg-black/30 border border-white/10 rounded text-white text-sm disabled:opacity-50"
                      title="Hora de apertura"
                    />
                  </div>
                </div>

                {/* Closing Time */}
                <div>
                  <label className="block text-xs text-white/40 mb-1">
                    Cierre
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    <input
                      type="time"
                      value={day.closing_time}
                      onChange={(e) =>
                        updateDay(
                          day.day_of_week,
                          "closing_time",
                          e.target.value,
                        )
                      }
                      disabled={!day.is_open}
                      className="px-2 py-1 bg-black/30 border border-white/10 rounded text-white text-sm disabled:opacity-50"
                      title="Hora de cierre"
                    />
                  </div>
                </div>

                {/* Deposit Amount */}
                <div>
                  <label className="block text-xs text-white/40 mb-1">
                    Precio Reserva
                  </label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <input
                      type="number"
                      value={day.deposit_amount}
                      onChange={(e) =>
                        updateDay(
                          day.day_of_week,
                          "deposit_amount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      min={0}
                      className="w-20 px-2 py-1 bg-black/30 border border-white/10 rounded text-white text-sm disabled:opacity-50"
                      title="Precio de reserva"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-white/40 mb-1">
                    Notas
                  </label>
                  <input
                    type="text"
                    value={day.notes || ""}
                    onChange={(e) =>
                      updateDay(day.day_of_week, "notes", e.target.value)
                    }
                    placeholder={
                      !day.is_open
                        ? "Motivo de cierre..."
                        : "Notas especiales..."
                    }
                    className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-white text-sm placeholder:text-white/30"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-2">
            Días Abiertos
          </h3>
          <p className="text-2xl font-bold text-white">
            {schedule.filter((d) => d.is_open).length}{" "}
            <span className="text-sm text-white/40">de 7</span>
          </p>
        </div>
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-2">
            Precio Promedio
          </h3>
          <p className="text-2xl font-bold text-green-400">
            $
            {Math.round(
              schedule
                .filter((d) => d.is_open)
                .reduce((sum, d) => sum + d.deposit_amount, 0) /
                Math.max(1, schedule.filter((d) => d.is_open).length),
            )}
          </p>
        </div>
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-2">
            Precio Máximo
          </h3>
          <p className="text-2xl font-bold text-amber-400">
            ${Math.max(...schedule.map((d) => d.deposit_amount))}
          </p>
        </div>
      </div>
    </div>
  );
}
