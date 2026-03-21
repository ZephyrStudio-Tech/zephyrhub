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
      "id, company_name, cif, current_state, service_type, consultant_id, user_id, created_at, has_web_contract, has_ecommerce_contract, has_device, service_description, bono_granted_at"
    )
    .eq("id", id)
    .single();

  if (role === "consultor") {
    const { data: c } = await query;
    if (!c || c.consultant_id !== user.id) notFound();
  }

  // Execute all queries in parallel
  const [{ data: client, error }, { data: interactions }, { data: documents }, { data: contracts }, { data: deviceOrders }, { data: payments }] =
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
      supabase
        .from("contracts")
        .select("id, type, current_state")
        .eq("client_id", id),
      supabase
        .from("device_orders")
        .select("id, status, device_id, shipping_address, shipping_city, shipping_postal_code, surcharge, payment_status, tracking_number, tracking_url")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("payments")
        .select("id, contract_type, phase, expected_amount, received_amount, received_at, agent_commission")
        .eq("client_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (error || !client) notFound();

  const slots = getVaultSlots(client.service_type as "web" | "ecommerce" | "seo" | "factura_electronica");
  const suggestedNext = getSuggestedNextState(client.current_state as PipelineState);

  return (
    <ClientDetailView
      client={client}
      interactions={interactions ?? []}
      documents={documents ?? []}
      contracts={contracts ?? []}
      deviceOrders={deviceOrders ?? []}
      payments={payments ?? []}
      slots={slots}
      phases={PHASES}
      suggestedNext={suggestedNext}
    />
  );
}
