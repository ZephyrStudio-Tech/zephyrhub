import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SupportInbox } from "./support-inbox";
import { MessageCircle, CheckCircle, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BackofficeSupportPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["consultor", "admin", "tecnico"].includes(role ?? "")) redirect("/backoffice");

  const supabase = createAdminClient();
  let query = supabase
    .from("support_requests")
    .select("id, user_id, client_id, category, message, status, admin_reply, created_at, updated_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (role === "consultor") {
    // Subquery-like behavior: consultant sees their own user tickets OR tickets for clients they manage
    const { data: managedClients } = await supabase
      .from("clients")
      .select("id")
      .eq("consultant_id", user.id);

    const clientIds = (managedClients || []).map(c => c.id);

    if (clientIds.length > 0) {
      query = query.or(`user_id.eq.${user.id},client_id.in.(${clientIds.join(",")})`);
    } else {
      query = query.eq("user_id", user.id);
    }
  }

  const { data: tickets } = await query;

  // Calculate statistics
  const totalTickets = tickets?.length ?? 0;
  const solvedTickets = tickets?.filter((t) => t.status === "resuelto" || t.status === "cerrado").length ?? 0;
  const pendingTickets = totalTickets - solvedTickets;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support List</h1>
          <p className="text-sm text-gray-500 mt-1">Home / Support List</p>
        </div>
        <Link href="/backoffice/support/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo ticket
          </Button>
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Tickets Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex items-start gap-4">
          <div className="bg-brand-50 p-3 rounded-lg">
            <MessageCircle className="w-6 h-6 text-brand-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
          </div>
        </div>

        {/* Solved Tickets Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex items-start gap-4">
          <div className="bg-success-50 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-success-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Solved</p>
            <p className="text-2xl font-bold text-gray-900">{solvedTickets}</p>
          </div>
        </div>

        {/* Pending Tickets Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex items-start gap-4">
          <div className="bg-warning-50 p-3 rounded-lg">
            <AlertCircle className="w-6 h-6 text-warning-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{pendingTickets}</p>
          </div>
        </div>
      </div>

      {/* Support Inbox */}
      <SupportInbox tickets={tickets ?? []} />
    </div>
  );
}
