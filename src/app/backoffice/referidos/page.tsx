import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Wallet,
  Search,
  Filter,
  ArrowRight,
  UserCircle2,
  CalendarDays
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ReferralsGlobalPage() {
  const { user, role } = await getSession();
  if (!user || (role !== "admin" && role !== "consultor")) redirect("/backoffice");

  const supabase = createAdminClient();

  const { data: referrals } = await supabase
    .from("referrals")
    .select(`
      *,
      associates(full_name)
    `)
    .order("created_at", { ascending: false });

  const totalReclaimable = (referrals || []).filter(r => r.commission_status === "reclamable")
    .reduce((acc, r) => acc + (r.commission_amount || 0), 0);

  const totalConfirmada = (referrals || []).filter(r => r.commission_status === "confirmada")
    .reduce((acc, r) => acc + (r.commission_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Referidos globales</h1>
          <p className="text-slate-500 mt-1">Todos los contactos enviados por asociados.</p>
        </div>
        <div className="flex gap-4">
          <Card className="border-none bg-brand-50 shadow-sm p-4 flex flex-col justify-center min-w-[200px]">
            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Total Reclamable</p>
            <p className="text-2xl font-bold text-brand-700">€{totalReclaimable.toLocaleString()}</p>
          </Card>
          <Card className="border-none bg-amber-50 shadow-sm p-4 flex flex-col justify-center min-w-[200px]">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Total Confirmada</p>
            <p className="text-2xl font-bold text-amber-700">€{totalConfirmada.toLocaleString()}</p>
          </Card>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Referido / Empresa</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px]">Enviado por</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-center">Estado Exp.</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-center">Estado Com.</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Comisión (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals?.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.contact_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">{r.company_name || "Particular"}</span> ·
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/backoffice/asociados/${r.associate_id}`} className="flex items-center gap-2 text-brand-600 hover:underline">
                        <UserCircle2 className="w-4 h-4" />
                        <span className="font-medium">{r.associates?.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                        r.status === "completado" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600 border-slate-100"
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        r.commission_status === "reclamable" ? "bg-brand-50 text-brand-700 border-brand-200 font-bold" :
                          r.commission_status === "pagada" ? "bg-emerald-800 text-white border-emerald-900" :
                            "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        {r.commission_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      €{r.commission_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
