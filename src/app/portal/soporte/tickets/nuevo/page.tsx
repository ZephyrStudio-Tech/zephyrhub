"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTicket } from "@/app/actions/help-center";

const CATEGORIES = [
  "Acceso / Login",
  "Facturación",
  "Documentación",
  "Incidencia técnica",
  "Pregunta general",
] as const;

export default function NuevoTicketPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/portal/soporte/tickets" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver a tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            Nuevo ticket
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe tu problema y te responderemos en el hilo.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50"
                value={category}
                disabled={isPending}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
              </label>
              <textarea
                className="min-h-[140px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50"
                placeholder="Cuéntanos qué ocurre, pasos para reproducir, capturas, etc."
                value={message}
                disabled={isPending}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => router.push("/portal/soporte/tickets")}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isPending || message.trim().length === 0}
                onClick={() => {
                  const msg = message.trim();
                  if (!msg) return;
                  startTransition(async () => {
                    setError(null);
                    const res = await createTicket({ category, message: msg });
                    if (!res.ok) {
                      setError(res.error ?? "No se pudo crear el ticket.");
                      return;
                    }
                    router.push("/portal/soporte/tickets");
                  });
                }}
              >
                Crear ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

