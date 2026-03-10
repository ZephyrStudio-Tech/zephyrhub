import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TicketChatView } from "./ticket-chat-view";

type Ticket = {
  id: string;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  message: string;
  attachment_url: string | null;
  sender_role: "cliente" | "soporte" | string;
  created_at: string;
};

export default async function PortalTicketChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_requests")
    .select("id, category, message, status, created_at, updated_at, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ticket) redirect("/portal/soporte/tickets");

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, ticket_id, message, attachment_url, sender_role, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/portal/soporte/tickets" className="text-sm text-gray-500 hover:text-gray-700">
            ← Mis tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            {ticket.category}
          </h1>
        </div>
      </div>
      <TicketChatView
        ticket={ticket as unknown as Ticket}
        messages={(messages ?? []) as TicketMessage[]}
      />
    </div>
  );
}

