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
import { Phone, PhoneMissed, Users } from "lucide-react";
import { LeadProfileSheet } from "./lead-profile-sheet";

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
  if (!service) return "bg-gray-100 text-gray-700 border-gray-200";
  if (service === "web") return "bg-blue-100 text-blue-700 border-blue-200";
  if (service === "ecommerce") return "bg-amber-100 text-amber-700 border-amber-200";
  if (service === "seo") return "bg-green-100 text-green-700 border-green-200";
  if (service === "factura" || service === "factura_electronica") return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
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

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        "rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md transition-all text-left"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate flex-1">
          {title}
        </p>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", getServiceColor(lead.service_requested))}>
          {lead.service_requested ? lead.service_requested.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "—"}
        </span>
      </div>

      {lead.has_referral && (
        <div className="flex items-center gap-1 mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-100 text-[10px] font-bold uppercase tracking-wider">
            <Users className="w-2.5 h-2.5" /> Referido
          </span>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-0.5">
        {lead.email ?? lead.phone ?? "—"}
      </p>

      {/* Days since last interaction indicator */}
      <div className={cn("text-xs mt-1.5 font-medium", daysSince.color)}>
        {daysSince.label}
      </div>

      {/* Failed calls indicator */}
      {lead.call_missed_count > 0 && (
        <p className="text-xs text-red-600 mt-0.5">
          {lead.call_missed_count} intento{lead.call_missed_count > 1 ? "s" : ""} fallido{lead.call_missed_count > 1 ? "s" : ""}
        </p>
      )}

      {isListo && (
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full bg-primary hover:bg-primary-dark text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoveToConsultoria(lead.id);
          }}
        >
          Pasar a Consultoría
        </Button>
      )}

      {/* Call action buttons */}
      {!isListo && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCallMissed(lead.id);
            }}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors p-1.5 text-xs font-medium"
            title="Intento fallido"
          >
            <PhoneMissed className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCallSuccess(lead.id);
            }}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors p-1.5 text-xs font-medium"
            title="Llamada exitosa"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-[220px]">
      <div
        className={cn(
          "rounded-2xl border bg-white/80 dark:bg-slate-800/80 dark:border-slate-700 shadow-card transition-all h-full flex flex-col min-h-[140px]",
          isOver && "ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10"
        )}
      >
        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">
            {label}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{leads.length}</p>
        </div>
        <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
          {leads.map((lead) => (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              onMoveToConsultoria={onMoveToConsultoria}
              onCallMissed={onCallMissed}
              onCallSuccess={onCallSuccess}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
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
      if (res.ok) router.refresh();
      else alert(res.error);
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
        if (res.password) setPasswordModal(res.password);
        setSelectedLead(null);
        router.refresh();
      } else {
        alert(res.error);
      }
    },
    [changing, router]
  );

  const handleCallMissed = useCallback(
    (leadId: string) => {
      startTransition(async () => {
        const res = await registerTriageCallMissed(leadId);
        if (res.ok) router.refresh();
        else alert(res.error);
      });
    },
    [router]
  );

  const handleCallSuccess = useCallback(
    (leadId: string) => {
      startTransition(async () => {
        const res = await registerTriageCallSuccess(leadId);
        if (res.ok) router.refresh();
        else alert(res.error);
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
        <div className="flex gap-3 overflow-x-auto pb-4">
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
            <div className="w-[220px] rounded-xl border-2 border-primary/40 bg-white dark:bg-slate-800 p-3 shadow-xl cursor-grabbing">
              <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
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
        <LeadProfileSheet
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onCallMissed={handleCallMissed}
          onCallSuccess={handleCallSuccess}
          onMoveToConsultoria={handleMoveToConsultoria}
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
