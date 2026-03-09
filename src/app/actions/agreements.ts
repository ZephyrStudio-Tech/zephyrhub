"use server";

import type React from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAgreementTemplate } from "@/lib/service-config";
import type { ServiceType } from "@/lib/service-config";
import { revalidatePath } from "next/cache";

export async function generateAgreement(
  clientId: string
): Promise<{ ok: boolean; error?: string; path?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, company_name, service_type, consultant_id")
    .eq("id", clientId)
    .single();

  if (clientErr || !client)
    return { ok: false, error: "Cliente no encontrado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const canDo =
    profile?.role === "admin" ||
    (profile?.role === "consultor" && client.consultant_id === user.id);
  if (!canDo) return { ok: false, error: "Sin permiso" };

  const companyName = client.company_name || "Cliente";
  const serviceType = (client.service_type as ServiceType) ?? "web";
  const date = new Date().toLocaleDateString("es");

  let buffer: Buffer;
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const React = await import("react");
    const { AgreementDocument } = await import("@/lib/agreement-pdf");
    const doc = React.createElement(AgreementDocument, {
      companyName,
      serviceType,
      date,
    });
    buffer = (await renderToBuffer(doc as React.ReactElement)) as Buffer;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error generando PDF",
    };
  }

  const supabaseAdmin = createAdminClient();
  const path = `${clientId}/acuerdo_${Date.now()}.pdf`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from("documents")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { error: insertErr } = await supabaseAdmin.from("agreements").insert({
    client_id: clientId,
    storage_path: path,
  });

  if (insertErr) return { ok: false, error: insertErr.message };

  revalidatePath("/backoffice");
  revalidatePath("/portal");
  return { ok: true, path };
}
