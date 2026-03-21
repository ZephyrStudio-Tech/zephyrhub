import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PortalSidebar } from "@/components/portal-sidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role === "asociado") redirect("/asociado");
  if (role !== "beneficiario" && role !== "admin") redirect("/backoffice");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row">
      <PortalSidebar />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 md:ml-64 w-full">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
