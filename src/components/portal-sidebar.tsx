"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortalSidebar({ hasDevice }: { hasDevice?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/portal", label: "Inicio" },
    ...(hasDevice ? [{ href: "/portal/equipo", label: "Mi equipo" }] : []),
    { href: "/portal/soporte", label: "Centro de Ayuda" },
    { href: "/portal/cuenta", label: "Mi cuenta" },
  ];

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200">
        <Link href="/portal" className="flex items-center gap-2">
          <img
            src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
            alt="ZephyrHub"
            className="h-8 w-auto"
          />
        </Link>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 md:hidden h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4 gap-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <Link href="/portal" className="flex items-center gap-2">
          <img
            src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
            alt="ZephyrHub"
            className="h-8 w-auto"
          />
        </Link>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 z-20 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:w-64 md:flex-col bg-white border-r border-gray-200">
        {sidebarContent}
      </aside>
    </>
  );
}
