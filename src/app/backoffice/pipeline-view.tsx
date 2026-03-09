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
import { PIPELINE_STATE_LABELS } from "@/lib/state-machine/constants";
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

function DraggableClientCard({ client }: { client: Client }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: client.id,
    data: { clientId: client.id, currentState: client.current_state },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <ClientCard client={client} />
    </div>
  );
}

function DroppableStateColumn({
  stateId,
  label,
  clients,
}: {
  stateId: PipelineState;
  label: string;
  clients: Client[];
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
          <p className="text-xs text-slate-500 mt-0.5">
            {clients.length}
          </p>
        </div>
        <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
          {clients.map((client) => (
            <DraggableClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stateLabels.map(({ id, label }) => (
          <DroppableStateColumn
            key={id}
            stateId={id}
            label={label}
            clients={clients.filter((c) => c.current_state === id)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeClient ? (
          <div className="w-[220px] rounded-xl border-2 border-primary/40 bg-white dark:bg-slate-800 p-3 shadow-xl cursor-grabbing">
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
