"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Clock,
  Calendar,
  Loader2,
  Store,
  Users,
  FileText,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

interface Settings {
  id: string;
  default_duration_minutes: number;
  gap_minutes: number;
  max_advance_days: number;
  opening_time: string;
  closing_time: string;
  // New fields
  max_pax_per_booking: number;
  min_advance_minutes: number;
  terms_and_conditions: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_instagram: string;
  social_facebook: string;
}

export default function SettingsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  if (roleLoading) return null;
  if (!isAdmin) return null;

  async function fetchSettings() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Error cargando configuración" });
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurant_settings")
        .update({
          default_duration_minutes: settings.default_duration_minutes,
          gap_minutes: settings.gap_minutes,
          max_advance_days: settings.max_advance_days,
          opening_time: settings.opening_time,
          closing_time: settings.closing_time,
          max_pax_per_booking: settings.max_pax_per_booking,
          min_advance_minutes: settings.min_advance_minutes,
          terms_and_conditions: settings.terms_and_conditions,
          contact_email: settings.contact_email,
          contact_phone: settings.contact_phone,
          address: settings.address,
          social_instagram: settings.social_instagram,
          social_facebook: settings.social_facebook,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;
      setMessage({
        type: "success",
        text: "Configuración guardada correctamente",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Error al guardar configuración" });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">No se pudo cargar la configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
          <p className="text-white/40 mt-1">
            Ajusta los parámetros del sistema de reservas
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Configuration */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Horarios de Servicio
              </h2>
              <p className="text-sm text-white/60">
                Configura las horas de operación
              </p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="opening_time"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  Hora Apertura
                </label>
                <input
                  id="opening_time"
                  type="time"
                  value={settings.opening_time}
                  onChange={(e) =>
                    updateSetting("opening_time", e.target.value)
                  }
                  title="Hora de apertura"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="closing_time"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  Hora Cierre
                </label>
                <input
                  id="closing_time"
                  type="time"
                  value={settings.closing_time}
                  onChange={(e) =>
                    updateSetting("closing_time", e.target.value)
                  }
                  title="Hora de cierre"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Rules - NEW: Replaces simple duration/advance */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Reglas de Reserva
              </h2>
              <p className="text-sm text-white/60">Límites y restricciones</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="max_pax"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  MAX Comensales
                </label>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-white/40" />
                  <input
                    id="max_pax"
                    type="number"
                    min={1}
                    max={50}
                    value={settings.max_pax_per_booking || 10}
                    onChange={(e) =>
                      updateSetting(
                        "max_pax_per_booking",
                        parseInt(e.target.value) || 10,
                      )
                    }
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500"
                    title="Máximo de personas por reserva"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="gap"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  Gap (min)
                </label>
                <input
                  id="gap"
                  type="number"
                  min={0}
                  step={5}
                  value={settings.gap_minutes}
                  onChange={(e) =>
                    updateSetting("gap_minutes", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500"
                  title="Tiempo entre turnos"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Duración Estándar (min)
              </label>
              <div className="flex gap-2">
                {[60, 90, 120, 150].map((mins) => (
                  <button
                    key={mins}
                    onClick={() =>
                      updateSetting("default_duration_minutes", mins)
                    }
                    className={`flex-1 py-2 text-sm rounded-lg border ${settings.default_duration_minutes === mins ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-white/5 border-white/10 text-white/60"}`}
                  >
                    {mins}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="max_adv"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  Max Antelación (días)
                </label>
                <input
                  id="max_adv"
                  type="number"
                  value={settings.max_advance_days}
                  onChange={(e) =>
                    updateSetting(
                      "max_advance_days",
                      parseInt(e.target.value) || 30,
                    )
                  }
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500"
                  title="Días máximos de antelación"
                />
              </div>
              <div>
                <label
                  htmlFor="min_adv"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  Min Antelación (min)
                </label>
                <input
                  id="min_adv"
                  type="number"
                  step={15}
                  value={settings.min_advance_minutes || 60}
                  onChange={(e) =>
                    updateSetting(
                      "min_advance_minutes",
                      parseInt(e.target.value) || 60,
                    )
                  }
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500"
                  title="Minutos mínimos de antelación"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Info - NEW SECTION */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Store className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Información del Negocio
              </h2>
              <p className="text-sm text-white/60">Contacto y Redes Sociales</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Contacto
              </label>
              <input
                type="email"
                value={settings.contact_email || ""}
                onChange={(e) => updateSetting("contact_email", e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-orange-500"
                placeholder="contacto@restaurante.com"
                title="Email de contacto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Teléfono
              </label>
              <input
                type="text"
                value={settings.contact_phone || ""}
                onChange={(e) => updateSetting("contact_phone", e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-orange-500"
                placeholder="+34 600 ..."
                title="Teléfono de contacto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Dirección
              </label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => updateSetting("address", e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-orange-500"
                placeholder="Calle Principal 123..."
                title="Dirección del local"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1 flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> Instagram URL
                </label>
                <input
                  type="text"
                  value={settings.social_instagram || ""}
                  onChange={(e) =>
                    updateSetting("social_instagram", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-white focus:border-pink-500"
                  placeholder="https://instagram.com/..."
                  title="Link de Instagram"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1 flex items-center gap-1">
                  <Facebook className="w-3 h-3" /> Facebook URL
                </label>
                <input
                  type="text"
                  value={settings.social_facebook || ""}
                  onChange={(e) =>
                    updateSetting("social_facebook", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-white focus:border-blue-600"
                  placeholder="https://facebook.com/..."
                  title="Link de Facebook"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Legal / Terms - NEW SECTION */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-500/10">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Legales</h2>
              <p className="text-sm text-white/60">Términos y Condiciones</p>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-white/60 mb-2">
              Texto de Términos y Condiciones
            </label>
            <textarea
              rows={10}
              value={settings.terms_and_conditions || ""}
              onChange={(e) =>
                updateSetting("terms_and_conditions", e.target.value)
              }
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white/80 focus:border-gray-500 text-sm resize-none"
              placeholder="Introduce aquí los términos y condiciones que el cliente debe aceptar..."
              title="Edición de términos y condiciones"
            />
            <p className="text-xs text-white/40 mt-2">
              Este texto se mostrará en el último paso de la reserva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
