import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["consultor", "tecnico", "admin"].includes(role ?? "")) redirect("/portal");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/backoffice" className="font-semibold text-accent">
            ZephyrOS Backoffice
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/backoffice"
              className="text-sm text-muted hover:text-foreground"
            >
              Pipeline
            </Link>
            <Link
              href="/backoffice/triage"
              className="text-sm text-muted hover:text-foreground"
            >
              Buzón Leads
            </Link>
            <Link
              href="/backoffice/tech"
              className="text-sm text-muted hover:text-foreground"
            >
              Evidencias
            </Link>
            {role === "admin" && (
              <Link
                href="/admin"
                className="text-sm text-muted hover:text-foreground"
              >
                Admin
              </Link>
            )}
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
