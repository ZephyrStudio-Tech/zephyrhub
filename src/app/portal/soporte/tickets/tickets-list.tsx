import Link from "next/link";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

function badge(status: string | null | undefined) {
  const s = (status ?? "abierto").toLowerCase();
  if (s === "resuelto" || s === "cerrado") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "en_proceso" || s === "en proceso") {
    return "bg-brand-50 text-brand-700 border-brand-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function TicketsList({ tickets }: { tickets: Ticket[] }) {
  if (!tickets || tickets.length === 0) {
    return <p className="py-8 text-center text-gray-500">No tienes tickets aún.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/portal/soporte/tickets/${t.id}`}
            className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium border", badge(t.status))}>
                  {t.status ?? "abierto"}
                </span>
                <span className="font-medium text-gray-900 truncate">{t.category}</span>
              </div>
              <p className="text-sm text-gray-500 truncate mt-1">
                {t.message ?? "—"}
              </p>
            </div>
            <span className="text-sm text-brand-600 font-medium shrink-0">
              Ver hilo →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

