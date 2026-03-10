import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function PortalSoportePage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: recentTickets } = await supabase
    .from("support_requests")
    .select("id, category, message, status, admin_reply, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  const { data: latestArticles } = await supabase
    .from("academy_content")
    .select("id, title, slug, description, cover_image, content_type")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Hola, ¿cómo podemos ayudarte?
        </h1>
        <form
          action="/portal/soporte/tutoriales"
          method="get"
          className="flex gap-2 w-full max-w-xl mx-auto"
        >
          <Input
            type="search"
            name="q"
            placeholder="Buscar en base de conocimientos..."
            className="flex-1 h-12 text-base"
          />
          <Button type="submit" variant="secondary" size="lg" className="rounded-xl">
            Buscar
          </Button>
        </form>
      </div>

      {/* Cards de acceso */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
        <Link href="/portal/soporte/tutoriales">
          <Card className="transition-colors h-full hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                Base de conocimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Videotutoriales y guías para resolver dudas frecuentes.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/soporte/tickets">
          <Card className="transition-colors h-full hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                Mis Tickets de Soporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Revisa el estado de tus consultas y abre nuevos tickets.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Últimos artículos (Blogs) */}
      {latestArticles && latestArticles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Últimos artículos
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {latestArticles.map((article) => (
              <Link
                key={article.id}
                href={`/portal/soporte/tutoriales?q=${encodeURIComponent(article.title ?? "")}`}
              >
                <Card className="transition-colors h-full overflow-hidden hover:shadow-md">
                  <div className="relative h-32 w-full overflow-hidden">
                    {article.cover_image ? (
                      <Image
                        src={article.cover_image}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200"
                        aria-hidden
                      />
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-2">
                      {article.title ?? "Sin título"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {article.description ?? "—"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mis tickets recientes - lista simple */}
      {recentTickets && recentTickets.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Mis tickets recientes
          </h2>
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {recentTickets.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between py-4 first:pt-0"
              >
                <span className="text-sm text-gray-700 truncate flex-1 mr-4">
                  {t.category} · {t.message?.slice(0, 60) ?? "—"}
                  {t.message && t.message.length > 60 ? "…" : ""}
                </span>
                <span
                  className={
                    (t.status?.toLowerCase() ?? "") === "resuelto"
                      ? "text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                      : "text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
                  }
                >
                  {t.status ?? "abierto"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
