"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateInternalUserRole, adminResetUserPassword } from "@/app/actions/user-actions";
import {
  Users,
  UserPlus,
  Eye,
  Search,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Key,
  X,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { NewInternalUserModal } from "./new-internal-user-modal";

type InternalUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
};

export function UsersManagementView({
  internalUsers,
  associates,
  currentUserRole
}: {
  internalUsers: InternalUser[];
  associates: any[];
  currentUserRole: string;
}) {
  const [activeTab, setActiveTab] = useState<"internal" | "associates">("internal");
  const [resetPasswordModal, setResetPasswordModal] = useState<{ userId: string; userName: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await updateInternalUserRole(userId, newRole);
    if (!res.ok) toast.error(res.error);
    else router.refresh();
  };

  const handleResetPassword = async () => {
    if (!resetPasswordModal || !newPassword.trim()) {
      toast.error("Por favor ingresa una nueva contraseña");
      return;
    }

    startTransition(async () => {
      const res = await adminResetUserPassword(resetPasswordModal.userId, newPassword);
      if (res.ok) {
        toast.success("Contraseña actualizada correctamente");
        setResetPasswordModal(null);
        setNewPassword("");
      } else {
        toast.error(res.error || "Error al cambiar la contraseña");
      }
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-50 text-red-700 border-red-100";
      case "consultor": return "bg-blue-50 text-blue-700 border-blue-100";
      case "tecnico": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const activeAssociates = associates.filter(a => a.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">Administra el equipo interno y la red de asociados externos.</p>
        </div>
        {activeTab === "internal" ? (
          currentUserRole === "admin" && <NewInternalUserModal />
        ) : (
          (currentUserRole === "admin" || currentUserRole === "consultor") && (
            <Link href="/backoffice/asociados/nuevo">
              <Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Crear asociado
              </Button>
            </Link>
          )
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("internal")}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-colors relative",
            activeTab === "internal" ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Equipo interno
          {activeTab === "internal" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" />}
        </button>
        <button
          onClick={() => setActiveTab("associates")}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-colors relative",
            activeTab === "associates" ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Asociados
          {activeTab === "associates" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" />}
        </button>
      </div>

      {activeTab === "internal" ? (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Miembro</th>
                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Rol</th>
                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Alta</th>
                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {internalUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase",
                            u.role === 'admin' ? 'bg-red-100 text-red-600' :
                            u.role === 'consultor' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600')}>
                            {u.full_name?.charAt(0) || u.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.full_name || "Sin nombre"}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", getRoleBadge(u.role))}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentUserRole === 'admin' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-slate-600"
                                onClick={() => setResetPasswordModal({ userId: u.id, userName: u.full_name || u.email || "Usuario" })}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <select
                                className="text-xs bg-white border border-slate-200 rounded p-1"
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              >
                                <option value="admin">Hacer Admin</option>
                                <option value="consultor">Hacer Consultor</option>
                                <option value="tecnico">Hacer Técnico</option>
                              </select>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Associates Summary */}
          <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-sm font-bold text-slate-700">
              Total Asociados: <span className="text-brand-600">{associates.length}</span>
            </span>
            <span className="text-sm font-bold text-slate-700">
              Activos: <span className="text-emerald-600">{activeAssociates}</span>
            </span>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Nombre / Entidad</th>
                      <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Contacto</th>
                      <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-center">Referidos</th>
                      <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Com. Reclamable</th>
                      <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-center">Estado</th>
                      <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associates.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{a.full_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">{a.entity_type} {a.company_name ? `· ${a.company_name}` : ""}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700">{a.phone}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{a.email}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-900">{a.referral_count}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-brand-600 font-bold">
                          €{a.reclaimable_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex px-2 py-1 rounded-full text-[10px] font-bold border uppercase",
                            a.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {a.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentUserRole === 'admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-slate-600"
                                onClick={() => setResetPasswordModal({ userId: a.id, userName: a.full_name || "Asociado" })}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                            )}
                            <Link href={`/backoffice/asociados/${a.id}`}>
                              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-primary transition-colors">
                                <Eye className="w-4 h-4 mr-2" /> Detalle
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Cambiar Contraseña</h2>
              <button
                onClick={() => {
                  setResetPasswordModal(null);
                  setNewPassword("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-slate-600">
                Nueva contraseña para <span className="font-bold">{resetPasswordModal.userName}</span>
              </p>
              <input
                type="text"
                placeholder="Ingresa la nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordModal(null);
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isPending || !newPassword.trim()}
                className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Guardar contraseña
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
