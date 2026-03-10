"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const filtered =
    filter === "all"
      ? tickets
      : tickets.filter((t) => t.status?.toLowerCase() === filter);

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

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
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
                      "border-b border-gray-100 cursor-pointer hover:bg-gray-50",
                    )}
                    onClick={() => {
                      router.push(`/backoffice/support/${t.id}`);
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
                    <td className="py-3 pr-4 text-gray-500 max-w-[260px] truncate">
                      {t.message ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(t.created_at).toLocaleDateString("es")}
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-brand-600 font-medium">
                        Ver hilo →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-gray-500">No hay tickets.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
