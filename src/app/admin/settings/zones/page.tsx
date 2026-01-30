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

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Zone {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
    description: "",
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

  if (roleLoading) return null;
  if (!isAdmin) return null;

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
      description: zone.description || "",
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
      description: "",
      capacity_pax: 10,
      is_active: true,
    });
  };

  const handleCancel = () => {
    setEditingZone(null);
    setIsCreating(false);
    setFormData({
      name: "",
      slug: "",
      description: "",
      capacity_pax: 10,
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return;

    setSaving(true);
    try {
      const supabase = createClient();

      if (isCreating) {
        const { error } = await supabase.from("zones").insert({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
          description: formData.description,
          capacity_pax: formData.capacity_pax,
          is_active: formData.is_active,
          display_order: zones.length + 1,
        });

        if (error) throw error;
      } else if (editingZone) {
        const { error } = await supabase
          .from("zones")
          .update({
            name: formData.name,
            slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
            description: formData.description,
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
        "¿Estás seguro de eliminar esta zona? Las reservas existentes podrían verse afectadas."
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/admin/settings"
            className="inline-flex items-center text-sm text-white/60 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a Configuración
          </Link>
          <h1 className="text-3xl font-bold text-white">Gestión de Zonas</h1>
          <p className="text-white/40 mt-1">
            Configura las zonas y capacidad del restaurante
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingZone) && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle>
              {isCreating ? "Crear Nueva Zona" : "Editar Zona"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Interior - Salón Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="Ej: salon"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Descripción (Opcional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción breve de la zona para mostrar en reservas..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_pax">Capacidad (PAX)</Label>
                <Input
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
                />
              </div>
              <div className="flex items-center space-x-3 pt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked,
                      })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.is_active ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        formData.is_active ? "translate-x-6" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </div>
                  <span className="ml-3 text-white/60 font-medium">
                    {formData.is_active ? "Activa" : "Inactiva"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones List */}
      <Card>
        <div className="divide-y divide-white/10">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/5 transition-colors gap-4 ${
                !zone.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <GripVertical className="w-5 h-5 text-white/20 cursor-grab" />
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {zone.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {zone.slug}
                    </Badge>
                    <div className="flex items-center space-x-1 text-white/60 text-sm">
                      <Users className="w-3 h-3" />
                      <span>{zone.capacity_pax} pax</span>
                    </div>
                    {!zone.is_active && (
                      <Badge variant="destructive">Inactiva</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 pl-9 md:pl-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleActive(zone)}
                  className={
                    zone.is_active
                      ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      : "text-white/40 hover:text-white"
                  }
                  title={zone.is_active ? "Desactivar" : "Activar"}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      zone.is_active ? "bg-green-500" : "bg-white/20"
                    }`}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(zone)}
                  className="text-white/60 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(zone.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {zones.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No hay zonas configuradas
            </h3>
            <p className="text-white/40 mb-6">
              Crea tu primera zona para comenzar a asignar mesas.
            </p>
            <Button onClick={handleCreate} className="bg-white text-black hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Crear primera zona
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
