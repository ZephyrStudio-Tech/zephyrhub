import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const { user, role } = await getSession();
  if (!user || role !== "asociado") redirect("/login");

  const supabase = await createClient();
  const { data: associate } = await supabase
    .from("associates")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!associate) return <p>No se encontró el perfil de asociado.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi perfil</h1>
        <p className="text-slate-500 mt-1">Configura tus datos de contacto y facturación.</p>
      </div>

      <ProfileForm associate={associate} />
    </div>
  );
}
