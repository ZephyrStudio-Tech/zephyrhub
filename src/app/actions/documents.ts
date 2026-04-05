"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveDocument(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: doc, error: fetchErr } = await supabase.from("documents").select("id, client_id").eq("id", documentId).single();

  if (fetchErr || !doc) return { ok: false, error: "Documento no encontrado" };

  const auth = await requireServerAuth(["admin", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;
  const { error: updateErr } = await supabaseAdmin.from("documents").update({
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    rejection_reason: null,
  }).eq("id", documentId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await supabaseAdmin.from("interactions").insert({
    client_id: doc.client_id,
    actor_id: user.id,
    type: "document_approved",
    metadata: { document_id: documentId },
  });

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "document_approved",
    entity_type: "document",
    entity_id: documentId,
    payload: { client_id: doc.client_id },
  });

  revalidatePath("/backoffice");
  revalidatePath("/portal");
  return { ok: true };
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: doc, error: fetchErr } = await supabase.from("documents").select("id, client_id").eq("id", documentId).single();

  if (fetchErr || !doc) return { ok: false, error: "Documento no encontrado" };

  const auth = await requireServerAuth(["admin", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;
  const { error: updateErr } = await supabaseAdmin.from("documents").update({
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    rejection_reason: reason,
  }).eq("id", documentId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await supabaseAdmin.from("interactions").insert({
    client_id: doc.client_id,
    actor_id: user.id,
    type: "document_rejected",
    metadata: { document_id: documentId, reason },
  });

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "document_rejected",
    entity_type: "document",
    entity_id: documentId,
    payload: { client_id: doc.client_id, reason },
  });

  revalidatePath("/backoffice");
  revalidatePath("/portal");
  return { ok: true };
}