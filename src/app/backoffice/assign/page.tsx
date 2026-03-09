import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AssignPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/backoffice");

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name, consultant_id, current_state")
    .order("company_name");

  const { data: consultants } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "consultor");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
        Asignar consultores
      </h1>
      <Card className="border-slate-200 dark:border-slate-700 shadow-card">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">
            Clientes y consultor asignado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm">
            Asignación masiva (actualizar consultant_id). Listado:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {(clients ?? []).map((c) => (
              <li key={c.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-800 dark:text-slate-200">
                  {c.company_name || c.id.slice(0, 8)} · {c.current_state}
                </span>
                <span className="text-slate-500">
                  Consultor:{" "}
                  {consultants?.find((x) => x.id === c.consultant_id)?.full_name ||
                    c.consultant_id?.slice(0, 8) ||
                    "—"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
