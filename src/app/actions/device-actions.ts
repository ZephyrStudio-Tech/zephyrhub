"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Database, Json } from "@/types/supabase";

type DeviceInsert = Database["public"]["Tables"]["devices"]["Insert"];
type DeviceUpdate = Database["public"]["Tables"]["devices"]["Update"];

type DeviceInput = {
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  description: string | null;
  specs: Json | null;
  cost_price: number;
  sale_price: number;
  bono_coverage: number;
  stock: number | null;
  is_available: boolean;
  images: string[];
};

export async function createDevice(
  data: DeviceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return { ok: false, error: "Solo los administradores pueden crear dispositivos" };
  }

  const supabaseAdmin = createAdminClient();

  // Asignamos a la interfaz exacta de Supabase
  const insertData: DeviceInsert = {
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    description: data.description,
    specs: data.specs,
    cost_price: data.cost_price,
    sale_price: data.sale_price,
    bono_coverage: data.bono_coverage,
    stock: data.stock,
    is_available: data.is_available,
    images: data.images,
  };

  // Ignoramos el chequeo de tipos estricto para evitar el bug "never"
  const { error } = await supabaseAdmin.from("devices").insert(insertData as any);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/devices");
  return { ok: true };
}

export async function selectDevice(deviceOrderId: string, deviceId: string) {
  const auth = await requireServerAuth(["beneficiario"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const { data: device } = await supabaseAdmin
    .from("devices")
    .select("sale_price, cost_price, bono_coverage")
    .eq("id", deviceId)
    .single();

  if (!device) return { ok: false, error: "Dispositivo no encontrado" };

  const surcharge = Math.max(0, device.sale_price - device.bono_coverage);

  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({
      device_id: deviceId,
      sale_price_snapshot: device.sale_price,
      cost_price_snapshot: device.cost_price,
      bono_coverage: device.bono_coverage,
      surcharge,
      status: surcharge > 0 ? "pago_pendiente" : "seleccionado",
      payment_status: surcharge > 0 ? "pendiente" : "no_requerido",
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/equipo");
  return { ok: true };
}

export async function confirmOrder(deviceOrderId: string, shippingData: any) {
  const auth = await requireServerAuth(["beneficiario"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({
      shipping_name: shippingData.name,
      shipping_address: shippingData.address,
      shipping_city: shippingData.city,
      shipping_province: shippingData.province,
      shipping_zip: shippingData.zip,
      shipping_phone: shippingData.phone,
      status: "pago_completado",
      payment_status: "completado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/equipo");
  return { ok: true };
}

export async function resetDeviceSelection(deviceOrderId: string) {
  const auth = await requireServerAuth(["beneficiario"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("device_orders")
    .update({
      device_id: null,
      status: "pendiente_seleccion",
      payment_status: "no_requerido",
      surcharge: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/equipo");
  return { ok: true };
}

export async function updateDevice(
  deviceId: string,
  data: Partial<DeviceInput>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return { ok: false, error: "Solo los administradores pueden editar dispositivos" };
  }

  const supabaseAdmin = createAdminClient();

  const updateData: DeviceUpdate = {
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    description: data.description,
    specs: data.specs,
    cost_price: data.cost_price,
    sale_price: data.sale_price,
    bono_coverage: data.bono_coverage,
    stock: data.stock,
    is_available: data.is_available,
    images: data.images,
  };

  // Limpiamos campos undefined para que la BD los ignore en el update
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof DeviceUpdate] === undefined) {
      delete updateData[key as keyof DeviceUpdate];
    }
  });

  // Ignoramos el chequeo de tipos estricto para evitar el bug "never"
  const { error } = await supabaseAdmin
    .from("devices")
    .update(updateData as any)
    .eq("id", deviceId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/devices");
  return { ok: true };
}

export async function toggleDeviceAvailability(
  deviceId: string,
  is_available: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return { ok: false, error: "Solo los administradores pueden modificar dispositivos" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("devices")
    .update({ is_available })
    .eq("id", deviceId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/devices");
  return { ok: true };
}