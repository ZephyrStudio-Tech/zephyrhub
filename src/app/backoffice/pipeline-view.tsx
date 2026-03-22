"use client";

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useRef } from "react";
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
import { transitionClientState } from "@/app/actions/transition-state";
import { canTransition } from "@/lib/state-machine/machine";
import { PIPELINE_STATE_LABELS } from "@/lib/state-machine/constants";
import type { PipelineState } from "@/lib/state-machine/constants";
import { cn } from "@/lib/utils";
import { Mail, Phone, MoreHorizontal } from "lucide-react";
import { ClientLeadModal } from "./components/client-lead-modal";

type Client = {
  id: string;
  company_name: string | null;
  cif: string | null;
  email?: string | null;
  phone?: string | null;
  current_state: string;
  service_type: string;
  consultant_id: string | null;
  created_at: string;
  last_interaction_at: string | null;
  pending_docs: boolean | null;
};

function getServiceColor(service: string | null): string {
  if (!service) return "bg-slate-100 text-slate-700 border-slate-200";
  if (service === "web") return "bg-blue-50 text-blue-600 border-blue-100";
  if (service === "ecommerce") return "bg-amber-50 text-amber-600 border-amber-100";
  if (service === "seo") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (service === "factura_electronica" || service === "factura") return "bg-purple-50 text-purple-600 border-purple-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getDaysSinceLastInteraction(
  lastInteractionAt: string | null,
  createdAt: string | null
): { days: number; color: string; label: string } {
  const referenceDate = lastInteractionAt || createdAt;
  if (!referenceDate) return { days: 0, color: "text-slate-500", label: "Sin datos" };

  const now = new Date();
  const lastDate = new Date(referenceDate);
  const diffMs = now.getTime() - lastDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return { days, color: "text-emerald-600", label: "Hoy" };
  } else if (days <= 3) {
    return { days, color: "text-amber-600", label: `${days}d` };
  } else {
    return { days, color: "text-red-600", label: `${days}d sin actividad` };
  }
}

function ClientCard({
  client,
  onClick
}: {
  client: Client;
  onClick: () => void;
}) {
  const title = client.company_name || client.cif || client.id.slice(0, 8);
  const daysSince = getDaysSinceLastInteraction(client.last_interaction_at, client.created_at);
  const isInactive = daysSince.days > 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-300 text-left cursor-pointer relative",
        isInactive && "border-red-200 ring-1 ring-red-100"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1 line-clamp-2">
          {title}
        </h4>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase shrink-0", getServiceColor(client.service_type))}>
          {client.service_type?.replace(/_/g, " ")}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-slate-500">
           <Mail className="w-3 h-3" />
           <span className="text-[11px] truncate">{client.email || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
           <Phone className="w-3 h-3" />
           <span className="text-[11px]">{client.phone || "—"}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
          daysSince.color.replace("text-", "bg-").replace("600", "50") + " " + daysSince.color + " " + daysSince.color.replace("text-", "border-").replace("600", "100")
        )}>
          {daysSince.label === "Hoy" ? "Entró hoy" : (daysSince.days > 0 ? `Hace ${daysSince.days}d` : daysSince.label)}
        </span>

        {client.pending_docs && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">
            Docs Pendientes
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 -bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10 pointer-events-none">
        <div className="bg-white border border-slate-200 shadow-xl rounded-full p-1.5 flex items-center pointer-events-auto">
          <button
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

function DroppableStateColumn({
  stateId,
  label,
  clients,
  onSelectClient,
}: {
  stateId: PipelineState;
  label: string;
  clients: Client[];
  onSelectClient: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stateId,
    data: { stateId },
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-[310px] h-full pb-6">
      <div
        className={cn(
          "rounded-[24px] border border-slate-200 bg-[#f9fafb] shadow-sm transition-all h-full flex flex-col overflow-hidden",
          isOver && "ring-2 ring-brand-500/20 bg-brand-50/10"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">
            {label}
          </h3>
          <span className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {clients.length}
          </span>
        </div>

        <div className="px-3 pb-4 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
          {clients.map((client) => (
            <DraggableClientCard
              key={client.id}
              client={client}
              onSelect={() => onSelectClient(client.id)}
            />
          ))}
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

function DraggableClientCard({ client, onSelect }: { client: Client, onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: client.id,
    data: { clientId: client.id, currentState: client.current_state },
  });

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
      onSelect();
    }
    dragStartPos.current = null;
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-0")}
    >
      <ClientCard client={client} onClick={() => {}} />
    </div>
  );
}

type StateLabel = { id: PipelineState; label: string };

export function PipelineView({
  clients,
  stateLabels = PIPELINE_STATE_LABELS,
}: {
  clients: Client[];
  stateLabels?: readonly StateLabel[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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

      const toState = String(over.id) as PipelineState;
      if (!stateLabels.some((s) => s.id === toState)) return;

      const client = clients.find((c) => c.id === active.id);
      if (!client) return;

      const fromState = client.current_state as PipelineState;
      if (!canTransition(fromState, toState)) {
        alert("Transición no permitida desde el estado actual.");
        return;
      }

      setChanging(true);
      const res = await transitionClientState(client.id, toState);
      setChanging(false);
      if (res.ok) router.refresh();
      else alert(res.error);
    },
    [clients, stateLabels, changing, router]
  );

  const activeClient = activeId ? clients.find((c) => c.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto h-[calc(100vh-220px)] pb-4 custom-scrollbar">
          {stateLabels.map(({ id, label }) => (
            <DroppableStateColumn
              key={id}
              stateId={id}
              label={label}
              clients={clients.filter((c) => c.current_state === id)}
              onSelectClient={setSelectedClientId}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeClient ? (
            <div className="w-[310px] rounded-xl border-2 border-brand-500 bg-white p-4 shadow-2xl cursor-grabbing scale-105 rotate-1">
              <p className="font-bold text-slate-900 text-sm truncate">
                {activeClient.company_name ||
                  activeClient.cif ||
                  activeClient.id.slice(0, 8)}
              </p>
              <p className="text-xs text-slate-500 mt-1 capitalize">
                {activeClient.service_type?.replace("_", " ")}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedClientId && (
        <ClientLeadModal
          mode="client"
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </>
  );
}
