"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markCommissionPaid,
  toggleAssociateActive,
  updateAssociateCommission
} from "@/app/actions/referral-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Users,
  CheckCircle2,
  XCircle,
  History,
  CreditCard,
  Building,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AssociateDetailView({
  associate,
  referrals,
  stats
}: {
  associate: any;
  referrals: any[];
  stats: any
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function handleMarkPaid(referralId: string) {
    setLoading(referralId);
    const res = await markCommissionPaid(referralId, notes[referralId] || "");
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  async function handleToggleActive() {
    setLoading("active");
    const res = await toggleAssociateActive(associate.id, !associate.is_active);
    setLoading(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-brand-100">
            <Users className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{associate.full_name}</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              ID Asociado: {associate.id.slice(0, 8)} ·
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                associate.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
              )}>
                {associate.is_active ? "Activo" : "Inactivo"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={loading === "active"}
          >
            {associate.is_active ? "Desactivar acceso" : "Activar acceso"}
          </Button>
          <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90 text-white">Editar perfil completo</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pendiente (€)", value: stats.pending, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Confirmada (€)", value: stats.confirmed, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Reclamable (€)", value: stats.reclaimable, color: "text-brand-600", bg: "bg-brand-50" },
          { label: "Pagada (€)", value: stats.paid, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className={cn("text-2xl font-bold mt-1", stat.color)}>€{stat.value.toLocaleString()}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="border-b border-slate-100 pb-4">
               <CardTitle className="text-lg">Información de contacto</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{associate.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{associate.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-medium capitalize">{associate.entity_type} {associate.company_name ? `· ${associate.company_name}` : ""}</span>
                </div>
                <div className="pt-4 border-t border-slate-50 space-y-3">
                   <p className="text-xs font-bold text-slate-400 uppercase">Datos bancarios</p>
                   <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100 text-brand-700">
                     <CreditCard className="w-4 h-4" />
                     <span className="font-mono text-sm">{associate.iban || "IBAN no configurado"}</span>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
                <CardTitle className="text-lg">Ajustes de comisión</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Comisión por lead (€)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        defaultValue={associate.default_commission}
                        className="bg-white"
                        onChange={(e) => {}} // Handle change if needed
                      />
                      <Button variant="outline" size="sm">Actualizar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
             <CardHeader className="border-b border-slate-100 pb-4">
               <CardTitle className="text-lg">Gestión de comisiones y referidos</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-200">
                       <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Contacto</th>
                       <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Estado Exp.</th>
                       <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Comisión</th>
                       <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Acción Pago</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {referrals.map(r => (
                       <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4">
                           <p className="font-bold text-slate-900">{r.contact_name}</p>
                           <p className="text-xs text-slate-500 mt-0.5 capitalize">{r.status}</p>
                         </td>
                         <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              r.status === "completado" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600 border-slate-100"
                            )}>
                              {r.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={cn(
                                "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit capitalize",
                                r.commission_status === "reclamable" ? "bg-brand-100 text-brand-700 border-brand-200" :
                                r.commission_status === "pagada" ? "bg-emerald-800 text-white border-emerald-900" :
                                "bg-slate-50 text-slate-500 border-slate-100"
                              )}>
                                {r.commission_status}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 font-bold">€{r.commission_amount}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                            {r.commission_status === "reclamable" ? (
                              <div className="flex items-center gap-2 justify-end">
                                <Input
                                  placeholder="Notas..."
                                  className="h-8 text-xs w-32 bg-white"
                                  value={notes[r.id] || ""}
                                  onChange={(e) => setNotes({...notes, [r.id]: e.target.value})}
                                />
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                                  disabled={loading === r.id}
                                  onClick={() => handleMarkPaid(r.id)}
                                >
                                  Pagar
                                </Button>
                              </div>
                            ) : r.commission_status === "pagada" ? (
                              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 justify-end">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pagado {r.commission_paid_at && new Date(r.commission_paid_at).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">No reclamable</span>
                            )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
