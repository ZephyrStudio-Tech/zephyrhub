import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAssignPage() {
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
      <h1 className="text-2xl font-bold">Asignar consultores</h1>
      <Card>
        <CardHeader>
          <CardTitle>Clientes y consultor asignado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted">
            Asignación masiva (actualizar consultant_id) en Fase 4. Listado:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {(clients ?? []).map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>
                  {c.company_name || c.id.slice(0, 8)} · {c.current_state}
                </span>
                <span className="text-muted">
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
