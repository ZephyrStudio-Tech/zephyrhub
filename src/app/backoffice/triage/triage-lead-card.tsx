"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertLeadToClient, rejectLead } from "@/app/actions/triage";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type TriageLead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  province: string | null;
  company_name: string | null;
  nif: string | null;
  entity_type: string | null;
  company_size: string | null;
  service_requested: string | null;
  hardware_pref: string | null;
  web_state: string | null;
  complemento: string | null;
  kit_digital_prev: string | null;
  created_at: string | null;
};

export function TriageLeadCard({
  lead,
}: {
  lead: TriageLead;
}) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  async function handleConvert() {
    setConverting(true);
    const res = await convertLeadToClient(lead.id);
    setConverting(false);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function handleReject() {
    if (!confirm("¿Rechazar este lead? No podrá recuperarse del buzón.")) return;
    setRejecting(true);
    const res = await rejectLead(lead.id);
    setRejecting(false);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  const title = lead.company_name?.trim() || lead.full_name || "Sin nombre";
  const sub = [lead.email, lead.phone].filter(Boolean).join(" · ");

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted">
          {sub}
          {lead.province ? ` · ${lead.province}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted">
        <p>
          <span className="text-foreground">Servicio:</span>{" "}
          {lead.service_requested ?? "—"}
        </p>
        <p>
          <span className="text-foreground">Tipo:</span>{" "}
          {lead.entity_type ?? "—"} · Tamaño {lead.company_size ?? "—"}
        </p>
        {lead.created_at && (
          <p className="text-xs">
            Recibido {new Date(lead.created_at).toLocaleString("es")}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button
          onClick={handleConvert}
          disabled={converting || rejecting}
        >
          {converting ? "Convirtiendo…" : "Convertir a expediente"}
        </Button>
        <Button
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          onClick={handleReject}
          disabled={converting || rejecting}
        >
          {rejecting ? "Rechazando…" : "Rechazar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
