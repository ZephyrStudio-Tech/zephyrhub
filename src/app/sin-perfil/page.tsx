import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SinPerfilPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-foreground">Cuenta sin perfil</CardTitle>
          <p className="text-sm text-muted">
            Tu usuario existe en el sistema pero no tiene un perfil asignado en la base de datos.
            Esto puede ocurrir si la cuenta se creó antes de activar el trigger de Supabase.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Pide a un administrador que ejecute en Supabase (SQL Editor):
          </p>
          <pre className="rounded-lg bg-white/10 p-3 text-xs overflow-x-auto">
            {`INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('${user.id}', '${user.email}', '${user.user_metadata?.full_name ?? ""}', 'beneficiario')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`}
          </pre>
          <p className="text-sm text-muted">
            Cambia <code className="rounded bg-white/10 px-1">beneficiario</code> por{" "}
            <code className="rounded bg-white/10 px-1">admin</code>,{" "}
            <code className="rounded bg-white/10 px-1">consultor</code> o{" "}
            <code className="rounded bg-white/10 px-1">tecnico</code> según corresponda.
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
