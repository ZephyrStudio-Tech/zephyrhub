import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PreconsultoriaKanban } from "./preconsultoria-kanban";
import { NewLeadModal } from "./new-lead-modal";

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

  const leadIds = (rawLeads ?? []).map(l => l.id);

  if (leadIds.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Preconsultoría
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Leads en captación. Arrastra para cambiar estado. En &quot;Listo para tramitar&quot; usa &quot;Pasar a Consultoría&quot;.
            </p>
          </div>
          <NewLeadModal />
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-8 text-center text-slate-500">
          No hay leads activos en preconsultoría.
        </div>
      </div>
    );
  }

  // Note: triage_leads has last_interaction_at and call_missed_count fields that are auto-updated
  // by database triggers when interactions are logged. We can fetch these directly from triage_leads
  // instead of querying interactions table for performance
  const { data: leadsWithInteractions } = await supabaseAdmin
    .from("triage_leads")
    .select("id, last_interaction_at, call_missed_count")
    .in("id", leadIds);

  const leads = (rawLeads ?? []).map((lead) => {
    const interaction = (leadsWithInteractions ?? []).find(l => l.id === lead.id);
    return {
      ...lead,
      current_state: lead.current_state ?? "nuevo_lead",
      last_interaction_at: interaction?.last_interaction_at ?? null,
      call_missed_count: interaction?.call_missed_count ?? 0,
    };
  });

  return (
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Preconsultoría
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestión de captación y triage de nuevos leads.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Leads</span>
            <span className="text-lg font-black text-brand-600">{leads.length}</span>
          </div>
          <NewLeadModal />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PreconsultoriaKanban leads={leads} />
      </div>
    </div>
  );
}
