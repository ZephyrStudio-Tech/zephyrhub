"use server";

import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateDeviceOrderStatus(
  deviceOrderId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: order } = await supabaseAdmin
    .from("device_orders")
    .select("client_id")
    .eq("id", deviceOrderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };

  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", order.client_id)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
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
    .select("client_id")
    .eq("id", deviceOrderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };

  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", order.client_id)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}
