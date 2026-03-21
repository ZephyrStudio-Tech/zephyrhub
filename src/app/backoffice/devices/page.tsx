import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DevicesCatalog, type Device } from "./devices-catalog";
import { Package, CheckCircle, XCircle } from "lucide-react";

export default async function BackofficeDevicesPage() {
  const { user, role } = await getSession();
  if (!user) redirect("/login");
  if (role !== "admin") redirect("/backoffice");

  const supabase = createAdminClient();
  const { data: devices } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: false });

  const totalDevices = devices?.length ?? 0;
  const availableDevices = devices?.filter((d) => d.is_available).length ?? 0;
  const unavailableDevices = totalDevices - availableDevices;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catalogo de dispositivos</h1>
        <p className="text-sm text-gray-500 mt-1">Home / Catalogo</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex items-start gap-4">
          <div className="bg-brand-50 p-3 rounded-lg">
            <Package className="w-6 h-6 text-brand-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Total dispositivos</p>
            <p className="text-2xl font-bold text-gray-900">{totalDevices}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex items-start gap-4">
          <div className="bg-success-50 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-success-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Disponibles</p>
            <p className="text-2xl font-bold text-gray-900">{availableDevices}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 flex items-start gap-4">
          <div className="bg-warning-50 p-3 rounded-lg">
            <XCircle className="w-6 h-6 text-warning-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">No disponibles</p>
            <p className="text-2xl font-bold text-gray-900">{unavailableDevices}</p>
          </div>
        </div>
      </div>

      {/* Devices Catalog */}
      <DevicesCatalog devices={(devices ?? []) as Device[]} />
    </div>
  );
}
