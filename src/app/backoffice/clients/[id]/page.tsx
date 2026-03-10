import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PHASES, getSuggestedNextState } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { getVaultSlots } from "@/lib/service-config";
import { ClientDetailView } from "./client-detail-view";

export default async function BackofficeClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select(
      "id, company_name, cif, current_state, service_type, consultant_id, user_id, created_at"
    )
    .eq("id", id)
    .single();

  if (role === "consultor") {
    const { data: c } = await query;
    if (!c || c.consultant_id !== user.id) notFound();
  }

  // Execute all three queries in parallel
  const [{ data: client, error }, { data: interactions }, { data: documents }] =
    await Promise.all([
      query,
      supabase
        .from("interactions")
        .select("id, type, metadata, created_at, actor_id")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("documents")
        .select(
          "id, slot_type, version, status, rejection_reason, storage_path, uploaded_at"
        )
        .eq("client_id", id)
        .order("slot_type")
        .order("version", { ascending: false }),
    ]);

  if (error || !client) notFound();

  const slots = getVaultSlots(client.service_type as "web" | "ecommerce" | "seo" | "factura_electronica");
  const suggestedNext = getSuggestedNextState(client.current_state as PipelineState);

  return (
    <ClientDetailView
      client={client}
      interactions={interactions ?? []}
      documents={documents ?? []}
      slots={slots}
      phases={PHASES}
      suggestedNext={suggestedNext}
    />
  );
}
