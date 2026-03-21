"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard, Users, User, LogOut } from "lucide-react";

const NAV = [
  { href: "/asociado", label: "Dashboard", icon: LayoutDashboard },
  { href: "/asociado/referidos", label: "Mis referidos", icon: Users },
  { href: "/asociado/perfil", label: "Mi perfil", icon: User },
];

export function AssociateSidebar({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 lg:hidden h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Link href="/asociado" className="flex items-center gap-2">
          <img
            src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
            alt="ZephyrHub"
            className="h-8 w-auto"
          />
        </Link>
        <div className="w-10" />
      </header>

      {/* Sidebar Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed left-0 top-16 lg:top-0 bottom-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 lg:sticky lg:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="hidden lg:flex h-16 items-center border-b border-slate-200 px-6">
            <Link href="/asociado" className="flex items-center gap-2">
              <img
                src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
                alt="ZephyrHub"
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/asociado" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="px-4 mb-4">
              <p className="truncate text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {userLabel}
              </p>
              <p className="text-[10px] text-brand-600 font-medium mt-0.5">Asociado Partner</p>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
