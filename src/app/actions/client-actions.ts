"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();

  // Get the contract to find the client_id for audit log
  const { data: contract } = await supabaseAdmin
    .from("contracts")
    .select("id, client_id")
    .eq("id", contractId)
    .single();

  if (!contract) return { ok: false, error: "Contrato no encontrado" };

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("clients")
    .update({ has_device: enabled })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  // If enabling has_device, the trigger will create the device_order automatically
  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}
