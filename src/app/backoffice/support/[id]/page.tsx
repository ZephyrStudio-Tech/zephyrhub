import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BackofficeTicketView } from "./backoffice-ticket-view";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  profiles?: {
    full_name?: string;
    email?: string;
  }[];
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  message: string;
  attachment_url: string | null;
  sender_role: "cliente" | "soporte" | string;
  created_at: string;
};

export default async function BackofficeTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["consultor", "admin"].includes(role ?? "")) redirect("/backoffice");

  const { id } = await params;
  const supabase = createAdminClient();

  // Execute both queries in parallel
  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase
      .from("support_requests")
      .select("id, user_id, client_id, category, message, status, created_at, updated_at, profiles(full_name, email)")
      .eq("id", id)
      .single(),
    supabase
      .from("ticket_messages")
      .select("id, ticket_id, message, attachment_url, sender_role, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) redirect("/backoffice/support");

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Home</span>
            <span>/</span>
            <span>Support Reply</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Support Reply</h1>
      </div>

      <BackofficeTicketView
        ticket={ticket as Ticket}
        messages={(messages ?? []) as TicketMessage[]}
      />
    </div>
  );
}

