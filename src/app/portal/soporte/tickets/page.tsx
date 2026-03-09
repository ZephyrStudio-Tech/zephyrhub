import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TicketsPageClient } from "./tickets-page-client";

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
      <span className="text-muted text-sm mb-4 block">
        <Link href="/portal" className="hover:text-foreground">Inicio</Link>
        {" / "}
        <Link href="/portal/soporte" className="hover:text-foreground">Centro de Ayuda</Link>
        {" / "}
        Mis Tickets
      </span>
      <TicketsPageClient tickets={tickets ?? []} />
    </div>
  );
}
