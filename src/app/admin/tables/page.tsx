"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Square,
  Circle,
  RectangleHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Zone {
  id: string;
  name: string;
  slug: string;
}

interface Table {
  id: string;
  zone_id: string;
  name: string;
  seats: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  shape: "rectangle" | "circle" | "square";
  rotation: number;
  is_active: boolean;
  display_order: number;
}

interface FormData {
  name: string;
  zone_id: string;
  seats: number;
  shape: "rectangle" | "circle" | "square";
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  is_active: boolean;
}

const defaultFormData: FormData = {
  name: "",
  zone_id: "",
  seats: 4,
  shape: "square",
  width: 80,
  height: 80,
  position_x: 50,
  position_y: 50,
  is_active: true,
};

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

export default function TablesPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const [{ data: zonesData }, { data: tablesData }] = await Promise.all([
        supabase.from("zones").select("id, name, slug").order("display_order"),
        supabase.from("tables").select("*").order("display_order"),
      ]);

      setZones(zonesData || []);
      setTables(tablesData || []);

      if (!selectedZone && zonesData?.length) {
        setSelectedZone(zonesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const zoneTables = tables.filter((t) => t.zone_id === selectedZone);
  const currentZone = zones.find((z) => z.id === selectedZone);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTable(null);
    setFormData({
      ...defaultFormData,
      zone_id: selectedZone,
      name: `Mesa ${zoneTables.length + 1}`,
    });
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setIsCreating(false);
    setFormData({
      name: table.name,
      zone_id: table.zone_id,
      seats: table.seats,
      shape: table.shape,
      width: table.width,
      height: table.height,
      position_x: table.position_x,
      position_y: table.position_y,
      is_active: table.is_active,
    });
  };

  const handleCancel = () => {
    setEditingTable(null);
    setIsCreating(false);
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.zone_id) return;

    setSaving(true);
    try {
      const supabase = createClient();

      if (isCreating) {
        const { error } = await supabase.from("tables").insert({
          ...formData,
          rotation: 0,
          display_order: zoneTables.length + 1,
        });
        if (error) throw error;
      } else if (editingTable) {
        const { error } = await supabase
          .from("tables")
          .update(formData)
          .eq("id", editingTable.id);
        if (error) throw error;
      }

      await fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error saving table:", error);
      alert("Error al guardar la mesa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: Table) => {
    if (
      !confirm(`¿Eliminar ${table.name}? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", table.id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error deleting table:", error);
      alert("Error al eliminar la mesa");
    }
  };

  const handleToggleActive = async (table: Table) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tables")
        .update({ is_active: !table.is_active })
        .eq("id", table.id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error toggling table:", error);
    }
  };

  const shapeIcon = (shape: string) => {
    switch (shape) {
      case "circle":
        return <Circle className="w-4 h-4" />;
      case "rectangle":
        return <RectangleHorizontal className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-white">Gestión de Mesas</h1>
          <p className="text-white/40 mt-1">
            Configura las mesas de cada zona del restaurante
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Mesa
        </button>
      </div>

      {/* Zone Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {zones.map((zone) => {
          const count = tables.filter((t) => t.zone_id === zone.id).length;
          return (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                selectedZone === zone.id
                  ? "bg-blue-600 text-white"
                  : "bg-black/30 border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              <span>{zone.name}</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  selectedZone === zone.id ? "bg-white/20" : "bg-white/10"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingTable) && (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {isCreating ? "Nueva Mesa" : `Editar ${editingTable?.name}`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-white/60 mb-1">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="Mesa 1"
                title="Nombre de la mesa"
              />
            </div>

            {/* Zone */}
            <div>
              <label className="block text-sm text-white/60 mb-1">Zona</label>
              <select
                value={formData.zone_id}
                onChange={(e) =>
                  setFormData({ ...formData, zone_id: e.target.value })
                }
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Seleccionar zona"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seats */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Asientos
              </label>
              <input
                type="number"
                value={formData.seats}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seats: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                max={20}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Cantidad de asientos"
              />
            </div>

            {/* Shape */}
            <div>
              <label className="block text-sm text-white/60 mb-1">Forma</label>
              <div className="flex gap-2">
                {(["square", "rectangle", "circle"] as const).map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => setFormData({ ...formData, shape })}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                      formData.shape === shape
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-black/30 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {shapeIcon(shape)}
                  </button>
                ))}
              </div>
            </div>

            {/* Position X */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Posición X
              </label>
              <input
                type="number"
                value={formData.position_x}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position_x: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Posición X"
              />
            </div>

            {/* Position Y */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Posición Y
              </label>
              <input
                type="number"
                value={formData.position_y}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position_y: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Posición Y"
              />
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Ancho (px)
              </label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    width: parseInt(e.target.value) || 60,
                  })
                }
                min={40}
                max={200}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Ancho de la mesa"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Alto (px)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    height: parseInt(e.target.value) || 60,
                  })
                }
                min={40}
                max={200}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                title="Alto de la mesa"
              />
            </div>
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

      {/* Tables List */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            Mesas - {currentZone?.name || "Selecciona una zona"}
          </h2>
        </div>

        {zoneTables.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            No hay mesas en esta zona. Haz clic en &quot;Nueva Mesa&quot; para
            agregar.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {zoneTables.map((table) => (
              <div
                key={table.id}
                className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${
                  !table.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      table.is_active ? "bg-blue-500/10" : "bg-white/5"
                    }`}
                  >
                    {shapeIcon(table.shape)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{table.name}</p>
                    <p className="text-sm text-white/60">
                      {table.seats} asientos • {table.shape} • {table.width}x
                      {table.height}px
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(table)}
                    className={`p-2 rounded-lg transition-colors ${
                      table.is_active
                        ? "text-green-400 hover:bg-green-500/10"
                        : "text-white/40 hover:bg-white/10"
                    }`}
                    title={table.is_active ? "Desactivar" : "Activar"}
                  >
                    {table.is_active ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(table)}
                    className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(table)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Vista Previa - {currentZone?.name}
        </h2>
        <div className="relative bg-black/20 rounded-xl border border-white/5 h-64 overflow-hidden">
          {zoneTables.map((table) => (
            <div
              key={table.id}
              className={`absolute flex items-center justify-center text-xs font-medium transition-all ${
                table.is_active
                  ? "bg-blue-500/20 border-2 border-blue-500/50 text-blue-300"
                  : "bg-white/10 border border-white/20 text-white/40"
              } ${table.shape === "circle" ? "rounded-full" : "rounded-lg"}`}
              // eslint-disable-next-line
              style={{
                left: table.position_x,
                top: table.position_y,
                width: table.width,
                height: table.height,
              }}
            >
              <span>{table.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
