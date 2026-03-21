import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function BackofficeIndexPage() {
  const { role } = await getSession();

  if (role === "admin") {
    redirect("/backoffice/dashboard");
  }

  if (role === "tecnico" || role === "consultor") {
    redirect("/backoffice/preconsultoria");
  }

  redirect("/login");
}
