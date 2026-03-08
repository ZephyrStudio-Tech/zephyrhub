import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JUSTIFICATION_STATES = [
  "presentar_justificacion_fase_i",
  "firma_justificacion",
  "subsanacion_fase_i",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
];

export default async function BackofficeTechPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["tecnico", "admin"].includes(role ?? "")) redirect("/backoffice");

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company_name, current_state, service_type")
    .in("current_state", JUSTIFICATION_STATES)
    .order("current_state")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caja de evidencias</h1>
      <p className="text-muted">
        Expedientes en fase de justificación. (Checklist y subida en Fase 3.)
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {(clients ?? []).map((c) => (
          <Card key={c.id} className="border-white/10 bg-white/5">
            <CardHeader className="p-4">
              <CardTitle className="text-base">
                <Link
                  href={`/backoffice/tech/${c.id}`}
                  className="text-foreground hover:text-accent"
                >
                  {c.company_name || c.id.slice(0, 8)}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted">
                {c.current_state} · {c.service_type}
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Link href={`/backoffice/tech/${c.id}`}>
                <span className="text-sm text-accent hover:underline">
                  Rellenar evidencias
                </span>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {(!clients || clients.length === 0) && (
        <p className="text-muted">Ningún expediente en justificación.</p>
      )}
    </div>
  );
}
