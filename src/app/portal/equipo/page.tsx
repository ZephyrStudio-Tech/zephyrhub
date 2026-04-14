import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeviceSelectionView } from "./device-selection-view";

const DEVICE_UNLOCKED_STATES = [
  "pago_i_fase",
  "ano_mantenimiento",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
  "resolucion_ii_red_es",
  "ganada",
];

export default async function EquipoPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // 1. Get Client Info
  const { data: client } = await supabase
    .from("clients")
    .select("id, has_device, current_state")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/portal");

  const deviceUnlocked =
    client.has_device === true &&
    DEVICE_UNLOCKED_STATES.includes(client.current_state as string);

  if (!deviceUnlocked) redirect("/portal");

  // 2. Get Device Order
  const { data: order } = await supabase
    .from("device_orders")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!order) {
    // Create a default order if none exists (should be handled by trigger, but just in case)
    return <p className="text-center py-12 text-slate-500">No se ha encontrado un pedido de dispositivo para este expediente.</p>;
  }

  // 3. Load Catalog or Selected Device
  let catalog = [];
  let selectedDevice = null;

  if (order.status === "pendiente_seleccion") {
    const { data: devices } = await supabase
      .from("devices")
      .select("*")
      .eq("is_available", true)
      .order("sale_price", { ascending: true });
    catalog = devices || [];
  }

  if (order.device_id) {
    const { data: device } = await supabase
      .from("devices")
      .select("*")
      .eq("id", order.device_id)
      .single();
    selectedDevice = device;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi equipo</h1>
        <p className="text-slate-500 mt-1">
          {order.status === 'pendiente_seleccion'
            ? 'Selecciona el ordenador portátil que quieres recibir.'
            : 'Sigue el estado de tu pedido de hardware.'}
        </p>
      </div>

      <DeviceSelectionView
        catalog={catalog}
        order={order}
        selectedDevice={selectedDevice}
      />
    </div>
  );
}
