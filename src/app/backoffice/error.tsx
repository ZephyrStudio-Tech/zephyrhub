"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackofficeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Backoffice Error]", error);
  }, [error]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar placeholder */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900" />

      {/* Error content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Algo ha salido mal
          </h1>

          <p className="text-slate-600 mb-6">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo o
            contacta con soporte si el problema persiste.
          </p>

          {error.digest && (
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/backoffice")}
              className="border-slate-300"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
