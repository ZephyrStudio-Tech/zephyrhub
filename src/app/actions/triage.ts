"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PRECONSULTORIA_STATES = [
  "nuevo_lead",
  "no_contesta",
  "contactar_mas_tarde",
  "imposible_contactar",
  "consultoria",
  "listo_para_tramitar",
] as const;

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

/** Genera contraseña tipo "Kit" + 4 dígitos */
function generatePassword(): string {
  return "Kit" + Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Actualiza el current_state de un lead en triage_leads (para el Kanban de Preconsultoría).
 */
export async function updateTriageLeadState(
  leadId: string,
  toState: string
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
    return { ok: false, error: "Sin permiso" };
  }

  if (!PRECONSULTORIA_STATES.includes(toState as (typeof PRECONSULTORIA_STATES)[number])) {
    return { ok: false, error: "Estado no válido para preconsultoría" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("triage_leads")
    .update({ current_state: toState })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/backoffice/preconsultoria");
  return { ok: true };
}

/**
 * Pasa un lead de Preconsultoría a Consultoría: crea usuario en Auth, expediente en clients,
 * marca el lead como completed. Devuelve la contraseña generada para mostrarla al usuario.
 */
export async function moveToConsultoria(
  leadId: string
): Promise<{ ok: boolean; error?: string; password?: string }> {
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
    return { ok: false, error: "Sin permiso" };
  }

  const supabaseAdmin = createAdminClient();
  const { data: lead, error: leadErr } = await supabaseAdmin
    .from("triage_leads")
    .select(
      "id, full_name, phone, email, province, company_name, nif, entity_type, company_size, service_requested, hardware_pref, web_state, complemento, kit_digital_prev"
    )
    .eq("id", leadId)
    .in("status", ["pending", "in_progress"])
    .single();

  if (leadErr || !lead) {
    return { ok: false, error: "Lead no encontrado o ya procesado" };
  }

  const password = generatePassword();
  const { data: newUser, error: createUserErr } = await supabaseAdmin.auth.admin.createUser({
    email: lead.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: lead.full_name ?? undefined },
  });

  if (createUserErr || !newUser.user) {
    return { ok: false, error: createUserErr?.message ?? "Error creando usuario" };
  }

  const serviceType = mapServiceType(lead.service_requested);
  const companyName = (lead.company_name?.trim() || lead.full_name) || "Sin nombre";

  const { error: insertClientErr } = await supabaseAdmin.from("clients").insert({
    user_id: newUser.user.id,
    company_name: companyName,
    cif: lead.nif ?? null,
    service_type: serviceType,
    current_state: "esperando_concesion",
    consultant_id: user.id,
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

  if (insertClientErr) {
    return { ok: false, error: insertClientErr.message };
  }

  const { error: updateLeadErr } = await supabaseAdmin
    .from("triage_leads")
    .update({ status: "completed" })
    .eq("id", leadId);

  if (updateLeadErr) return { ok: false, error: updateLeadErr.message };

  revalidatePath("/backoffice/preconsultoria");
  revalidatePath("/backoffice/consultoria");
  return { ok: true, password };
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
    .in("status", ["pending", "in_progress"])
    .single();

  if (fetchErr || !lead) {
    return { ok: false, error: "Lead no encontrado o ya procesado" };
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateErr } = await supabaseAdmin
    .from("triage_leads")
    .update({ status: "rejected" })
    .eq("id", leadId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/preconsultoria");
  return { ok: true };
}
