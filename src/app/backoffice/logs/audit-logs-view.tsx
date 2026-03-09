"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Log = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export function AuditLogsView({
  logs,
  profileMap,
}: {
  logs: Log[];
  profileMap: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
        Logs de auditoría
      </h1>
      <Card className="border-slate-200 dark:border-slate-700 shadow-card">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">
            Auditoría (solo lectura)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500">
                  <th className="p-3">Quién</th>
                  <th className="p-3">Qué</th>
                  <th className="p-3">Entidad</th>
                  <th className="p-3">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3">
                      {log.actor_id
                        ? profileMap[log.actor_id] ?? log.actor_id.slice(0, 8)
                        : "—"}
                    </td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">
                      {log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(log.created_at).toLocaleString("es")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <p className="py-8 text-center text-slate-500">No hay registros.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
