import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalSidebar } from "@/components/portal-sidebar";

const DEVICE_UNLOCKED_STATES = [
  "pago_i_fase",
  "ano_mantenimiento",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
  "resolucion_ii_red_es",
  "ganada",
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role === "asociado") redirect("/asociado");
  if (role !== "beneficiario" && role !== "admin") redirect("/backoffice");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("has_device, current_state")
    .eq("user_id", user.id)
    .single();

  const hasDevice =
    client?.has_device === true &&
    DEVICE_UNLOCKED_STATES.includes(client.current_state as string);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row">
      <PortalSidebar hasDevice={hasDevice} />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 md:ml-64 w-full">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
