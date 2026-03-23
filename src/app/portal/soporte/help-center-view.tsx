"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Search,
  Video,
  BookOpen,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Globe,
  ShoppingCart,
  Receipt,
  type LucideIcon
} from "lucide-react";

type Article = {
  id: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  cover_image: string | null;
  content_type: string | null;
  category: string | null;
  video_url: string | null;
  content_body: string | null;
};

type CategoryCount = {
  id: string;
  count: number;
};

type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  count: number;
};

type Ticket = {
  id: string;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; gradient: string }> = {
  web: { label: "Web", icon: Globe, color: "text-blue-600 bg-blue-50 border-blue-100", gradient: "from-blue-500/20 to-blue-600/20" },
  ecommerce: { label: "E-commerce", icon: ShoppingCart, color: "text-amber-600 bg-amber-50 border-amber-100", gradient: "from-amber-500/20 to-amber-600/20" },
  seo: { label: "SEO", icon: Search, color: "text-emerald-600 bg-emerald-50 border-emerald-100", gradient: "from-emerald-500/20 to-emerald-600/20" },
  factura: { label: "Factura", icon: Receipt, color: "text-purple-600 bg-purple-50 border-purple-100", gradient: "from-purple-500/20 to-purple-600/20" },
  general: { label: "General", icon: BookOpen, color: "text-slate-600 bg-slate-50 border-slate-100", gradient: "from-slate-500/20 to-slate-600/20" },
};

const FAQS = [
  { q: "¿Cuánto tarda Red.es en resolver?", a: "El plazo oficial es de hasta 6 meses, aunque la mayoría de expedientes se resuelven entre 2 y 4 meses tras la presentación." },
  { q: "¿Qué documentos necesito?", a: "Principalmente DNI del solicitante, escrituras si es sociedad, y estar al corriente con Hacienda y Seguridad Social." },
  { q: "¿Cuándo cobro el bono?", a: "El bono no se cobra en efectivo. Se entrega como un derecho de cobro que tú cedes al Agente Digitalizador tras firmar el acuerdo." },
  { q: "¿Qué pasa si hay una subsanación?", a: "Red.es pedirá corregir algún dato. Nosotros nos encargamos de gestionarlo contigo para que no pierdas el bono." },
  { q: "¿Puedo cambiar el servicio contratado?", a: "Una vez firmado el acuerdo de prestación de servicios, no se puede cambiar la categoría del servicio dentro de ese bono." },
];

function toEmbedVideoUrl(url: string): string {
  const u = url.trim();
  const youtuBeMatch = u.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
  const watchMatch = u.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return u;
}

export function HelpCenterView({
  initialArticles,
  categoryCounts,
  recentTickets
}: {
  initialArticles: Article[];
  categoryCounts: CategoryCount[];
  recentTickets: Ticket[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [videoOpen, setVideoOpen] = useState<Article | null>(null);
  const [guiaOpen, setGuiaOpen] = useState<Article | null>(null);

  // Build categories with icons on client side
  const categories: Category[] = useMemo(() => {
    return Object.entries(CATEGORY_CONFIG).map(([id, config]) => ({
      id,
      ...config,
      count: categoryCounts.find(c => c.id === id)?.count ?? 0,
    }));
  }, [categoryCounts]);

  const filteredArticles = useMemo(() => {
    return initialArticles.filter(a => {
      const matchesSearch = !search ||
        (a.title?.toLowerCase().includes(search.toLowerCase()) ||
         a.description?.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = activeCategory === "all" || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    }).slice(0, 6);
  }, [initialArticles, search, activeCategory]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <div className="relative py-12 px-6 rounded-3xl bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Centro de Ayuda</h1>
            <p className="text-slate-400 text-lg">Busca guías, tutoriales y resuelve tus dudas sobre el Kit Digital.</p>
          </div>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="¿En qué podemos ayudarte hoy?"
              className="h-14 pl-12 pr-4 bg-white border-0 text-slate-900 rounded-2xl shadow-2xl focus:ring-2 focus:ring-brand-500 text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)}
            className={cn(
              "p-6 rounded-2xl border transition-all duration-300 text-left group",
              activeCategory === cat.id
                ? "bg-white border-brand-500 shadow-lg ring-1 ring-brand-500"
                : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-md"
            )}
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.color)}>
              {<cat.icon className="w-6 h-6" />}
            </div>
            <h3 className="font-bold text-slate-900">{cat.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{cat.count} artículos</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Articles List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {search || activeCategory !== "all" ? "Resultados encontrados" : "Últimos artículos"}
            </h2>
            <Link href="/portal/soporte/tutoriales" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {filteredArticles.map((article) => {
              const isVideo = article.content_type === 'video';
              const cat = categories.find(c => c.id === article.category) || categories[4];
              return (
                <Card
                  key={article.id}
                  className="group overflow-hidden border-slate-100 hover:shadow-xl transition-all duration-500 cursor-pointer"
                  onClick={() => isVideo ? setVideoOpen(article) : setGuiaOpen(article)}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    {article.cover_image ? (
                      <Image src={article.cover_image} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                    ) : (
                      <div className={cn("w-full h-full bg-gradient-to-br", cat.gradient)} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase", cat.color)}>
                        {cat.label}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                      <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
                        {isVideo ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{isVideo ? "Vídeo" : "Guía"}</span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {article.description || "Haz clic para ver el contenido completo."}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
            {filteredArticles.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No se encontraron artículos.</p>
              </div>
            )}
          </div>

          {/* FAQs Section */}
          <div className="pt-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 px-1">Preguntas Frecuentes</h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-slate-800">{faq.q}</span>
                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", openFaq === i && "rotate-180")} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-brand-600 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-brand-100">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">¿No encuentras respuesta?</h3>
              <p className="text-brand-100 text-sm leading-relaxed">Nuestro equipo de soporte está listo para ayudarte con tu expediente.</p>
            </div>
            <Link href="/portal/soporte/tickets/nuevo" className="block">
              <Button className="w-full bg-white text-brand-600 hover:bg-brand-50 h-12 font-bold rounded-xl border-0">
                Abrir un ticket
              </Button>
            </Link>
          </div>

          {/* Recent Tickets */}
          {recentTickets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Tickets Recientes</h3>
              <div className="space-y-3">
                {recentTickets.map((t) => (
                  <Link key={t.id} href={`/portal/soporte/tickets/${t.id}`}>
                    <Card className="border-slate-100 hover:border-brand-200 transition-all cursor-pointer group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border",
                            t.status === 'resuelto' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {t.status}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString("es")}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">{t.category}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.message || "Sin mensaje"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <Link href="/portal/soporte/tickets" className="block text-center text-xs font-bold text-slate-400 hover:text-brand-600 py-2">
                Ver todos mis tickets →
              </Link>
            </div>
          )}
        </div>
      </div>

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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white uppercase">{guiaOpen.category}</span>
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
