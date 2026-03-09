import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcademyCMS } from "./academy-cms";

export default async function BackofficeAcademyPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/backoffice");

  const supabase = createAdminClient();
  const { data: tutorials } = await supabase
    .from("academy_content")
    .select("id, title, slug, category, content_type, video_url, description, created_at")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Academia (Mini-CMS)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestiona videotutoriales y guías para el centro de ayuda.
        </p>
      </div>
      <AcademyCMS tutorials={tutorials ?? []} />
    </div>
  );
}
