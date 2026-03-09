import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TicketsList } from "./tickets-list";

export default async function PortalTicketsPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("support_requests")
    .select("id, category, message, status, admin_reply, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Mis Tickets de Soporte
        </h1>
        <p className="text-muted text-sm mt-1">
          Gestiona tus consultas y abre nuevos tickets.
        </p>
      </div>
      <TicketsList tickets={tickets ?? []} />
    </div>
  );
}
