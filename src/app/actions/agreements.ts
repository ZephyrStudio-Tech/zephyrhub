"use server";

import type React from "react";
import { createClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
import { getAgreementTemplate } from "@/lib/service-config";
import type { ServiceType } from "@/lib/service-config";
import { revalidatePath } from "next/cache";

export async function generateAgreement(
  clientId: string
): Promise<{ ok: boolean; error?: string; path?: string }> {
  const auth = await requireServerAuth(["admin", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  type ClientRow = {
    id: string;
    company_name: string | null;
    service_type: string | null;
    consultant_id: string | null;
  };

  const supabase = await createClient();
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, company_name, service_type, consultant_id")
    .eq("id", clientId)
    .single() as { data: ClientRow | null; error: unknown };

  if (clientErr || !client)
    return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso" };
  }

  const companyName = (client.company_name as string) || "Cliente";
  const serviceType = (client.service_type as ServiceType) ?? "web";
  const date = new Date().toLocaleDateString("es");

  let buffer: Buffer;
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { createElement } = await import("react");
    const { AgreementDocument } = await import("@/lib/agreement-pdf");
    const doc = createElement(
      AgreementDocument as React.ComponentType<{
        companyName: string;
        serviceType: ServiceType;
        date: string;
      }>,
      { companyName, serviceType, date }
    );
    buffer = (await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0])) as Buffer;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error generando PDF",
    };
  }

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
