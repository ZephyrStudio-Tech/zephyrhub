-- Permite que cada usuario autenticado lea su propia fila en profiles.
-- Sin esta política, getSession() y el middleware no ven el perfil y redirigen a "Cuenta sin perfil".
-- Ejecutar en Supabase: SQL Editor o como migración.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Opcional: permitir que el usuario actualice solo su full_name/email (no el role)
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.profiles;
CREATE POLICY "Users can update own profile fields"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
