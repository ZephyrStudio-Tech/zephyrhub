import type { SupabaseClient } from "@supabase/supabase-js";

type CreateUserParams = {
  email: string;
  password: string;
  full_name: string;
  role: "beneficiario" | "asociado" | "consultor" | "tecnico" | "admin";
};

type CreateUserResult = {
  ok: boolean;
  userId?: string;
  error?: string;
};

/**
 * Creates a user in Supabase Auth and upserts the profile record.
 * This is the shared logic used by triage, referral, and internal user creation.
 */
export async function createUserWithProfile(
  supabaseAdmin: SupabaseClient,
  { email, password, full_name, role }: CreateUserParams
): Promise<CreateUserResult> {
  // 1. Create user in Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError || !authUser.user) {
    return { ok: false, error: authError?.message || "Error al crear usuario" };
  }

  // 2. Upsert profile (handles trigger-created profiles)
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: authUser.user.id,
      role,
      email,
      full_name,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  return { ok: true, userId: authUser.user.id };
}
