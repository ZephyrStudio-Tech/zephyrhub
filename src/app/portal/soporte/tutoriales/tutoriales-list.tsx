"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Video, BookOpen } from "lucide-react";

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

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "web", label: "Web", color: "border-blue-500/30 text-blue-400 bg-blue-500/10", gradient: "from-blue-500/20 to-blue-600/20" },
  { id: "ecommerce", label: "E-commerce", color: "border-amber-500/30 text-amber-400 bg-amber-500/10", gradient: "from-amber-500/20 to-amber-600/20" },
  { id: "seo", label: "SEO", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10", gradient: "from-emerald-500/20 to-emerald-600/20" },
  { id: "factura", label: "Factura", color: "border-purple-500/30 text-purple-400 bg-purple-500/10", gradient: "from-purple-500/20 to-purple-600/20" },
  { id: "general", label: "General", color: "border-slate-500/30 text-slate-400 bg-slate-500/10", gradient: "from-slate-500/20 to-slate-600/20" },
];

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
  const [activeCategory, setActiveCategory] = useState("all");
  const [guiaOpen, setGuiaOpen] = useState<Item | null>(null);
  const [videoOpen, setVideoOpen] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        (i.title ?? "").toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q);
      const matchesCategory = activeCategory === "all" || i.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  const getCatInfo = (catId: string) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-all",
                activeCategory === cat.id
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-foreground placeholder:text-muted rounded-xl"
          />
        </div>
      </div>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
        {filtered.length} recursos encontrados
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isVideo = (item.content_type ?? "video").toLowerCase() === "video";
          const cat = getCatInfo(item.category || "general");

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => isVideo ? setVideoOpen(item) : setGuiaOpen(item)}
              className="text-left group"
            >
              <Card className={cn(
                "border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 h-full overflow-hidden group-hover:translate-y-[-4px]",
                "hover:border-" + (item.category === 'web' ? 'blue' : item.category === 'ecommerce' ? 'amber' : item.category === 'seo' ? 'emerald' : item.category === 'factura' ? 'purple' : 'slate') + "-500/50"
              )}>
                <div className="relative h-52 w-full overflow-hidden bg-slate-800">
                  {item.cover_image ? (
                    <Image
                      src={item.cover_image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className={cn("h-full w-full bg-gradient-to-br", cat.gradient)} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase", cat.color)}>
                      {cat.label}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md">
                      {isVideo ? <Video className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{isVideo ? "VIDEO" : "GUÍA"}</span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-brand-400 transition-colors">
                    {item.title ?? "Sin título"}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description ?? "Haz clic para ver más detalles."}
                  </p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
          <p className="text-slate-400 font-medium">No se encontraron tutoriales con estos criterios.</p>
        </div>
      )}

      {/* Lightbox Vídeo */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setVideoOpen(null)}>
          <Card className="w-full max-w-4xl border-0 bg-slate-900 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-bold text-white truncate pr-4">{videoOpen.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setVideoOpen(null)} className="text-white hover:bg-white/10">Cerrar</Button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={toEmbedVideoUrl(videoOpen.video_url!)}
                title={videoOpen.title || "Vídeo"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        </div>
      )}

      {/* Modal Guía */}
      {guiaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setGuiaOpen(null)}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden border-0 bg-white flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 w-full flex-shrink-0">
              {guiaOpen.cover_image ? (
                <Image src={guiaOpen.cover_image} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button onClick={() => setGuiaOpen(null)} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"><X className="w-5 h-5" /></button>
              <div className="absolute bottom-6 left-8 right-8">
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white uppercase">{getCatInfo(guiaOpen.category || "").label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white uppercase">Guía</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{guiaOpen.title}</h2>
              </div>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div
                className="prose prose-slate prose-brand max-w-none"
                dangerouslySetInnerHTML={{
                  __html: guiaOpen.content_body || "<p>Sin contenido disponible.</p>",
                }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
