import type { PipelineState } from "./constants";
import { PIPELINE_STATES } from "./constants";

// Allowed transitions: from -> to[] (source of truth for server validation)
const TRANSITIONS: Record<PipelineState, PipelineState[]> = Object.fromEntries(
  PIPELINE_STATES.map((state) => [
    state,
    PIPELINE_STATES.filter((s) => s !== state),
  ])
) as Record<PipelineState, PipelineState[]>;

export function canTransition(from: PipelineState, to: PipelineState): boolean {
  const allowed = TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

const stateSet = new Set(PIPELINE_STATES);

export function validateTransition(
  from: string,
  to: string
): { valid: boolean; error?: string } {
  if (!stateSet.has(from as PipelineState)) {
    return { valid: false, error: "Estado origen no válido" };
  }
  if (!stateSet.has(to as PipelineState)) {
    return { valid: false, error: "Estado destino no válido" };
  }
  if (!canTransition(from as PipelineState, to as PipelineState)) {
    return { valid: false, error: "Transición no permitida" };
  }
  return { valid: true };
}
