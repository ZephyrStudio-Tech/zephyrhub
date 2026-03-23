import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewTicketForm } from "./new-ticket-form";

export default async function BackofficeNuevoTicketPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (!["consultor", "admin", "tecnico"].includes(role ?? "")) redirect("/backoffice");

  const supabase = createAdminClient();

  let query = supabase
    .from("clients")
    .select("id, company_name")
    .order("company_name");

  if (role === "consultor") {
    query = query.eq("consultant_id", user.id);
  }

  const { data: clients } = await query;

  return <NewTicketForm clients={clients || []} />;
}
