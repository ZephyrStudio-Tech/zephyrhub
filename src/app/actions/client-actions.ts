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
