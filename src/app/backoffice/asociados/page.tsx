import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Eye, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AssociatesListPage() {
  const { user, role } = await getSession();
  if (!user || (role !== "admin" && role !== "consultor")) redirect("/backoffice");

  const supabase = await createClient();

  // Get associates with referral counts and commission totals
  const { data: associates } = await supabase
    .from("associates")
    .select(`
      *,
      referrals(count),
      referrals_data:referrals(commission_amount, commission_status)
    `)
    .order("full_name");

  const processedAssociates = (associates || []).map(a => {
    const refs = a.referrals_data || [];
    const pending = refs.filter(r => r.commission_status === "confirmada").reduce((acc, r) => acc + (r.commission_amount || 0), 0);
    const reclaimable = refs.filter(r => r.commission_status === "reclamable").reduce((acc, r) => acc + (r.commission_amount || 0), 0);

    return {
      ...a,
      referral_count: a.referrals?.[0]?.count || 0,
      pending_amount: pending,
      reclaimable_amount: reclaimable
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Asociados</h1>
          <p className="text-slate-500 mt-1">Gestión de partners externos y comisiones por referidos.</p>
        </div>
        {role === "admin" && (
          <Link href="/backoffice/asociados/nuevo">
            <Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Crear asociado
            </Button>
          </Link>
        )}
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
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Com. Confirmada</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Com. Reclamable</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-center">Estado</th>
                  <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-widest text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedAssociates.map((a) => (
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
                    <td className="px-6 py-4 text-right text-amber-600 font-bold">
                      €{a.pending_amount.toLocaleString()}
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
                      <Link href={`/backoffice/asociados/${a.id}`}>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-primary transition-colors">
                          <Eye className="w-4 h-4 mr-2" /> Ver detalle
                        </Button>
                      </Link>
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
