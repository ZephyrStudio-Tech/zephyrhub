"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { updateTriageLeadState, moveToConsultoria } from "@/app/actions/triage";
import { PRECONSULTORIA_STATE_LABELS } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  current_state: string;
  service_requested: string | null;
  created_at: string | null;
};

const PRECONSULTORIA_IDS = new Set(
  PRECONSULTORIA_STATE_LABELS.map((s) => s.id)
);

function LeadCard({
  lead,
  onMoveToConsultoria,
}: {
  lead: Lead;
  onMoveToConsultoria: (leadId: string) => void;
}) {
  const isListo = lead.current_state === "listo_para_tramitar";
  const title = lead.company_name?.trim() || lead.full_name || lead.email || lead.id.slice(0, 8);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md transition-all text-left"
      )}
    >
      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
        {title}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {lead.email ?? lead.phone ?? "—"}
      </p>
      {lead.service_requested && (
        <p className="text-xs text-slate-500 capitalize mt-0.5">
          {lead.service_requested.replace("_", " ")}
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
    </div>
  );
}

function DraggableLeadCard({
  lead,
  onMoveToConsultoria,
}: {
  lead: Lead;
  onMoveToConsultoria: (leadId: string) => void;
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
      <LeadCard lead={lead} onMoveToConsultoria={onMoveToConsultoria} />
    </div>
  );
}

function DroppableColumn({
  stateId,
  label,
  leads,
  onMoveToConsultoria,
}: {
  stateId: string;
  label: string;
  leads: Lead[];
  onMoveToConsultoria: (leadId: string) => void;
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
        router.refresh();
      } else {
        alert(res.error);
      }
    },
    [changing, router]
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
