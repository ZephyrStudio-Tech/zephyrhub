"use server";

import { Resend } from "resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
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
  const auth = await requireServerAuth(["consultor", "tecnico", "admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  if (!PRECONSULTORIA_STATES.includes(toState as (typeof PRECONSULTORIA_STATES)[number])) {
    return { ok: false, error: "Estado no válido para preconsultoría" };
  }

  const { error } = await supabaseAdmin
    .from("triage_leads")
    .update({ current_state: toState })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/backoffice/preconsultoria");
  return { ok: true };
}

export async function createTriageLead(data: any) {
  const auth = await requireServerAuth(["consultor", "admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  const { error } = await supabaseAdmin.from("triage_leads").insert({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    company_name: data.company_name,
    entity_type: data.entity_type,
    service_requested: data.service_requested,
    complemento: data.notes,
    current_state: "nuevo_lead",
    status: "pending",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/preconsultoria");
  return { ok: true };
}

export async function addTriageNote(leadId: string, note: string) {
  const auth = await requireServerAuth(["consultor", "tecnico", "admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const { error } = await supabaseAdmin.from("interactions").insert({
    client_id: leadId,
    actor_id: user.id,
    type: "note",
    metadata: { note },
  });

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
  const auth = await requireServerAuth(["consultor", "tecnico", "admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { user, supabaseAdmin } = auth;

  const resend = new Resend(process.env.RESEND_API_KEY);
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

  // Enviar Email de Bienvenida con Resend
  if (process.env.RESEND_API_KEY && lead.email) {
    try {
      await resend.emails.send({
        from: "ZephyrStudio <hola@kitdigitalzephyrstudio.es>",
        to: lead.email,
        subject:
          "Tu bono Kit Digital está en trámite - Acceso al Portal",
        html: `
<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <title>Acceso al Portal — ZephyrStudio</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a { padding: 0; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    p { display: block; margin: 13px 0; }
  </style>
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 { width: 100% !important; max-width: 100%; }
    }
  </style>
  <style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 { width: 100% !important; max-width: 100%; }
  </style>
  <style type="text/css">
    @media only screen and (max-width:479px) {
      table.mj-full-width-mobile { width: 100% !important; }
      td.mj-full-width-mobile { width: auto !important; }
    }
  </style>
  <style type="text/css">
    body { margin: 0 !important; padding: 0 !important; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    .badge { display: inline-block; background: #0a1628; border: 1px solid #0e3a5c; border-radius: 100px; padding: 5px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #00e5ff; }
    .badge-dot { display: inline-block; width: 6px; height: 6px; background: #00e5ff; border-radius: 50%; vertical-align: middle; margin-right: 6px; margin-top: -1px; }
    .status-glass { background: #050d1a; border: 1px solid #0e3a5c; border-radius: 12px; padding: 20px 24px; }
    .status-tag { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #00e5ff; margin-bottom: 14px; }
    .status-row { font-size: 14px; font-weight: 400; color: #94a3b8; margin-bottom: 12px; }
    .status-row:last-child { margin-bottom: 0; }
    .status-dot { color: #00e5ff; font-size: 16px; margin-right: 8px; vertical-align: middle; }
    .credential-value { color: #ffffff; font-weight: 600; }
    .password-pill { font-family: monospace; font-size: 14px; color: #00e5ff; background: rgba(0, 229, 255, 0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(0, 229, 255, 0.25); letter-spacing: 1px; }
    .timeline-label { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: #475569; margin-bottom: 18px; }
    .tl-row { padding: 0 0 16px 20px; border-left: 1px solid #1e293b; margin-left: 4px; position: relative; font-size: 13px; color: #64748b; font-weight: 400; line-height: 1.5; }
    .tl-row.last { border-left: 1px solid transparent; padding-bottom: 0; color: #ffffff; font-weight: 600; }
    .tl-num { font-size: 10px; font-weight: 700; color: #334155; margin-right: 5px; }
    .tl-num-active { font-size: 10px; font-weight: 700; color: #00e5ff; margin-right: 5px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #0022ff, #000f8a); color: #ffffff !important; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; text-decoration: none !important; padding: 14px 32px; border-radius: 100px; border: 1px solid #1a3a6e; }
    .micro { font-size: 11px; color: #475569; text-align: center; }
    .micro-dot { display: inline-block; width: 4px; height: 4px; background: #334155; border-radius: 50%; vertical-align: middle; margin: 0 6px; }
    .footer-brand { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #334155; }
    .footer-partner { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #1e293b; margin-top: 4px; }
    @media (prefers-color-scheme: dark) { .email-body { background-color: #030305 !important; } }
  </style>
</head>
<body style="word-spacing:normal;background-color:#030305;">
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Hemos creado tu acceso al portal del Kit Digital, ${companyName || lead.full_name || "Cliente"}.</div>
  <div aria-label="Acceso al Portal — ZephyrStudio" aria-roledescription="email" class="email-body" style="background-color:#030305;" role="article" lang="und" dir="auto">
    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:32px 0 0 0;text-align:center;"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:0 24px 28px 24px;text-align:center;">
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <tr>
                      <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                          <tbody>
                            <tr>
                              <td style="width:140px;">
                                <img alt="ZephyrStudio" src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logo_zephyrstudio.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="140" />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background:#030305;background-color:#030305;margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#030305;background-color:#030305;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:0 16px 12px 16px;text-align:center;">
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                  <tbody>
                    <tr>
                      <td style="background-color:#0a0f1e;border:1px solid #1a2540;border-radius:20px;border-top:1px solid #2a3a60;vertical-align:top;border-collapse:separate;padding:32px 28px 36px 28px;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%">
                          <tbody>
                            <tr>
                              <td align="center" style="font-size:0px;padding:0 0 20px 0;word-break:break-word;">
                                <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:14px;font-weight:400;line-height:1.65;text-align:center;color:#94a3b8;"><span class="badge">
                                    <span class="badge-dot"></span>NUEVO ACCESO GENERADO </span></div>
                              </td>
                            </tr>
                            <tr>
                              <td align="center" style="font-size:0px;padding:0 0 10px 0;word-break:break-word;">
                                <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.03em;line-height:1.15;text-align:center;color:#ffffff;">Hola <span style="color:#00e5ff;">${companyName || lead.full_name || "Cliente"}</span>,<br /> ¡Buenas noticias!</div>
                              </td>
                            </tr>
                            <tr>
                              <td align="center" style="font-size:0px;padding:0 8px 28px 8px;word-break:break-word;">
                                <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:14px;font-weight:400;line-height:1.65;text-align:center;color:#94a3b8;">Tu expediente del <strong style="color:#ffffff;font-weight:600;">Kit Digital</strong> ha pasado a la fase de tramitación oficial. Hemos habilitado tu portal de cliente para que hagas seguimiento.</div>
                              </td>
                            </tr>
                            <tr>
                              <td align="left" style="font-size:0px;padding:0;word-break:break-word;">
                                <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:14px;font-weight:400;line-height:1.65;text-align:left;color:#94a3b8;">
                                  <div class="status-glass">
                                    <span class="status-tag">Tus Credenciales de Acceso</span>
                                    <div class="status-row">
                                      <span class="status-dot">●</span>Portal: <a href="https://app.kitdigitalzephyrstudio.es/login" style="color:#00e5ff; text-decoration:none; font-weight: 600;">app.kitdigitalzephyrstudio.es</a>
                                    </div>
                                    <div class="status-row">
                                      <span class="status-dot">●</span>Usuario: <span class="credential-value">${lead.email}</span>
                                    </div>
                                    <div class="status-row">
                                      <span class="status-dot">●</span>Contraseña: <span class="password-pill">${password}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:0 16px 12px 16px;text-align:center;">
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                  <tbody>
                    <tr>
                      <td style="background-color:#0a0f1e;border:1px solid #1a2540;border-radius:18px;border-top:1px solid #1e2e50;vertical-align:top;border-collapse:separate;padding:24px 24px 24px 28px;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%">
                          <tbody>
                            <tr>
                              <td align="left" style="font-size:0px;padding:0 0 18px 0;word-break:break-word;">
                                <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:14px;font-weight:400;line-height:1.65;text-align:left;color:#94a3b8;"><span class="timeline-label">Tus próximos pasos</span>
                                  <div class="tl-row">
                                    <span class="tl-num-active">01</span>Accede al portal y cambia tu contraseña temporal.
                                  </div>
                                  <div class="tl-row">
                                    <span class="tl-num">02</span>Sube tu documentación en la Bóveda Segura (DNI, escrituras).
                                  </div>
                                  <div class="tl-row last">
                                    <span class="tl-num">03</span>Revisa los videotutoriales de la Academia.
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:8px 16px 4px 16px;text-align:center;">
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <tr>
                      <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                        <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:14px;font-weight:400;line-height:1.65;text-align:center;color:#94a3b8;"><a href="https://app.kitdigitalzephyrstudio.es/login" class="cta-btn"> Entrar al Portal B2B → </a></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:24px 16px 0px 16px;text-align:center;">
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:center;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <tr>
                      <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                        <div style="font-family:-apple-system, 'Helvetica Neue', Arial, sans-serif;font-size:11px;font-weight:400;line-height:1.5;text-align:center;color:#475569;"><span class="micro">© 2024 ZephyrStudio. Todos los derechos reservados.</span> <span class="micro-dot"></span> <span class="micro"><a href="https://www.kitdigitalzephyrstudio.es/privacidad" style="color: #475569; text-decoration: none;">Aviso de Privacidad</a></span></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
        `,
      });
    } catch (emailErr) {
      console.error("[v0] Email sending failed:", emailErr);
      // No retornamos error, el flujo continúa
    }
  }

  revalidatePath("/backoffice/preconsultoria");
  return { ok: true, password };
}

/**
 * Rechaza un lead (spam, competencia, no cualificado). Actualiza status a 'rejected'.
 */
export async function rejectLead(
  leadId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["consultor", "tecnico", "admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const supabase = await createClient();

  const { data: lead, error: fetchErr } = await supabase
    .from("triage_leads")
    .select("id")
    .eq("id", leadId)
    .in("status", ["pending", "in_progress"])
    .single();

  if (fetchErr || !lead) {
    return { ok: false, error: "Lead no encontrado o ya procesado" };
  }

  const { error: updateErr } = await supabaseAdmin
    .from("triage_leads")
    .update({ status: "rejected" })
    .eq("id", leadId);

  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/backoffice");
  revalidatePath("/backoffice/preconsultoria");
  return { ok: true };
}
