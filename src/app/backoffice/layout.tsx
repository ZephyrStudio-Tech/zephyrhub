import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["consultor", "tecnico", "admin"].includes(role ?? "")) redirect("/portal");

  const userLabel = user.user_metadata?.full_name ?? user.email ?? "Usuario";
  const navRole = role === "admin" ? "admin" : role === "tecnico" ? "tecnico" : "consultor";

  return (
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100">
      <Sidebar role={navRole} userLabel={userLabel} />
      <main className="pl-0 pt-14 lg:pt-0 lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1800px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
