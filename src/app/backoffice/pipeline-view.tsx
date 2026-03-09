"use client";

import Link from "next/link";
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
import { transitionClientState } from "@/app/actions/transition-state";
import { canTransition } from "@/lib/state-machine/machine";
import type { PipelineState } from "@/lib/state-machine/constants";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  company_name: string | null;
  cif: string | null;
  current_state: string;
  service_type: string;
  consultant_id: string | null;
  created_at: string;
};

function ClientCard({
  client,
  isDragging,
}: {
  client: Client;
  isDragging?: boolean;
}) {
  const title =
    client.company_name || client.cif || client.id.slice(0, 8);

  return (
    <Link
      href={`/backoffice/clients/${client.id}`}
      className={cn(
        "block rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-left",
        isDragging && "opacity-90 shadow-lg ring-2 ring-primary/30"
      )}
    >
      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
        {title}
      </p>
      <p className="text-xs text-slate-500 mt-1 capitalize">
        {client.service_type?.replace("_", " ")}
      </p>
    </Link>
  );
}

function DraggableClientCard({
  client,
  isDragging,
}: {
  client: Client;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: client.id,
    data: {
      clientId: client.id,
      currentState: client.current_state,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <ClientCard client={client} isDragging={isDragging} />
    </div>
  );
}

export function PipelineView({
  clients,
  phases,
}: {
  clients: Client[];
  phases: { name: string; states: PipelineState[] }[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || changing) return;

      const overId = String(over.id);
      if (!overId.startsWith("phase-")) return;

      const phaseIndex = parseInt(overId.replace("phase-", ""), 10);
      if (Number.isNaN(phaseIndex) || phaseIndex < 0 || phaseIndex >= phases.length)
        return;

      const client = clients.find((c) => c.id === active.id);
      if (!client) return;

      const targetPhase = phases[phaseIndex];
      const fromState = client.current_state as PipelineState;

      const validToState = targetPhase.states.find((s) =>
        canTransition(fromState, s)
      );
      if (!validToState) {
        alert(
          `No se puede mover a "${targetPhase.name}". Transición no permitida desde el estado actual.`
        );
        return;
      }

      setChanging(true);
      const res = await transitionClientState(client.id, validToState);
      setChanging(false);
      if (res.ok) router.refresh();
      else alert(res.error);
    },
    [clients, phases, changing, router]
  );

  const clientsByPhase = phases.map((phase) => ({
    phase,
    clients: clients.filter((c) =>
      phase.states.includes(c.current_state as PipelineState)
    ),
  }));

  const activeClient = activeId
    ? clients.find((c) => c.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {phases.map((phase, idx) => {
          const { clients: inPhase } = clientsByPhase[idx];
          return (
            <DroppablePhaseColumnWrapper
              key={phase.name}
              phaseIndex={idx}
              phase={phase}
              clients={inPhase}
              DraggableCard={DraggableClientCard}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeClient ? (
          <div className="w-[280px] rounded-xl border-2 border-primary/40 bg-white dark:bg-slate-800 p-3 shadow-xl cursor-grabbing">
            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
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
  );
}

function DroppablePhaseColumnWrapper({
  phaseIndex,
  phase,
  clients,
  DraggableCard,
}: {
  phaseIndex: number;
  phase: { name: string; states: PipelineState[] };
  clients: Client[];
  DraggableCard: React.ComponentType<{
    client: Client;
    isDragging?: boolean;
  }>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `phase-${phaseIndex}`,
    data: { phaseIndex, states: phase.states },
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0">
      <div
        className={cn(
          "w-[280px] rounded-2xl border bg-white/80 dark:bg-slate-800/80 dark:border-slate-700 shadow-card transition-all",
          isOver && "ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10"
        )}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white tracking-tight">
            {phase.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {clients.length} expediente{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="p-3 min-h-[120px] space-y-2">
          {clients.map((client) => (
            <DraggableCard key={client.id} client={client} />
          ))}
        </div>
      </div>
    </div>
  );
}
