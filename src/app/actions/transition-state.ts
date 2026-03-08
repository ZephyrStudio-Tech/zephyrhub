"use server";

import { createClient } from "@/lib/supabase/server";
import { validateTransition } from "@/lib/state-machine/machine";
import { revalidatePath } from "next/cache";

export async function transitionClientState(
  clientId: string,
  toState: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("current_state, consultant_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) return { ok: false, error: "Cliente no encontrado" };

  const fromState = client.current_state as string;
  const validation = validateTransition(fromState, toState);
  if (!validation.valid) return { ok: false, error: validation.error };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;
  const canChange =
    role === "admin" ||
    (role === "consultor" && client.consultant_id === user.id);
  if (!canChange) return { ok: false, error: "Sin permiso para cambiar estado" };

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      current_state: toState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (updateError) return { ok: false, error: updateError.message };

  await supabase.from("interactions").insert({
    client_id: clientId,
    actor_id: user.id,
    type: "state_change",
    metadata: { from: fromState, to: toState },
  });

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "state_change",
    entity_type: "client",
    entity_id: clientId,
    payload: { from: fromState, to: toState },
  });

  // Optional: call Loops webhook (env LOOPs_WEBHOOK_URL)
  const webhookUrl = process.env.LOOPS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "state_change",
          client_id: clientId,
          from: fromState,
          to: toState,
        }),
      });
    } catch {
      // Log but don't fail the transition
    }
  }

  revalidatePath("/backoffice");
  revalidatePath("/portal");
  return { ok: true };
}
