"use client";

import { useEffect, useState } from "react";
import { Users, Shield, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import {
  getStaffUsers,
  updateUserRole,
  type StaffUser,
} from "@/app/actions/admin";

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const result = await getStaffUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setError(result.error || "Error al cargar usuarios");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    newRole: "admin" | "staff" | "user",
  ) {
    if (!confirm(`¿Cambiar el rol de este usuario a "${newRole}"?`)) return;

    setActionLoading(userId);
    setRoleError(null);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        // Optimistic update
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      } else {
        setRoleError("Error al actualizar rol: " + result.error);
        setTimeout(() => setRoleError(null), 4000);
      }
    } catch {
      setRoleError("Error desconocido");
      setTimeout(() => setRoleError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  }

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
      {/* Error Banner */}
      {roleError && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
          <span>{roleError}</span>
          <button onClick={() => setRoleError(null)} className="text-red-400/60 hover:text-red-400 ml-3">✕</button>
        </div>
      )}
      {/* Header */}
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center text-sm text-white/60 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Link>
        <h1 className="text-3xl font-bold text-white">Equipo & Permisos</h1>
        <p className="text-white/40 mt-1">
          Gestiona los accesos y roles del personal
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                Rol Actual
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-white/5">
                      <Users className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.email}</p>
                      <p className="text-xs text-white/40">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {user.role !== "admin" && (
                      <button
                        onClick={() => handleRoleChange(user.id, "admin")}
                        disabled={!!actionLoading}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                        title="Promover a Admin"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="flex items-center space-x-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Hacer Admin</span>
                          </div>
                        )}
                      </button>
                    )}
                    {user.role !== "staff" && (
                      <button
                        onClick={() => handleRoleChange(user.id, "staff")}
                        disabled={!!actionLoading}
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition-colors disabled:opacity-50"
                        title="Asignar rol Staff"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Hacer Staff</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !error && (
          <div className="p-12 text-center text-white/40">
            No se encontraron usuarios. (¿Falta configurar la Service Key?)
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: Readonly<{ role: string }>) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20">
        <ShieldAlert className="w-3 h-3" />
        <span>Admin</span>
      </span>
    );
  }
  if (role === "staff") {
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/20">
        <Shield className="w-3 h-3" />
        <span>Staff</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium border border-white/10">
      <Users className="w-3 h-3" />
      <span>Usuario</span>
    </span>
  );
}
