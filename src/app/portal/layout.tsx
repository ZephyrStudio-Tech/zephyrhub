import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "beneficiario" && role !== "admin") redirect("/backoffice");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/portal" className="font-semibold text-accent">
            ZephyrOS
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/portal"
              className="text-sm text-muted hover:text-foreground"
            >
              Inicio
            </Link>
            <Link
              href="/portal/vault"
              className="text-sm text-muted hover:text-foreground"
            >
              Documentos
            </Link>
            <Link
              href="/portal/acuerdos"
              className="text-sm text-muted hover:text-foreground"
            >
              Acuerdos
            </Link>
            <Link
              href="/portal/academy"
              className="text-sm text-muted hover:text-foreground"
            >
              Formación
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Salir
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container px-4 py-8">{children}</main>
    </div>
  );
}
