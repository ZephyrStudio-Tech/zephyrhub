"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Phone, Mail, Building, Clock, Calendar, CheckCircle2, PhoneMissed, Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTriageNote } from "@/app/actions/triage";

type Interaction = {
  id: string;
  type: string;
  metadata: any;
  created_at: string;
  actor_id: string;
};

export function LeadProfileSheet({
  lead,
  onClose,
  onCallMissed,
  onCallSuccess,
  onMoveToConsultoria
}: {
  lead: any;
  onClose: () => void;
  onCallMissed: (id: string) => void;
  onCallSuccess: (id: string) => void;
  onMoveToConsultoria: (id: string) => void;
}) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchInteractions() {
      const { data } = await supabase
        .from("triage_interactions")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      setInteractions(data || []);
      setLoading(false);
    }
    fetchInteractions();
  }, [lead.id, supabase]);

  async function handleAddNote() {
    if (!note.trim()) return;
    setSendingNote(true);
    const res = await addTriageNote(lead.id, note);
    if (res.ok) {
      setNote("");
      // Refresh interactions locally
      const { data } = await supabase
        .from("triage_interactions")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      setInteractions(data || []);
    }
    setSendingNote(false);
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Ficha del Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header Info */}
          <section className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{lead.company_name || lead.full_name}</h3>
              <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-wider">{lead.current_state.replace(/_/g, ' ')}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" /> {lead.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /> {lead.phone}
              </div>
              {lead.company_name && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Building className="w-4 h-4 text-slate-400" /> {lead.full_name} (Contacto)
                </div>
              )}
            </div>
          </section>

          {/* Details Grid */}
          <section className="grid grid-cols-2 gap-4">
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Servicio</p>
                <p className="text-sm font-bold text-slate-700 capitalize">{lead.service_requested?.replace(/_/g, ' ')}</p>
             </div>
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Entrada</p>
                <p className="text-sm font-bold text-slate-700">{new Date(lead.created_at).toLocaleDateString()}</p>
             </div>
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Actividad</p>
                <p className="text-sm font-bold text-slate-700">{lead.last_interaction_at ? 'Hace ' + Math.floor((Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000*60*60*24)) + ' días' : 'Sin datos'}</p>
             </div>
             <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Int. Fallidos</p>
                <p className="text-sm font-bold text-red-600">{lead.call_missed_count}</p>
             </div>
          </section>

          {/* Actions */}
          <section className="space-y-3">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones rápidas</p>
             <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-red-600 border-red-100 hover:bg-red-50" onClick={() => onCallMissed(lead.id)}>
                   <PhoneMissed className="w-4 h-4 mr-2" /> Fallida
                </Button>
                <Button variant="outline" className="flex-1 text-emerald-600 border-emerald-100 hover:bg-emerald-50" onClick={() => onCallSuccess(lead.id)}>
                   <CheckCircle2 className="w-4 h-4 mr-2" /> Exitosa
                </Button>
             </div>
             {lead.current_state === 'listo_para_tramitar' && (
                <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white" onClick={() => onMoveToConsultoria(lead.id)}>
                   Pasar a Consultoría
                </Button>
             )}
          </section>

          {/* Notes Input */}
          <section className="space-y-3">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notas internas</p>
             <div className="space-y-2">
                <textarea
                   className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                   rows={3}
                   placeholder="Escribe una nota interna..."
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                />
                <Button size="sm" className="w-full" disabled={!note.trim() || sendingNote} onClick={handleAddNote}>
                   {sendingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                   Guardar nota
                </Button>
             </div>
          </section>

          {/* Interactions History */}
          <section className="space-y-4 pb-8">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historial de interacciones</p>
             {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
             ) : (
                <div className="space-y-4">
                   {interactions.map(i => (
                      <div key={i.id} className="relative pl-6 border-l border-slate-100">
                         <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-200" />
                         <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-700 capitalize">{i.type.replace(/_/g, ' ')}</p>
                            <span className="text-[10px] text-slate-400">{new Date(i.created_at).toLocaleString()}</span>
                         </div>
                         {i.type === 'note' && i.metadata?.note && (
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">{i.metadata.note}</p>
                         )}
                      </div>
                   ))}
                   {interactions.length === 0 && <p className="text-sm text-slate-400 text-center py-4 italic">Sin actividad registrada</p>}
                </div>
             )}
          </section>
        </div>
      </div>
    </div>
  );
}
