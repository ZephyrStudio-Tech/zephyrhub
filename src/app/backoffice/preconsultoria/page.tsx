import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PreconsultoriaKanban } from "./preconsultoria-kanban";

export default async function PreconsultoriaPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const supabaseAdmin = await import("@/lib/supabase/server").then(m => m.createAdminClient());

  // Get leads with their interaction data
  const { data: rawLeads } = await supabase
    .from("triage_leads")
    .select(
      "id, full_name, company_name, email, phone, current_state, service_requested, created_at"
    )
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false });

  // For each lead, calculate last_interaction_at and call_missed_count
  const leads = await Promise.all(
    (rawLeads ?? []).map(async (lead) => {
      const [{ data: interactions }, { count: missedCount }] = await Promise.all([
        supabaseAdmin
          .from("interactions")
          .select("created_at")
          .eq("client_id", lead.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("interactions")
          .select("id", { count: "exact", head: true })
          .eq("client_id", lead.id)
          .eq("type", "call_missed"),
      ]);

      return {
        ...lead,
        current_state: lead.current_state ?? "nuevo_lead",
        last_interaction_at: interactions?.[0]?.created_at ?? null,
        call_missed_count: missedCount ?? 0,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Preconsultoría
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Leads en captación. Arrastra para cambiar estado. En &quot;Listo para tramitar&quot; usa &quot;Pasar a Consultoría&quot;.
        </p>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-8 text-center text-slate-500">
          No hay leads activos en preconsultoría.
        </div>
      ) : (
        <PreconsultoriaKanban leads={leads} />
      )}
    </div>
  );
}
