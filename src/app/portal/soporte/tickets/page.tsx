import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketsList } from "./tickets-list";

type Ticket = {
  id: string;
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
    .select("id, category, message, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Mis tickets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta tus conversaciones con soporte.
          </p>
        </div>
        <Link
          href="/portal/soporte/tickets/nuevo"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Nuevo ticket
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsList tickets={(tickets ?? []) as Ticket[]} />
        </CardContent>
      </Card>
    </div>
  );
}

