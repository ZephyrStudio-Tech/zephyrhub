"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTutorial, updateTutorial, deleteTutorial } from "@/app/actions/help-center";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/tiptap-editor";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Video,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  BarChart3,
  Layers,
  ArrowRight,
  Filter
} from "lucide-react";
import Image from "next/image";

type Tutorial = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content_type: string;
  video_url: string | null;
  description: string | null;
  cover_image: string | null;
  content_body: string | null;
  sort_order: number;
  created_at: string;
};

const CATEGORIAS = [
  { id: "web", label: "Web", color: "text-blue-600 bg-blue-50 border-blue-100", gradient: "from-blue-500/20 to-blue-600/20" },
  { id: "ecommerce", label: "E-commerce", color: "text-amber-600 bg-amber-50 border-amber-100", gradient: "from-amber-500/20 to-amber-600/20" },
  { id: "seo", label: "SEO", color: "text-emerald-600 bg-emerald-50 border-emerald-100", gradient: "from-emerald-500/20 to-emerald-600/20" },
  { id: "factura", label: "Factura", color: "text-purple-600 bg-purple-50 border-purple-100", gradient: "from-purple-500/20 to-purple-600/20" },
  { id: "general", label: "General", color: "text-slate-600 bg-slate-50 border-slate-100", gradient: "from-slate-500/20 to-slate-600/20" },
];

export function AcademyCMS({ tutorials: initialTutorials }: { tutorials: Tutorial[] }) {
  const router = useRouter();
  const [tutorials, setTutorials] = useState(initialTutorials);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    content_type: "video" as "video" | "articulo",
    video_url: "",
    content_body: "",
    cover_image: "",
    sort_order: 0,
  });

  const [uploadingCover, setUploadingCover] = useState(false);
  const supabase = createClient();

  // Metrics
  const metrics = useMemo(() => ({
    total: tutorials.length,
    videos: tutorials.filter(t => t.content_type === 'video').length,
    guias: tutorials.filter(t => t.content_type === 'articulo').length,
    categories: new Set(tutorials.map(t => t.category)).size
  }), [tutorials]);

  // Filtered tutorials
  const filteredTutorials = useMemo(() => {
    return tutorials.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesType = typeFilter === "all" || t.content_type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [tutorials, searchTerm, categoryFilter, typeFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSending(true);

    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      content_type: form.content_type,
      video_url: form.content_type === "video" ? form.video_url.trim() || undefined : undefined,
      content_body: form.content_type === "articulo" ? form.content_body : undefined,
      cover_image: form.cover_image.trim() || undefined,
      sort_order: form.sort_order,
    };

    const res = editingId
      ? await updateTutorial(editingId, data)
      : await createTutorial(data);

    setSending(false);
    if (res.ok) {
      setOpen(false);
      resetForm();
      router.refresh();
      // En un entorno ideal aquí haríamos fetch de nuevo o actualizaríamos localmente
    } else {
      alert(res.error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Seguro que quieres eliminar este tutorial?")) return;

    // Optimistic delete
    const original = [...tutorials];
    setTutorials(prev => prev.filter(t => t.id !== id));

    const res = await deleteTutorial(id);
    if (!res.ok) {
      setTutorials(original);
      alert(res.error);
    } else {
      router.refresh();
    }
  }

  function handleEdit(t: Tutorial) {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description || "",
      category: t.category,
      content_type: t.content_type as "video" | "articulo",
      video_url: t.video_url || "",
      content_body: t.content_body || "",
      cover_image: t.cover_image || "",
      sort_order: t.sort_order || 0,
    });
    setOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      category: "general",
      content_type: "video",
      video_url: "",
      content_body: "",
      cover_image: "",
      sort_order: 0,
    });
  }

  const getCategory = (id: string) => CATEGORIAS.find(c => c.id === id) || CATEGORIAS[4];

  return (
    <div className="space-y-8">
      {/* Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Recursos", value: metrics.total, icon: Layers, color: "text-brand-600 bg-brand-50" },
          { label: "Vídeos", value: metrics.videos, icon: Video, color: "text-amber-600 bg-amber-50" },
          { label: "Guías/Artículos", value: metrics.guias, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Categorías", value: metrics.categories, icon: BarChart3, color: "text-emerald-600 bg-emerald-50" },
        ].map((m, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", m.color)}>
                <m.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <p className="text-xl font-bold text-slate-900">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 w-full gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar tutoriales..."
              className="pl-9 h-10 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            <option value="video">Vídeo</option>
            <option value="articulo">Guía</option>
          </select>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }} className="w-full md:w-auto gap-2">
          <Plus className="w-4 h-4" /> Nuevo Tutorial
        </Button>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTutorials.map((t) => {
          const cat = getCategory(t.category);
          return (
            <Card key={t.id} className="group overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                {t.cover_image ? (
                  <Image src={t.cover_image} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                ) : (
                  <div className={cn("w-full h-full bg-gradient-to-br", cat.gradient)} />
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase", cat.color)}>
                    {cat.label}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1",
                    t.content_type === 'video' ? "bg-amber-500 text-white border-amber-600" : "bg-blue-500 text-white border-blue-600"
                  )}>
                    {t.content_type === 'video' ? <Video className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                    {t.content_type === 'video' ? 'VIDEO' : 'GUÍA'}
                  </span>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors line-clamp-2">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description || "Sin descripción."}
                  </p>
                </div>
                <div className="pt-4 mt-auto flex items-center justify-between border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(t.created_at).toLocaleDateString("es")}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-brand-600 hover:bg-brand-50" onClick={() => handleEdit(t)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTutorials.length === 0 && (
        <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No se encontraron tutoriales con estos filtros.</p>
          <Button variant="link" onClick={() => { setSearchTerm(""); setCategoryFilter("all"); setTypeFilter("all"); }}> Limpiar filtros </Button>
        </div>
      )}

      {/* Sidebar Drawer (CSS Overlay) */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{editingId ? "Editar Tutorial" : "Nuevo Tutorial"}</h2>
                <p className="text-sm text-slate-500">Completa los campos para publicar contenido.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Título del recurso</Label>
                <Input
                  className="h-11 border-slate-200 focus:ring-brand-500"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="Ej: Guía de primeros pasos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select
                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Orden (prioridad)</Label>
                  <Input
                    type="number"
                    className="h-11 border-slate-200"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción corta</Label>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Resumen para la tarjeta de previsualización..."
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen de portada</Label>
                <div className="flex gap-4 items-start">
                  <div className="relative w-32 h-20 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {form.cover_image ? (
                      <Image src={form.cover_image} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCover}
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingCover(true);
                        const ext = file.name.split(".").pop() || "jpg";
                        const path = `covers/${Date.now()}.${ext}`;
                        const { error: upErr } = await supabase.storage.from("academy").upload(path, file);
                        if (upErr) { alert(upErr.message); setUploadingCover(false); return; }
                        const { data } = supabase.storage.from("academy").getPublicUrl(path);
                        setForm((f) => ({ ...f, cover_image: data.publicUrl }));
                        setUploadingCover(false);
                      }}
                    />
                    <p className="text-[10px] text-slate-400">Recomendado: 16:9, min 800x450px.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <Label>Tipo de contenido</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, content_type: 'video' }))}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                      form.content_type === 'video' ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Video className="w-4 h-4" /> <span className="text-sm font-bold">VÍDEO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, content_type: 'articulo' }))}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                      form.content_type === 'articulo' ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <BookOpen className="w-4 h-4" /> <span className="text-sm font-bold">GUÍA</span>
                  </button>
                </div>
              </div>

              {form.content_type === "video" ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>URL del vídeo (YouTube / Vimeo)</Label>
                  <Input
                    className="h-11 border-slate-200"
                    type="url"
                    value={form.video_url}
                    onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Contenido de la guía</Label>
                  <TiptapEditor
                    value={form.content_body}
                    onChange={(html) => setForm((f) => ({ ...f, content_body: html }))}
                    placeholder="Escribe el contenido detallado aquí..."
                  />
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button variant="outline" className="flex-1 h-12" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button className="flex-[2] h-12 gap-2" type="submit" disabled={sending || uploadingCover}>
                  {sending ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar ahora"}
                  {!sending && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
