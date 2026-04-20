import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Euro, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

  const safeReferrals = referrals || [];

  const totalLeads = safeReferrals.length;
  const totalCommission = safeReferrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
  const paidCommission = safeReferrals.filter(r => r.commission_status === 'pagada').reduce((sum, r) => sum + (r.commission_amount || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Control de Referidos</h1>
        <p className="text-slate-500 mt-2">Visión global de todos los leads aportados por la red de asociados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Comisiones Generadas</CardTitle>
            <Euro className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalCommission)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Comisiones Pagadas</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(paidCommission)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <CardTitle className="text-lg font-bold">Listado Global</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Lead (Empresa)</th>
                <th className="px-6 py-4">Asociado</th>
                <th className="px-6 py-4">Estado Lead</th>
                <th className="px-6 py-4">Comisión</th>
                <th className="px-6 py-4">Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {safeReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay referidos registrados en el sistema.
                  </td>
                </tr>
              ) : (
                safeReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4">
                      {/* AQUI ESTABA EL ERROR: USAMOS contact_name en vez de full_name */}
                      <p className="font-bold text-slate-900">{r.company_name || r.contact_name}</p>
                      <p className="text-xs text-slate-500">{r.contact_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">
                        {r.associates?.full_name || "Desconocido"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize bg-slate-50 text-slate-600">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(r.commission_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          r.commission_status === 'pagada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            r.commission_status === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-600'
                        }
                      >
                        {r.commission_status === 'pendiente' && <Clock className="w-3 h-3 mr-1" />}
                        {r.commission_status === 'pagada' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {r.commission_status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}