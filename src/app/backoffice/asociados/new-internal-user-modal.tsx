"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInternalUser } from "@/app/actions/client-actions";
import { generateStaffPassword } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, ShieldCheck } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";

export function NewInternalUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTempPassword(generateStaffPassword());
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await createInternalUser(data);
    setLoading(false);
    if (res.ok) {
      toastSuccess("Usuario creado correctamente");
      setIsOpen(false);
      router.refresh();
    } else {
      toastError(res.error || "Error al crear usuario");
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
        <Plus className="w-4 h-4" /> Añadir miembro
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" /> Nuevo miembro del equipo
          </CardTitle>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input id="full_name" name="full_name" required placeholder="Nombre y apellidos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo *</Label>
              <Input id="email" name="email" type="email" required placeholder="nombre@zephyrstudio.es" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña temporal *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  name="password"
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setTempPassword(generateStaffPassword())}>Regenerar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol asignado</Label>
              <select id="role" name="role" required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="admin">Administrador (Acceso total)</option>
                <option value="consultor">Consultor (Gestión comercial)</option>
                <option value="tecnico">Técnico (Ejecución y justificación)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Añadir usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
