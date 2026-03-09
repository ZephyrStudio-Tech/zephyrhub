import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SupportInbox } from "./support-inbox";

export default async function BackofficeSupportPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["consultor", "admin"].includes(role ?? "")) redirect("/backoffice");

  const supabase = createAdminClient();
  const { data: tickets } = await supabase
    .from("support_requests")
    .select("id, user_id, client_id, category, message, status, admin_reply, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Bandeja de soporte
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestiona los tickets de los clientes. Responde y marca como resuelto.
        </p>
      </div>
      <SupportInbox tickets={tickets ?? []} />
    </div>
  );
}
