import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalDashboard } from "./portal-dashboard";

const DEVICE_UNLOCKED_STATES = [
  "pago_i_fase",
  "ano_mantenimiento",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
  "resolucion_ii_red_es",
  "ganada",
];

export default async function PortalPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, company_name, current_state, service_type, has_device")
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <p className="text-slate-600 font-medium">
          Estás en el portal como administrador. Los admins no tienen expediente asignado (son personal).
        </p>
        <a
          href="/backoffice/dashboard"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
        >
          Ir al backoffice
        </a>
      </div>
    );
  }

  const [{ data: alerts }, { data: interactions }, { data: contracts }] = client
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
        supabase
          .from("contracts")
          .select("id, type, current_state")
          .eq("client_id", client.id)
          .order("type"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const deviceUnlocked =
    client?.has_device === true &&
    DEVICE_UNLOCKED_STATES.includes(client.current_state as string);

  return (
    <PortalDashboard
      client={client ?? null}
      alerts={alerts ?? []}
      interactions={interactions ?? []}
      contracts={contracts ?? []}
      role={role}
      deviceUnlocked={deviceUnlocked}
    />
  );
}
