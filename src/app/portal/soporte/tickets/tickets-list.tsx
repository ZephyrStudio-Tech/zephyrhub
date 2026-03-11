"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronRight } from "lucide-react";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

function statusBadge(status: string | null | undefined) {
  const s = (status ?? "abierto").toLowerCase();
  if (s === "resuelto" || s === "cerrado") {
    return "bg-success-50 text-success-700 border border-success-200";
  }
  if (s === "en_proceso" || s === "en proceso") {
    return "bg-brand-50 text-brand-700 border border-brand-200";
  }
  return "bg-warning-50 text-warning-700 border border-warning-200";
}

export function TicketsList({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="py-12 text-center">
          <p className="text-gray-500">No tienes tickets de soporte aún</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-card">
      <div className="divide-y divide-gray-100">
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/portal/soporte/tickets/${ticket.id}`}>
            <div className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all duration-200 hover:pl-6 cursor-pointer group">
              {/* Left Column */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {ticket.category}
                  </p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    #{ticket.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {ticket.message || "—"}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                {/* Date */}
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {new Date(ticket.created_at).toLocaleDateString("es")}
                </span>

                {/* Status Badge */}
                <span
                  className={cn(
                    "inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    statusBadge(ticket.status)
                  )}
                >
                  {ticket.status === "resuelto" || ticket.status === "cerrado"
                    ? "Resuelto"
                    : ticket.status === "en_proceso"
                      ? "En Proceso"
                      : "Abierto"}
                </span>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 group-hover:text-gray-400 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

