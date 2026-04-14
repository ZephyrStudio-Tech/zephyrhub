import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArchivedDevicesCatalog, type Device } from "../archived-catalog";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ArchivedDevicesPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/backoffice");

  const supabase = createAdminClient();
  const { data: devices } = await supabase
    .from("devices")
    .select("*")
    .eq("is_available", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Papelera</h1>
          <p className="text-sm text-gray-500 mt-1">Dispositivos eliminados y disponibles para restaurar</p>
        </div>
        <Link href="/backoffice/devices">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Volver al Catálogo
          </Button>
        </Link>
      </div>

      {/* Archived Devices */}
      <ArchivedDevicesCatalog devices={(devices ?? []) as Device[]} />
    </div>
  );
}
