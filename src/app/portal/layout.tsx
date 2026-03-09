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
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-white/10 bg-background flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/portal" className="font-semibold text-accent">
            ZephyrOS
          </Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <Link
            href="/portal"
            className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
          >
            Inicio
          </Link>
          <Link
            href="/portal/vault"
            className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
          >
            Documentos
          </Link>
          <Link
            href="/portal/acuerdos"
            className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
          >
            Acuerdos
          </Link>
          <Link
            href="/portal/soporte"
            className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
          >
            Centro de Ayuda
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto relative h-screen">
        {children}
      </main>
    </div>
  );
}
