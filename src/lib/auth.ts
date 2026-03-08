import { createClient } from "@/lib/supabase/server";

export type AppRole = "beneficiario" | "consultor" | "tecnico" | "admin";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
}
