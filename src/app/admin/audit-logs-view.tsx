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
      <h1 className="text-2xl font-bold">Consola de Logs</h1>
      <Card>
        <CardHeader>
          <CardTitle>Auditoría (solo lectura)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-muted">
                  <th className="p-2">Quién</th>
                  <th className="p-2">Qué</th>
                  <th className="p-2">Entidad</th>
                  <th className="p-2">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="p-2">
                      {log.actor_id
                        ? profileMap[log.actor_id] ?? log.actor_id.slice(0, 8)
                        : "—"}
                    </td>
                    <td className="p-2">{log.action}</td>
                    <td className="p-2">
                      {log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="p-2 text-muted">
                      {new Date(log.created_at).toLocaleString("es")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <p className="py-8 text-center text-muted">No hay registros.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
