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

  // Bulk fetch data to avoid N+1 queries
  const [
    { data: latestInteractions },
    { data: callMissedCounts },
    { data: allReferrals }
  ] = await Promise.all([
    // Latest interaction for each lead using a more efficient query if possible,
    // or just fetching all and reducing (safer without custom Postgres functions)
    supabaseAdmin
      .from("interactions")
      .select("client_id, created_at")
      .in("client_id", leadIds)
      .order("created_at", { ascending: false }),

    // Count of missed calls per lead
    supabaseAdmin
      .from("interactions")
      .select("client_id")
      .in("client_id", leadIds)
      .eq("type", "call_missed"),

    supabaseAdmin
      .from("referrals")
      .select("client_id")
      .in("client_id", leadIds)
  ]);

  const leads = (rawLeads ?? []).map((lead) => {
    const latestInteraction = (latestInteractions ?? []).find(i => i.client_id === lead.id);
    const referral = (allReferrals ?? []).find(r => r.client_id === lead.id);
    const missedCount = (callMissedCounts ?? []).filter(i => i.client_id === lead.id).length;

    return {
      ...lead,
      current_state: lead.current_state ?? "nuevo_lead",
      last_interaction_at: latestInteraction?.created_at ?? null,
      call_missed_count: missedCount,
      has_referral: !!referral,
    };
  });

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
      <PreconsultoriaKanban leads={leads} />
    </div>
  );
}
