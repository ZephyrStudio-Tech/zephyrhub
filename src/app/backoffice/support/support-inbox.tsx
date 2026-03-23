"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Filter, MoreVertical } from "lucide-react";
import { deleteTicket } from "@/app/actions/help-center";

type Ticket = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  category: string;
  message: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string | null;
  profiles?: { full_name?: string; email?: string; } | any;
};

export function SupportInbox({ tickets: initialTickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState<"all" | "abierto" | "resuelto" | "pending">("all");
  const [search, setSearch] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const filtered = tickets.filter((t) => {
    // Apply status filter
    if (filter === "abierto") return t.status?.toLowerCase() === "abierto" || t.status?.toLowerCase() === "pending";
    if (filter === "resuelto") return t.status?.toLowerCase() === "resuelto" || t.status?.toLowerCase() === "cerrado";
    if (filter === "pending") return t.status?.toLowerCase() !== "resuelto" && t.status?.toLowerCase() !== "cerrado";
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        t.id.toLowerCase().includes(searchLower) ||
        (t.profiles?.full_name || t.profiles?.[0]?.full_name)?.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.message?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedTickets.size === filtered.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(filtered.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedTickets);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTickets(newSet);
  };

  async function onDeleteTicket(id: string) {
    if (!window.confirm("¿Seguro que quieres eliminar este ticket?")) return;

    const originalTickets = [...tickets];
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setOpenDropdown(null);

    const res = await deleteTicket(id);
    if (!res.ok) {
      setTickets(originalTickets);
      alert(res.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-100 p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and respond to customer support requests</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="bg-gray-50 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                filter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                filter === "pending"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("resuelto")}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                filter === "resuelto"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Solved
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filter Button */}
          <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-left">
                <input
                  type="checkbox"
                  checked={selectedTickets.size > 0 && selectedTickets.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Ticket ID</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Requested By</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Create Date</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push('/backoffice/support/' + t.id)}
              >
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedTickets.has(t.id)}
                    onChange={() => toggleSelect(t.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-500 font-mono">#{t.id.slice(0, 8)}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{t.profiles?.full_name || t.profiles?.[0]?.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{t.profiles?.email || t.profiles?.[0]?.email || "—"}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-900 max-w-[240px] truncate">{t.category}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-600">{new Date(t.created_at).toLocaleDateString("es")}</p>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-1.5 rounded-full text-xs font-medium",
                      t.status?.toLowerCase() === "resuelto" || t.status?.toLowerCase() === "cerrado"
                        ? "bg-success-50 text-success-700"
                        : "bg-warning-50 text-warning-700"
                    )}
                  >
                    {t.status === "resuelto" || t.status === "cerrado" ? "Solved" : "Pending"}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === t.id ? null : t.id); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      aria-label="Open ticket"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openDropdown === t.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push('/backoffice/support/' + t.id); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          View More
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTicket(t.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No tickets found.</p>
        </div>
      )}
    </div>
  );
}
