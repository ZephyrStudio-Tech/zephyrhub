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

const DOCUMENT_OPTIONS = [
  "Modelo 036 — Alta/modificación censal",
  "Modelo 037 — Alta/modificación censal (autónomos)",
  "Certificado de estar al corriente con la Seguridad Social",
  "Certificado de estar al corriente con Hacienda (AEAT)",
  "DNI / NIF del representante legal",
  "Escrituras de constitución de la empresa",
  "Informe de vida laboral",
  "Otro (especificar abajo)",
] as const;

export function NewTicketForm({
  clients
}: {
  clients: { id: string, company_name: string | null }[]
}) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [additionalContext, setAdditionalContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDocumentCategory = category === "Documentación";

  const toggleDoc = (doc: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(doc)) {
        next.delete(doc);
      } else {
        next.add(doc);
      }
      return next;
    });
  };

  const buildFinalMessage = (): string => {
    if (!isDocumentCategory) {
      return message.trim();
    }
    const docs = Array.from(selectedDocs);
    if (docs.length === 0) return "";

    let finalMsg = "Documentación solicitada:\n" + docs.map((d) => `- ${d}`).join("\n");
    if (additionalContext.trim()) {
      finalMsg += "\n\n" + additionalContext.trim();
    }
    return finalMsg;
  };

  const canSubmit = isDocumentCategory
    ? selectedDocs.size > 0
    : message.trim().length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/backoffice/support" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver a soporte
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            Nuevo ticket
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea un ticket de soporte interno.
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
                Asociar a cliente (opcional)
              </label>
              <select
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                value={selectedClientId}
                disabled={isPending}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Ninguno / General</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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

            {/* Document checkboxes - only for Documentación category */}
            {isDocumentCategory ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selecciona los documentos que necesitas
                  </label>
                  <div className="space-y-2">
                    {DOCUMENT_OPTIONS.map((doc) => (
                      <label
                        key={doc}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc)}
                          onChange={() => toggleDoc(doc)}
                          disabled={isPending}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-700">{doc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contexto adicional (opcional)
                  </label>
                  <textarea
                    className="min-h-[100px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    placeholder="Especifica cualquier detalle adicional sobre los documentos solicitados..."
                    value={additionalContext}
                    disabled={isPending}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  className="min-h-[140px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  placeholder="Describe tu problema o consulta..."
                  value={message}
                  disabled={isPending}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            )}

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
                onClick={() => router.push("/backoffice/support")}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isPending || !canSubmit}
                onClick={() => {
                  const finalMessage = buildFinalMessage();
                  if (!finalMessage) return;
                  startTransition(async () => {
                    setError(null);
                    const res = await createTicket({
                      category,
                      message: finalMessage,
                      clientId: selectedClientId || null
                    });
                    if (!res.ok) {
                      setError(res.error ?? "No se pudo crear el ticket.");
                      return;
                    }
                    router.push("/backoffice/support");
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
