import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalDashboard } from "./portal-dashboard";

export default async function PortalPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, company_name, current_state, service_type")
    .eq("user_id", user.id)
    .single();

  if (!client && role === "beneficiario") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-muted">
          Aún no tienes un expediente asignado. Contacta con tu consultor.
        </p>
      </div>
    );
  }

  if (!client && role === "admin") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
        <p className="text-muted">
          Estás en el portal como administrador. Los admins no tienen expediente asignado (son personal).
        </p>
        <a
          href="/backoffice"
          className="inline-block rounded-lg bg-accent px-4 py-2 text-background font-medium hover:opacity-90"
        >
          Ir al backoffice
        </a>
      </div>
    );
  }

  const [{ data: alerts }, { data: interactions }] = client
    ? await Promise.all([
        supabase
          .from("alerts")
          .select("id, message, created_at, read_at")
          .eq("client_id", client.id)
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("interactions")
          .select("id, type, metadata, created_at")
          .eq("client_id", client.id)
          .eq("type", "state_change")
          .order("created_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <PortalDashboard
      client={client ?? null}
      alerts={alerts ?? []}
      interactions={interactions ?? []}
      role={role}
    />
  );
}
