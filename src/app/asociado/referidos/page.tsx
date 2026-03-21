import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  recibido: { label: "Recibido — estamos revisando", color: "bg-slate-100 text-slate-600 border-slate-200" },
  en_proceso: { label: "En tramitación", color: "bg-blue-100 text-blue-700 border-blue-200" },
  bono_concedido: { label: "Bono concedido", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  en_desarrollo: { label: "En desarrollo", color: "bg-green-100 text-green-700 border-green-200" },
  completado: { label: "Completado", color: "bg-emerald-800 text-white border-emerald-900" },
  perdido: { label: "No viable", color: "bg-red-100 text-red-700 border-red-200" },
};

const COMMISSION_MAP: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-slate-100 text-slate-600 border-slate-200" },
  confirmada: { label: "Confirmada", color: "bg-amber-100 text-amber-700 border-amber-200" },
  reclamable: { label: "Reclamable ✓", color: "bg-brand-100 text-brand-700 border-brand-200 font-bold" },
  pagada: { label: "Pagada", color: "bg-emerald-800 text-white border-emerald-900" },
};

export default async function ReferralsPage() {
  const { user, role } = await getSession();
  if (!user || role !== "asociado") redirect("/login");

  const supabase = await createClient();
  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("associate_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis referidos</h1>
          <p className="text-slate-500 mt-1">Lista completa de todos los contactos enviados y su estado.</p>
        </div>
        <Link href="/asociado/referidos/nuevo">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-100 flex items-center gap-2 px-6">
            <Plus className="w-4 h-4" /> Nuevo referido
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Nombre / Empresa</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Fecha envío</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Estado expediente</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Estado comisión</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals?.map((r) => {
                  const statusInfo = STATUS_MAP[r.status] || { label: r.status, color: "bg-slate-100 text-slate-600" };
                  const commissionInfo = COMMISSION_MAP[r.commission_status] || { label: r.commission_status, color: "bg-slate-100 text-slate-600" };

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{r.contact_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.company_name || "Particular"}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(r.created_at).toLocaleDateString("es")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border", commissionInfo.color)}>
                          {commissionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        €{r.commission_amount || 0}
                      </td>
                    </tr>
                  );
                })}
                {(!referrals || referrals.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Users className="w-8 h-8" />
                        <p className="text-sm">No has enviado ningún referido todavía.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
