import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTechChecklist } from "@/lib/service-config";
import { TechEvidencesView } from "./tech-evidences-view";

export default async function BackofficeTechClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, company_name, current_state, service_type")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const phase =
    client.current_state === "justificacion_ii_fase" ||
    client.current_state === "firma_justificacion_ii" ||
    client.current_state === "subsanacion_fase_ii"
      ? "phase_ii"
      : "phase_i";

  const checklist = getTechChecklist(
    client.service_type as "web" | "ecommerce" | "seo" | "factura_electronica",
    phase
  );

  const { data: evidences } = await supabase
    .from("tech_evidences")
    .select("id, checklist_key, storage_path, uploaded_at")
    .eq("client_id", id);

  return (
    <TechEvidencesView
      clientId={id}
      clientName={client.company_name || id}
      checklist={checklist}
      evidences={evidences ?? []}
    />
  );
}
