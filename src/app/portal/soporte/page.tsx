import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  ShoppingCart,
  Search as SearchIcon,
  Receipt,
  BookOpen,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { HelpCenterView } from "./help-center-view";

export default async function PortalSoportePage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Execute queries in parallel
  const [{ data: recentTickets }, { data: articles }, { data: counts }] = await Promise.all([
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
    supabase.rpc('get_academy_category_counts') // We might need to implement this or just count manually
  ]);

  // Fallback for counts if RPC doesn't exist
  const categories = [
    { id: "web", label: "Web", icon: Globe, color: "text-blue-600 bg-blue-50 border-blue-100", gradient: "from-blue-500/20 to-blue-600/20" },
    { id: "ecommerce", label: "E-commerce", icon: ShoppingCart, color: "text-amber-600 bg-amber-50 border-amber-100", gradient: "from-amber-500/20 to-amber-600/20" },
    { id: "seo", label: "SEO", icon: SearchIcon, color: "text-emerald-600 bg-emerald-50 border-emerald-100", gradient: "from-emerald-500/20 to-emerald-600/20" },
    { id: "factura", label: "Factura", icon: Receipt, color: "text-purple-600 bg-purple-50 border-purple-100", gradient: "from-purple-500/20 to-purple-600/20" },
    { id: "general", label: "General", icon: BookOpen, color: "text-slate-600 bg-slate-50 border-slate-100", gradient: "from-slate-500/20 to-slate-600/20" },
  ].map(cat => ({
    ...cat,
    count: articles?.filter(a => a.category === cat.id).length || 0
  }));

  return (
    <HelpCenterView
      initialArticles={articles ?? []}
      categories={categories}
      recentTickets={recentTickets ?? []}
    />
  );
}
