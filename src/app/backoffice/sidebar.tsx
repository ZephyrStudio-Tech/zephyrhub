"use client";

import { useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import NextLink from "next/link";

type Role = "admin" | "consultor" | "tecnico";

const NAV = {
  admin: [
    { href: "/backoffice/dashboard", label: "Dashboard" },
    { href: "/backoffice/preconsultoria", label: "Preconsultoría" },
    { href: "/backoffice/consultoria", label: "Consultoría" },
    { href: "/backoffice/support", label: "Soporte" },
    { href: "/backoffice/academy", label: "Academia" },
    { href: "/backoffice/tech", label: "Evidencias" },
    { href: "/backoffice/devices", label: "Catálogo" },
    { href: "/backoffice/logs", label: "Logs" },
    { href: "/backoffice/assign", label: "Asignar consultores" },
    { href: "/backoffice/asociados", label: "Asociados" },
    { href: "/backoffice/referidos", label: "Referidos" },
  ],
  consultor: [
    { href: "/backoffice/preconsultoria", label: "Preconsultoría" },
    { href: "/backoffice/consultoria", label: "Consultoría" },
    { href: "/backoffice/support", label: "Soporte" },
    { href: "/backoffice/asociados", label: "Asociados" },
    { href: "/backoffice/referidos", label: "Referidos" },
  ],
  tecnico: [
    { href: "/backoffice/preconsultoria", label: "Preconsultoría" },
    { href: "/backoffice/consultoria", label: "Consultoría" },
    { href: "/backoffice/support", label: "Soporte" },
    { href: "/backoffice/tech", label: "Evidencias" },
  ],
} as const;

export function Sidebar({ role, userLabel }: { role: Role; userLabel: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = NAV[role] ?? NAV.consultor;

  return (
    <>
      {/* Mobile Header - visible only on small screens */}
      <header className="fixed top-0 left-0 right-0 lg:hidden h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <NextLink href="/backoffice/preconsultoria" className="flex items-center gap-2">
          <img
            src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
            alt="ZephyrHub"
            className="h-8 w-auto"
          />
        </NextLink>
        <div className="w-10" />
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar: drawer on mobile, fixed on desktop */}
      <aside
        className={cn(
          "fixed left-0 top-16 lg:top-0 bottom-0 z-40 w-64 flex-shrink-0 border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:translate-x-0 lg:sticky lg:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Desktop Header */}
          <div className="hidden lg:flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
        <NextLink href="/backoffice/preconsultoria" className="flex items-center gap-2">
          <img
            src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
            alt="ZephyrHub"
            className="h-8 w-auto"
          />
        </NextLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
            {links.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/backoffice/dashboard" && pathname.startsWith(item.href + "/"));
              return (
                <NextLink
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
                </NextLink>
              );
            })}
          </nav>

          {/* User Section */}
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
        </div>
      </aside>
    </>
  );
}
