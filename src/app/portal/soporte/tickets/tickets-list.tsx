"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/actions/help-center";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Ticket = {
  id: string;
  category: string;
  message: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string | null;
};

const CATEGORIES = ["general", "web", "ecommerce", "seo", "factura", "soporte"];

export function TicketsList({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "abierto" | "cerrado">("all");
  const [openNew, setOpenNew] = useState(false);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const filtered =
    tab === "all"
      ? tickets
      : tab === "abierto"
        ? tickets.filter((t) => (t.status?.toLowerCase() ?? "abierto") !== "resuelto")
        : tickets.filter((t) => (t.status?.toLowerCase() ?? "") === "resuelto");

  async function handleCreate() {
    if (!message.trim()) return;
    setSending(true);
    const res = await createTicket({ category, message: message.trim() });
    setSending(false);
    if (res.ok) {
      setOpenNew(false);
      setMessage("");
      setCategory("general");
      router.refresh();
    } else {
      alert(res.error ?? "Error al crear el ticket");
    }
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={tab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("all")}
        >
          Todos
        </Button>
        <Button
          variant={tab === "abierto" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("abierto")}
          className={tab === "abierto" ? "bg-amber-600 hover:bg-amber-700" : ""}
        >
          Abiertos
        </Button>
        <Button
          variant={tab === "cerrado" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("cerrado")}
          className={tab === "cerrado" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          Cerrados
        </Button>
      </div>

      <div className="space-y-4">
        {filtered.map((t) => (
          <Card
            key={t.id}
            className="border-white/10 bg-white/5 overflow-hidden"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    (t.status?.toLowerCase() ?? "") === "resuelto"
                      ? "text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }
                >
                  {t.status ?? "abierto"}
                </span>
                <span className="text-xs text-muted">{t.category}</span>
                <span className="text-xs text-muted ml-auto">
                  {new Date(t.created_at).toLocaleDateString("es")}
                </span>
              </div>
              <p className="text-sm text-foreground">{t.message ?? "—"}</p>
              {t.admin_reply && (
                <div className="rounded-lg bg-black/20 border border-white/10 p-3">
                  <p className="text-xs text-muted mb-1">Respuesta del equipo</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {t.admin_reply}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-muted">No hay tickets en esta pestaña.</p>
      )}

      {/* FAB + Modal nuevo ticket */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg bg-accent hover:bg-accent/90"
          onClick={() => setOpenNew(true)}
        >
          + Nuevo Ticket
        </Button>
      </div>

      {openNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !sending && setOpenNew(false)}
        >
          <Card
            className="w-full max-w-md border-white/20 bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold text-foreground">Nuevo ticket</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => !sending && setOpenNew(false)}
              >
                Cerrar
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-foreground"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Mensaje</label>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted"
                  placeholder="Describe tu consulta..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={sending || !message.trim()}
                className="w-full"
              >
                {sending ? "Enviando…" : "Enviar ticket"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
