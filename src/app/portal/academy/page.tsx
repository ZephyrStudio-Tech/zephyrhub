import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcademyView } from "./academy-view";

export default async function PortalAcademyPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: content } = await supabase
    .from("academy_content")
    .select("id, title, slug, category, video_url, thumbnail_url, description")
    .order("sort_order")
    .order("title");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const categories = [
    "web",
    "ecommerce",
    "seo",
    "factura",
    "general",
  ];

  return (
    <AcademyView
      content={content ?? []}
      categories={categories}
      clientId={client?.id ?? null}
    />
  );
}
