import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TicketsList } from "./tickets-list";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

export default async function PortalTicketsPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("support_requests")
    .select("id, user_id, client_id, category, message, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis tickets de soporte</h1>
          <p className="text-gray-500">Gestiona tus solicitudes de soporte y consulta el estado</p>
        </div>
        <Link href="/portal/soporte/tickets/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo ticket
          </Button>
        </Link>
      </div>

      {/* Tickets List */}
      <TicketsList tickets={(tickets ?? []) as Ticket[]} />
    </div>
  );
}


