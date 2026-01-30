"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Save,
  X,
  Loader2,
  MapPin,
  Users,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
  is_active: boolean;
  display_order: number;
}

export default function ZonesPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for new/edit zone
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    capacity_pax: 10,
    is_active: true,
  });

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  if (roleLoading) return null; // Or a loading spinner
  if (!isAdmin) return null; // Should redirect by now

  async function fetchZones() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      slug: zone.slug,
      capacity_pax: zone.capacity_pax,
      is_active: zone.is_active,
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingZone(null);
    setFormData({
      name: "",
      slug: "",
      capacity_pax: 10,
      is_active: true,
    });
  };

  const handleCancel = () => {
    setEditingZone(null);
    setIsCreating(false);
    setFormData({ name: "", slug: "", capacity_pax: 10, is_active: true });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return;

    setSaving(true);
    try {
      const supabase = createClient();

      if (isCreating) {
        // Create new zone
        const { error } = await supabase.from("zones").insert({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
          capacity_pax: formData.capacity_pax,
          is_active: formData.is_active,
          display_order: zones.length + 1,
        });

        if (error) throw error;
      } else if (editingZone) {
        // Update existing zone
        const { error } = await supabase
          .from("zones")
          .update({
            name: formData.name,
            slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
            capacity_pax: formData.capacity_pax,
            is_active: formData.is_active,
          })
          .eq("id", editingZone.id);

        if (error) throw error;
      }

      await fetchZones();
      handleCancel();
    } catch (error) {
      console.error("Error saving zone:", error);
      alert("Error al guardar la zona");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar esta zona? Las reservas existentes podrían verse afectadas.",
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("zones").delete().eq("id", zoneId);
      if (error) throw error;
      await fetchZones();
    } catch (error) {
      console.error("Error deleting zone:", error);
      alert("Error al eliminar la zona");
    }
  };

  const toggleActive = async (zone: Zone) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("zones")
        .update({ is_active: !zone.is_active })
        .eq("id", zone.id);

      if (error) throw error;
      await fetchZones();
    } catch (error) {
      console.error("Error toggling zone:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/settings"
            className="inline-flex items-center text-sm text-white/60 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Link>
          <h1 className="text-3xl font-bold text-white">Gestión de Zonas</h1>
          <p className="text-white/40 mt-1">
            Configura las zonas y capacidad del restaurante
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Zona</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingZone) && (
        <div className="bg-black/30 backdrop-blur-md border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {isCreating ? "Crear Nueva Zona" : "Editar Zona"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Interior - Salón Principal"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="Ej: salon"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="capacity_pax"
                className="block text-sm font-medium text-white/60 mb-2"
              >
                Capacidad (PAX)
              </label>
              <input
                id="capacity_pax"
                type="number"
                min={1}
                value={formData.capacity_pax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity_pax: Number.parseInt(e.target.value) || 1,
                  })
                }
                title="Capacidad en personas"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${formData.is_active ? "bg-green-500" : "bg-gray-600"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-0.5"} mt-0.5`}
                  />
                </div>
                <span className="ml-3 text-white/60">
                  {formData.is_active ? "Activa" : "Inactiva"}
                </span>
              </label>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Zones List */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <div className="divide-y divide-white/10">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${
                !zone.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <GripVertical className="w-5 h-5 text-white/20 cursor-grab" />
                <div className="p-3 rounded-lg bg-white/5">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{zone.name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <code className="text-xs bg-black/30 px-2 py-0.5 rounded text-white/40">
                      {zone.slug}
                    </code>
                    <div className="flex items-center space-x-1 text-white/60">
                      <Users className="w-3 h-3" />
                      <span className="text-sm">{zone.capacity_pax} pax</span>
                    </div>
                    {!zone.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleActive(zone)}
                  className={`p-2 rounded-lg transition-colors ${
                    zone.is_active
                      ? "text-green-400 hover:bg-green-500/10"
                      : "text-gray-400 hover:bg-gray-500/10"
                  }`}
                  title={zone.is_active ? "Desactivar" : "Activar"}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${zone.is_active ? "border-green-400 bg-green-400" : "border-gray-400"}`}
                  />
                </button>
                <button
                  onClick={() => handleEdit(zone)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Editar zona"
                  aria-label="Editar zona"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Eliminar zona"
                  aria-label="Eliminar zona"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {zones.length === 0 && (
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No hay zonas configuradas</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-blue-400 hover:underline"
            >
              Crear primera zona
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
