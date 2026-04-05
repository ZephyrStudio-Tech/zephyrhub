"use server";

import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateContractState(
  contractId: string,
  newState: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Get the contract to find the client_id for audit log and ownership check
  const { data: contract } = await supabaseAdmin
    .from("contracts")
    .select("id, client_id")
    .eq("id", contractId)
    .single();

  if (!contract) return { ok: false, error: "Contrato no encontrado" };

  // Ownership check for consultores
  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", contract.client_id)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  // Update contract state
  const { error: updateError } = await supabaseAdmin
    .from("contracts")
    .update({ current_state: newState })
    .eq("id", contractId);

  if (updateError) return { ok: false, error: updateError.message };

  // Register in audit logs
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "update_contract_state",
    entity_type: "contract",
    entity_id: contractId,
    payload: { client_id: contract.client_id, new_state: newState },
  });

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}
