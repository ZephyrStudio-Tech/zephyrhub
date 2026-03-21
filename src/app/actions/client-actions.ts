"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
import { getSuggestedNextState } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { revalidatePath } from "next/cache";

export async function getSuggestedNext(
  currentState: string
): Promise<PipelineState | null> {
  return getSuggestedNextState(currentState as PipelineState);
}

export async function dismissAlert(
  alertId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth();
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", alertId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal");
  return { ok: true };
}

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
    .select("id, client_id, clients(consultant_id)")
    .eq("id", contractId)
    .single();

  if (!contract) return { ok: false, error: "Contrato no encontrado" };

  // Ownership check for consultores
  if (role === "consultor" && contract.clients?.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  // Update contract state
  const { error: updateError } = await supabaseAdmin
    .from("contracts")
    .update({ current_state: newState })
    .eq("id", contractId);

  if (updateError) return { ok: false, error: updateError.message };

  // Register in audit logs
  await supabaseAdmin.from("audit_logs").insert({
    client_id: contract.client_id,
    actor_id: user.id,
    action: "update_contract_state",
    changes: { contract_id: contractId, new_state: newState },
  });

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function updateDeviceOrderStatus(
  deviceOrderId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: order } = await supabaseAdmin
    .from("device_orders")
    .select("client_id, clients(consultant_id)")
    .eq("id", deviceOrderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };

  if (role === "consultor" && order.clients?.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({ status })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function updateDeviceOrderTracking(
  deviceOrderId: string,
  trackingNumber: string,
  trackingUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: order } = await supabaseAdmin
    .from("device_orders")
    .select("client_id, clients(consultant_id)")
    .eq("id", deviceOrderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };

  if (role === "consultor" && order.clients?.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function markPaymentReceived(
  paymentId: string,
  receivedAmount: number,
  receivedDate: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("payments")
    .update({ received_amount: receivedAmount, received_at: receivedDate })
    .eq("id", paymentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function updateServiceDescription(
  clientId: string,
  description: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("consultant_id")
    .eq("id", clientId)
    .single();

  if (!client) return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ service_description: description })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function toggleHasDevice(
  clientId: string,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("consultant_id")
    .eq("id", clientId)
    .single();

  if (!client) return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ has_device: enabled })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  // If enabling has_device, the trigger will create the device_order automatically
  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function assignConsultant(
  clientId: string,
  consultantId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ consultant_id: consultantId })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "assign_consultant",
    entity_type: "client",
    entity_id: clientId,
    payload: { consultant_id: consultantId },
  });

  revalidatePath("/backoffice/assign");
  return { ok: true };
}
