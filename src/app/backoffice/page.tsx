import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PipelineView } from "./pipeline-view";
import { PHASES } from "@/lib/state-machine/constants";

export default async function BackofficePage() {
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <PipelineView clients={clients ?? []} phases={PHASES} />
      <p className="text-sm text-muted">
        Para activar vista Kanban con Drag &amp; Drop:{" "}
        <code className="rounded bg-white/10 px-1">npm install @dnd-kit/core @dnd-kit/utilities</code> y añadir un
        componente que use <code className="rounded bg-white/10 px-1">transitionClientState</code> al soltar en otra fase. Ver README.
      </p>
    </div>
  );
}
