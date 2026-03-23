import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HelpCenterView } from "./help-center-view";

export default async function PortalSoportePage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Execute queries in parallel
  const [{ data: recentTickets }, { data: articles }] = await Promise.all([
    supabase
      .from("support_requests")
      .select("id, category, message, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("academy_content")
      .select("id, title, slug, description, cover_image, content_type, category, video_url, content_body")
      .order("sort_order")
      .order("created_at", { ascending: false }),
  ]);

  // Calculate category counts from articles (plain data, no icons)
  const categoryCounts = ["web", "ecommerce", "seo", "factura", "general"].map(id => ({
    id,
    count: articles?.filter(a => a.category === id).length || 0
  }));

  return (
    <HelpCenterView
      initialArticles={articles ?? []}
      categoryCounts={categoryCounts}
      recentTickets={recentTickets ?? []}
    />
  );
}
