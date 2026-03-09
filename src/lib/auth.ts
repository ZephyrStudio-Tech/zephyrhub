import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type AppRole = "beneficiario" | "consultor" | "tecnico" | "admin";

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
