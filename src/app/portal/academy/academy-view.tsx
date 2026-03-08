"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  title: string;
  slug: string;
  category: string;
  video_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
};

export function AcademyView({
  content,
  categories,
  clientId = null,
}: {
  content: Item[];
  categories: string[];
  clientId?: string | null;
}) {
  const [showContact, setShowContact] = useState(false);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("support_requests").insert({
      user_id: user.id,
      client_id: clientId ?? null,
      category: category || "general",
      message: message || null,
    });
    setSent(true);
    setShowContact(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zephyr Academy</h1>
        <Button variant="outline" size="sm" onClick={() => setShowContact(true)}>
          Contactar soporte
        </Button>
      </div>

      {content.length === 0 ? (
        <p className="text-muted">
          Próximamente: micro-píldoras de formación (Elementor, WooCommerce, etc.).
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <Card key={item.id} className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <span className="text-xs text-muted">{item.category}</span>
              </CardHeader>
              <CardContent>
                {item.video_url ? (
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    Ver vídeo
                  </a>
                ) : (
                  <p className="text-sm text-muted">{item.description || "—"}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contactar soporte</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowContact(false)}>
                Cerrar
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted">
                Elige una categoría. Te mostraremos un vídeo que puede resolver tu duda.
              </p>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted">Categoría</label>
                  <select
                    className="mt-1 w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted">
                  Si el vídeo no resuelve tu duda, escribe tu mensaje:
                </p>
                <textarea
                  className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Mensaje"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit">
                  Enviar solicitud de soporte
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {sent && (
        <p className="text-sm text-accent">Solicitud enviada. Te contactaremos pronto.</p>
      )}
    </div>
  );
}
