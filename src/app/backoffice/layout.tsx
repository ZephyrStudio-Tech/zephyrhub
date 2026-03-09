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
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100">
      <header className="glass sticky top-0 z-30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/backoffice"
            className="font-bold text-lg tracking-tight text-slate-900 dark:text-white"
          >
            Zephyr<span className="text-primary">OS</span> Backoffice
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/backoffice"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 transition-all"
            >
              Pipeline
            </Link>
            <Link
              href="/backoffice/triage"
              className="rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Buzón Leads
            </Link>
            <Link
              href="/backoffice/tech"
              className="rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Evidencias
            </Link>
            {role === "admin" && (
              <Link
                href="/admin"
                className="rounded-xl px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Admin
              </Link>
            )}
            <form action={signOut} className="ml-2">
              <Button type="submit" variant="ghost" size="sm" className="text-slate-500">
                Salir
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container px-4 sm:px-6 py-6 md:py-8 max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
