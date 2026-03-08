import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuditLogsView } from "./audit-logs-view";

export default async function AdminLogsPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/backoffice");

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      "id, actor_id, action, entity_type, entity_id, payload, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))];
  const { data: profiles } =
    actorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", actorIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name || p.email || p.id])
  );

  return (
    <AuditLogsView
      logs={logs ?? []}
      profileMap={Object.fromEntries(profileMap)}
    />
  );
}
