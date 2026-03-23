"use server";

import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function registerCallMissed(
  clientId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Ownership check for consultores
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

  const now = new Date();
  const { error: interactionErr } = await supabaseAdmin.from("interactions").insert({
    client_id: clientId,
    actor_id: user.id,
    type: "call_missed",
    metadata: { at: now.toISOString() },
  });

  if (interactionErr) return { ok: false, error: interactionErr.message };

  const { data: interaction } = await supabaseAdmin
    .from("interactions")
    .select("id")
    .eq("client_id", clientId)
    .eq("actor_id", user.id)
    .eq("type", "call_missed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const message = `Intentamos contactar contigo el ${now.toLocaleDateString("es")} a las ${now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}. Por favor revisa el email o avísanos.`;

  await supabaseAdmin.from("alerts").insert({
    client_id: clientId,
    message,
    interaction_id: interaction?.id ?? null,
  });

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "call_missed",
    entity_type: "client",
    entity_id: clientId,
    payload: { at: now.toISOString() },
  });

  revalidatePath("/backoffice");
  revalidatePath("/portal");
  return { ok: true };
}

export async function registerCallSuccess(
  clientId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Ownership check for consultores
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

  const { error } = await supabaseAdmin.from("interactions").insert({
    client_id: clientId,
    actor_id: user.id,
    type: "call_success",
    metadata: { at: new Date().toISOString() },
  });

  if (error) return { ok: false, error: error.message };

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "call_success",
    entity_type: "client",
    entity_id: clientId,
    payload: { at: new Date().toISOString() },
  });

  revalidatePath("/backoffice");
  return { ok: true };
}
