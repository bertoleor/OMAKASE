"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Clock,
  Table2,
  Shield,
  Loader2,
  Store,
  Mail,
  Phone,
  Globe,
  MapPin,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Settings {
  id: string;
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
        .select("id, contact_email, contact_phone, address, social_instagram, social_facebook")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
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
        text: "Información guardada correctamente",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Error al guardar información" });
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

  const menuItems = [
    {
      label: "Horarios",
      description: "Gestionar días y horas de apertura",
      icon: Clock,
      href: "/admin/settings/schedule",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Zonas",
      description: "Configurar áreas del restaurante",
      icon: MapPin,
      href: "/admin/settings/zones",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Mesas",
      description: "Organizar distribución de mesas",
      icon: Table2,
      href: "/admin/settings/tables",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Equipo",
      description: "Administrar usuarios y permisos",
      icon: Shield,
      href: "/admin/settings/staff",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-white/40 mt-1">
          Administra tu restaurante y preferencias
        </p>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex items-center p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-shine`}
            />
            
            <div className={`p-4 rounded-xl mr-5 ${item.bgColor} ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
            
            <div className="flex-1 relative z-10">
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                {item.label}
              </h3>
              <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                {item.description}
              </p>
            </div>
            
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 text-white/20 group-hover:text-white transition-all duration-300 -mr-2 group-hover:mr-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Business Info Section */}
      <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Store className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Información del Negocio
              </h2>
              <p className="text-sm text-white/60">
                Contacto y Redes Sociales
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span>Guardar</span>
          </button>
        </div>

        {message && (
            <div
            className={`mx-4 mt-4 p-3 rounded-lg text-sm border ${
                message.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
            >
            {message.text}
            </div>
        )}

        <div className="p-6 space-y-4">
          {settings ? (
            <>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Contacto
                </label>
                <input
                  type="email"
                  value={settings.contact_email || ""}
                  onChange={(e) => updateSetting("contact_email", e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-pink-500 focus:outline-none transition-colors"
                  placeholder="contacto@restaurante.com"
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
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-pink-500 focus:outline-none transition-colors"
                  placeholder="+34 600 ..."
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
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-pink-500 focus:outline-none transition-colors"
                  placeholder="Calle Principal 123..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Instagram URL
                  </label>
                  <input
                    type="text"
                    value={settings.social_instagram || ""}
                    onChange={(e) =>
                      updateSetting("social_instagram", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-white focus:border-pink-500 focus:outline-none transition-colors"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Facebook URL
                  </label>
                  <input
                    type="text"
                    value={settings.social_facebook || ""}
                    onChange={(e) =>
                      updateSetting("social_facebook", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-white focus:border-blue-600 focus:outline-none transition-colors"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
            </>
          ) : (
             <div className="text-center text-white/40 py-4">No se pudo cargar la información</div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button
        className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Cerrar Sesión</span>
      </button>
    </div>
  );
}
