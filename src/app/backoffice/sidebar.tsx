"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "admin" | "consultor" | "tecnico";

const NAV = {
  admin: [
    { href: "/backoffice/preconsultoria", label: "Preconsultoría" },
    { href: "/backoffice/consultoria", label: "Consultoría" },
    { href: "/backoffice/tech", label: "Evidencias" },
    { href: "/backoffice/logs", label: "Logs" },
    { href: "/backoffice/assign", label: "Asignar consultores" },
  ],
  consultor: [
    { href: "/backoffice/preconsultoria", label: "Preconsultoría" },
    { href: "/backoffice/consultoria", label: "Consultoría" },
  ],
  tecnico: [
    { href: "/backoffice/preconsultoria", label: "Preconsultoría" },
    { href: "/backoffice/consultoria", label: "Consultoría" },
    { href: "/backoffice/tech", label: "Evidencias" },
  ],
} as const;

export function Sidebar({ role, userLabel }: { role: Role; userLabel: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = NAV[role] ?? NAV.consultor;

  const nav = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
        <Link href="/backoffice/preconsultoria" className="font-bold text-slate-900 dark:text-white">
          Zephyr<span className="text-primary">OS</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
        {links.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <p className="truncate px-4 text-xs text-slate-500 dark:text-slate-400">
          {userLabel}
        </p>
        <form action={signOut} className="mt-2">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-slate-600 dark:text-slate-400">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Botón menú móvil */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Overlay móvil */}
      <div
        role="presentation"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      {/* Sidebar: drawer en móvil, fijo en desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-200 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {nav}
        </div>
      </aside>
    </>
  );
}
