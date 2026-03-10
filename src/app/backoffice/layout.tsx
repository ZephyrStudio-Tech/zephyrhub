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
  const navRole =
    role === "admin" ? "admin" : role === "tecnico" ? "tecnico" : "consultor";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <Sidebar role={navRole} userLabel={userLabel} />
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <div>
            <h1 className="text-sm font-medium text-gray-500">
              Panel de administración
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="truncate max-w-[200px]">{userLabel}</span>
          </div>
        </header>
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
