import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function BackofficeIndexPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");

  if (role === "admin") {
    redirect("/backoffice/dashboard");
  }

  if (role === "tecnico" || role === "consultor") {
    redirect("/backoffice/preconsultoria");
  }

  if (role === "asociado") {
    redirect("/asociado");
  }

  redirect("/portal");
}
