import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PortalAcuerdosPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-muted">
        No tienes expediente asignado.
      </div>
    );
  }

  const { data: agreements } = await supabase
    .from("agreements")
    .select("id, storage_path, created_at")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Acuerdos</h1>
      {!agreements?.length ? (
        <p className="text-muted">Aún no hay acuerdos generados.</p>
      ) : (
        <ul className="space-y-2">
          {agreements.map((a) => (
            <li key={a.id} className="rounded-lg border border-white/10 p-4">
              <span className="text-sm text-muted">
                {new Date(a.created_at).toLocaleDateString("es")}
              </span>
              <a
                href="#"
                className="ml-2 text-accent hover:underline"
              >
                Ver acuerdo
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
