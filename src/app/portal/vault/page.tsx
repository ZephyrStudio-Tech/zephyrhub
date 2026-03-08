import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getVaultSlots } from "@/lib/service-config";
import { VaultView } from "./vault-view";

export default async function PortalVaultPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, service_type")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-muted">
        No tienes un expediente asignado.
      </div>
    );
  }

  const slots = getVaultSlots(client.service_type as "web" | "ecommerce" | "seo" | "factura_electronica");
  const { data: documents } = await supabase
    .from("documents")
    .select("id, slot_type, version, status, rejection_reason, uploaded_at")
    .eq("client_id", client.id)
    .order("slot_type")
    .order("version", { ascending: false });

  return (
    <VaultView
      clientId={client.id}
      slots={slots}
      documents={documents ?? []}
    />
  );
}
