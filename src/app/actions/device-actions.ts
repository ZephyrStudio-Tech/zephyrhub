"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
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
  };
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

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Solo los administradores pueden crear dispositivos" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("devices").insert({
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
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/devices");
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

  if (profile?.role !== "admin") {
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
      specs: data.specs,
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

  if (profile?.role !== "admin") {
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
