"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Portal Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Ha ocurrido un error
        </h1>

        <p className="text-slate-600 mb-6">
          Lo sentimos, algo no ha funcionado correctamente. Por favor, intenta
          de nuevo.
        </p>

        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-50 py-2 px-3 rounded-lg">
            Referencia: {error.digest}
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
            onClick={() => (window.location.href = "/portal")}
            className="border-slate-200"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
