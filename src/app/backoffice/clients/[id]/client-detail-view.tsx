"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { transitionClientState } from "@/app/actions/transition-state";
import { approveDocument, rejectDocument } from "@/app/actions/documents";
import { registerCallMissed, registerCallSuccess } from "@/app/actions/interactions";
import { generateAgreement } from "@/app/actions/agreements";
import { linkReferralToClient, createAndLinkReferral } from "@/app/actions/referral-actions";
import {
  updateServiceDescription,
  toggleHasDevice,
} from "@/app/actions/client-actions";
import { updateContractState } from "@/app/actions/contract-actions";
import { updateDeviceOrderStatus, updateDeviceOrderTracking } from "@/app/actions/device-order-actions";
import { markPaymentReceived } from "@/app/actions/payment-actions";
import { addClientNote } from "@/app/actions/note-actions";
import type { PipelineState } from "@/lib/state-machine/constants";
import { PIPELINE_STATE_LABELS } from "@/lib/state-machine/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";

type Client = {
  id: string;
  company_name: string | null;
  cif: string | null;
  current_state: string;
  service_type: string;
  consultant_id: string | null;
  user_id: string | null;
  created_at: string;
  has_web_contract: boolean | null;
  has_ecommerce_contract: boolean | null;
  has_device: boolean | null;
  service_description: string | null;
  bono_granted_at: string | null;
};

type Interaction = {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_id: string;
};

type Document = {
  id: string;
  slot_type: string;
  version: number;
  status: string;
  rejection_reason: string | null;
  storage_path: string;
  uploaded_at: string;
};

type Contract = {
  id: string;
  type: "web" | "ecommerce";
  current_state: string;
};

type DeviceOrder = {
  id: string;
  status: string;
  device_id: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_zip: string | null;
  surcharge: number | null;
  payment_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
};

type Payment = {
  id: string;
  contract_type: "web" | "ecommerce";
  phase: "fase_i" | "fase_ii";
  expected_amount: number;
  received_amount: number | null;
  received_at: string | null;
  agent_commission: number | null;
};

type Slot = { key: string; label: string };

export function ClientDetailView({
  client,
  interactions,
  documents,
  contracts,
  deviceOrders,
  payments,
  referral,
  associates,
  slots,
  phases,
  suggestedNext,
}: {
  client: Client;
  interactions: Interaction[];
  documents: Document[];
  contracts: Contract[];
  deviceOrders: DeviceOrder[];
  payments: Payment[];
  referral: any;
  associates: any[];
  slots: Slot[];
  phases: { name: string; states: PipelineState[] }[];
  suggestedNext: PipelineState | null;
}) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(client.service_description || "");
  const [receivingPayment, setReceivingPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingTracking, setEditingTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [linking, setLinking] = useState(false);
  const [referralId, setReferralId] = useState("");
  const [associateId, setAssociateId] = useState("");
  const [localInteractions, setLocalInteractions] = useState(interactions);
  const [noteText, setNoteText] = useState("");

  // Sync local interactions with props when they change
  useEffect(() => {
    setLocalInteractions(interactions);
  }, [interactions]);

  async function onLinkReferral() {
    if (!referralId.trim()) return;
    setLinking(true);
    const res = await linkReferralToClient(referralId, client.id);
    setLinking(false);
    if (res.ok) {
      toastSuccess("Referido vinculado correctamente");
      router.refresh();
    } else {
      toastError(res.error || "Error al vincular referido");
    }
  }

  async function onCreateAndLinkReferral() {
    if (!associateId) return;
    setLinking(true);
    const res = await createAndLinkReferral(client.id, associateId);
    setLinking(false);
    if (res.ok) {
      toastSuccess("Referido creado y vinculado");
      router.refresh();
    } else {
      toastError(res.error || "Error al crear referido");
    }
  }

  async function onStateChange(toState: string) {
    setChanging(true);
    const res = await transitionClientState(client.id, toState);
    setChanging(false);
    if (res.ok) {
      toastSuccess("Estado actualizado");
      router.refresh();
    } else {
      toastError(res.error || "Error al cambiar estado");
    }
  }

  async function onContractStateChange(contractId: string, newState: string) {
    const res = await updateContractState(contractId, newState);
    if (res.ok) {
      toastSuccess("Estado del contrato actualizado");
      router.refresh();
    } else {
      toastError(res.error || "Error al actualizar contrato");
    }
  }

  async function onDeviceOrderStatusChange(deviceOrderId: string, status: string) {
    const res = await updateDeviceOrderStatus(deviceOrderId, status);
    if (res.ok) {
      toastSuccess("Estado del pedido actualizado");
      router.refresh();
    } else {
      toastError(res.error || "Error al actualizar pedido");
    }
  }

  async function onSaveTracking(deviceOrderId: string) {
    if (!trackingNumber.trim()) return;
    const res = await updateDeviceOrderTracking(deviceOrderId, trackingNumber, trackingUrl);
    if (res.ok) {
      toastSuccess("Tracking guardado");
      setEditingTracking(false);
      setTrackingNumber("");
      setTrackingUrl("");
      router.refresh();
    } else {
      toastError(res.error || "Error al guardar tracking");
    }
  }

  async function onMarkPaymentReceived(paymentId: string) {
    if (!paymentAmount.trim()) return;
    const res = await markPaymentReceived(paymentId, parseFloat(paymentAmount), paymentDate);
    if (res.ok) {
      toastSuccess("Pago registrado correctamente");
      setReceivingPayment(null);
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      router.refresh();
    } else {
      toastError(res.error || "Error al registrar pago");
    }
  }

  async function onSaveDescription() {
    startTransition(async () => {
      const res = await updateServiceDescription(client.id, descriptionValue);
      if (res.ok) {
        toastSuccess("Descripción guardada");
        setEditingDescription(false);
        router.refresh();
      } else {
        toastError(res.error || "Error al guardar descripción");
      }
    });
  }

  async function onToggleHasDevice(enabled: boolean) {
    const res = await toggleHasDevice(client.id, enabled);
    if (res.ok) {
      router.refresh();
    } else {
      toastError(res.error || "Error al actualizar dispositivo");
    }
  }

  async function onApprove(docId: string) {
    const res = await approveDocument(docId);
    if (res.ok) {
      toastSuccess("Documento aprobado");
      router.refresh();
    } else {
      toastError(res.error || "Error al aprobar documento");
    }
  }

  async function onReject(docId: string) {
    if (!rejectReason.trim()) return;
    setRejecting(docId);
    const res = await rejectDocument(docId, rejectReason);
    setRejecting(null);
    setRejectReason("");
    if (res.ok) {
      toastSuccess("Documento rechazado");
      router.refresh();
    } else {
      toastError(res.error || "Error al rechazar documento");
    }
  }

  async function onCallMissed() {
    const tempId = "temp-" + Date.now();
    const optimistic: Interaction = {
      id: tempId,
      type: "call_missed",
      created_at: new Date().toISOString(),
      metadata: {},
      actor_id: "",
    };
    setLocalInteractions((prev) => [optimistic, ...prev]);

    const res = await registerCallMissed(client.id);
    if (res.ok) {
      router.refresh();
    } else {
      setLocalInteractions((prev) => prev.filter((i) => i.id !== tempId));
      toastError(res.error || "Error al registrar llamada");
    }
  }

  async function onCallSuccess() {
    const tempId = "temp-" + Date.now();
    const optimistic: Interaction = {
      id: tempId,
      type: "call_success",
      created_at: new Date().toISOString(),
      metadata: {},
      actor_id: "",
    };
    setLocalInteractions((prev) => [optimistic, ...prev]);

    const res = await registerCallSuccess(client.id);
    if (res.ok) {
      router.refresh();
    } else {
      setLocalInteractions((prev) => prev.filter((i) => i.id !== tempId));
      toastError(res.error || "Error al registrar llamada");
    }
  }

  async function onAddNote() {
    if (!noteText.trim()) return;
    const msg = noteText.trim();
    const tempId = "temp-" + Date.now();
    const optimistic: Interaction = {
      id: tempId,
      type: "note",
      created_at: new Date().toISOString(),
      metadata: { content: msg },
      actor_id: "",
    };
    setLocalInteractions((prev) => [optimistic, ...prev]);
    setNoteText("");

    const res = await addClientNote(client.id, msg);
    if (res.ok) {
      router.refresh();
    } else {
      setLocalInteractions((prev) => prev.filter((i) => i.id !== tempId));
      toastError(res.error || "Error al añadir nota");
    }
  }

  async function onGenerateAgreement() {
    setGenerating(true);
    const res = await generateAgreement(client.id);
    setGenerating(false);
    if (res.ok) {
      toastSuccess("Acuerdo generado correctamente");
      router.refresh();
    } else {
      toastError(res.error || "Error al generar acuerdo");
    }
  }

  const docsBySlot = slots.map((slot) => {
    const doc = documents
      .filter((d) => d.slot_type === slot.key)
      .sort((a, b) => b.version - a.version)[0];
    return { slot, doc };
  });

  function getStateLabel(stateId: string): string {
    return PIPELINE_STATE_LABELS.find((s) => s.id === stateId)?.label || stateId;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{client.company_name || client.cif || "Cliente"}</CardTitle>
            <p className="text-sm text-gray-600">
              Estado:{" "}
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 border border-brand-100">
                {client.current_state}
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Description */}
            <div>
              <label className="text-sm font-medium text-gray-700">Descripci��n del servicio</label>
              {editingDescription ? (
                <div className="mt-2 flex gap-2">
                  <textarea
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={onSaveDescription} disabled={isPending}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingDescription(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => setEditingDescription(true)}
                >
                  {descriptionValue || "Haz clic para añadir descripción"}
                </div>
              )}
            </div>

            {/* Has Device Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Incluye dispositivo</label>
              <button
                onClick={() => onToggleHasDevice(!client.has_device)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  client.has_device ? "bg-brand-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    client.has_device ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-600">Cambiar estado</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={client.current_state}
                disabled={changing}
                onChange={(e) => onStateChange(e.target.value)}
              >
                {phases.map((phase) => (
                  <optgroup key={phase.name} label={phase.name}>
                    {phase.states.map((s) => (
                      <option key={s} value={s}>
                        {getStateLabel(s)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {suggestedNext && (
              <Button
                onClick={() => onStateChange(suggestedNext)}
                disabled={changing}
              >
                Siguiente paso: {getStateLabel(suggestedNext)}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>One-Click Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onCallMissed}
            >
              Llamada no respondida
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onCallSuccess}
            >
              Llamada exitosa
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referido por</CardTitle>
          </CardHeader>
          <CardContent>
            {referral ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{referral.associates?.full_name}</p>
                <p className="text-xs text-slate-500">
                  Estado comisión:{" "}
                  <span className="font-bold text-brand-600 uppercase">
                    {referral.commission_status}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Crear nuevo vínculo:</p>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={associateId}
                      onChange={(e) => setAssociateId(e.target.value)}
                    >
                      <option value="">Seleccionar asociado...</option>
                      {associates.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.full_name} {a.company_name ? `(${a.company_name})` : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={onCreateAndLinkReferral}
                      disabled={linking || !associateId}
                    >
                      Crear
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">O vincular existente</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="ID del referido"
                    className="h-9 text-xs"
                    value={referralId}
                    onChange={(e) => setReferralId(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={onLinkReferral} disabled={linking}>
                    Vincular
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Interacciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Añadir nota interna..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddNote()}
              />
              <Button size="sm" onClick={onAddNote} disabled={!noteText.trim()}>
                Añadir
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {localInteractions.slice(0, 20).map((i) => (
                <li key={i.id} className="flex flex-col border-b border-gray-50 pb-2 last:border-0">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold uppercase text-[10px] text-slate-400">
                      {i.type}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(i.created_at).toLocaleString("es")}
                    </span>
                  </div>
                  {i.type === "note" && (
                    <p className="text-xs text-slate-700 mt-0.5">
                      {(i.metadata as any)?.content || (i.metadata as any)?.note}
                    </p>
                  )}
                  {i.type === "state_change" && (
                    <p className="text-[10px] text-brand-600">
                      {(i.metadata as any)?.from} → {(i.metadata as any)?.to}
                    </p>
                  )}
                </li>
              ))}
              {localInteractions.length === 0 && <li className="text-gray-500">Ninguna</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vault (documentos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {docsBySlot.map(({ slot, doc }) => (
              <div
                key={slot.key}
                className={
                  doc?.status === "rejected"
                    ? "rounded-lg border border-red-200 bg-red-50 p-3"
                    : "rounded-lg border border-gray-200 bg-white p-3"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{slot.label}</span>
                  <span className="text-sm text-gray-500">
                    {doc
                      ? `v${doc.version} - ${doc.status}`
                      : "Sin documento"}
                  </span>
                </div>
                {doc && doc.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onApprove(doc.id)}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejecting(doc.id)}
                    >
                      Rechazar
                    </Button>
                    {rejecting === doc.id && (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          placeholder="Motivo rechazo"
                          className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-error-500"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => onReject(doc.id)}
                          disabled={!rejectReason.trim()}
                        >
                          Enviar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {doc?.rejection_reason && (
                  <p className="mt-1 text-sm text-red-700">
                    Motivo: {doc.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acuerdos</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAgreement}
              disabled={generating}
            >
              {generating ? "Generando…" : "Generar acuerdo"}
            </Button>
          </CardContent>
        </Card>

        {/* Contracts Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contratos Red.es</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contracts.length === 0 ? (
              <p className="text-sm text-gray-500">No hay contratos activos</p>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div key={contract.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        Contrato {contract.type === "web" ? "Web" : "E-commerce"}
                      </span>
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full border border-brand-100">
                        {getStateLabel(contract.current_state)}
                      </span>
                    </div>
                    <select
                      className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={contract.current_state}
                      onChange={(e) => onContractStateChange(contract.id, e.target.value)}
                    >
                      {PIPELINE_STATE_LABELS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Card */}
        {client.has_device && deviceOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dispositivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceOrders.map((order) => (
                <div key={order.id} className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="text-gray-600">Estado del pedido</label>
                      <select
                        className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={order.status || ""}
                        onChange={(e) => onDeviceOrderStatusChange(order.id, e.target.value)}
                      >
                        <option value="pendiente_seleccion">Pendiente Selección</option>
                        <option value="seleccionado">Seleccionado</option>
                        <option value="pago_pendiente">Pago Pendiente</option>
                        <option value="pago_completado">Pago Completado</option>
                        <option value="en_preparacion">En Preparación</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-600">Estado pago</label>
                      <div className="mt-1 p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                        {order.payment_status || "—"}
                      </div>
                    </div>
                  </div>

                  {order.surcharge && (
                    <div className="text-sm">
                      <label className="text-gray-600">Sobrecoste</label>
                      <p className="font-medium">€{order.surcharge.toFixed(2)}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tracking</label>
                    {editingTracking ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Número de seguimiento"
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                        <input
                          type="url"
                          placeholder="URL de seguimiento (opcional)"
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => onSaveTracking(order.id)}
                            disabled={!trackingNumber.trim()}
                          >
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTracking(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {order.tracking_number ? (
                          <div className="p-2 rounded border border-gray-200 bg-gray-50">
                            <p className="font-mono">{order.tracking_number}</p>
                            {order.tracking_url && (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-600 hover:underline text-xs"
                              >
                                Ver seguimiento →
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingTracking(true)}
                            className="text-brand-600 hover:underline text-sm"
                          >
                            Añadir tracking
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payments Card */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pagos esperados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium">Concepto</th>
                      <th className="text-right py-2 px-2 font-medium">Esperado</th>
                      <th className="text-right py-2 px-2 font-medium">Recibido</th>
                      <th className="text-right py-2 px-2 font-medium">Comisión</th>
                      <th className="text-center py-2 px-2 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          {payment.contract_type === "web" ? "Web" : "E-commerce"} - {payment.phase === "fase_i" ? "Fase I" : "Fase II"}
                        </td>
                        <td className="text-right py-3 px-2">€{payment.expected_amount.toFixed(2)}</td>
                        <td className="text-right py-3 px-2">
                          {payment.received_amount ? `€${payment.received_amount.toFixed(2)}` : "—"}
                        </td>
                        <td className="text-right py-3 px-2">
                          {payment.agent_commission ? `€${payment.agent_commission.toFixed(2)}` : "—"}
                        </td>
                        <td className="text-center py-3 px-2">
                          {receivingPayment === payment.id ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Importe"
                                className="w-20 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                              />
                              <input
                                type="date"
                                className="w-24 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                              />
                              <Button
                                size="sm"
                                onClick={() => onMarkPaymentReceived(payment.id)}
                                disabled={!paymentAmount}
                              >
                                OK
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReceivingPayment(null);
                                  setPaymentAmount("");
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReceivingPayment(payment.id);
                                setPaymentAmount(payment.expected_amount.toString());
                              }}
                              className="text-brand-600 hover:underline text-xs"
                            >
                              {payment.received_amount ? "Editar" : "Marcar recibido"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
