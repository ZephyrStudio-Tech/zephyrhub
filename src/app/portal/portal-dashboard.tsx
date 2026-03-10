"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MACRO_PHASES, getMacroPhase } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Client = {
  id: string;
  company_name: string | null;
  current_state: string;
  service_type: string;
} | null;

type Alert = { id: string; message: string; created_at: string; read_at: string | null }[];

export function PortalDashboard({
  client: initialClient,
  alerts: initialAlerts,
  role,
}: {
  client: Client;
  alerts: Alert;
  role: string | null;
}) {
  const [client, setClient] = useState(initialClient);
  const [alerts, setAlerts] = useState(initialAlerts);

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
        () => {
          setAlerts((prev) => [
            {
              id: "",
              message: "Nueva alerta",
              created_at: new Date().toISOString(),
              read_at: null,
            },
            ...prev,
          ]);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {client.company_name || "Mi expediente"}
        </h1>
        <p className="text-gray-500">Estado actual: {client.current_state}</p>
      </div>

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-700">Avisos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a) => (
              <p key={a.id} className="text-sm">
                ⚠️ {a.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Progreso del expediente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
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
    </div>
  );
}
