"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  updateTriageLeadState,
  moveToConsultoria,
  registerTriageCallMissed,
  registerTriageCallSuccess
} from "@/app/actions/triage";
import { PRECONSULTORIA_STATE_LABELS } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneMissed,
  Users,
  Mail,
  ExternalLink,
  CheckCircle2,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { ClientLeadModal } from "../components/client-lead-modal";
import { toastError, toastSuccess } from "@/lib/toast";

type Lead = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  current_state: string;
  service_requested: string | null;
  created_at: string | null;
  last_interaction_at: string | null;
  call_missed_count: number;
  has_referral?: boolean;
};

const PRECONSULTORIA_IDS = new Set(
  PRECONSULTORIA_STATE_LABELS.map((s) => s.id)
);

function getServiceColor(service: string | null): string {
  if (!service) return "bg-slate-100 text-slate-700 border-slate-200";
  if (service === "web") return "bg-blue-50 text-blue-600 border-blue-100";
  if (service === "ecommerce") return "bg-amber-50 text-amber-600 border-amber-100";
  if (service === "seo") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (service === "factura" || service === "factura_electronica") return "bg-purple-50 text-purple-600 border-purple-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getDaysSinceLastInteraction(
  lastInteractionAt: string | null,
  createdAt: string | null
): { days: number; color: string; label: string } {
  const referenceDate = lastInteractionAt || createdAt;
  if (!referenceDate) return { days: 0, color: "text-gray-500", label: "Sin datos" };

  const now = new Date();
  const lastDate = new Date(referenceDate);
  const diffMs = now.getTime() - lastDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return { days, color: "text-green-600", label: "Hoy" };
  } else if (days <= 3) {
    return { days, color: "text-amber-600", label: `${days}d` };
  } else {
    return { days, color: "text-red-600", label: `${days}d sin actividad` };
  }
}

function LeadCard({
  lead,
  onMoveToConsultoria,
  onCallMissed,
  onCallSuccess,
  onSelect,
}: {
  lead: Lead;
  onMoveToConsultoria: (leadId: string) => void;
  onCallMissed: (leadId: string) => void;
  onCallSuccess: (leadId: string) => void;
  onSelect: (lead: Lead) => void;
}) {
  const isListo = lead.current_state === "listo_para_tramitar";
  const title = lead.company_name?.trim() || lead.full_name || lead.email || lead.id.slice(0, 8);
  const daysSince = getDaysSinceLastInteraction(lead.last_interaction_at, lead.created_at);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartPos.current) return;
    const dist = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.current.x, 2) +
      Math.pow(e.clientY - dragStartPos.current.y, 2)
    );
    if (dist < 5) {
      onSelect(lead);
    }
    dragStartPos.current = null;
  };

  const isInactive = daysSince.days > 3;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        "group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-300 text-left relative",
        isInactive && "border-red-200 ring-1 ring-red-100"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1 line-clamp-2">
          {title}
        </h4>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase shrink-0", getServiceColor(lead.service_requested))}>
          {lead.service_requested ? lead.service_requested.replace(/_/g, " ") : "—"}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-slate-500">
           <Mail className="w-3 h-3" />
           <span className="text-[11px] truncate">{lead.email || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
           <Phone className="w-3 h-3" />
           <span className="text-[11px]">{lead.phone || "—"}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
          daysSince.color.replace("text-", "bg-").replace("600", "50") + " " + daysSince.color + " " + daysSince.color.replace("text-", "border-").replace("600", "100")
        )}>
          {daysSince.label === "Hoy" ? "Entró hoy" : (daysSince.days > 0 ? `Hace ${daysSince.days}d` : daysSince.label)}
        </span>

        {lead.has_referral && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100 text-[10px] font-bold uppercase">
            Referido
          </span>
        )}

        {lead.call_missed_count > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold">
            {lead.call_missed_count} intentos
          </span>
        )}
      </div>

      {isListo && (
        <Button
          type="button"
          size="sm"
          className="mt-4 w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-9 rounded-lg shadow-lg shadow-brand-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoveToConsultoria(lead.id);
          }}
        >
          Pasar a Consultoría
        </Button>
      )}

      {/* Hover Action Footer */}
      <div className="absolute inset-x-0 -bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10 pointer-events-none">
        <div className="bg-white border border-slate-200 shadow-xl rounded-full p-1.5 flex items-center gap-1 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onCallMissed(lead.id); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Llamada fallida"
          >
            <PhoneMissed className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCallSuccess(lead.id); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Llamada exitosa"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-100 mx-1" />
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(lead); }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Ver ficha"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DraggableLeadCard({
  lead,
  onMoveToConsultoria,
  onCallMissed,
  onCallSuccess,
  onSelect,
}: {
  lead: Lead;
  onMoveToConsultoria: (leadId: string) => void;
  onCallMissed: (leadId: string) => void;
  onCallSuccess: (leadId: string) => void;
  onSelect: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: lead.id,
    data: { leadId: lead.id, currentState: lead.current_state },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <LeadCard 
        lead={lead} 
        onMoveToConsultoria={onMoveToConsultoria}
        onCallMissed={onCallMissed}
        onCallSuccess={onCallSuccess}
        onSelect={onSelect}
      />
    </div>
  );
}

function DroppableColumn({
  stateId,
  label,
  leads,
  onMoveToConsultoria,
  onCallMissed,
  onCallSuccess,
  onSelect,
}: {
  stateId: string;
  label: string;
  leads: Lead[];
  onMoveToConsultoria: (leadId: string) => void;
  onCallMissed: (leadId: string) => void;
  onCallSuccess: (leadId: string) => void;
  onSelect: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stateId,
    data: { stateId },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const isListo = stateId === "listo_para_tramitar";

  const virtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isListo ? 200 : 160,
    overscan: 3,
    gap: 12,
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-[310px] h-full pb-6">
      <div
        className={cn(
          "rounded-[24px] border border-slate-200 bg-[#f9fafb] shadow-sm transition-all h-full flex flex-col overflow-hidden",
          isOver && "ring-2 ring-brand-500/20 bg-brand-50/10",
          isListo && "ring-2 ring-brand-500 shadow-lg shadow-brand-100"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">
            {label}
          </h3>
          <span className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>

        <div
          ref={parentRef}
          className="px-3 pb-4 flex-1 overflow-y-auto custom-scrollbar"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const lead = leads[virtualRow.index];
              return (
                <div
                  key={lead.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <DraggableLeadCard
                    lead={lead}
                    onMoveToConsultoria={onMoveToConsultoria}
                    onCallMissed={onCallMissed}
                    onCallSuccess={onCallSuccess}
                    onSelect={onSelect}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

export function PreconsultoriaKanban({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [passwordModal, setPasswordModal] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || changing) return;

      const toState = String(over.id);
      if (!PRECONSULTORIA_IDS.has(toState as PipelineState)) return;

      const lead = leads.find((l) => l.id === active.id);
      if (!lead || lead.current_state === toState) return;

      setChanging(true);
      const res = await updateTriageLeadState(lead.id, toState);
      setChanging(false);
      if (res.ok) {
        router.refresh();
      } else {
        toastError(res.error || "Error al cambiar estado");
      }
    },
    [leads, changing, router]
  );

  const handleMoveToConsultoria = useCallback(
    async (leadId: string) => {
      if (changing) return;
      setChanging(true);
      const res = await moveToConsultoria(leadId);
      setChanging(false);
      if (res.ok) {
        toastSuccess("Cliente transferido a Consultoría");
        if (res.password) setPasswordModal(res.password);
        setSelectedLead(null);
        router.refresh();
      } else {
        toastError(res.error || "Error al transferir cliente");
      }
    },
    [changing, router]
  );

  const handleCallMissed = useCallback(
    (leadId: string) => {
      startTransition(async () => {
        const res = await registerTriageCallMissed(leadId);
        if (res.ok) {
          router.refresh();
        } else {
          toastError(res.error || "Error al registrar llamada");
        }
      });
    },
    [router]
  );

  const handleCallSuccess = useCallback(
    (leadId: string) => {
      startTransition(async () => {
        const res = await registerTriageCallSuccess(leadId);
        if (res.ok) {
          router.refresh();
        } else {
          toastError(res.error || "Error al registrar llamada");
        }
      });
    },
    [router]
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto h-[calc(100vh-220px)] pb-4 custom-scrollbar">
          {PRECONSULTORIA_STATE_LABELS.map(({ id, label }) => (
            <DroppableColumn
              key={id}
              stateId={id}
              label={label}
              leads={leads.filter((l) => l.current_state === id)}
              onMoveToConsultoria={handleMoveToConsultoria}
              onCallMissed={handleCallMissed}
              onCallSuccess={handleCallSuccess}
              onSelect={setSelectedLead}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="w-[310px] rounded-xl border-2 border-brand-500 bg-white p-4 shadow-2xl cursor-grabbing scale-105 rotate-1">
              <p className="font-bold text-slate-900 text-sm truncate">
                {activeLead.company_name?.trim() ||
                  activeLead.full_name ||
                  activeLead.email ||
                  activeLead.id.slice(0, 8)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeLead.email ?? activeLead.phone ?? "—"}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <ClientLeadModal
          mode="lead"
          leadData={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Cliente transferido a Consultoría
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              La contraseña de acceso al portal para el cliente es:
            </p>
            <p className="font-mono text-lg bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-xl mb-6 break-all">
              {passwordModal}
            </p>
            <Button
              onClick={() => setPasswordModal(null)}
              className="w-full"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
