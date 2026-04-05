"use server";

import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addClientNote(
  clientId: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin.from("interactions").insert({
    client_id: clientId,
    actor_id: user.id,
    type: "note",
    metadata: { content },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}
