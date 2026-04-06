"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChecklistItem = { key: string; label: string };
type Evidence = {
  id: string;
  checklist_key: string;
  storage_path: string;
  uploaded_at: string;
};

export function TechEvidencesView({
  clientId,
  clientName,
  checklist,
  evidences,
}: {
  clientId: string;
  clientName: string;
  checklist: ChecklistItem[];
  evidences: Evidence[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<string | null>(null);
  const supabase = createClient();

  async function handleUpload(checklistKey: string, file: File) {
    setUploading(checklistKey);
    const ext = file.name.split(".").pop() || "png";
    const path = `${clientId}/${checklistKey}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("tech-evidences")
      .upload(path, file, { upsert: false });

    if (error) {
      toast.error(error.message);
      setUploading(null);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(null);
      return;
    }

    await supabase.from("tech_evidences").insert({
      client_id: clientId,
      checklist_key: checklistKey,
      storage_path: path,
      uploaded_by: user.id,
    });

    setUploading(null);
    router.refresh();
  }

  const evidenceByKey = new Map(evidences.map((e) => [e.checklist_key, e]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Evidencias · {clientName}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Checklist técnico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.map((item) => {
            const ev = evidenceByKey.get(item.key);
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <span>{item.label}</span>
                <div className="flex items-center gap-2">
                  {ev && (
                    <span className="text-sm text-gray-500">
                      Subido {new Date(ev.uploaded_at).toLocaleDateString("es")}
                    </span>
                  )}
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="max-w-[200px]"
                    disabled={!!uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(item.key, f);
                      e.target.value = "";
                    }}
                  />
                  {uploading === item.key && (
                    <span className="text-sm text-muted">Subiendo…</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
