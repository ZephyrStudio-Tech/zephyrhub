"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type DeviceInput = {
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  description: string | null;
  specs: {
    ram?: string;
    storage?: string;
    screen?: string;
    processor?: string;
  } | null;
  cost_price: number;
  sale_price: number;
  bono_coverage: number;
  stock: number;
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

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return { ok: false, error: "Solo los administradores pueden crear dispositivos" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("devices").insert({
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    description: data.description,
    specs: data.specs as any, // <-- FIX AQUÍ
    cost_price: data.cost_price,
    sale_price: data.sale_price,
    bono_coverage: data.bono_coverage,
    stock: data.stock,
    is_available: data.is_available,
    images: data.images,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/devices");
  return { ok: true };
}

export async function selectDevice(deviceOrderId: string, deviceId: string) {
  const auth = await requireServerAuth(["beneficiario"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;

  // Fetch device details
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

  // TODO: Add payment gateway integration here if surcharge > 0

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

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return { ok: false, error: "Solo los administradores pueden editar dispositivos" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("devices")
    .update({
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category,
      description: data.description,
      specs: data.specs as any, // <-- FIX AQUÍ
      cost_price: data.cost_price,
      sale_price: data.sale_price,
      bono_coverage: data.bono_coverage,
      stock: data.stock,
      is_available: data.is_available,
      images: data.images,
    })
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

  // Check if user is admin
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