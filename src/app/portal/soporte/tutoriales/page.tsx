import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorialesList } from "./tutoriales-list";

export default async function PortalTutorialesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("academy_content")
    .select("id, title, slug, category, description, content_type, video_url, content_body, cover_image")
    .order("sort_order")
    .order("title");

  const { q } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Videotutoriales y Guías
        </h1>
        <p className="text-muted text-sm mt-1">
          Filtra por búsqueda o haz clic en un recurso para verlo.
        </p>
      </div>
      <TutorialesList items={items ?? []} initialSearch={q ?? ""} />
    </div>
  );
}
