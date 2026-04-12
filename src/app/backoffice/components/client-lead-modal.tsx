"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getClientDetail,
  updateClientContactInfo,
  toggleHasDevice,
  assignConsultant,
} from "@/app/actions/client-actions";
import { updateContractState } from "@/app/actions/contract-actions";
import { updateDeviceOrderStatus, updateDeviceOrderTracking } from "@/app/actions/device-order-actions";
import { markPaymentReceived } from "@/app/actions/payment-actions";
import { addClientNote } from "@/app/actions/note-actions";
import {
  addTriageNote,
  registerTriageCallMissed,
  registerTriageCallSuccess,
  updateTriageLeadState,
  moveToConsultoria
} from "@/app/actions/triage";
import { registerCallMissed, registerCallSuccess } from "@/app/actions/interactions";
import { transitionClientState } from "@/app/actions/transition-state";
import { approveDocument, rejectDocument } from "@/app/actions/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  CreditCard,
  Package,
  History,
  PhoneMissed,
  CheckCircle2,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PIPELINE_STATE_LABELS, PRECONSULTORIA_STATE_LABELS } from "@/lib/state-machine/constants";
import { toastError, toastSuccess } from "@/lib/toast";

const POST_DEV_STATES = [
  "empezar_desarrollo",
  "presentar_justificacion_fase_i",
  "firma_justificacion",
  "subsanacion_fase_i",
  "resolucion_red_es",
  "pago_i_fase",
  "ano_mantenimiento",
  "justificacion_ii_fase",
  "firma_justificacion_ii",
  "subsanacion_fase_ii",
  "resolucion_ii_red_es",
  "ganada",
  "perdida",
] as const;

const POST_DEV_STATE_LABELS: { id: string; label: string }[] = [
  { id: "empezar_desarrollo", label: "Empezar desarrollo" },
  { id: "presentar_justificacion_fase_i", label: "Presentar justificación (Fase I)" },
  { id: "firma_justificacion", label: "Firma justificación" },
  { id: "subsanacion_fase_i", label: "Subsanación (Fase I)" },
  { id: "resolucion_red_es", label: "Resolución Red.es" },
  { id: "pago_i_fase", label: "Pago I Fase" },
  { id: "ano_mantenimiento", label: "Año mantenimiento" },
  { id: "justificacion_ii_fase", label: "Justificación II Fase" },
  { id: "firma_justificacion_ii", label: "Firma justificación II" },
  { id: "subsanacion_fase_ii", label: "Subsanación (Fase II)" },
  { id: "resolucion_ii_red_es", label: "Resolución II Red.es" },
  { id: "ganada", label: "Ganada ✓" },
  { id: "perdida", label: "Perdida ✗" },
];

const isPostDev = (state: string) => POST_DEV_STATES.includes(state as any);

type Props = {
  mode: 'lead' | 'client';
  leadData?: any;
  clientId?: string;
  onClose: () => void;
};

export function ClientLeadModal({ mode, leadData, clientId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [leadInteractions, setLeadInteractions] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<{id: string, full_name: string | null, email: string | null}[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [assigningConsultant, setAssigningConsultant] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cif: "",
    notes: ""
  });

  // Use TanStack Query for client detail with 30s stale time
  const { data: clientData, isLoading: clientLoading, refetch: refetchClient } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await getClientDetail(clientId);
      if (res && res.ok && res.data) {
        return res.data;
      }
      return null;
    },
    enabled: mode === 'client' && !!clientId,
    staleTime: 30000,
  });

  // Combine data from query or leadData (Añadido el : any para solucionar el tipado estricto)
  const data: any = mode === 'client' ? clientData : { client: leadData };
  const loading = mode === 'client' && clientLoading;

  const fetchLeadInteractions = useCallback(async () => {
    if (!leadData?.id) return;
    try {
      const supabase = createClient();
      const { data: interactions } = await supabase
        .from("triage_interactions")
        .select("*")
        .eq("lead_id", leadData.id)
        .order("created_at", { ascending: false });

      setLeadInteractions(interactions || []);
    } catch (error) {
      console.error("Error fetching lead interactions:", error);
    }
  }, [leadData?.id]);

  // Set edit form when client data loads from query
  useEffect(() => {
    if (mode === 'client' && clientData?.client) {
      const d = clientData.client;
      setEditForm({
        full_name: d.full_name || "",
        email: d.email || "",
        phone: d.phone || "",
        cif: d.cif || "",
        notes: d.service_description || ""
      });
      setSelectedConsultantId(d.consultant_id || null);
    } else if (mode === 'lead' && leadData) {
      setEditForm({
        full_name: leadData.full_name || "",
        email: leadData.email || "",
        phone: leadData.phone || "",
        cif: leadData.nif || leadData.cif || "",
        notes: leadData.notes || leadData.service_description || ""
      });
      fetchLeadInteractions();
    }
  }, [clientData, leadData, mode, fetchLeadInteractions]);

  // Load consultants when mode is 'client'
  useEffect(() => {
    if (mode === 'client') {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "consultor")
        .then(({ data }) => {
          setConsultants(data || []);
        });
    }
  }, [mode]);

  const refreshData = useCallback(async () => {
    if (mode === 'client') {
      await refetchClient();
    } else {
      await fetchLeadInteractions();
    }
  }, [mode, refetchClient, fetchLeadInteractions]);

  const client = data?.client || leadData;
  const interactions = mode === 'client' ? (clientData?.interactions || []) : leadInteractions;

  async function handleAddNote() {
    if (!note.trim()) return;
    setSendingNote(true);
    const res = mode === 'lead'
      ? await addTriageNote(client.id, note)
      : await addClientNote(client.id, note);

    if (res && res.ok) {
      setNote("");
      refreshData();
    }
    setSendingNote(false);
  }

  async function handleSaveChanges() {
    setSaving(true);
    let res;
    if (mode === 'client') {
      res = await updateClientContactInfo(client.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        cif: editForm.cif,
        service_description: editForm.notes
      });
    } else {
      res = { ok: true };
    }

    if (res && res.ok) {
      toastSuccess("Cambios guardados");
      refreshData();
    } else if (res && res.error) {
      toastError(res.error);
    }
    setSaving(false);
  }

  const handleCallAction = async (success: boolean) => {
    startTransition(async () => {
      const res = mode === 'lead'
        ? (success ? await registerTriageCallSuccess(client.id) : await registerTriageCallMissed(client.id))
        : (success ? await registerCallSuccess(client.id) : await registerCallMissed(client.id));

      if (res && res.ok) {
        refreshData();
      }
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="font-bold text-slate-900">Cargando ficha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-6" onClick={onClose}>
      <div
        className="bg-slate-50 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
        onClick={e => e.stopPropagation()}
      >
        {/* COLUMNA IZQUIERDA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header Sticky */}
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-brand-200">
                {(client.company_name || client.full_name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{client.company_name || client.full_name}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">#{client.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                className="bg-brand-50 text-brand-700 text-xs font-bold px-4 py-2 rounded-xl border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                value={client?.current_state || ""}
                onChange={async (e) => {
                  const toState = e.target.value;
                  const res = mode === 'lead'
                    ? await updateTriageLeadState(client.id, toState)
                    : await transitionClientState(client.id, toState);
                  if (res && res.ok) {
                    refreshData();
                  }
                }}
                disabled={mode === 'client' && isPostDev(client?.current_state)}
              >
                {(mode === 'lead' ? PRECONSULTORIA_STATE_LABELS : PIPELINE_STATE_LABELS).map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              {mode === 'client' && isPostDev(client?.current_state) && (
                <div className="text-[10px] text-slate-400 font-bold absolute top-full mt-1 left-4">
                  Estado gestionado por contratos
                </div>
              )}
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Info Card */}
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" /> Información del contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Nombre Completo</Label>
                    <Input
                      className="bg-slate-50/50 border-slate-100 text-sm h-9 rounded-xl"
                      value={editForm.full_name}
                      onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Email</Label>
                    <div className="relative">
                      <Input
                        className="bg-slate-50/50 border-slate-100 text-sm h-9 rounded-xl pr-8"
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      />
                      {editForm.email && <a href={`mailto:${editForm.email}`} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600"><ExternalLink className="w-3 h-3" /></a>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Teléfono</Label>
                    <div className="flex gap-2">
                      <Input
                        className="bg-slate-50/50 border-slate-100 text-sm h-9 rounded-xl flex-1"
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      />
                      {editForm.phone && (
                        <a href={`tel:${editForm.phone}`}>
                          <Button size="sm" variant="outline" className="h-9 px-3 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                            <Phone className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">CIF / NIF</Label>
                    <Input
                      className="bg-slate-50/50 border-slate-100 text-sm h-9 rounded-xl uppercase"
                      value={editForm.cif}
                      onChange={e => setEditForm(f => ({ ...f, cif: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold">Descripción del servicio / Notas</Label>
                  <textarea
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    rows={4}
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                {mode === 'client' && (
                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Consultor asignado</Label>
                    <select
                      value={selectedConsultantId || "none"}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setAssigningConsultant(true);
                        const res = await assignConsultant(
                          client.id,
                          value === "none" ? null : value
                        );
                        setAssigningConsultant(false);
                        
                        if (res.ok) {
                          toast.success("Consultor asignado");
                          setSelectedConsultantId(value === "none" ? null : value);
                          await refreshData();
                        } else {
                          toast.error(res.error || "Error al asignar consultor");
                        }
                      }}
                      disabled={assigningConsultant}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="none">Sin asignar</option>
                      {consultants.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                  <div className="flex justify-end pt-4">
                    <Button
                      size="sm"
                      className="rounded-xl h-9 font-bold px-6"
                      onClick={handleSaveChanges}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                      Guardar cambios
                    </Button>
                  </div>
              </CardContent>
            </Card>

            {mode === 'client' && data && (
              <>
                {/* Documentation Section */}
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Vault (documentación)
                    </CardTitle>
                    <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase">{client.service_type}</span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {data.slots?.map((slot: any) => {
                        const doc = data.documents?.find((d: any) => d.slot_type === slot.key);
                        return (
                          <div key={slot.key} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-slate-700">{slot.label}</p>
                              <p className="text-[10px] text-slate-400">{doc ? `v${doc.version} · Subido el ${new Date(doc.uploaded_at).toLocaleDateString()}` : "Sin subir"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc ? (
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded-lg uppercase border",
                                  doc.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    doc.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                )}>
                                  {doc.status}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase">Pendiente</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Contracts Section */}
                {mode === 'client' && data?.contracts && (
                  <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                      <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Contratos Red.es
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-slate-50">
                      {[
                        { type: "web", label: "Sitio Web", total: "2.000€" },
                        { type: "ecommerce", label: "Bono Adicional", total: "1.000€" },
                      ].map(({ type, label, total }) => {
                        const contract = data.contracts?.find((c: any) => c.type === type);
                        const contractPayments = data.payments?.filter((p: any) => p.contract_type === type) ?? [];
                        const isInPostDev = contract && isPostDev(contract.current_state);

                        return (
                          <div key={type} className="p-4 space-y-3">
                            {/* Header del contrato */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{label}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{total} · Red.es</p>
                              </div>
                              {contract ? (
                                isInPostDev ? (
                                  /* Selector independiente en fase post-desarrollo */
                                  <select
                                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    value={contract.current_state}
                                    onChange={async (e) => {
                                      const res = await updateContractState(contract.id, e.target.value);
                                      if (res.ok) {
                                        toastSuccess(`${label} actualizado`);
                                        refreshData();
                                      } else {
                                        toastError(res.error ?? "Error");
                                      }
                                    }}
                                  >
                                    {POST_DEV_STATE_LABELS.map(s => (
                                      <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  /* Antes de post-desarrollo: solo badge informativo */
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">
                                    {contract.current_state.replace(/_/g, " ")}
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] text-slate-300 font-bold uppercase">Sin contrato</span>
                              )}
                            </div>

                            {/* Pagos del contrato */}
                            {contractPayments.length > 0 && (
                              <div className="rounded-xl border border-slate-50 overflow-hidden">
                                {contractPayments.map((p: any) => (
                                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                    <div>
                                      <p className="text-xs font-bold text-slate-700 capitalize">
                                        {p.phase === "fase_i" ? "Fase I" : "Fase II"}
                                      </p>
                                      <p className="text-[10px] text-slate-400">€{p.expected_amount}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {p.received_amount ? (
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                                          Cobrado €{p.received_amount}
                                        </span>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-3 text-[10px] font-bold rounded-lg border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                                          onClick={async () => {
                                            const res = await markPaymentReceived(p.id, p.expected_amount, new Date().toISOString());
                                            if (res.ok) {
                                              toastSuccess("Pago registrado");
                                              refreshData();
                                            } else {
                                              toastError(res.error ?? "Error");
                                            }
                                          }}
                                        >
                                          Marcar cobrado
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {client.has_device && (
              <Card className="border-slate-100 shadow-sm overflow-hidden mb-6">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                  <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-4 h-4" /> Dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {data?.deviceOrders?.[0] ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{data.deviceOrders[0].status}</p>
                        <p className="text-xs text-slate-500">Tracking: {data.deviceOrders[0].tracking_number || "Pendiente"}</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl">Gestionar pedido</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No se ha generado pedido aún.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="w-full md:w-[400px] border-l border-slate-100 bg-white flex flex-col h-full">
          <header className="p-6 border-b border-slate-50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-brand-600" /> Historial
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl bg-red-50 text-red-600 border-red-100 hover:bg-red-100 h-10 text-xs font-bold"
                onClick={() => handleCallAction(false)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneMissed className="w-4 h-4 mr-2" />}
                Llamada Fallida
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-2xl bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 h-10 text-xs font-bold"
                onClick={() => handleCallAction(true)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Llamada Exitosa
              </Button>
            </div>
          </header>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {interactions.map((i: any) => {
              const date = new Date(i.created_at);
              if (i.type === 'note') {
                return (
                  <div key={i.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 text-xs font-bold">
                      ?
                    </div>
                    <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4 flex-1 border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Soporte</span>
                        <span className="text-[10px] text-slate-400">{date.toLocaleString('es')}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{i.metadata?.content || i.metadata?.note}</p>
                    </div>
                  </div>
                );
              }

              let color = "bg-brand-500 ring-brand-100";
              let label = i.type;
              if (i.type === 'call_success') { color = "bg-emerald-500 ring-emerald-100"; label = "Llamada exitosa"; }
              if (i.type === 'call_missed') { color = "bg-red-500 ring-red-100"; label = "Llamada no respondida"; }
              if (i.type === 'state_change') { label = `Estado cambiado a ${i.metadata?.to}`; }

              return (
                <div key={i.id} className="relative pl-8 pb-1 border-l border-slate-100 ml-4 last:border-0">
                  <div className={cn("absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4", color)} />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-bold text-slate-700">{label}</p>
                    <p className="text-[10px] text-slate-400">{date.toLocaleString('es')}</p>
                  </div>
                </div>
              );
            })}
            {interactions.length === 0 && (
              <div className="py-12 text-center">
                <History className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Sin actividad reciente</p>
              </div>
            )}
          </div>

          {/* Footer Form */}
          <footer className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="space-y-3">
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                placeholder="Añadir nota interna..."
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <Button
                className="w-full rounded-xl h-11 font-bold shadow-lg shadow-brand-100"
                disabled={!note.trim() || sendingNote}
                onClick={handleAddNote}
              >
                {sendingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Añadir nota
              </Button>
            </div>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border: 2px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
}
