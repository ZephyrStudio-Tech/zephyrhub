"use server";

import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createReferral(data: any) {
  const auth = await requireServerAuth(["asociado"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  // 1. Get associate_id
  const { data: associate, error: assocError } = await supabaseAdmin
    .from("associates")
    .select("id, default_commission")
    .eq("id", user.id)
    .single();

  if (assocError || !associate) {
    return { ok: false, error: "No se encontró el perfil de asociado" };
  }

  // 2. Insert referral
  const { error: insertError } = await supabaseAdmin.from("referrals").insert({
    associate_id: associate.id,
    contact_name: data.contact_name,
    contact_phone: data.contact_phone,
    contact_email: data.contact_email,
    entity_type: data.entity_type,
    company_name: data.company_name,
    dni_cif: data.dni_cif,
    fiscal_address: data.fiscal_address,
    notes: data.notes,
    commission_amount: associate.default_commission,
    status: "recibido",
    commission_status: "pendiente",
  });

  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath("/asociado/referidos");
  return { ok: true };
}

export async function updateAssociateProfile(data: any) {
  const auth = await requireServerAuth(["asociado"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("associates")
    .update({
      full_name: data.full_name,
      phone: data.phone,
      dni: data.dni,
      address: data.address,
      city: data.city,
      province: data.province,
      zip: data.zip,
      entity_type: data.entity_type,
      company_name: data.company_name,
      cif: data.cif,
      fiscal_address: data.fiscal_address,
      iban: data.iban,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/asociado/perfil");
  return { ok: true };
}

export async function markCommissionPaid(referralId: string, notes: string) {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("referrals")
    .update({
      commission_status: "pagada",
      commission_paid_at: new Date().toISOString(),
      commission_notes: notes,
    })
    .eq("id", referralId);

  if (error) return { ok: false, error: error.message };

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "commission_paid",
    entity_type: "referral",
    entity_id: referralId,
    payload: { notes },
  });

  revalidatePath("/backoffice/asociados");
  revalidatePath("/backoffice/referidos");
  return { ok: true };
}

export async function linkReferralToClient(referralId: string, clientId: string) {
  const auth = await requireServerAuth(["admin", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("referrals")
    .update({
      client_id: clientId,
      status: "en_proceso",
    })
    .eq("id", referralId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function toggleAssociateActive(associateId: string, isActive: boolean) {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("associates")
    .update({ is_active: isActive })
    .eq("id", associateId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}

export async function updateAssociateCommission(associateId: string, amount: number) {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("associates")
    .update({ default_commission: amount })
    .eq("id", associateId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}

export async function createAssociateAction(data: any) {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  // 1. Create user in Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  });

  if (authError || !authUser.user) {
    return { ok: false, error: authError?.message || "Error al crear usuario" };
  }

  // 2. Create profile
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: authUser.user.id,
    role: "asociado",
    email: data.email,
    full_name: data.full_name,
  });

  if (profileError) {
    // Cleanup auth user? Supabase admin can do it if needed.
    return { ok: false, error: profileError.message };
  }

  // 3. Create associate record
  const { error: assocError } = await supabaseAdmin.from("associates").insert({
    id: authUser.user.id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    entity_type: data.entity_type,
    default_commission: data.default_commission || 200,
    is_active: true,
  });

  if (assocError) return { ok: false, error: assocError.message };

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}
