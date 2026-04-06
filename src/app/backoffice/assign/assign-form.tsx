"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignConsultant } from "@/app/actions/client-actions";
import { Button } from "@/components/ui/button";

type Consultant = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Client = {
  id: string;
  company_name: string | null;
  consultant_id: string | null;
  current_state: string;
};

export function AssignConsultantForm({
  clients,
  consultants,
}: {
  clients: Client[];
  consultants: Consultant[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAssign(clientId: string, consultantId: string) {
    const cid = consultantId === "none" ? null : consultantId;
    setLoadingId(clientId);
    const res = await assignConsultant(clientId, cid);
    setLoadingId(null);
    if (res.ok) {
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <ul className="mt-4 space-y-2 text-sm">
      {clients.map((c) => (
        <li
          key={c.id}
          className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-4"
        >
          <span className="text-slate-800 dark:text-slate-200 flex-1 truncate">
            {c.company_name || c.id.slice(0, 8)} ·{" "}
            <span className="text-xs text-slate-500 uppercase">
              {c.current_state.replace(/_/g, " ")}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              value={c.consultant_id || "none"}
              disabled={loadingId === c.id}
              onChange={(e) => handleAssign(c.id, e.target.value)}
            >
              <option value="none">Sin asignar</option>
              {consultants.map((con) => (
                <option key={con.id} value={con.id}>
                  {con.full_name || con.email}
                </option>
              ))}
            </select>
            {loadingId === c.id && (
              <span className="text-[10px] text-slate-400 animate-pulse">
                Guardando...
              </span>
            )}
          </div>
        </li>
      ))}
      {clients.length === 0 && (
        <p className="text-slate-500 text-center py-4">No hay clientes para mostrar.</p>
      )}
    </ul>
  );
}
