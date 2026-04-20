import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersManagementView } from "./users-management-view";

export default async function AssociatesListPage() {
  const { user, role } = await getSession();
  if (!user || (role !== "admin" && role !== "consultor")) redirect("/backoffice");

  const supabase = createAdminClient();

  // 1. Get internal users (profiles with staff roles)
  const { data: internalUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .in("role", ["admin", "consultor", "tecnico"])
    .order("full_name");

  // 2. Get associates (existing logic)
  const { data: associates } = await supabase
    .from("associates")
    .select(`
      *,
      referrals(count),
      referrals_data:referrals(commission_amount, commission_status)
    `)
    .order("full_name");

  const processedAssociates = (associates || []).map(a => {
    const refs = (a.referrals_data as any[]) || [];
    const reclaimable = refs.filter((r: any) => r.commission_status === "reclamable").reduce((acc: number, r: any) => acc + (r.commission_amount || 0), 0);

    return {
      ...a,
      referral_count: a.referrals?.[0]?.count || 0,
      reclaimable_amount: reclaimable
    };
  });

  return (
    <UsersManagementView
      internalUsers={internalUsers || []}
      associates={processedAssociates}
      currentUserRole={role || ""}
    />
  );
}
