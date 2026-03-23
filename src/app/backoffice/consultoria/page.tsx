import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PipelineView } from "../pipeline-view";
import { CONSULTORIA_STATE_LABELS } from "@/lib/state-machine/constants";

export default async function ConsultoriaPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const supabaseAdmin = await import("@/lib/supabase/server").then(m => m.createAdminClient());

  let query = supabase
    .from("clients")
    .select("id, company_name, cif, current_state, service_type, consultant_id, created_at, pending_docs")
    .order("created_at", { ascending: false });

  if (role === "consultor") {
    query = query.eq("consultant_id", user.id);
  }

  const { data: rawClients } = await query;
  const clientIds = (rawClients ?? []).map(c => c.id);

  // Bulk fetch last interactions to avoid N+1 queries
  const { data: allInteractions } = clientIds.length > 0
    ? await supabaseAdmin
        .from("interactions")
        .select("client_id, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Map interactions to clients efficiently
  const clients = (rawClients ?? []).map((client) => {
    const latestInteraction = (allInteractions ?? []).find(i => i.client_id === client.id);
    return {
      ...client,
      last_interaction_at: latestInteraction?.created_at ?? null,
    };
  });

  const clientCount = clients.length;

  return (
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Consultoría
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestión de expedientes en fase de tramitación oficial.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Expedientes</span>
            <span className="text-lg font-black text-brand-600">{clientCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PipelineView
          clients={clients}
          stateLabels={CONSULTORIA_STATE_LABELS}
        />
      </div>
    </div>
  );
}
