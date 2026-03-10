"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Crea un ticket de soporte (portal). Vincula user_id y client_id del usuario actual. */
export async function createTicket(data: {
  category: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("support_requests").insert({
    user_id: user.id,
    client_id: client?.id ?? null,
    category: data.category || "general",
    message: data.message || null,
    status: "abierto",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/soporte");
  revalidatePath("/portal/soporte/tickets");
  revalidatePath("/backoffice/support");
  return { ok: true };
}

/** Responde a un ticket y lo marca como resuelto (backoffice). */
export async function replyTicket(
  ticketId: string,
  reply: string
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
  if (!["consultor", "admin"].includes(role ?? "")) {
    return { ok: false, error: "Sin permiso" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("support_requests")
    .update({
      admin_reply: reply,
      status: "resuelto",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/backoffice/support");
  revalidatePath("/portal/soporte");
  revalidatePath("/portal/soporte/tickets");
  return { ok: true };
}

/** Crea un tutorial/recurso en la academia (solo admin). */
export async function createTutorial(data: {
  title: string;
  description?: string;
  category: string;
  content_type: "video" | "articulo";
  video_url?: string;
  content_body?: string;
  cover_image?: string;
}): Promise<{ ok: boolean; error?: string }> {
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
  if (profile?.role !== "admin") {
    return { ok: false, error: "Solo administradores" };
  }

  const slug =
    slugify(data.title) + "-" + Date.now().toString(36);

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("academy_content").insert({
    title: data.title,
    slug,
    category: data.category || "general",
    description: data.description ?? null,
    content_type: data.content_type || "video",
    video_url: data.video_url ?? null,
    content_body: data.content_body ?? null,
    cover_image: data.cover_image ?? null,
    sort_order: 0,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/backoffice/academy");
  revalidatePath("/portal/soporte/tutoriales");
  return { ok: true };
}

/** Añade un mensaje al hilo de un ticket y actualiza updated_at. */
export async function addTicketMessage(data: {
  ticketId: string;
  message: string;
  attachmentUrl?: string;
  isClient: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  // Opcional: podríamos validar que el usuario tiene acceso al ticket,
  // pero la RLS de lectura ya se encarga en las vistas de portal/backoffice.

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin.from("ticket_messages").insert({
    ticket_id: data.ticketId,
    message: data.message,
    attachment_url: data.attachmentUrl ?? null,
    sender_role: data.isClient ? "cliente" : "soporte",
  });

  if (error) return { ok: false, error: error.message };

  const { error: ticketErr } = await supabaseAdmin
    .from("support_requests")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.ticketId);

  if (ticketErr) return { ok: false, error: ticketErr.message };

  revalidatePath("/portal/soporte/tickets");
  revalidatePath(`/portal/soporte/tickets/${data.ticketId}`);
  revalidatePath("/backoffice/support");
  revalidatePath(`/backoffice/support/${data.ticketId}`);

  return { ok: true };
}

/** Actualiza el estado de un ticket (backoffice o automatismos). */
export async function updateTicketStatus(
  ticketId: string,
  status: string
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
  if (!["consultor", "admin"].includes(role ?? "")) {
    return { ok: false, error: "Sin permiso" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("support_requests")
    .update({ status })
    .eq("id", ticketId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/support");
  revalidatePath(`/backoffice/support/${ticketId}`);
  revalidatePath("/portal/soporte/tickets");
  revalidatePath(`/portal/soporte/tickets/${ticketId}`);

  return { ok: true };
}
