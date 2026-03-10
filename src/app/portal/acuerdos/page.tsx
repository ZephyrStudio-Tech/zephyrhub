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
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-card">
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
      <h1 className="text-2xl font-bold text-gray-900">Acuerdos</h1>
      {!agreements?.length ? (
        <p className="text-gray-500">Aún no hay acuerdos generados.</p>
      ) : (
        <ul className="space-y-2">
          {agreements.map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-card flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {new Date(a.created_at).toLocaleDateString("es")}
              </span>
              <a
                href="#"
                className="ml-2 text-brand-600 hover:text-brand-700 hover:underline text-sm font-medium"
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
