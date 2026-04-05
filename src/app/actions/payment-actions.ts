"use server";

import { requireServerAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markPaymentReceived(
  paymentId: string,
  receivedAmount: number,
  receivedDate: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireServerAuth(["admin", "tecnico"]);
  if (auth.error) return { ok: false, error: auth.error };

  const { supabaseAdmin } = auth;
  const { error } = await supabaseAdmin
    .from("payments")
    .update({ received_amount: receivedAmount, received_at: receivedDate })
    .eq("id", paymentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/backoffice/clients/[id]", "layout");
  return { ok: true };
}
