"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleDeviceAvailability } from "@/app/actions/device-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";

export type Device = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  description: string | null;
  specs: {
    ram?: string;
    storage?: string;
    screen?: string;
    processor?: string;
  } | null;
  cost_price: number;
  sale_price: number;
  bono_coverage: number;
  stock: number | null;
  is_available: boolean;
  images: string[];
  created_at: string;
};

function getMargin(salePrice: number, costPrice: number, bonoCoverage: number): number {
  return Math.max(salePrice, bonoCoverage) - costPrice;
}

function getClientCost(salePrice: number, bonoCoverage: number): number {
  const cost = salePrice - bonoCoverage;
  return Math.max(0, cost);
}

export function ArchivedDevicesCatalog({ devices: initialDevices }: { devices: Device[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRestore = (deviceId: string) => {
    startTransition(async () => {
      const res = await toggleDeviceAvailability(deviceId, true);
      if (res.ok) {
        toastSuccess("Dispositivo restaurado");
        router.refresh();
      } else {
        toastError(res.error || "Error al restaurar dispositivo");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Devices Grid */}
      {initialDevices.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">La papelera está vacía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialDevices.map((device) => {
            const margin = getMargin(device.sale_price, device.cost_price, device.bono_coverage);
            const clientCost = getClientCost(device.sale_price, device.bono_coverage);
            const totalRevenue = Math.max(device.sale_price, device.bono_coverage);
            const mainImage = device.images?.[0];

            return (
              <Card
                key={device.id}
                className="overflow-hidden hover:shadow-lg transition-shadow opacity-60 hover:opacity-100"
              >
                <div className="relative h-48 bg-gray-200 dark:bg-slate-600">
                  {mainImage ? (
                    <Image
                      src={mainImage}
                      alt={device.name}
                      fill
                      className="object-cover grayscale"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                <CardHeader>
                  <CardTitle className="text-lg text-gray-600 dark:text-gray-400">{device.name}</CardTitle>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {device.brand && device.model
                      ? `${device.brand} ${device.model}`
                      : device.brand || device.model || "—"}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Categoría:</span> {device.category}
                    </p>
                    {device.description && (
                      <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                        {device.description}
                      </p>
                    )}
                  </div>

                  {device.specs && Object.values(device.specs).some((v) => v) && (
                    <div className="text-xs space-y-1 bg-gray-100 dark:bg-slate-800/50 p-2 rounded text-gray-500">
                      {device.specs.ram && <p>📱 RAM: {device.specs.ram}</p>}
                      {device.specs.storage && <p>💾 Storage: {device.specs.storage}</p>}
                      {device.specs.screen && <p>🖥️ Pantalla: {device.specs.screen}</p>}
                      {device.specs.processor && <p>⚙️ Procesador: {device.specs.processor}</p>}
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Coste:</span>
                      <span className="font-medium">€{device.cost_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Precio venta:</span>
                      <span className="font-medium">€{device.sale_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Bono cubre:</span>
                      <span className="font-medium">€{device.bono_coverage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Cliente paga:</span>
                      <span className={cn("font-medium", clientCost > 0 ? "text-amber-600" : "text-slate-400")}>
                        {clientCost > 0 ? `€${clientCost.toFixed(2)}` : "Sin coste"}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-1 mt-1 text-gray-600">
                      <span className="font-medium">Ingreso total:</span>
                      <span className="font-bold">€{totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between bg-gray-100 dark:bg-slate-800/50 p-2 rounded mt-2 text-gray-600">
                      <span className="font-bold">Margen neto:</span>
                      <span className={cn("font-bold", margin >= 0 ? "text-emerald-700" : "text-red-600")}>
                        €{margin.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      size="sm"
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleRestore(device.id)}
                      disabled={isPending}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
