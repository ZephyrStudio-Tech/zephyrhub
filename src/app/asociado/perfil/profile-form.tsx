"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAssociateProfile } from "@/app/actions/referral-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, User, Shield, CreditCard } from "lucide-react";

export function ProfileForm({ associate }: { associate: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await updateAssociateProfile(data);
    setLoading(false);

    if (res.ok) {
      router.refresh();
      toast.success("Perfil actualizado correctamente");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto pb-12">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" /> Datos de contacto
          </CardTitle>
          <p className="text-sm text-slate-500">Información básica y obligatoria.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-bold text-slate-700">Nombre completo *</Label>
              <Input id="full_name" name="full_name" required defaultValue={associate.full_name} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold text-slate-700">Teléfono *</Label>
              <Input id="phone" name="phone" required defaultValue={associate.phone} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email</Label>
              <Input id="email" name="email" disabled defaultValue={associate.email} className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni" className="text-sm font-bold text-slate-700">DNI / NIF *</Label>
              <Input id="dni" name="dni" required defaultValue={associate.dni} className="bg-white border-slate-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-6">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address" className="text-sm font-bold text-slate-700">Dirección</Label>
              <Input id="address" name="address" defaultValue={associate.address} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-bold text-slate-700">Ciudad</Label>
              <Input id="city" name="city" defaultValue={associate.city} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province" className="text-sm font-bold text-slate-700">Provincia</Label>
              <Input id="province" name="province" defaultValue={associate.province} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip" className="text-sm font-bold text-slate-700">Código Postal</Label>
              <Input id="zip" name="zip" defaultValue={associate.zip} className="bg-white border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" /> Datos fiscales
          </CardTitle>
          <p className="text-sm text-slate-500">Información para la facturación de tus comisiones.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="entity_type" className="text-sm font-bold text-slate-700">Tipo de entidad</Label>
                <select id="entity_type" name="entity_type" defaultValue={associate.entity_type} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all">
                  <option value="particular">Particular</option>
                  <option value="autonomo">Autónomo</option>
                  <option value="empresa">Empresa / SL</option>
                </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-bold text-slate-700">Nombre de la empresa</Label>
                  <Input id="company_name" name="company_name" defaultValue={associate.company_name} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cif" className="text-sm font-bold text-slate-700">CIF de la empresa</Label>
                  <Input id="cif" name="cif" defaultValue={associate.cif} className="bg-white border-slate-200" />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="fiscal_address" className="text-sm font-bold text-slate-700">Dirección fiscal (si es distinta)</Label>
                <Input id="fiscal_address" name="fiscal_address" defaultValue={associate.fiscal_address} className="bg-white border-slate-200" />
             </div>
          </div>

          <div className="pt-6 border-t border-brand-100">
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-brand-100">
                  <CreditCard className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-900">Tu Cuenta Bancaria (IBAN)</h4>
                  <p className="text-xs text-brand-700">Indica donde quieres recibir tus comisiones.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban" className="text-sm font-bold text-brand-900">IBAN *</Label>
                <Input id="iban" name="iban" defaultValue={associate.iban} placeholder="ES00 0000 0000 0000 0000 0000" className="bg-white border-brand-200 font-mono text-lg focus:ring-brand-500" />
                {!associate.iban && <p className="text-xs text-red-500 font-bold">⚠️ Obligatorio para poder transferirte las comisiones</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 h-12 shadow-lg shadow-brand-100 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
