"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDevice, updateDevice, toggleDeviceAvailability } from "@/app/actions/device-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import Image from "next/image";

type Device = {
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
  available: boolean;
  images: string[];
  created_at: string;
};

const CATEGORIES = ["Portátil", "Móvil", "Tablet", "Sobremesa", "Otro"];

function getMargin(salePrice: number, costPrice: number): number {
  return salePrice - costPrice;
}

function getClientCost(salePrice: number, bonoCoverage: number): number {
  const cost = salePrice - bonoCoverage;
  return Math.max(0, cost);
}

function DeviceForm({
  device,
  onSubmit,
  onCancel,
  isPending,
}: {
  device?: Device;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    model: string;
    category: string;
    description: string;
    specs: { ram?: string; storage?: string; screen?: string; processor?: string };
    cost_price: number;
    sale_price: number;
    bono_coverage: number;
    stock: number;
    available: boolean;
    images: string[];
  }>(
    device ? {
      name: device.name,
      brand: device.brand || "",
      model: device.model || "",
      category: device.category,
      description: device.description || "",
      specs: device.specs || {},
      cost_price: device.cost_price,
      sale_price: device.sale_price,
      bono_coverage: device.bono_coverage,
      stock: device.stock || 0,
      available: device.available,
      images: device.images,
    } : {
      name: "",
      brand: "",
      model: "",
      category: "Portátil",
      description: "",
      specs: {},
      cost_price: 0,
      sale_price: 0,
      bono_coverage: 1000,
      stock: 0,
      available: true,
      images: [],
    }
  );
  const [imagesText, setImagesText] = useState(
    (device?.images || []).join("\n")
  );

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpecsChange = (spec: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specs: { ...(prev.specs || {}), [spec]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const images = imagesText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    onSubmit({
      ...formData,
      images,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Marca
          </label>
          <input
            type="text"
            value={formData.brand || ""}
            onChange={(e) => handleChange("brand", e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Modelo
          </label>
          <input
            type="text"
            value={formData.model || ""}
            onChange={(e) => handleChange("model", e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoría
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={isPending}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Especificaciones
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              RAM
            </label>
            <input
              type="text"
              placeholder="ej: 8GB"
              value={formData.specs?.ram || ""}
              onChange={(e) => handleSpecsChange("ram", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Almacenamiento
            </label>
            <input
              type="text"
              placeholder="ej: 256GB SSD"
              value={formData.specs?.storage || ""}
              onChange={(e) => handleSpecsChange("storage", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Pantalla
            </label>
            <input
              type="text"
              placeholder="ej: 15.6 pulgadas"
              value={formData.specs?.screen || ""}
              onChange={(e) => handleSpecsChange("screen", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Procesador
            </label>
            <input
              type="text"
              placeholder="ej: Intel i7"
              value={formData.specs?.processor || ""}
              onChange={(e) => handleSpecsChange("processor", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio de coste (€)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.cost_price}
            onChange={(e) => handleChange("cost_price", parseFloat(e.target.value))}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio de venta (€)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.sale_price}
            onChange={(e) => handleChange("sale_price", parseFloat(e.target.value))}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cobertura del bono (€)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.bono_coverage}
            onChange={(e) => handleChange("bono_coverage", parseFloat(e.target.value))}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stock
          </label>
          <input
            type="number"
            value={formData.stock || 0}
            onChange={(e) => handleChange("stock", parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={formData.available}
          onChange={(e) => handleChange("available", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          disabled={isPending}
        />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Disponible
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          URLs de imágenes (una por línea)
        </label>
        <textarea
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          rows={4}
          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {device ? "Actualizar" : "Crear"} dispositivo
        </Button>
      </div>
    </form>
  );
}

export function DevicesCatalog({ devices: initialDevices }: { devices: Device[] }) {
  const router = useRouter();
  const [devices, setDevices] = useState(initialDevices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (data: any) => {
    startTransition(async () => {
      const res = await createDevice(data);
      if (res.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleUpdate = (data: any) => {
    if (!editingId) return;
    startTransition(async () => {
      const res = await updateDevice(editingId, data);
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleToggleAvailability = (deviceId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleDeviceAvailability(deviceId, !currentStatus);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const editingDevice = editingId ? devices.find((d) => d.id === editingId) : null;

  return (
    <div className="space-y-6">
      {/* New Device Button */}
      {!showForm && !editingId && (
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          Nuevo dispositivo
        </Button>
      )}

      {/* Form */}
      {(showForm || editingId) && (
        <DeviceForm
          device={editingDevice}
          onSubmit={editingId ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          isPending={isPending}
        />
      )}

      {/* Devices Grid */}
      {devices.length === 0 && !showForm && !editingId ? (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay dispositivos en el catálogo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const margin = getMargin(device.sale_price, device.cost_price);
            const clientCost = getClientCost(device.sale_price, device.bono_coverage);
            const mainImage = device.images?.[0];

            return (
              <Card key={device.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-100 dark:bg-slate-700">
                  {mainImage ? (
                    <Image
                      src={mainImage}
                      alt={device.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {device.available ? "Disponible" : "No disponible"}
                    </span>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {device.brand && device.model
                      ? `${device.brand} ${device.model}`
                      : device.brand || device.model || "—"}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Categoría:</span> {device.category}
                    </p>
                    {device.description && (
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                        {device.description}
                      </p>
                    )}
                  </div>

                  {device.specs && Object.values(device.specs).some((v) => v) && (
                    <div className="text-xs space-y-1 bg-gray-50 dark:bg-slate-800/50 p-2 rounded">
                      {device.specs.ram && <p>📱 RAM: {device.specs.ram}</p>}
                      {device.specs.storage && <p>💾 Storage: {device.specs.storage}</p>}
                      {device.specs.screen && <p>🖥️ Pantalla: {device.specs.screen}</p>}
                      {device.specs.processor && <p>⚙️ Procesador: {device.specs.processor}</p>}
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Coste:</span>
                      <span className="font-medium">€{device.cost_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Venta:</span>
                      <span className="font-medium">€{device.sale_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Margen:</span>
                      <span className={`font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        €{margin.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bono cubre:</span>
                      <span className="font-medium">€{device.bono_coverage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Cliente paga:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        €{clientCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {device.stock !== null && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Stock:</span> {device.stock} unidades
                    </p>
                  )}

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setEditingId(device.id)}
                      disabled={isPending}
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={device.available ? "outline" : "default"}
                      className="flex-1 gap-2"
                      onClick={() => handleToggleAvailability(device.id, device.available)}
                      disabled={isPending}
                    >
                      {device.available ? (
                        <>
                          <X className="w-4 h-4" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Activar
                        </>
                      )}
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
