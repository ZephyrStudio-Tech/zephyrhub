"use client";

import Link from "next/link";
import { transitionClientState } from "@/app/actions/transition-state";
import { PHASES } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Client = {
  id: string;
  company_name: string | null;
  cif: string | null;
  current_state: string;
  service_type: string;
  consultant_id: string | null;
  created_at: string;
};

export function PipelineView({
  clients,
  phases,
}: {
  clients: Client[];
  phases: { name: string; states: PipelineState[] }[];
}) {
  const router = useRouter();
  const [changing, setChanging] = useState<string | null>(null);

  async function onStateChange(clientId: string, toState: string) {
    setChanging(clientId);
    const res = await transitionClientState(clientId, toState);
    setChanging(null);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Pipeline</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {phases.map((phase) => {
          const inPhase = clients.filter((c) =>
            phase.states.includes(c.current_state as PipelineState)
          );
          return (
            <div key={phase.name} className="space-y-2">
              <h2 className="text-sm font-medium text-muted">{phase.name}</h2>
              <div className="space-y-2">
                {inPhase.map((client) => (
                  <Card
                    key={client.id}
                    className="border-white/10 bg-white/5"
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium">
                        <Link
                          href={`/backoffice/clients/${client.id}`}
                          className="text-foreground hover:text-accent"
                        >
                          {client.company_name || client.cif || client.id.slice(0, 8)}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <select
                        className="w-full rounded border border-white/20 bg-white/5 px-2 py-1.5 text-sm"
                        value={client.current_state}
                        disabled={!!changing}
                        onChange={(e) =>
                          onStateChange(client.id, e.target.value)
                        }
                      >
                        {phases.flatMap((p) =>
                          p.states.map((s) => (
                            <option key={s} value={s}>
                              {p.name === phase.name ? s : `${p.name}: ${s}`}
                            </option>
                          ))
                        )}
                      </select>
                    </CardContent>
                  </Card>
                ))}
                {inPhase.length === 0 && (
                  <p className="text-sm text-muted">Ninguno</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
