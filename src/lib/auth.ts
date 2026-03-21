import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cache } from "react";

export type AppRole = "beneficiario" | "consultor" | "tecnico" | "admin" | "asociado";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null as AppRole | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    user,
    role: (profile?.role as AppRole) ?? null,
  };
});

/**
 * Valida autenticación y autorización en una sola llamada.
 * Devuelve usuario, rol y cliente admin de Supabase si todo es correcto.
 * Caso contrario, devuelve un objeto con error.
 */
export async function requireServerAuth(allowedRoles?: AppRole[]): Promise<
  | { error: string; user?: never; role?: never; supabaseAdmin?: never }
  | { error?: never; user: any; role: AppRole; supabaseAdmin: any }
> {
  const { user, role } = await getSession();

  if (!user) {
    return { error: "No autenticado" };
  }

  if (allowedRoles && !allowedRoles.includes(role as AppRole)) {
    return { error: "Sin permiso" };
  }

  const supabaseAdmin = createAdminClient();

  return {
    user,
    role: role as AppRole,
    supabaseAdmin,
  };
}
