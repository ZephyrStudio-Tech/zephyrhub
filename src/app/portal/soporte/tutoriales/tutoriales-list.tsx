"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
};

export function TutorialesList({
  items,
  initialSearch,
}: {
  items: Item[];
  initialSearch: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [guiaOpen, setGuiaOpen] = useState<Item | null>(null);

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
              <a
                key={item.id}
                href={item.video_url!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 w-fit">
                      VIDEO
                    </span>
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
              </a>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setGuiaOpen(item)}
              className="text-left"
            >
              <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors h-full">
                <CardHeader className="pb-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30 w-fit">
                    GUÍA
                  </span>
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

      {guiaOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setGuiaOpen(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden border-white/20 bg-background flex flex-col"
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
            <div className="p-4 overflow-y-auto flex-1">
              <div className="prose prose-invert prose-sm max-w-none text-foreground">
                {guiaOpen.content_body ? (
                  <div className="whitespace-pre-wrap">
                    {guiaOpen.content_body}
                  </div>
                ) : (
                  <p className="text-muted">Sin contenido.</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
