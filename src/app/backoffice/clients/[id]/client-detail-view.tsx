"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitionClientState } from "@/app/actions/transition-state";
import { approveDocument, rejectDocument } from "@/app/actions/documents";
import { registerCallMissed, registerCallSuccess } from "@/app/actions/interactions";
import { generateAgreement } from "@/app/actions/agreements";
import type { PipelineState } from "@/lib/state-machine/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Client = {
  id: string;
  company_name: string | null;
  cif: string | null;
  current_state: string;
  service_type: string;
  consultant_id: string | null;
  user_id: string | null;
  created_at: string;
};

type Interaction = {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_id: string;
};

type Document = {
  id: string;
  slot_type: string;
  version: number;
  status: string;
  rejection_reason: string | null;
  storage_path: string;
  uploaded_at: string;
};

type Slot = { key: string; label: string };

export function ClientDetailView({
  client,
  interactions,
  documents,
  slots,
  phases,
  suggestedNext,
}: {
  client: Client;
  interactions: Interaction[];
  documents: Document[];
  slots: Slot[];
  phases: { name: string; states: PipelineState[] }[];
  suggestedNext: PipelineState | null;
}) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [generating, setGenerating] = useState(false);

  async function onStateChange(toState: string) {
    setChanging(true);
    const res = await transitionClientState(client.id, toState);
    setChanging(false);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function onApprove(docId: string) {
    const res = await approveDocument(docId);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function onReject(docId: string) {
    if (!rejectReason.trim()) return;
    setRejecting(docId);
    const res = await rejectDocument(docId, rejectReason);
    setRejecting(null);
    setRejectReason("");
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function onCallMissed() {
    const res = await registerCallMissed(client.id);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function onCallSuccess() {
    const res = await registerCallSuccess(client.id);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function onGenerateAgreement() {
    setGenerating(true);
    const res = await generateAgreement(client.id);
    setGenerating(false);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  const docsBySlot = slots.map((slot) => {
    const doc = documents
      .filter((d) => d.slot_type === slot.key)
      .sort((a, b) => b.version - a.version)[0];
    return { slot, doc };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{client.company_name || client.cif || "Cliente"}</CardTitle>
            <p className="text-sm text-muted">
              Estado:{" "}
              <span className="rounded bg-accent/20 px-2 py-0.5 text-accent">
                {client.current_state}
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted">Cambiar estado</label>
              <select
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
                value={client.current_state}
                disabled={changing}
                onChange={(e) => onStateChange(e.target.value)}
              >
                {phases.map((phase) => (
                  <optgroup key={phase.name} label={phase.name}>
                    {phase.states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {suggestedNext && (
              <Button
                onClick={() => onStateChange(suggestedNext)}
                disabled={changing}
              >
                Siguiente paso: {suggestedNext}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>One-Click Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onCallMissed}
            >
              Llamada no respondida
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onCallSuccess}
            >
              Llamada exitosa
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {interactions.slice(0, 20).map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.type}</span>
                  <span className="text-muted">
                    {new Date(i.created_at).toLocaleString("es")}
                  </span>
                </li>
              ))}
              {interactions.length === 0 && (
                <li className="text-muted">Ninguna</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vault (documentos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {docsBySlot.map(({ slot, doc }) => (
              <div
                key={slot.key}
                className={
                  doc?.status === "rejected"
                    ? "rounded-lg border border-red-500/30 bg-red-500/5 p-3"
                    : "rounded-lg border border-white/10 p-3"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{slot.label}</span>
                  <span className="text-sm text-muted">
                    {doc
                      ? `v${doc.version} - ${doc.status}`
                      : "Sin documento"}
                  </span>
                </div>
                {doc && doc.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onApprove(doc.id)}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejecting(doc.id)}
                    >
                      Rechazar
                    </Button>
                    {rejecting === doc.id && (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          placeholder="Motivo rechazo"
                          className="flex-1 rounded border border-white/20 bg-white/5 px-2 py-1 text-sm"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => onReject(doc.id)}
                          disabled={!rejectReason.trim()}
                        >
                          Enviar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {doc?.rejection_reason && (
                  <p className="mt-1 text-sm text-red-400">
                    Motivo: {doc.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acuerdos</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAgreement}
              disabled={generating}
            >
              {generating ? "Generando…" : "Generar acuerdo"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
