"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TicketsList } from "./tickets-list";

type Ticket = {
  id: string;
  category: string;
  message: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string | null;
};

export function TicketsPageClient({ tickets }: { tickets: Ticket[] }) {
  const [openNew, setOpenNew] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Mis Tickets de Soporte
          </h1>
          <p className="text-muted text-sm mt-1">
            Gestiona tus consultas y abre nuevos tickets.
          </p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="shrink-0">
          + Nuevo Ticket
        </Button>
      </div>
      <TicketsList
        tickets={tickets}
        openNew={openNew}
        setOpenNew={setOpenNew}
      />
    </>
  );
}
