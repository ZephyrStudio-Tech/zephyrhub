import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SinPerfilPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <Card className="w-full max-w-md border border-amber-200 bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900">Cuenta sin perfil</CardTitle>
          <p className="text-sm text-gray-600">
            Tu usuario existe en el sistema pero no tiene un perfil asignado en la base de datos.
            Esto puede ocurrir si la cuenta se creó antes de activar el trigger de Supabase.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Pide a un administrador que ejecute en Supabase (SQL Editor):
          </p>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-3 text-xs overflow-x-auto">
            {`INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('${user.id}', '${user.email}', '${user.user_metadata?.full_name ?? ""}', 'beneficiario')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`}
          </pre>
          <p className="text-sm text-gray-600">
            Cambia <code className="rounded bg-gray-100 px-1">beneficiario</code> por{" "}
            <code className="rounded bg-gray-100 px-1">admin</code>,{" "}
            <code className="rounded bg-gray-100 px-1">consultor</code> o{" "}
            <code className="rounded bg-gray-100 px-1">tecnico</code> según corresponda.
          </p>
          <p className="text-sm text-amber-700">
            Si tu perfil ya existe en la tabla <code className="rounded bg-gray-100 px-1">profiles</code>, el fallo suele ser RLS: en Supabase → Authentication → Policies, asegura que en <code className="rounded bg-gray-100 px-1">profiles</code> haya una política que permita <strong>SELECT</strong> cuando <code className="rounded bg-gray-100 px-1">auth.uid() = id</code>. Ver <code className="rounded bg-gray-100 px-1">supabase/migrations/00001_profiles_rls_own_profile.sql</code>.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
