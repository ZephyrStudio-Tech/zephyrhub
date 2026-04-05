"use server";

import { requireServerAuth } from "@/lib/auth";
import { createUserWithProfile } from "@/lib/create-user";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

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

export async function createAndLinkReferral(clientId: string, associateId: string) {
  const auth = await requireServerAuth(["admin", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  // 1. Get client data
  const { data: client, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("full_name, email, phone, company_name, current_state")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) return { ok: false, error: "Cliente no encontrado" };

  // 2. Get associate data
  const { data: associate, error: assocErr } = await supabaseAdmin
    .from("associates")
    .select("default_commission")
    .eq("id", associateId)
    .single();

  if (assocErr || !associate) return { ok: false, error: "Asociado no encontrado" };

  // 3. Determine commission status based on client state
  let commissionStatus = "pendiente";
  const confirmedStates = [
    "resolucion_red_es",
    "pago_i_fase",
    "ano_mantenimiento",
    "justificacion_ii_fase",
    "firma_justificacion_ii",
    "subsanacion_fase_ii",
    "resolucion_ii_red_es",
    "ganada",
  ];
  const reclaimableStates = [
    "ano_mantenimiento",
    "justificacion_ii_fase",
    "firma_justificacion_ii",
    "subsanacion_fase_ii",
    "resolucion_ii_red_es",
    "ganada",
  ];

  if (confirmedStates.includes(client.current_state)) {
    commissionStatus = "confirmada";
  }
  if (reclaimableStates.includes(client.current_state)) {
    commissionStatus = "reclamable";
  }

  // 4. Insert referral
  const { error: insertErr } = await supabaseAdmin.from("referrals").insert({
    associate_id: associateId,
    client_id: clientId,
    contact_name: client.full_name,
    contact_phone: client.phone,
    contact_email: client.email,
    company_name: client.company_name,
    commission_amount: associate.default_commission,
    status: "en_proceso",
    commission_status: commissionStatus,
  });

  if (insertErr) return { ok: false, error: insertErr.message };

  // 5. Audit log
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "link_referral",
    entity_type: "client",
    entity_id: clientId,
    payload: { associate_id: associateId },
  });

  revalidatePath("/backoffice/clients/[id]", "layout");
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

  // Use shared user creation logic
  const userResult = await createUserWithProfile(supabaseAdmin, {
    email: data.email,
    password: data.password,
    full_name: data.full_name,
    role: "asociado",
  });

  if (!userResult.ok || !userResult.userId) {
    return { ok: false, error: userResult.error || "Error al crear usuario" };
  }

  // Create associate record
  const { error: assocError } = await supabaseAdmin.from("associates").insert({
    id: userResult.userId,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    entity_type: data.entity_type,
    default_commission: data.default_commission || 200,
    is_active: true,
  });

  if (assocError) return { ok: false, error: assocError.message };

  // 4. Send welcome email
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("[Email] Enviando email de bienvenida a", data.email, "con rol asociado");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ZephyrStudio <hola@kitdigitalzephyrstudio.es>",
        to: data.email,
        subject: "Tu acceso como Asociado ZephyrStudio",
        html: `
<!doctype html>
<html>
<head>
  <style>
    body { background-color: #030305; font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background-color: #0a0f1e; border: 1px solid #1a2540; border-radius: 20px; padding: 32px; color: #94a3b8; }
    .badge { display: inline-block; background: #150a28; border: 1px solid #2a1a4a; border-radius: 100px; padding: 5px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #c084fc; margin-bottom: 20px; }
    h1 { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 16px 0; }
    .creds { background: #050d1a; border: 1px solid #0e3a5c; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .creds-row { font-size: 14px; margin-bottom: 8px; color: #94a3b8; }
    .creds-val { color: #ffffff; font-weight: 600; }
    .pass { font-family: monospace; color: #c084fc; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; }
    .steps { margin: 24px 0; }
    .step { position: relative; padding-left: 24px; margin-bottom: 12px; font-size: 13px; }
    .step-num { position: absolute; left: 0; color: #c084fc; font-weight: 700; }
    .btn { display: inline-block; background: #c084fc; color: #000000 !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 100px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="badge">Bienvenido Asociado</div>
      <h1>Hola <span style="color:#c084fc;">${data.full_name.split(' ')[0]}</span>, Ya eres asociado</h1>
      <p>Tu cuenta de asociado en ZephyrStudio está activa. Podrás enviar referidos y hacer seguimiento de tus comisiones en tiempo real.</p>

      <div class="creds">
        <div class="creds-row">Portal: <span class="creds-val">app.kitdigitalzephyrstudio.es/asociado</span></div>
        <div class="creds-row">Usuario: <span class="creds-val">${data.email}</span></div>
        <div class="creds-row">Contraseña: <span class="creds-val pass">${data.password}</span></div>
      </div>

      <div class="steps">
        <div class="step"><span class="step-num">01</span> Accede y cambia tu contraseña temporal.</div>
        <div class="step"><span class="step-num">02</span> Añade tus datos fiscales e IBAN para recibir comisiones.</div>
        <div class="step"><span class="step-num">03</span> Envía tu primer referido desde "Mis referidos".</div>
        <div class="step"><span class="step-num">04</span> Recibirás 200€ por cada expediente que lleguemos a cobrar.</div>
      </div>

      <a href="https://app.kitdigitalzephyrstudio.es/asociado" class="btn">Entrar a mi Portal →</a>
    </div>
  </div>
</body>
</html>
        `
      });
    } catch (e) {
      console.error("[Associate Email Error]", e);
    }
  }

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}
