"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addTicketMessage, updateTicketStatus } from "@/app/actions/help-center";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  profiles?: {
    full_name?: string;
    email?: string;
  }[];
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusBadge(status: string | null | undefined) {
  const s = (status ?? "abierto").toLowerCase();
  if (s === "resuelto" || s === "cerrado") {
    return "bg-success-50 text-success-700 border-success-200";
  }
  if (s === "en_proceso" || s === "en proceso") {
    return "bg-brand-50 text-brand-700 border-brand-200";
  }
  return "bg-warning-50 text-warning-700 border-warning-200";
}

export function BackofficeTicketView({
  ticket,
  messages: initialMessages,
}: {
  ticket: Ticket;
  messages: TicketMessage[];
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(ticket.status ?? "abierto");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>(() => {
    const initial: TicketMessage = {
      id: "initial",
      ticket_id: ticket.id,
      message: ticket.message ?? "—",
      attachment_url: null,
      sender_role: "cliente",
      created_at: ticket.created_at,
    };
    return [initial, ...(initialMessages ?? [])];
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sincronizar el estado local con los datos frescos del servidor tras un router.refresh()
  useEffect(() => {
    const base: TicketMessage[] = [
      {
        id: "initial",
        ticket_id: ticket.id,
        message: ticket.message ?? "—",
        attachment_url: null,
        sender_role: "cliente",
        created_at: ticket.created_at,
      },
      ...(initialMessages ?? []),
    ];

    setMessages((prev) => {
      const temps = prev.filter((m) => m.id.startsWith("temp-"));
      const merged = [...base];

      temps.forEach((t) => {
        if (
          !merged.some(
            (m) =>
              m.message === t.message &&
              (m.sender_role ?? "").toLowerCase() ===
                (t.sender_role ?? "").toLowerCase()
          )
        ) {
          merged.push(t);
        }
      });

      return merged.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    });

    setStatus(ticket.status ?? "abierto");
  }, [initialMessages, ticket.status, ticket.id, ticket.message, ticket.created_at]);

  // Supabase Realtime: nuevos mensajes + cambios de estado.
  useEffect(() => {
    const supabase = createClient();
    const channelName = `ticket-chat-${ticket.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          console.log("🟢 [Realtime] Nuevo mensaje recibido (backoffice):", payload.new);
          const newMessage = payload.new as TicketMessage;
          setMessages((prev) => {
            // Si ya tenemos el mensaje real por ID, no hacemos nada.
            if (prev.some((m) => m.id === newMessage.id)) return prev;

            // Si existe un mensaje temporal idéntico, lo descartamos a favor del real.
            const filtered = prev.filter(
              (m) =>
                !(
                  m.id.startsWith("temp-") &&
                  m.message === newMessage.message &&
                  (m.sender_role ?? "").toLowerCase() ===
                    (newMessage.sender_role ?? "").toLowerCase()
                )
            );

            return [...filtered, newMessage].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_requests",
          filter: `id=eq.${ticket.id}`,
        },
        (payload) => {
          console.log("🔵 [Realtime] Estado actualizado (backoffice):", payload.new);
          const nextStatus = (payload.new as { status?: string | null }).status;
          if (nextStatus) setStatus(nextStatus);
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 [Realtime Status Backoffice] ${status}`, err ? err : "");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  // Scroll automático al último mensaje.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const customerName = ticket.profiles?.[0]?.full_name || "Cliente";
  const customerEmail = ticket.profiles?.[0]?.email || "Sin email";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] min-h-[600px]">
      {/* Left Column - Chat */}
      <Card className="flex flex-col h-full overflow-hidden lg:col-span-2">
        {/* Chat Header */}
        <div className="flex-shrink-0 border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Ticket #{ticket.id.slice(0, 6)} - {ticket.category}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(ticket.created_at)}
          </p>
        </div>

        {/* Messages Container - Scrollable Only Here */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m) => {
            const isClient = (m.sender_role ?? "").toLowerCase() === "cliente";
            const senderName = isClient ? customerName : "Support";
            const senderInitials = getInitials(senderName);

            return (
              <div key={m.id} className="flex gap-4">
                {/* Avatar */}
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white",
                    isClient ? "bg-gray-800" : "bg-brand-500"
                  )}
                >
                  {senderInitials}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(m.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-50 rounded-lg p-3 text-sm text-gray-900 border border-gray-100">
                    <div className="whitespace-pre-wrap">{m.message}</div>
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

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4">
          <div className="border border-gray-300 rounded-xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
            <textarea
              className="w-full resize-none rounded-t-xl border-0 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              placeholder="Escribe una respuesta..."
              value={text}
              disabled={isPending}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            <div className="bg-gray-50 border-t border-gray-200 rounded-b-xl p-3 flex justify-end">
              <Button
                type="button"
                disabled={isPending || text.trim().length === 0}
                onClick={() => {
                  const msg = text.trim();
                  if (!msg) return;
                  const tempId = `temp-${Date.now()}`;
                  const optimistic: TicketMessage = {
                    id: tempId,
                    ticket_id: ticket.id,
                    message: msg,
                    attachment_url: null,
                    sender_role: "soporte",
                    created_at: new Date().toISOString(),
                  };

                  // Optimistic UI: añadimos el mensaje al instante.
                  setMessages((prev) => [...prev, optimistic]);
                  setText("");

                  startTransition(async () => {
                    setError(null);
                    const res = await addTicketMessage({
                      ticketId: ticket.id,
                      message: msg,
                      isClient: false,
                    });
                    if (!res.ok) {
                      // Rollback: eliminamos el mensaje temporal.
                      setMessages((prev) => prev.filter((m) => m.id !== tempId));
                      const message = res.error ?? "No se pudo enviar el mensaje.";
                      setError(message);
                      if (typeof window !== "undefined") {
                        window.alert(message);
                      }
                    }
                  });
                }}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Right Column - Ticket Details */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {/* Customer */}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">Customer</span>
            <span className="text-sm font-medium text-gray-900">{customerName}</span>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">Email</span>
            <span className="text-sm font-medium text-gray-900 break-all">{customerEmail}</span>
          </div>

          {/* Ticket ID */}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">Ticket ID</span>
            <span className="text-sm font-mono text-gray-900">#{ticket.id.slice(0, 8)}</span>
          </div>

          {/* Category */}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">Category</span>
            <span className="text-sm font-medium text-gray-900">{ticket.category}</span>
          </div>

          {/* Created */}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">Created</span>
            <span className="text-sm text-gray-900">{new Date(ticket.created_at).toLocaleDateString("es")}</span>
          </div>

          {/* Status */}
          <div className="flex justify-between items-center py-4">
            <span className="text-sm text-gray-600">Status</span>
            <select
              className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

