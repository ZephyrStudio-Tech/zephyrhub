import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PipelineView } from "../pipeline-view";
import type { KanbanItem } from "../pipeline-view";
import { CONSULTORIA_STATE_LABELS } from "@/lib/state-machine/constants";

const POST_DEV_STATES = [
  "empezar_desarrollo",
  "presentar_justificacion_fase_i",
  "firma_justificacion",
  "subsanacion_fase_i",
  "resolucion_red_es",
  "pago_i_fase",
  "ano_mantenimiento",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
  "resolucion_ii_red_es",
  "ganada",
  "perdida",
];

export default async function ConsultoriaPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  // === FIX CRÍTICO: Usamos supabaseAdmin para garantizar la carga de datos sin bloqueos RLS ===
  const supabaseAdmin = await import("@/lib/supabase/server").then(m => m.createAdminClient());

  let query = supabaseAdmin
    .from("clients")
    .select("id, company_name, cif, full_name, email, phone, current_state, service_type, consultant_id, created_at, pending_docs, contracts(id, type, current_state)")
    .order("created_at", { ascending: false })
    .limit(150);

  if (role === "consultor") {
    query = query.eq("consultant_id", user.id);
  }

  const { data: rawClients, error } = await query;
  if (error) console.error("[Consultoria] Error fetching clients:", error);

  const clientIds = (rawClients ?? []).map(c => c.id);

  const { data: allInteractions } = clientIds.length > 0
    ? await supabaseAdmin
      .from("interactions")
      .select("client_id, created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false })
    : { data: [] };

  const kanbanItems: KanbanItem[] = [];

  (rawClients ?? []).forEach((client) => {
    const latestInteraction = (allInteractions ?? []).find(i => i.client_id === client.id);
    const clientWithInteraction = {
      ...client,
      last_interaction_at: latestInteraction?.created_at ?? null,
    };

    if (POST_DEV_STATES.includes(client.current_state)) {
      const contracts = client.contracts ?? [];

      if (contracts.length > 0) {
        contracts.forEach((contract: any) => {
          kanbanItems.push({
            type: "contract",
            contractType: contract.type,
            clientId: client.id,
            id: `contract-${contract.id}`,
            current_state: contract.current_state,
            company_name: client.company_name,
            cif: client.cif,
            email: client.email,
            phone: client.phone,
            service_type: client.service_type,
            consultant_id: client.consultant_id,
            created_at: client.created_at,
            last_interaction_at: clientWithInteraction.last_interaction_at,
            pending_docs: client.pending_docs,
          });
        });
      } else {
        // Fallback blindado
        kanbanItems.push({
          ...clientWithInteraction,
          clientId: client.id,
          id: `client-limbo-${client.id}`,
          type: "client",
          current_state: client.current_state,
        });
      }
    } else {
      // Fase Pre-desarrollo
      kanbanItems.push({
        ...clientWithInteraction,
        clientId: client.id,
        id: `client-${client.id}`,
        type: "client",
        current_state: client.current_state,
      });
    }
  });

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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tarjetas Activas</span>
            <span className="text-lg font-black text-brand-600">{kanbanItems.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PipelineView
          kanbanItems={kanbanItems}
          stateLabels={CONSULTORIA_STATE_LABELS}
        />
      </div>
    </div>
  );
}