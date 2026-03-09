"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTutorial } from "@/app/actions/help-center";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/tiptap-editor";
import { cn } from "@/lib/utils";

type Tutorial = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content_type: string;
  video_url: string | null;
  description: string | null;
  created_at: string;
};

const CATEGORIAS = ["web", "ecommerce", "seo", "factura", "general"];

export function AcademyCMS({ tutorials }: { tutorials: Tutorial[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    content_type: "video" as "video" | "articulo",
    video_url: "",
    content_body: "",
    cover_image: "",
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSending(true);
    const res = await createTutorial({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      content_type: form.content_type,
      video_url: form.content_type === "video" ? form.video_url.trim() || undefined : undefined,
      content_body: form.content_type === "articulo" ? form.content_body : undefined,
      cover_image: form.cover_image.trim() || undefined,
    });
    setSending(false);
    if (res.ok) {
      setOpen(false);
      setForm({
        title: "",
        description: "",
        category: "general",
        content_type: "video",
        video_url: "",
        content_body: "",
        cover_image: "",
      });
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setOpen(true)}>Nuevo Tutorial</Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-foreground">Tutoriales</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {tutorials.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted">
                    {t.category} · {t.content_type === "articulo" ? "Guía" : "Vídeo"}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded border",
                    t.content_type === "articulo"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  )}
                >
                  {t.content_type === "articulo" ? "GUÍA" : "VIDEO"}
                </span>
              </li>
            ))}
          </ul>
          {tutorials.length === 0 && (
            <p className="py-8 text-center text-muted">Aún no hay tutoriales.</p>
          )}
        </CardContent>
      </Card>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-md border-white/20 bg-background max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Nuevo Tutorial</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted block mb-1">Título</label>
                  <Input
                    className="bg-white/5 border-white/10"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    required
                    placeholder="Ej: Cómo subir documentos"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">
                    Descripción (opcional)
                  </label>
                  <Input
                    className="bg-white/5 border-white/10"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Breve descripción"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">
                    Categoría
                  </label>
                  <select
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-foreground"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">
                    Imagen de portada (opcional)
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-white/5 border-white/10"
                    disabled={uploadingCover}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingCover(true);
                      const ext = file.name.split(".").pop() || "jpg";
                      const path = `covers/${Date.now()}.${ext}`;
                      const { error } = await supabase.storage
                        .from("academy")
                        .upload(path, file, { upsert: false });
                      if (error) {
                        alert(error.message);
                        setUploadingCover(false);
                        return;
                      }
                      const { data } = supabase.storage
                        .from("academy")
                        .getPublicUrl(path);
                      setForm((f) => ({ ...f, cover_image: data.publicUrl }));
                      setUploadingCover(false);
                    }}
                  />
                  {form.cover_image && (
                    <p className="text-xs text-muted mt-1 truncate">
                      Portada: {form.cover_image}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">
                    Tipo de contenido
                  </label>
                  <select
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-foreground"
                    value={form.content_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        content_type: e.target.value as "video" | "articulo",
                      }))
                    }
                  >
                    <option value="video">Vídeo</option>
                    <option value="articulo">Artículo / Guía</option>
                  </select>
                </div>
                {form.content_type === "video" && (
                  <div>
                    <label className="text-sm text-muted block mb-1">
                      URL del vídeo (ej: YouTube)
                    </label>
                    <Input
                      className="bg-white/5 border-white/10"
                      type="url"
                      value={form.video_url}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, video_url: e.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                )}
                {form.content_type === "articulo" && (
                  <div>
                    <label className="text-sm text-muted block mb-1">
                      Contenido (texto de la guía)
                    </label>
                    <TiptapEditor
                      value={form.content_body}
                      onChange={(html) =>
                        setForm((f) => ({ ...f, content_body: html }))
                      }
                      placeholder="Escribe el contenido del artículo..."
                    />
                  </div>
                )}
                <Button type="submit" disabled={sending} className="w-full">
                  {sending ? "Creando…" : "Crear tutorial"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
