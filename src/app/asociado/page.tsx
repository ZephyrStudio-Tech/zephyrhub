import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  CheckCircle2,
  Wallet,
  AlertTriangle,
  ArrowRight,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AssociateDashboard() {
  const { user, role } = await getSession();
  if (!user || role !== "asociado") redirect("/login");

  const supabase = await createClient();

  // Load associate profile and referrals
  const { data: associate } = await supabase
    .from("associates")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("associate_id", user.id)
    .order("created_at", { ascending: false });

  if (!associate) return <p>No se encontró el perfil de asociado.</p>;

  const totalLeads = referrals?.length || 0;
  const inProcess = referrals?.filter(r => r.status !== "perdido" && r.status !== "completado").length || 0;
  const confirmedCommission = referrals?.filter(r => r.commission_status === "confirmada")
    .reduce((acc, r) => acc + (r.commission_amount || 0), 0) || 0;
  const reclaimableCommission = referrals?.filter(r => r.commission_status === "reclamable")
    .reduce((acc, r) => acc + (r.commission_amount || 0), 0) || 0;

  const hasReclaimable = reclaimableCommission > 0;
  const missingIban = !associate.iban;

  const stats = [
    { label: "Leads enviados", value: totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "En proceso", value: inProcess, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Comisiones confirmadas", value: `€${confirmedCommission}`, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Comisiones reclamables", value: `€${reclaimableCommission}`, icon: Wallet, color: "text-brand-600", bg: "bg-brand-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, {associate.full_name.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Aquí tienes un resumen de tus referidos y comisiones.</p>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {missingIban && (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Añade tu IBAN en tu perfil</p>
              <p className="text-sm text-amber-800">Necesitamos tu cuenta bancaria para poder transferirte las comisiones reclamables.</p>
            </div>
            <Link href="/asociado/perfil">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 whitespace-nowrap">
                Ir al perfil
              </Button>
            </Link>
          </div>
        )}

        {hasReclaimable && (
          <div className="flex items-center gap-4 p-5 rounded-xl border border-brand-200 bg-brand-50 shadow-sm border-l-4">
            <div className="p-2 rounded-full bg-brand-100">
              <Wallet className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-brand-900">Tienes €{reclaimableCommission} reclamables</p>
              <p className="text-sm text-brand-800">El bono de tus referidos ya ha sido cobrado. Puedes solicitar tu pago ahora.</p>
            </div>
            <Link href="/asociado/soporte/tickets/nuevo?subject=Reclamar comisión">
              <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-200 transition-all hover:scale-105 active:scale-95">
                Contactar para reclamar
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(stat.bg, "p-2 rounded-lg group-hover:scale-110 transition-transform")}>
                  <stat.icon className={cn(stat.color, "h-5 w-5")} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Referrals */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold">Últimos referidos enviados</CardTitle>
          <Link href="/asociado/referidos" className="text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {referrals?.slice(0, 5).map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{r.contact_name}</p>
                  <p className="text-xs text-slate-500">{r.company_name || "Particular"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Comisión</p>
                    <p className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full border mt-1 text-center",
                      r.commission_status === "pendiente" && "bg-slate-100 text-slate-600 border-slate-200",
                      r.commission_status === "confirmada" && "bg-amber-100 text-amber-700 border-amber-200",
                      r.commission_status === "reclamable" && "bg-brand-100 text-brand-700 border-brand-200",
                      r.commission_status === "pagada" && "bg-emerald-100 text-emerald-700 border-emerald-200"
                    )}>
                      {r.commission_status.charAt(0).toUpperCase() + r.commission_status.slice(1)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {(!referrals || referrals.length === 0) && (
              <li className="p-12 text-center">
                <p className="text-slate-500 text-sm">Aún no has enviado ningún referido.</p>
                <Link href="/asociado/referidos/nuevo" className="inline-block mt-4">
                  <Button className="bg-brand-600 text-white">Enviar mi primer referido</Button>
                </Link>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
