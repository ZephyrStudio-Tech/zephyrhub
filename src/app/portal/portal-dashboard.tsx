"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MACRO_PHASES, getMacroPhase, PIPELINE_STATE_LABELS } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Clock, CheckCircle, Building2, Users, FileText, Layout, ShoppingCart } from "lucide-react";
import { dismissAlert } from "@/app/actions/client-actions";
import Link from "next/link";

type Client = {
  id: string;
  company_name: string | null;
  current_state: string;
  service_type: string;
} | null;

type Alert = { id: string; message: string; created_at: string; read_at: string | null }[];

type Interaction = {
  id: string;
  type: string;
  metadata: { from?: string; to?: string } | null;
  created_at: string;
};

type Contract = {
  id: string;
  type: "web" | "ecommerce";
  current_state: string;
};

// State explanations for each pipeline state
type StateInfo = {
  title: string;
  description: string;
  actor: "zephyr" | "redes" | "cliente";
  clientAction?: string;
};

const STATE_EXPLANATIONS: Record<string, StateInfo> = {
  nuevo_lead: {
    title: "Registro inicial",
    description: "Tu solicitud ha sido registrada. Nuestro equipo revisará tu información y se pondrá en contacto contigo.",
    actor: "zephyr",
  },
  no_contesta: {
    title: "Pendiente de contacto",
    description: "Hemos intentado contactarte pero no hemos podido localizarte. Por favor, revisa tu teléfono o correo.",
    actor: "cliente",
    clientAction: "Contacta con nosotros para continuar con tu solicitud",
  },
  contactar_mas_tarde: {
    title: "Contacto programado",
    description: "Tenemos agendado contactarte próximamente. Mantente atento a nuestras comunicaciones.",
    actor: "zephyr",
  },
  imposible_contactar: {
    title: "Sin respuesta",
    description: "No hemos podido establecer contacto. Si deseas continuar, por favor contáctanos.",
    actor: "cliente",
    clientAction: "Envía un ticket de soporte para retomar el proceso",
  },
  consultoria: {
    title: "En consultoría",
    description: "Estamos analizando tu caso y preparando toda la documentación necesaria para tu solicitud de Kit Digital.",
    actor: "zephyr",
  },
  listo_para_tramitar: {
    title: "Listo para tramitar",
    description: "Tu expediente está completo y preparado. Procederemos a enviarlo a Red.es para su evaluación.",
    actor: "zephyr",
  },
  esperando_concesion: {
    title: "Esperando concesión",
    description: "Tu solicitud ha sido enviada a Red.es. Estamos a la espera de que resuelvan tu expediente.",
    actor: "redes",
  },
  subsanacion_tramitacion: {
    title: "Subsanación requerida",
    description: "Red.es ha solicitado documentación adicional o correcciones. Necesitamos tu colaboración.",
    actor: "cliente",
    clientAction: "Revisa la documentación solicitada y envíala cuanto antes",
  },
  bono_concedido: {
    title: "Bono concedido",
    description: "¡Enhorabuena! Red.es ha aprobado tu solicitud. Ahora confirmaremos los detalles para iniciar el desarrollo.",
    actor: "zephyr",
  },
  consultoria_confirmacion: {
    title: "Confirmación de consultoría",
    description: "Estamos verificando los últimos detalles de tu expediente antes de emitir los acuerdos.",
    actor: "zephyr",
  },
  emitir_acuerdos: {
    title: "Emisión de acuerdos",
    description: "Preparando los acuerdos de colaboración para tu firma.",
    actor: "zephyr",
  },
  empezar_desarrollo: {
    title: "Inicio del desarrollo",
    description: "¡Tu proyecto está en marcha! Nuestro equipo técnico está trabajando en tu solución digital.",
    actor: "zephyr",
  },
  presentar_justificacion_fase_i: {
    title: "Preparando justificación Fase I",
    description: "Estamos recopilando toda la documentación para justificar el trabajo realizado ante Red.es.",
    actor: "zephyr",
  },
  firma_justificacion: {
    title: "Firma de justificación",
    description: "Necesitamos tu firma en los documentos de justificación para poder presentarlos.",
    actor: "cliente",
    clientAction: "Firma los documentos de justificación pendientes",
  },
  subsanacion_fase_i: {
    title: "Subsanación Fase I",
    description: "Red.es ha solicitado aclaraciones sobre la justificación. Estamos preparando la respuesta.",
    actor: "zephyr",
  },
  resolucion_red_es: {
    title: "Resolución Red.es",
    description: "Red.es está evaluando la justificación presentada. Esperamos su resolución.",
    actor: "redes",
  },
  pago_i_fase: {
    title: "Pago Fase I",
    description: "La primera fase ha sido aprobada. El pago está en proceso.",
    actor: "redes",
  },
  ano_mantenimiento: {
    title: "Año de mantenimiento",
    description: "Tu solución está en periodo de mantenimiento. Seguimos dándote soporte.",
    actor: "zephyr",
  },
  justificacion_ii_fase: {
    title: "Justificación Fase II",
    description: "Preparando la documentación de la segunda fase de justificación.",
    actor: "zephyr",
  },
  firma_justificacion_ii: {
    title: "Firma Fase II",
    description: "Necesitamos tu firma para los documentos de la segunda fase.",
    actor: "cliente",
    clientAction: "Firma los documentos de justificación de la Fase II",
  },
  subsanacion_fase_ii: {
    title: "Subsanación Fase II",
    description: "Atendiendo requerimientos de Red.es sobre la segunda justificación.",
    actor: "zephyr",
  },
  resolucion_ii_red_es: {
    title: "Resolución Final",
    description: "Red.es está evaluando la justificación final de tu proyecto.",
    actor: "redes",
  },
  ganada: {
    title: "Proyecto completado",
    description: "¡Enhorabuena! Tu proyecto Kit Digital ha sido completado con éxito. Gracias por confiar en nosotros.",
    actor: "zephyr",
  },
  perdida: {
    title: "Expediente cerrado",
    description: "Este expediente ha sido cerrado. Contáctanos si tienes dudas o quieres iniciar un nuevo proceso.",
    actor: "cliente",
    clientAction: "Contáctanos para más información",
  },
};

function getStateLabel(stateId: string): string {
  const found = PIPELINE_STATE_LABELS.find((s) => s.id === stateId);
  return found?.label ?? stateId;
}

const POST_DEV_STATES = [
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
];

function ContractProgress({
  contract,
  label,
  stateOverride,
  unified,
}: {
  contract: Contract;
  label: string;
  stateOverride?: string;
  unified?: boolean;
}) {
  const stateToShow = stateOverride ?? contract.current_state;
  const macro = getMacroPhase(stateToShow as PipelineState);
  const currentIndex = MACRO_PHASES.findIndex((p) => p.key === macro);
  const Icon = contract.type === "web" ? Layout : ShoppingCart;
  const stateInfo = STATE_EXPLANATIONS[stateToShow];

  return (
    <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
            <Icon className="w-5 h-5 text-brand-600" />
          </div>
          <span className="font-semibold text-slate-800">{label}</span>
        </div>
        {unified ? (
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
            En tramitación conjunta
          </span>
        ) : (
          <span className="text-xs font-medium bg-brand-100 text-brand-700 px-2 py-1 rounded-full border border-brand-200">
            {getStateLabel(contract.current_state)}
          </span>
        )}
      </div>

      {unified && stateInfo && (
        <p className="text-sm text-slate-600">{stateInfo.description}</p>
      )}

      <div className="flex items-center gap-1">
        {MACRO_PHASES.map((phase, i) => {
          const isActive = i <= currentIndex;
          return (
            <div
              key={phase.key}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                isActive ? "bg-brand-500" : "bg-slate-200"
              )}
              title={phase.label}
            />
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-semibold">
        Fase actual: {MACRO_PHASES[currentIndex]?.label || "Tramitación"}
      </p>
    </div>
  );
}

export function PortalDashboard({
  client: initialClient,
  alerts: initialAlerts,
  interactions: initialInteractions,
  contracts,
  role,
  deviceUnlocked,
}: {
  client: Client;
  alerts: Alert;
  interactions: Interaction[];
  contracts: Contract[];
  role: string | null;
  deviceUnlocked?: boolean;
}) {
  const [client, setClient] = useState(initialClient);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [interactions, setInteractions] = useState(initialInteractions);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  useEffect(() => {
    if (!client?.id) return;

    const channel = supabase
      .channel("portal-client")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
          filter: `id=eq.${client.id}`,
        },
        (payload) => {
          const newRow = payload.new as typeof client;
          if (newRow) setClient(newRow);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `client_id=eq.${client.id}`,
        },
        (payload) => {
          const newAlert = payload.new as Alert[0];
          if (newAlert) {
            setAlerts((prev) => [newAlert, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interactions",
          filter: `client_id=eq.${client.id}`,
        },
        (payload) => {
          const newInteraction = payload.new as Interaction;
          if (newInteraction && newInteraction.type === "state_change") {
            setInteractions((prev) => [...prev, newInteraction]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client?.id, supabase]);

  if (!client) return null;

  const currentMacro = getMacroPhase(client.current_state as PipelineState);
  const currentIndex = MACRO_PHASES.findIndex((p) => p.key === currentMacro);
  const stateInfo = STATE_EXPLANATIONS[client.current_state] ?? {
    title: getStateLabel(client.current_state),
    description: "Tu expediente está siendo procesado.",
    actor: "zephyr" as const,
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    startTransition(async () => {
      await dismissAlert(alertId);
    });
  };

  const actorLabels = {
    zephyr: { label: "ZephyrStudio", icon: Building2, color: "text-brand-600" },
    redes: { label: "Red.es", icon: FileText, color: "text-blue-600" },
    cliente: { label: "Tu acción requerida", icon: Users, color: "text-amber-600" },
  };

  const actorInfo = actorLabels[stateInfo.actor];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {client.company_name || "Mi expediente"}
          </h1>
          <p className="text-slate-500 mt-1">
            Gestionando tu bono Kit Digital · <span className="font-medium text-brand-600">{getStateLabel(client.current_state)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/soporte/tickets/nuevo">
            <Button variant="outline" size="sm">Ayuda</Button>
          </Link>
        </div>
      </div>

      {/* Dismissible Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">{a.message}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {new Date(a.created_at).toLocaleDateString("es")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDismissAlert(a.id)}
                disabled={isPending}
                className="p-1 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                aria-label="Cerrar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Device Selection Banner */}
      {deviceUnlocked && (
        <div className="flex flex-col md:flex-row items-center gap-4 p-6 rounded-2xl border border-brand-200 bg-brand-50 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="p-3 rounded-full bg-brand-100">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-lg font-bold text-brand-900">¡Ya puedes elegir tu dispositivo!</p>
            <p className="text-sm text-brand-800">Tu bono ha sido aprobado y puedes seleccionar el equipo que quieres recibir.</p>
          </div>
          <Link href="/portal/equipo">
            <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-200 transition-all hover:scale-105">
              Elegir mi equipo
            </Button>
          </Link>
        </div>
      )}

      {/* Contracts Parallel Processes */}
      {contracts.length > 0 && (() => {
        const isPostDev = POST_DEV_STATES.includes(client.current_state);

        if (!isPostDev) {
          // Fase pre-desarrollo: contratos unificados
          return (
            <div className="grid gap-4 md:grid-cols-2">
              {contracts.map(c => (
                <ContractProgress
                  key={c.id}
                  contract={c}
                  label={c.type === "web" ? "Sitio Web" : "Bono Adicional"}
                  stateOverride={client.current_state}
                  unified={true}
                />
              ))}
            </div>
          );
        } else {
          // Fase post-desarrollo: contratos independientes
          return (
            <div className="grid gap-4 md:grid-cols-2">
              {contracts.map(c => (
                <ContractProgress
                  key={c.id}
                  contract={c}
                  label={c.type === "web" ? "Tu Sitio Web" : "Tu Equipamiento Digital"}
                  unified={false}
                />
              ))}
            </div>
          );
        }
      })()}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Stepper */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Progreso General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {MACRO_PHASES.map((phase, i) => {
                  const isActive = i <= currentIndex;
                  const isCurrent = phase.key === currentMacro;
                  return (
                    <div key={phase.key} className="flex flex-col items-center gap-2 min-w-[80px]">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                          isActive
                            ? "bg-brand-500 text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200",
                          isCurrent && "ring-4 ring-brand-100"
                        )}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider text-center",
                          isActive ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* State Explanation Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className={cn("h-1.5 w-full", actorInfo.color.replace("text", "bg"))} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-slate-400" />
                ¿En qué punto estamos?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{stateInfo.title}</h3>
                <p className="text-slate-600 mt-2 leading-relaxed">{stateInfo.description}</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 w-fit">
                <actorInfo.icon className={cn("w-5 h-5", actorInfo.color)} />
                <span className="text-sm font-medium text-slate-700">
                  Responsable actual: <span className={cn("font-bold", actorInfo.color)}>{actorInfo.label}</span>
                </span>
              </div>

              {/* Client Action Banner */}
              {stateInfo.actor === "cliente" && stateInfo.clientAction && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-amber-100">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-900">
                        Acción requerida por tu parte
                      </p>
                      <p className="text-sm text-amber-800 mt-1">{stateInfo.clientAction}</p>
                      <div className="flex gap-2 mt-4">
                        <Link href="/portal/soporte/tickets/nuevo">
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                            Resolver ahora
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Timeline of State Changes */}
          {interactions.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                  Actividad reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                  {interactions.slice(-5).reverse().map((interaction, idx) => {
                    const toState = interaction.metadata?.to ?? "";
                    const label = getStateLabel(toState);
                    const isFirst = idx === 0;

                    return (
                      <div key={interaction.id} className="relative">
                        <div
                          className={cn(
                            "absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10",
                            isFirst ? "bg-brand-500 scale-125" : "bg-slate-300"
                          )}
                        />
                        <div>
                          <p className={cn(
                            "text-sm font-bold",
                            isFirst ? "text-slate-900" : "text-slate-500"
                          )}>
                            {label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                            {new Date(interaction.created_at).toLocaleDateString("es", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
