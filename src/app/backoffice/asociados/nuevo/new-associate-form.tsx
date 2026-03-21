"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAssociateAction } from "@/app/actions/referral-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Key, Wallet, User } from "lucide-react";

export function NewAssociateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await createAssociateAction(data);
    setLoading(false);

    if (res.ok) {
      router.push("/backoffice/asociados");
    } else {
      alert(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-12">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-600" /> Credenciales de acceso
          </CardTitle>
          <p className="text-sm text-slate-500">Se enviará un email al asociado para que acceda al portal.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email *</Label>
            <Input id="email" name="email" type="email" required placeholder="ejemplo@correo.com" className="bg-white border-slate-200" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-slate-700">Contraseña temporal *</Label>
            <Input id="password" name="password" type="text" required placeholder="Escribe una contraseña segura" className="bg-white border-slate-200 font-mono" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" /> Datos del asociado
          </CardTitle>
          <p className="text-sm text-slate-500">Información del partner y su comisión.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-bold text-slate-700">Nombre completo *</Label>
              <Input id="full_name" name="full_name" required placeholder="Nombre y apellidos" className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold text-slate-700">Teléfono *</Label>
              <Input id="phone" name="phone" required placeholder="600 000 000" className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="entity_type" className="text-sm font-bold text-slate-700">Tipo de entidad</Label>
               <select id="entity_type" name="entity_type" required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all">
                  <option value="particular">Particular</option>
                  <option value="autonomo">Autónomo</option>
                  <option value="empresa">Empresa / SL</option>
               </select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="default_commission" className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Comisión por lead (€)
                </Label>
                <Input id="default_commission" name="default_commission" type="number" defaultValue="200" className="bg-white border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-600 font-bold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20 flex items-center gap-2 h-12"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creando asociado...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Crear asociado
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
