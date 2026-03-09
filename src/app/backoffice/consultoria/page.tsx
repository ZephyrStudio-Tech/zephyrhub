import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PipelineView } from "../pipeline-view";
import { CONSULTORIA_STATE_LABELS } from "@/lib/state-machine/constants";

export default async function ConsultoriaPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id, company_name, cif, current_state, service_type, consultant_id, created_at")
    .order("created_at", { ascending: false });

  if (role === "consultor") {
    query = query.eq("consultant_id", user.id);
  }

  const { data: clients } = await query;

  const clientCount = clients?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Consultoría
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Expedientes en tramitación. Arrastra las tarjetas para cambiar el estado.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl w-fit">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {clientCount}
        </span>
        expediente{clientCount !== 1 ? "s" : ""}
      </div>
      <PipelineView
        clients={clients ?? []}
        stateLabels={CONSULTORIA_STATE_LABELS}
      />
    </div>
  );
}
