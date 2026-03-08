"use server";

import { createClient } from "@/lib/supabase/server";
import { getSuggestedNextState } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";

export async function getSuggestedNext(
  currentState: string
): Promise<PipelineState | null> {
  return getSuggestedNextState(currentState as PipelineState);
}
