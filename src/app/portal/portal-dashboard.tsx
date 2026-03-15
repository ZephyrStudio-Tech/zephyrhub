"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MACRO_PHASES, getMacroPhase, PIPELINE_STATE_LABELS } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Clock, CheckCircle, Building2, Users, FileText } from "lucide-react";
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
    description: "Tu solicitud ha sido registrada. Nuestro equipo revisara tu informacion y se pondra en contacto contigo.",
    actor: "zephyr",
  },
  no_contesta: {
    title: "Pendiente de contacto",
    description: "Hemos intentado contactarte pero no hemos podido localizarte. Por favor, revisa tu telefono o correo.",
    actor: "cliente",
    clientAction: "Contacta con nosotros para continuar con tu solicitud",
  },
  contactar_mas_tarde: {
    title: "Contacto programado",
    description: "Tenemos agendado contactarte proximamente. Mantente atento a nuestras comunicaciones.",
    actor: "zephyr",
  },
  imposible_contactar: {
    title: "Sin respuesta",
    description: "No hemos podido establecer contacto. Si deseas continuar, por favor contactanos.",
    actor: "cliente",
    clientAction: "Envía un ticket de soporte para retomar el proceso",
  },
  consultoria: {
    title: "En consultoria",
    description: "Estamos analizando tu caso y preparando toda la documentacion necesaria para tu solicitud de Kit Digital.",
    actor: "zephyr",
  },
  listo_para_tramitar: {
    title: "Listo para tramitar",
    description: "Tu expediente esta completo y preparado. Procederemos a enviarlo a Red.es para su evaluacion.",
    actor: "zephyr",
  },
  esperando_concesion: {
    title: "Esperando concesion",
    description: "Tu solicitud ha sido enviada a Red.es. Estamos a la espera de que resuelvan tu expediente.",
    actor: "redes",
  },
  subsanacion_tramitacion: {
    title: "Subsanacion requerida",
    description: "Red.es ha solicitado documentacion adicional o correcciones. Necesitamos tu colaboracion.",
    actor: "cliente",
    clientAction: "Revisa la documentacion solicitada y enviala cuanto antes",
  },
  bono_concedido: {
    title: "Bono concedido",
    description: "Enhorabuena! Red.es ha aprobado tu solicitud. Ahora confirmaremos los detalles para iniciar el desarrollo.",
    actor: "zephyr",
  },
  consultoria_confirmacion: {
    title: "Confirmacion de consultoria",
    description: "Estamos verificando los ultimos detalles de tu expediente antes de emitir los acuerdos.",
    actor: "zephyr",
  },
  emitir_acuerdos: {
    title: "Emision de acuerdos",
    description: "Preparando los acuerdos de colaboracion para tu firma.",
    actor: "zephyr",
  },
  empezar_desarrollo: {
    title: "Inicio del desarrollo",
    description: "Tu proyecto esta en marcha! Nuestro equipo tecnico esta trabajando en tu solucion digital.",
    actor: "zephyr",
  },
  presentar_justificacion_fase_i: {
    title: "Preparando justificacion Fase I",
    description: "Estamos recopilando toda la documentacion para justificar el trabajo realizado ante Red.es.",
    actor: "zephyr",
  },
  firma_justificacion: {
    title: "Firma de justificacion",
    description: "Necesitamos tu firma en los documentos de justificacion para poder presentarlos.",
    actor: "cliente",
    clientAction: "Firma los documentos de justificacion pendientes",
  },
  subsanacion_fase_i: {
    title: "Subsanacion Fase I",
    description: "Red.es ha solicitado aclaraciones sobre la justificacion. Estamos preparando la respuesta.",
    actor: "zephyr",
  },
  resolucion_red_es: {
    title: "Resolucion Red.es",
    description: "Red.es esta evaluando la justificacion presentada. Esperamos su resolucion.",
    actor: "redes",
  },
  pago_i_fase: {
    title: "Pago Fase I",
    description: "La primera fase ha sido aprobada. El pago esta en proceso.",
    actor: "redes",
  },
  ano_mantenimiento: {
    title: "Año de mantenimiento",
    description: "Tu solucion esta en periodo de mantenimiento. Seguimos dandote soporte.",
    actor: "zephyr",
  },
  justificacion_ii_fase: {
    title: "Justificacion Fase II",
    description: "Preparando la documentacion de la segunda fase de justificacion.",
    actor: "zephyr",
  },
  firma_justificacion_ii: {
    title: "Firma Fase II",
    description: "Necesitamos tu firma para los documentos de la segunda fase.",
    actor: "cliente",
    clientAction: "Firma los documentos de justificacion de la Fase II",
  },
  subsanacion_fase_ii: {
    title: "Subsanacion Fase II",
    description: "Atendiendo requerimientos de Red.es sobre la segunda justificacion.",
    actor: "zephyr",
  },
  resolucion_ii_red_es: {
    title: "Resolucion Final",
    description: "Red.es esta evaluando la justificacion final de tu proyecto.",
    actor: "redes",
  },
  ganada: {
    title: "Proyecto completado",
    description: "Enhorabuena! Tu proyecto Kit Digital ha sido completado con exito. Gracias por confiar en nosotros.",
    actor: "zephyr",
  },
  perdida: {
    title: "Expediente cerrado",
    description: "Este expediente ha sido cerrado. Contactanos si tienes dudas o quieres iniciar un nuevo proceso.",
    actor: "cliente",
    clientAction: "Contactanos para mas informacion",
  },
};

function getStateLabel(stateId: string): string {
  const found = PIPELINE_STATE_LABELS.find((s) => s.id === stateId);
  return found?.label ?? stateId;
}

export function PortalDashboard({
  client: initialClient,
  alerts: initialAlerts,
  interactions: initialInteractions,
  role,
}: {
  client: Client;
  alerts: Alert;
  interactions: Interaction[];
  role: string | null;
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
    description: "Tu expediente esta siendo procesado.",
    actor: "zephyr" as const,
  };

  const handleDismissAlert = (alertId: string) => {
    // Optimistic update
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    startTransition(async () => {
      await dismissAlert(alertId);
    });
  };

  const actorLabels = {
    zephyr: { label: "ZephyrStudio", icon: Building2, color: "text-brand-600" },
    redes: { label: "Red.es", icon: FileText, color: "text-blue-600" },
    cliente: { label: "Tu accion requerida", icon: Users, color: "text-amber-600" },
  };

  const actorInfo = actorLabels[stateInfo.actor];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {client.company_name || "Mi expediente"}
        </h1>
        <p className="text-gray-500">Estado actual: {getStateLabel(client.current_state)}</p>
      </div>

      {/* Dismissible Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">{a.message}</p>
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

      {/* Progress Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del expediente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {MACRO_PHASES.map((phase, i) => {
              const isActive = i <= currentIndex;
              const isCurrent = phase.key === currentMacro;
              return (
                <div key={phase.key} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                      isActive
                        ? "bg-brand-500 text-white"
                        : "bg-white text-gray-400 border border-gray-200",
                      isCurrent && "ring-2 ring-brand-500 ring-offset-2 ring-offset-gray-50"
                    )}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      isActive ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {phase.label}
                  </span>
                  {i < MACRO_PHASES.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-8",
                        isActive ? "bg-brand-500" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* State Explanation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Estado actual del expediente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{stateInfo.title}</h3>
            <p className="text-gray-600 mt-1">{stateInfo.description}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <actorInfo.icon className={cn("w-4 h-4", actorInfo.color)} />
            <span className={cn("font-medium", actorInfo.color)}>
              Actuando: {actorInfo.label}
            </span>
          </div>

          {/* Client Action Banner */}
          {stateInfo.actor === "cliente" && stateInfo.clientAction && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Accion requerida de tu parte
                  </p>
                  <p className="text-sm text-amber-700 mt-1">{stateInfo.clientAction}</p>
                  <Link href="/portal/soporte/tickets/nuevo">
                    <Button variant="outline" size="sm" className="mt-3 border-amber-400 text-amber-700 hover:bg-amber-100">
                      Contactar con soporte
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline of State Changes */}
      {interactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-500" />
              Historial del expediente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {interactions.map((interaction, idx) => {
                  const toState = interaction.metadata?.to ?? "";
                  const label = getStateLabel(toState);
                  const isLast = idx === interactions.length - 1;

                  return (
                    <div key={interaction.id} className="flex items-start gap-4 relative">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                          isLast
                            ? "bg-brand-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={cn(
                          "text-sm font-medium",
                          isLast ? "text-gray-900" : "text-gray-700"
                        )}>
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(interaction.created_at).toLocaleDateString("es", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
