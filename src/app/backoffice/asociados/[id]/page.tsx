import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AssociateDetailView } from "./associate-detail-view";

export default async function AssociateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, role } = await getSession();
  if (!user || (role !== "admin" && role !== "consultor")) redirect("/backoffice");

  const supabase = await createClient();
  const { data: associate } = await supabase
    .from("associates")
    .select("*")
    .eq("id", id)
    .single();

  if (!associate) notFound();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("associate_id", id)
    .order("created_at", { ascending: false });

  const stats = (referrals || []).reduce((acc, r) => {
    if (r.commission_status === "pendiente") acc.pending += (r.commission_amount || 0);
    if (r.commission_status === "confirmada") acc.confirmed += (r.commission_amount || 0);
    if (r.commission_status === "reclamable") acc.reclaimable += (r.commission_amount || 0);
    if (r.commission_status === "pagada") acc.paid += (r.commission_amount || 0);
    return acc;
  }, { pending: 0, confirmed: 0, reclaimable: 0, paid: 0 });

  return (
    <AssociateDetailView
      associate={associate}
      referrals={referrals || []}
      stats={stats}
    />
  );
}
