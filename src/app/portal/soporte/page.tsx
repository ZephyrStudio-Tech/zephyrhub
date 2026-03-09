import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hola, ¿cómo podemos ayudarte?
        </h1>
        <p className="text-muted text-sm mt-1">
          Busca en guías y tutoriales o abre un ticket de soporte.
        </p>
      </div>

      <form
        action="/portal/soporte/tutoriales"
        method="get"
        className="flex gap-2"
      >
        <Input
          type="search"
          name="q"
          placeholder="Buscar en tutoriales y guías..."
          className="max-w-md bg-white/5 border-white/10 text-foreground placeholder:text-muted"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/soporte/tutoriales">
          <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">
                Videotutoriales y Guías
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Consulta vídeos y artículos para resolver dudas frecuentes.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/soporte/tickets">
          <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">
                Mis Tickets de Soporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Revisa el estado de tus consultas y abre nuevos tickets.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {recentTickets && recentTickets.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentTickets.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm text-foreground truncate flex-1 mr-2">
                    {t.category} · {t.message?.slice(0, 50) ?? "—"}
                    {t.message && t.message.length > 50 ? "…" : ""}
                  </span>
                  <span
                    className={
                      (t.status?.toLowerCase() ?? "") === "resuelto"
                        ? "text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }
                  >
                    {t.status ?? "abierto"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
