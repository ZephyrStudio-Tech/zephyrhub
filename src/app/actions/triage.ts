"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Mapea service_requested (triage) → service_type (clients). factura → factura_electronica */
function mapServiceType(
  serviceRequested: string | null
): "web" | "ecommerce" | "seo" | "factura_electronica" {
  if (serviceRequested === "factura") return "factura_electronica";
  if (
    serviceRequested === "web" ||
    serviceRequested === "ecommerce" ||
    serviceRequested === "seo"
  ) {
    return serviceRequested;
  }
  return "web";
}

/**
 * Convierte un lead de triage en expediente (clients). Crea la fila en clients
 * con current_state = 'nuevo_lead' y marca el lead como completed.
 * No crea auth user ni profile (se hará en otro paso).
 */
export async function convertLeadToClient(
  leadId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;
  if (!["consultor", "tecnico", "admin"].includes(role ?? "")) {
    return { ok: false, error: "Sin permiso para convertir leads" };
  }

  const { data: lead, error: leadErr } = await supabase
    .from("triage_leads")
    .select(
      "id, full_name, phone, email, province, company_name, nif, entity_type, company_size, service_requested, hardware_pref, web_state, complemento, kit_digital_prev"
    )
    .eq("id", leadId)
    .eq("status", "pending")
    .single();

  if (leadErr || !lead) {
    return { ok: false, error: "Lead no encontrado o ya procesado" };
  }

  const serviceType = mapServiceType(lead.service_requested);
  const companyName = (lead.company_name?.trim() || lead.full_name) || "Sin nombre";

  const { error: insertErr } = await supabase.from("clients").insert({
    company_name: companyName,
    cif: lead.nif ?? null,
    service_type: serviceType,
    current_state: "nuevo_lead",
    consultant_id: user.id,
    user_id: null,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    full_name: lead.full_name ?? null,
    province: lead.province ?? null,
    company_size: lead.company_size ?? null,
    entity_type: lead.entity_type ?? null,
    hardware_pref: lead.hardware_pref ?? null,
    web_state: lead.web_state ?? null,
    complemento: lead.complemento ?? null,
    kit_digital_prev: lead.kit_digital_prev ?? null,
    estado_hacienda: false,
  });

  if (insertErr) return { ok: false, error: insertErr.message };

  const { error: updateErr } = await supabase
    .from("triage_leads")
    .update({ status: "completed" })
    .eq("id", leadId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/triage");
  return { ok: true };
}

/**
 * Rechaza un lead (spam, competencia, no cualificado). Actualiza status a 'rejected'.
 */
export async function rejectLead(
  leadId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;
  if (!["consultor", "tecnico", "admin"].includes(role ?? "")) {
    return { ok: false, error: "Sin permiso para rechazar leads" };
  }

  const { data: lead, error: fetchErr } = await supabase
    .from("triage_leads")
    .select("id")
    .eq("id", leadId)
    .eq("status", "pending")
    .single();

  if (fetchErr || !lead) {
    return { ok: false, error: "Lead no encontrado o ya procesado" };
  }

  const { error: updateErr } = await supabase
    .from("triage_leads")
    .update({ status: "rejected" })
    .eq("id", leadId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/triage");
  return { ok: true };
}
