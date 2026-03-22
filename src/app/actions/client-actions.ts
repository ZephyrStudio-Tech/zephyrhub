"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
import { Resend } from "resend";
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
  const auth = await requireServerAuth();
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", alertId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal");
  return { ok: true };
}

export async function updateContractState(
  contractId: string,
  newState: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Get the contract to find the client_id for audit log and ownership check
  const { data: contract } = await supabaseAdmin
    .from("contracts")
    .select("id, client_id")
    .eq("id", contractId)
    .single();

  if (!contract) return { ok: false, error: "Contrato no encontrado" };

  // Ownership check for consultores
  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", contract.client_id)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  // Update contract state
  const { error: updateError } = await supabaseAdmin
    .from("contracts")
    .update({ current_state: newState })
    .eq("id", contractId);

  if (updateError) return { ok: false, error: updateError.message };

  // Register in audit logs
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "update_contract_state",
    entity_type: "contract",
    entity_id: contractId,
    payload: { client_id: contract.client_id, new_state: newState },
  });

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function updateDeviceOrderStatus(
  deviceOrderId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: order } = await supabaseAdmin
    .from("device_orders")
    .select("client_id")
    .eq("id", deviceOrderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };

  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", order.client_id)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({ status })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function updateDeviceOrderTracking(
  deviceOrderId: string,
  trackingNumber: string,
  trackingUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: order } = await supabaseAdmin
    .from("device_orders")
    .select("client_id")
    .eq("id", deviceOrderId)
    .single();

  if (!order) return { ok: false, error: "Pedido no encontrado" };

  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", order.client_id)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function markPaymentReceived(
  paymentId: string,
  receivedAmount: number,
  receivedDate: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("payments")
    .update({ received_amount: receivedAmount, received_at: receivedDate })
    .eq("id", paymentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function updateServiceDescription(
  clientId: string,
  description: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("consultant_id")
    .eq("id", clientId)
    .single();

  if (!client) return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ service_description: description })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function toggleHasDevice(
  clientId: string,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico", "consultor"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("consultant_id")
    .eq("id", clientId)
    .single();

  if (!client) return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ has_device: enabled })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  // If enabling has_device, the trigger will create the device_order automatically
  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function assignConsultant(
  clientId: string,
  consultantId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ consultant_id: consultantId })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "assign_consultant",
    entity_type: "client",
    entity_id: clientId,
    payload: { consultant_id: consultantId },
  });

  revalidatePath("/backoffice/assign");
  return { ok: true };
}

export async function createInternalUser(data: any) {
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

  // 2. Create profile (upsert to handle existing profile created by trigger)
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: authUser.user.id,
    role: data.role,
    email: data.email,
    full_name: data.full_name,
  }, { onConflict: "id" });

  if (profileError) return { ok: false, error: profileError.message };

  // 3. Send welcome email
  if (process.env.RESEND_API_KEY) {
    try {
      console.log("[Email] Enviando email de bienvenida a", data.email, "con rol", data.role);
      const resend = new Resend(process.env.RESEND_API_KEY);
      const roleColors = {
        admin: { primary: "#f87171", bg: "#1a0a0a", border: "#3f1f1f", label: "Administrador" },
        consultor: { primary: "#60a5fa", bg: "#0a1628", border: "#1a2f4a", label: "Consultor" },
        tecnico: { primary: "#4ade80", bg: "#0a1f14", border: "#1a3a2a", label: "Técnico" },
      };
      const theme = roleColors[data.role as keyof typeof roleColors] || roleColors.consultor;

      await resend.emails.send({
        from: "ZephyrStudio <hola@kitdigitalzephyrstudio.es>",
        to: data.email,
        subject: "Tu acceso a ZephyrHub — Panel interno",
        html: `
<!doctype html>
<html>
<head>
  <style>
    body { background-color: #030305; font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background-color: #0a0f1e; border: 1px solid #1a2540; border-radius: 20px; padding: 32px; color: #94a3b8; }
    .badge { display: inline-block; background: ${theme.bg}; border: 1px solid ${theme.border}; border-radius: 100px; padding: 5px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${theme.primary}; margin-bottom: 20px; }
    h1 { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 16px 0; }
    .highlight { color: ${theme.primary}; }
    .creds { background: #050d1a; border: 1px solid #0e3a5c; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .creds-row { font-size: 14px; margin-bottom: 8px; color: #94a3b8; }
    .creds-val { color: #ffffff; font-weight: 600; }
    .pass { font-family: monospace; color: ${theme.primary}; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; }
    .steps { margin: 24px 0; }
    .step { position: relative; padding-left: 24px; margin-bottom: 12px; font-size: 13px; }
    .step-num { position: absolute; left: 0; color: ${theme.primary}; font-weight: 700; }
    .btn { display: inline-block; background: ${theme.primary}; color: #000000 !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 100px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="badge">Nuevo acceso equipo</div>
      <h1>Hola <span class="highlight">${data.full_name.split(' ')[0]}</span>, Bienvenido/a al equipo</h1>
      <p>Se ha creado tu cuenta de acceso al panel interno de ZephyrHub como <strong>${theme.label}</strong>. Desde aquí gestionarás los expedientes Kit Digital.</p>

      <div class="creds">
        <div class="creds-row">Panel: <span class="creds-val">app.kitdigitalzephyrstudio.es/backoffice</span></div>
        <div class="creds-row">Usuario: <span class="creds-val">${data.email}</span></div>
        <div class="creds-row">Contraseña: <span class="creds-val pass">${data.password}</span></div>
        <div class="creds-row">Rol: <span class="creds-val">${theme.label}</span></div>
      </div>

      <div class="steps">
        <div class="step"><span class="step-num">01</span> Accede y cambia tu contraseña temporal.</div>
        <div class="step"><span class="step-num">02</span> Revisa los expedientes asignados.</div>
        <div class="step"><span class="step-num">03</span> Contacta con el admin si necesitas ayuda.</div>
      </div>

      <a href="https://app.kitdigitalzephyrstudio.es/backoffice" class="btn">Entrar al Panel →</a>
    </div>
  </div>
</body>
</html>
        `
      });
    } catch (e) {
      console.error("[Email Error]", e);
    }
  }

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}

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

export async function updateClientContactInfo(
  clientId: string,
  data: {
    full_name?: string;
    email?: string;
    phone?: string;
    cif?: string;
    service_description?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  // Ownership check
  if (role === "consultor") {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("consultant_id")
      .eq("id", clientId)
      .single();
    if (client?.consultant_id !== user.id) {
      return { ok: false, error: "Sin permiso para este cliente" };
    }
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}

export async function getClientDetail(clientId: string) {
  const auth = await requireServerAuth(["admin", "consultor", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, role, supabaseAdmin } = auth;

  const { data: client, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) return { ok: false, error: "Cliente no encontrado" };

  if (role === "consultor" && client.consultant_id !== user.id) {
    return { ok: false, error: "Sin permiso para este cliente" };
  }

  const [
    { data: interactions },
    { data: documents },
    { data: contracts },
    { data: deviceOrders },
    { data: payments },
    { data: referral },
  ] = await Promise.all([
    supabaseAdmin
      .from("interactions")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("slot_type")
      .order("version", { ascending: false }),
    supabaseAdmin.from("contracts").select("*").eq("client_id", clientId),
    supabaseAdmin
      .from("device_orders")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("referrals")
      .select("id, commission_status, associates(full_name)")
      .eq("client_id", clientId)
      .single(),
  ]);

  const { getVaultSlots } = await import("@/lib/service-config");
  const slots = getVaultSlots(client.service_type);

  return {
    ok: true,
    data: {
      client,
      interactions: interactions ?? [],
      documents: documents ?? [],
      contracts: contracts ?? [],
      deviceOrders: deviceOrders ?? [],
      payments: payments ?? [],
      referral: referral ?? null,
      slots,
    },
  };
}

export async function updateInternalUserRole(userId: string, newRole: string) {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}
