import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TriageLeadCard, type TriageLead } from "./triage-lead-card";

export default async function TriagePage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("triage_leads")
    .select(
      "id, full_name, phone, email, province, company_name, nif, entity_type, company_size, service_requested, hardware_pref, web_state, complemento, kit_digital_prev, created_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = (leads ?? []) as TriageLead[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Buzón de Leads</h1>
        <p className="text-muted">
          Leads pendientes de la landing. Convierte a expediente cuando el cliente acepte tramitar el Kit Digital.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-muted">
          No hay leads pendientes en el buzón.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((lead) => (
            <TriageLeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
