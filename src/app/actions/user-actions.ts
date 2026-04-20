"use server";

import { requireServerAuth } from "@/lib/auth";
import { createUserWithProfile } from "@/lib/create-user";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

export async function createInternalUser(data: {
  email: string;
  password: string;
  full_name: string;
  role: "consultor" | "tecnico" | "admin";
}) {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  // Use shared user creation logic
  const result = await createUserWithProfile(supabaseAdmin, {
    email: data.email,
    password: data.password,
    full_name: data.full_name,
    role: data.role,
  });

  if (!result.ok) return result;

  // Send welcome email
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const roleColors = {
        admin: { primary: "#f87171", bg: "#1a0a0a", border: "#3f1f1f", label: "Administrador" },
        consultor: { primary: "#60a5fa", bg: "#0a1628", border: "#1a2f4a", label: "Consultor" },
        tecnico: { primary: "#4ade80", bg: "#0a1f14", border: "#1a3a2a", label: "Técnico" },
      };
      const theme = roleColors[data.role] || roleColors.consultor;

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

export async function adminResetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/asociados");
  return { ok: true };
}
