"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTriageLead } from "@/app/actions/triage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";

export function NewLeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await createTriageLead(data);
    setLoading(false);
    if (res.ok) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Nuevo lead
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl">Crear nuevo lead manualmente</CardTitle>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input id="full_name" name="full_name" required placeholder="Ej: Juan Pérez" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required placeholder="juan@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input id="phone" name="phone" required placeholder="600 000 000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa (opcional)</Label>
                <Input id="company_name" name="company_name" placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia *</Label>
                <Input id="province" name="province" required placeholder="Ej: Madrid" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entity_type">Tipo de entidad</Label>
                <select id="entity_type" name="entity_type" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="autonomo">Autónomo</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_requested">Servicio solicitado</Label>
                <select id="service_requested" name="service_requested" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="web">Sitio Web</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="seo">SEO</option>
                  <option value="factura">Factura Electrónica</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size">Tamaño de empresa</Label>
                <select id="company_size" name="company_size" defaultValue="0-2" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="0-2">Menos de 3 empleados</option>
                  <option value="3-9">Entre 3 y 9 empleados</option>
                  <option value="10+">10 o más empleados</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Cualquier información relevante..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Crear Lead
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
