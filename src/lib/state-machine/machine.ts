import type { PipelineState } from "./constants";
import { PIPELINE_STATES } from "./constants";

// Allowed transitions: from -> to[] (source of truth for server validation)
const TRANSITIONS: Record<PipelineState, PipelineState[]> = {
  nuevo_lead: ["no_contesta", "contactar_mas_tarde", "imposible_contactar", "consultoria"],
  no_contesta: ["contactar_mas_tarde", "imposible_contactar", "consultoria", "nuevo_lead"],
  contactar_mas_tarde: ["no_contesta", "consultoria", "listo_para_tramitar"],
  imposible_contactar: ["perdida", "nuevo_lead"],
  consultoria: ["listo_para_tramitar", "no_contesta", "contactar_mas_tarde"],
  listo_para_tramitar: ["esperando_concesion", "consultoria"],
  esperando_concesion: ["subsanacion_tramitacion", "bono_concedido"],
  subsanacion_tramitacion: ["bono_concedido", "esperando_concesion"],
  bono_concedido: ["consultoria_confirmacion"],
  consultoria_confirmacion: ["emitir_acuerdos"],
  emitir_acuerdos: ["empezar_desarrollo"],
  empezar_desarrollo: ["presentar_justificacion_fase_i"],
  presentar_justificacion_fase_i: ["firma_justificacion", "subsanacion_fase_i"],
  firma_justificacion: ["subsanacion_fase_i", "resolucion_red_es"],
  subsanacion_fase_i: ["resolucion_red_es", "presentar_justificacion_fase_i"],
  resolucion_red_es: ["pago_i_fase"],
  pago_i_fase: ["ano_mantenimiento"],
  ano_mantenimiento: ["justificacion_ii_fase"],
  justificacion_ii_fase: ["firma_justificacion_ii", "subsanacion_fase_ii"],
  firma_justificacion_ii: ["subsanacion_fase_ii", "resolucion_ii_red_es"],
  subsanacion_fase_ii: ["resolucion_ii_red_es", "justificacion_ii_fase"],
  resolucion_ii_red_es: ["ganada", "perdida"],
  ganada: [],
  perdida: [],
};

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
