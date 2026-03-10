"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addTicketMessage, updateTicketStatus } from "@/app/actions/help-center";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  message: string;
  attachment_url: string | null;
  sender_role: "cliente" | "soporte" | string;
  created_at: string;
};

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("es");
  } catch {
    return value;
  }
}

function statusBadge(status: string | null | undefined) {
  const s = (status ?? "abierto").toLowerCase();
  if (s === "resuelto" || s === "cerrado") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "en_proceso" || s === "en proceso") {
    return "bg-brand-50 text-brand-700 border-brand-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function BackofficeTicketView({
  ticket,
  messages,
}: {
  ticket: Ticket;
  messages: TicketMessage[];
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(ticket.status ?? "abierto");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const timeline = useMemo(() => {
    const initial: TicketMessage = {
      id: "initial",
      ticket_id: ticket.id,
      message: ticket.message ?? "—",
      attachment_url: null,
      sender_role: "cliente",
      created_at: ticket.created_at,
    };
    return [initial, ...(messages ?? [])];
  }, [messages, ticket.created_at, ticket.id, ticket.message]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/backoffice/support" className="text-sm text-gray-500 hover:text-gray-700">
              ← Bandeja
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">Ticket</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {ticket.category}
          </h1>
          <p className="text-sm text-gray-500">
            Creado {formatDateTime(ticket.created_at)}
            {ticket.updated_at ? ` · Actualizado ${formatDateTime(ticket.updated_at)}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium border", statusBadge(status))}>
            {status}
          </span>
          <select
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50"
            value={status}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.value;
              setStatus(next);
              startTransition(async () => {
                setError(null);
                const res = await updateTicketStatus(ticket.id, next);
                if (!res.ok) setError(res.error ?? "No se pudo actualizar el estado.");
              });
            }}
          >
            <option value="abierto">abierto</option>
            <option value="en_proceso">en_proceso</option>
            <option value="resuelto">resuelto</option>
            <option value="cerrado">cerrado</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hilo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((m) => {
              const isClient = (m.sender_role ?? "").toLowerCase() === "cliente";
              return (
                <div
                  key={m.id}
                  className={cn("flex", isClient ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-xs",
                      isClient
                        ? "bg-gray-50 border-gray-200 text-gray-900"
                        : "bg-brand-500 border-brand-600 text-white"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{m.message}</div>
                    <div
                      className={cn(
                        "mt-2 text-[11px]",
                        isClient ? "text-gray-500" : "text-white/80"
                      )}
                    >
                      {formatDateTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex gap-2">
              <textarea
                className="min-h-[44px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50"
                placeholder="Escribe una respuesta..."
                value={text}
                disabled={isPending}
                onChange={(e) => setText(e.target.value)}
              />
              <Button
                type="button"
                disabled={isPending || text.trim().length === 0}
                onClick={() => {
                  const msg = text.trim();
                  if (!msg) return;
                  startTransition(async () => {
                    setError(null);
                    const res = await addTicketMessage({
                      ticketId: ticket.id,
                      message: msg,
                      isClient: false,
                    });
                    if (!res.ok) {
                      setError(res.error ?? "No se pudo enviar el mensaje.");
                      return;
                    }
                    setText("");
                  });
                }}
              >
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

