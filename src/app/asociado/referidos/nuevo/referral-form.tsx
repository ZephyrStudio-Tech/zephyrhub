"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createReferral } from "@/app/actions/referral-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";

export function NewReferralForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [entityType, setEntityType] = useState<"particular" | "autonomo" | "empresa">("particular");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      contact_name: formData.get("contact_name"),
      contact_phone: formData.get("contact_phone"),
      contact_email: formData.get("contact_email"),
      entity_type: entityType,
      company_name: formData.get("company_name"),
      dni_cif: formData.get("dni_cif"),
      fiscal_address: formData.get("fiscal_address"),
      notes: formData.get("notes"),
    };

    const res = await createReferral(data);
    setLoading(false);

    if (res.ok) {
      router.push("/asociado/referidos");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900">Datos del contacto</CardTitle>
          <p className="text-sm text-slate-500">Información básica para que nuestro equipo pueda contactar con el cliente.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_name" className="text-sm font-bold text-slate-700">Nombre completo *</Label>
            <Input id="contact_name" name="contact_name" required placeholder="Ej: Juan Pérez" className="bg-white border-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="text-sm font-bold text-slate-700">Teléfono *</Label>
              <Input id="contact_phone" name="contact_phone" required placeholder="Ej: 600 000 000" className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm font-bold text-slate-700">Email *</Label>
              <Input id="contact_email" name="contact_email" type="email" required placeholder="Ej: juan@ejemplo.com" className="bg-white border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900">Tipo de cliente</CardTitle>
          <p className="text-sm text-slate-500">Ayúdanos a identificar el tipo de entidad del beneficiario.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {["particular", "autonomo", "empresa"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEntityType(type as any)}
                className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${
                  entityType === type
                    ? "bg-brand-600 text-white border-brand-700 shadow-md ring-2 ring-brand-100"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
            {entityType === "empresa" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-bold text-slate-700">Nombre de la empresa</Label>
                  <Input id="company_name" name="company_name" placeholder="Nombre comercial o social" className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni_cif" className="text-sm font-bold text-slate-700">CIF</Label>
                  <Input id="dni_cif" name="dni_cif" placeholder="Ej: B12345678" className="bg-white border-slate-200" />
                </div>
              </div>
            )}
            {entityType === "autonomo" && (
              <div className="space-y-2">
                <Label htmlFor="dni_cif" className="text-sm font-bold text-slate-700">DNI / NIF</Label>
                <Input id="dni_cif" name="dni_cif" placeholder="Ej: 12345678X" className="bg-white border-slate-200" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors mx-auto"
        >
          {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showOptional ? "Menos información" : "Añadir más información"}
        </button>

        {showOptional && (
          <Card className="border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_address" className="text-sm font-bold text-slate-700">Dirección fiscal</Label>
                <Input id="fiscal_address" name="fiscal_address" placeholder="Dirección completa" className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-bold text-slate-700">Notas para el equipo</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="¿Hay algo que debamos saber sobre este contacto?"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 shadow-lg shadow-brand-100 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Enviar referido
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
