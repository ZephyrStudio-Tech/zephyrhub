"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyTicket } from "@/app/actions/help-center";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string | null;
};

export function SupportInbox({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "abierto" | "resuelto">("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const filtered =
    filter === "all"
      ? tickets
      : tickets.filter((t) => t.status?.toLowerCase() === filter);

  async function handleReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const res = await replyTicket(selected.id, reply.trim());
    setSending(false);
    if (res.ok) {
      setSelected(null);
      setReply("");
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todos
        </Button>
        <Button
          variant={filter === "abierto" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("abierto")}
          className={filter === "abierto" ? "bg-amber-600 hover:bg-amber-700" : ""}
        >
          Abiertos
        </Button>
        <Button
          variant={filter === "resuelto" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("resuelto")}
          className={filter === "resuelto" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          Resueltos
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-foreground">Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 pr-4">Categoría</th>
                  <th className="pb-3 pr-4">Mensaje</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-b border-white/5 cursor-pointer hover:bg-white/5",
                      selected?.id === t.id && "bg-white/10"
                    )}
                    onClick={() => {
                      setSelected(t);
                      setReply(t.admin_reply ?? "");
                    }}
                  >
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-medium border",
                          (t.status?.toLowerCase() ?? "") === "resuelto"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {t.status ?? "abierto"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{t.category}</td>
                    <td className="py-3 pr-4 text-muted max-w-[200px] truncate">
                      {t.message ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {new Date(t.created_at).toLocaleDateString("es")}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(t);
                          setReply(t.admin_reply ?? "");
                        }}
                      >
                        {t.admin_reply ? "Ver / Editar" : "Responder"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-muted">No hay tickets.</p>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <Card
            className="w-full max-w-lg border-white/20 bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">
                Ticket · {selected.category}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted mb-1">Mensaje del cliente</p>
                <p className="text-sm text-foreground rounded-lg bg-white/5 border border-white/10 p-3">
                  {selected.message ?? "—"}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">
                  Respuesta (admin_reply)
                </label>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted"
                  placeholder="Escribe la respuesta al cliente..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  disabled={sending}
                />
              </div>
              <Button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="w-full"
              >
                {sending ? "Enviando…" : "Enviar y marcar como resuelto"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
