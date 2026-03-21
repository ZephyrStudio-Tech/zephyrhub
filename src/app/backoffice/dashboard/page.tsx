import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STATE_LABELS, PipelineState } from "@/lib/state-machine/constants";
import {
  TrendingUp,
  Users,
  FileText,
  Smartphone,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default async function AdminDashboardPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/backoffice");

  const supabase = await createClient();

  // 1. Fetch Summary Metrics
  const [
    { count: totalClients },
    { data: payments },
    { data: clientsByState },
    { data: deviceOrders }
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("expected_amount, received_amount, agent_commission"),
    supabase.from("clients").select("current_state"),
    supabase.from("device_orders").select("surcharge, status")
  ]);

  // 2. Calculate Accounting
  const totalExpected = (payments || []).reduce((acc, p) => acc + (p.expected_amount || 0), 0);
  const totalReceived = (payments || []).reduce((acc, p) => acc + (p.received_amount || 0), 0);
  const pendingPayment = totalExpected - totalReceived;
  const totalCommissions = (payments || []).reduce((acc, p) => acc + (p.agent_commission || 0), 0);

  const deviceMargins = (deviceOrders || [])
    .filter(o => o.status !== "cancelled")
    .reduce((acc, o) => acc + (o.surcharge || 0), 0);

  // 3. Expedientes por Fase
  const stateCounts = (clientsByState || []).reduce((acc: Record<string, number>, c) => {
    acc[c.current_state] = (acc[c.current_state] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      label: "Tesorería (Recibido)",
      value: `€${totalReceived.toLocaleString()}`,
      subValue: `De €${totalExpected.toLocaleString()} esperados`,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Pendiente de Cobro",
      value: `€${pendingPayment.toLocaleString()}`,
      subValue: "Facturación en pipeline",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Márgenes Dispositivos",
      value: `€${deviceMargins.toLocaleString()}`,
      subValue: "Sobrecostes netos",
      icon: Smartphone,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "Total Expedientes",
      value: totalClients || 0,
      subValue: "En todas las fases",
      icon: Users,
      color: "text-slate-600",
      bg: "bg-slate-50"
    }
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h1>
        <p className="text-slate-500">Métricas globales y contabilidad de ZephyrHUB.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={stat.bg + " p-2 rounded-lg"}>
                  <stat.icon className={stat.color + " h-5 w-5"} />
                </div>
                {stat.label.includes("Recibido") && (
                  <div className="flex items-center text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{stat.subValue}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Accounting Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Resumen Contable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Total Facturación Bruta</span>
                <span className="font-semibold text-slate-900">€{totalExpected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Cobrado</span>
                <span className="font-semibold text-emerald-600">€{totalReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Pendiente</span>
                <span className="font-semibold text-amber-600">€{pendingPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Comisiones Agentes</span>
                <span className="font-semibold text-red-600">-€{totalCommissions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-slate-900">EBITDA Estimado (Bonos + Disp)</span>
                <span className="text-xl font-bold text-primary">€{(totalExpected - totalCommissions + deviceMargins).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients per Phase */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Expedientes por Fase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {PIPELINE_STATE_LABELS.map((state) => {
                const count = stateCounts[state.id] || 0;
                const percentage = totalClients ? (count / totalClients) * 100 : 0;
                if (count === 0) return null;

                return (
                  <div key={state.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{state.label}</span>
                      <span className="text-slate-500">{count} expedientes</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(stateCounts).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No hay expedientes activos.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
