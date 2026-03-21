import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignConsultantForm } from "./assign-form";

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Asignación de Consultores
        </h1>
        <p className="text-slate-500 text-sm">
          Distribuye los expedientes entre los gestores comerciales disponibles.
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
            Clientes y consultor asignado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AssignConsultantForm
            clients={clients || []}
            consultants={consultants || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
