"use server";

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

export async function updateClientContactInfo(
  clientId: string,
  data: {
    full_name?: string;
    email?: string;
    phone?: string;
    cif?: string;
    service_description?: string;
    associate_id?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Ownership check
  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", clientId)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

/**
 * Elimina un cliente y todos sus registros relacionados (destructivo)
 * Orden de borrado para evitar FK violations: interactions, documents, contracts, device_orders, payments, alerts, referrals, clients
 */
export async function deleteClientRecord(
  clientId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Ownership check for consultors
  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", clientId)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para eliminar este cliente" };
    }
  }

  // Borrar en orden para evitar FK violations
  await supabaseAdmin.from("interactions").delete().eq("client_id", clientId);
  await supabaseAdmin.from("documents").delete().eq("client_id", clientId);
  await supabaseAdmin.from("contracts").delete().eq("client_id", clientId);
  await supabaseAdmin.from("device_orders").delete().eq("client_id", clientId);
  await supabaseAdmin.from("payments").delete().eq("client_id", clientId);
  await supabaseAdmin.from("alerts").delete().eq("client_id", clientId);
  await supabaseAdmin.from("referrals").delete().eq("client_id", clientId);

  const { error } = await supabaseAdmin
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/consultoria");
  revalidatePath("/backoffice/assign");
  return { ok: true };
}

export async function getClientDetail(clientId: string) {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: client, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const [
    { data: interactions },
    { data: documents },
    { data: contracts },
    { data: deviceOrders },
    { data: payments },
    { data: referral },
  ] = await Promise.all([
    supabaseAdmin
      .from("interactions")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("slot_type")
      .order("version", { ascending: false }),
    supabaseAdmin.from("contracts").select("*").eq("client_id", clientId),
    supabaseAdmin
      .from("device_orders")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("referrals")
      .select("id, commission_status, associates(full_name)")
      .eq("client_id", clientId)
      .single(),
  ]);

  const { getVaultSlots } = await import("@/lib/service-config");
  const slots = getVaultSlots(client.service_type);

  return {
    ok: true,
    data: {
      client,
      interactions: interactions ?? [],
      documents: documents ?? [],
      contracts: contracts ?? [],
      deviceOrders: deviceOrders ?? [],
      payments: payments ?? [],
      referral: referral ?? null,
      slots,
    },
  };
}
