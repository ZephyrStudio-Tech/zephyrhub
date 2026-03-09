"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  title: string | null;
  slug: string | null;
  category: string | null;
  description: string | null;
  content_type: string | null;
  video_url: string | null;
  content_body: string | null;
  cover_image: string | null;
};

/** Convierte URL de YouTube (watch?v=XXX o youtu.be/XXX) a embed. Si no es YouTube, devuelve la URL tal cual. */
function toEmbedVideoUrl(url: string): string {
  const u = url.trim();
  const youtuBeMatch = u.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
  const watchMatch = u.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return u;
}

export function TutorialesList({
  items,
  initialSearch,
}: {
  items: Item[];
  initialSearch: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [guiaOpen, setGuiaOpen] = useState<Item | null>(null);
  const [videoOpen, setVideoOpen] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        (i.title ?? "").toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <>
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Buscar por título o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white/5 border-white/10 text-foreground placeholder:text-muted"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isVideo = (item.content_type ?? "video").toLowerCase() === "video";
          const hasVideoUrl = !!item.video_url?.trim();

          if (isVideo && hasVideoUrl) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVideoOpen(item)}
                className="text-left"
              >
                <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full bg-gradient-to-br from-slate-800/80 to-slate-900/80"
                        aria-hidden
                      />
                    )}
                    <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      VIDEO
                    </span>
                  </div>
                  <CardHeader className="pb-2">
                    <h3 className="font-medium text-foreground mt-2">
                      {item.title ?? "Sin título"}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted line-clamp-2">
                      {item.description ?? "—"}
                    </p>
                  </CardContent>
                </Card>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setGuiaOpen(item)}
              className="text-left"
            >
              <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full overflow-hidden">
                <div className="relative h-48 w-full overflow-hidden">
                  {item.cover_image ? (
                    <img
                      src={item.cover_image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-gradient-to-br from-violet-900/40 to-slate-900/80"
                      aria-hidden
                    />
                  )}
                  <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30">
                    GUÍA
                  </span>
                </div>
                <CardHeader className="pb-2">
                  <h3 className="font-medium text-foreground mt-2">
                    {item.title ?? "Sin título"}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted line-clamp-2">
                    {item.description ?? "—"}
                  </p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-muted">No hay resultados.</p>
      )}

      {/* Lightbox Vídeo */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setVideoOpen(null)}
        >
          <Card
            className="w-full max-w-4xl border-white/20 bg-background overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold text-foreground">
                {videoOpen.title ?? "Vídeo"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVideoOpen(null)}
              >
                Cerrar
              </Button>
            </div>
            <div className="p-4 bg-black/20">
              <iframe
                src={toEmbedVideoUrl(videoOpen.video_url!)}
                title={videoOpen.title ?? "Vídeo"}
                className="w-full aspect-video rounded-lg border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        </div>
      )}

      {/* Modal Guía con prose */}
      {guiaOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setGuiaOpen(null)}
        >
          <Card
            className="w-full max-w-4xl max-h-[85vh] overflow-hidden border-white/20 bg-background flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold text-foreground">
                {guiaOpen.title ?? "Guía"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGuiaOpen(null)}
              >
                Cerrar
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div
                className="prose prose-invert prose-blue max-w-none text-foreground"
                dangerouslySetInnerHTML={{
                  __html: guiaOpen.content_body || "<p class=\"text-muted\">Sin contenido.</p>",
                }}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
