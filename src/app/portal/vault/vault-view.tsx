"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Slot = { key: string; label: string };
type Doc = {
  id: string;
  slot_type: string;
  version: number;
  status: string;
  rejection_reason: string | null;
  uploaded_at: string;
};

export function VaultView({
  clientId,
  slots,
  documents: initialDocs,
}: {
  clientId: string;
  slots: Slot[];
  documents: Doc[];
}) {
  const [documents, setDocuments] = useState(initialDocs);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function getLatestDoc(slotType: string): Doc | undefined {
    return documents
      .filter((d) => d.slot_type === slotType)
      .sort((a, b) => b.version - a.version)[0];
  }

  async function handleUpload(slotType: string, file: File) {
    setError(null);
    setUploading(slotType);
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${clientId}/${slotType}_v${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: false });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(null);
      return;
    }

    const version =
      (documents.filter((d) => d.slot_type === slotType).reduce((m, d) => Math.max(m, d.version), 0) || 0) + 1;

    const { error: insertErr } = await supabase.from("documents").insert({
      client_id: clientId,
      slot_type: slotType,
      version,
      storage_path: path,
      status: "pending",
    });

    if (insertErr) {
      setError(insertErr.message);
      setUploading(null);
      return;
    }

    setDocuments((prev) => [
      ...prev,
      {
        id: "",
        slot_type: slotType,
        version,
        status: "pending",
        rejection_reason: null,
        uploaded_at: new Date().toISOString(),
      },
    ]);
    setUploading(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bóveda documental</h1>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {slots.map((slot) => {
          const doc = getLatestDoc(slot.key);
          const isRejected = doc?.status === "rejected";
          return (
            <Card
              key={slot.key}
              className={
                isRejected
                  ? "border border-red-200 bg-red-50"
                  : "border border-gray-200 bg-white"
              }
            >
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">{slot.label}</CardTitle>
                {doc && (
                  <p className="text-sm text-gray-600">
                    Estado:{" "}
                    {doc.status === "approved"
                      ? "Aprobado"
                      : doc.status === "rejected"
                        ? "Rechazado"
                        : "Pendiente de revisión"}
                    {doc.rejection_reason && (
                      <span className="mt-2 block text-red-700">
                        Motivo: {doc.rejection_reason}
                      </span>
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <label className="block text-sm text-gray-600 mb-2">
                  Subir archivo
                </label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={uploading === slot.key}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(slot.key, f);
                      e.target.value = "";
                    }}
                    className="flex-1"
                  />
                  {uploading === slot.key && (
                    <span className="text-sm text-muted">Subiendo…</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
