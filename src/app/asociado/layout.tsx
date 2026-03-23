import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AssociateSidebar } from "./sidebar";

export default async function AssociateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "asociado") redirect("/login");

  const userLabel = user.user_metadata?.full_name ?? user.email ?? "Asociado";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      <AssociateSidebar userLabel={userLabel} />
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 md:px-8 py-3 shadow-sm lg:ml-0">
          <div>
            <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Portal de Asociados
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="truncate max-w-[200px] font-medium">{userLabel}</span>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
