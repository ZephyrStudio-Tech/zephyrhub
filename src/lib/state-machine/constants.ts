// Pipeline states (24) – must match DB enum pipeline_state

export const PIPELINE_STATES = [
  "nuevo_lead",
  "no_contesta",
  "contactar_mas_tarde",
  "imposible_contactar",
  "consultoria",
  "listo_para_tramitar",
  "esperando_concesion",
  "subsanacion_tramitacion",
  "bono_concedido",
  "consultoria_confirmacion",
  "emitir_acuerdos",
  "empezar_desarrollo",
  "presentar_justificacion_fase_i",
  "firma_justificacion",
  "subsanacion_fase_i",
  "resolucion_red_es",
  "pago_i_fase",
  "ano_mantenimiento",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
  "resolucion_ii_red_es",
  "ganada",
  "perdida",
] as const;

export type PipelineState = (typeof PIPELINE_STATES)[number];

/** Orden y etiquetas para el Kanban (una columna por estado) */
export const PIPELINE_STATE_LABELS: { id: PipelineState; label: string }[] = [
  { id: "nuevo_lead", label: "Nuevo Lead" },
  { id: "no_contesta", label: "No contesta" },
  { id: "contactar_mas_tarde", label: "Contactar Más Tarde" },
  { id: "imposible_contactar", label: "Imposible contactar" },
  { id: "consultoria", label: "Consultoría" },
  { id: "listo_para_tramitar", label: "Listo para tramitar" },
  { id: "esperando_concesion", label: "Esperando concesión" },
  { id: "subsanacion_tramitacion", label: "Subsanación (Tramitación)" },
  { id: "bono_concedido", label: "Bono Concedido" },
  { id: "consultoria_confirmacion", label: "Consultoría Confirmación" },
  { id: "emitir_acuerdos", label: "Emitir Acuerdos" },
  { id: "empezar_desarrollo", label: "Empezar Desarrollo" },
  { id: "presentar_justificacion_fase_i", label: "Presentar Justificación (Fase I)" },
  { id: "firma_justificacion", label: "Firma justificación" },
  { id: "subsanacion_fase_i", label: "Subsanación (Justificación Fase I)" },
  { id: "resolucion_red_es", label: "Resolución Red.es" },
  { id: "pago_i_fase", label: "Pago I Fase" },
  { id: "ano_mantenimiento", label: "Año Mantenimiento" },
  { id: "justificacion_ii_fase", label: "Justificación II Fase" },
  { id: "firma_justificacion_ii", label: "Firma Justificación II" },
  { id: "subsanacion_fase_ii", label: "Subsanación (Justificación Fase II)" },
  { id: "resolucion_ii_red_es", label: "Resolución II Red.es" },
  { id: "ganada", label: "Ganada" },
  { id: "perdida", label: "Perdida" },
];

/** Solo los 6 estados del tablero Preconsultoría (triage_leads) */
export const PRECONSULTORIA_STATE_LABELS = PIPELINE_STATE_LABELS.slice(0, 6);

/** Estados del tablero Consultoría (clients): desde esperando_concesion hasta perdida */
export const CONSULTORIA_STATE_LABELS = PIPELINE_STATE_LABELS.slice(6);

export const PHASES: { name: string; states: PipelineState[] }[] = [
  {
    name: "Captación y Triage",
    states: [
      "nuevo_lead",
      "no_contesta",
      "contactar_mas_tarde",
      "imposible_contactar",
      "consultoria",
      "listo_para_tramitar",
    ],
  },
  {
    name: "Tramitación Oficial",
    states: [
      "esperando_concesion",
      "subsanacion_tramitacion",
      "bono_concedido",
      "consultoria_confirmacion",
      "emitir_acuerdos",
      "empezar_desarrollo",
    ],
  },
  {
    name: "Ejecución y Justificación I",
    states: [
      "presentar_justificacion_fase_i",
      "firma_justificacion",
      "subsanacion_fase_i",
      "resolucion_red_es",
      "pago_i_fase",
      "ano_mantenimiento",
    ],
  },
  {
    name: "Justificación II y Cierre",
    states: [
      "justificacion_ii_fase",
      "firma_justificacion_ii",
      "subsanacion_fase_ii",
      "resolucion_ii_red_es",
      "ganada",
      "perdida",
    ],
  },
];

// Suggested next state (for contextual button)
const SUGGESTED_NEXT: Record<PipelineState, PipelineState | null> = {
  nuevo_lead: "no_contesta",
  no_contesta: "contactar_mas_tarde",
  contactar_mas_tarde: "consultoria",
  imposible_contactar: null,
  consultoria: "listo_para_tramitar",
  listo_para_tramitar: "esperando_concesion",
  esperando_concesion: "subsanacion_tramitacion",
  subsanacion_tramitacion: "bono_concedido",
  bono_concedido: "consultoria_confirmacion",
  consultoria_confirmacion: "emitir_acuerdos",
  emitir_acuerdos: "empezar_desarrollo",
  empezar_desarrollo: "presentar_justificacion_fase_i",
  presentar_justificacion_fase_i: "firma_justificacion",
  firma_justificacion: "subsanacion_fase_i",
  subsanacion_fase_i: "resolucion_red_es",
  resolucion_red_es: "pago_i_fase",
  pago_i_fase: "ano_mantenimiento",
  ano_mantenimiento: "justificacion_ii_fase",
  justificacion_ii_fase: "firma_justificacion_ii",
  firma_justificacion_ii: "subsanacion_fase_ii",
  subsanacion_fase_ii: "resolucion_ii_red_es",
  resolucion_ii_red_es: "ganada",
  ganada: null,
  perdida: null,
};

export function getSuggestedNextState(state: PipelineState): PipelineState | null {
  return SUGGESTED_NEXT[state] ?? null;
}

// Macro phases for portal timeline (simplified stepper)
export type MacroPhase = "tramitacion" | "desarrollo" | "mantenimiento" | "cierre";

const STATE_TO_MACRO: Record<PipelineState, MacroPhase> = {
  nuevo_lead: "tramitacion",
  no_contesta: "tramitacion",
  contactar_mas_tarde: "tramitacion",
  imposible_contactar: "tramitacion",
  consultoria: "tramitacion",
  listo_para_tramitar: "tramitacion",
  esperando_concesion: "tramitacion",
  subsanacion_tramitacion: "tramitacion",
  bono_concedido: "tramitacion",
  consultoria_confirmacion: "tramitacion",
  emitir_acuerdos: "tramitacion",
  empezar_desarrollo: "desarrollo",
  presentar_justificacion_fase_i: "desarrollo",
  firma_justificacion: "desarrollo",
  subsanacion_fase_i: "desarrollo",
  resolucion_red_es: "desarrollo",
  pago_i_fase: "mantenimiento",
  ano_mantenimiento: "mantenimiento",
  justificacion_ii_fase: "mantenimiento",
  firma_justificacion_ii: "mantenimiento",
  subsanacion_fase_ii: "mantenimiento",
  resolucion_ii_red_es: "cierre",
  ganada: "cierre",
  perdida: "cierre",
};

export function getMacroPhase(state: PipelineState): MacroPhase {
  return STATE_TO_MACRO[state] ?? "tramitacion";
}

export const MACRO_PHASES: { key: MacroPhase; label: string }[] = [
  { key: "tramitacion", label: "Tramitación" },
  { key: "desarrollo", label: "Desarrollo" },
  { key: "mantenimiento", label: "Mantenimiento" },
  { key: "cierre", label: "Cierre" },
];
