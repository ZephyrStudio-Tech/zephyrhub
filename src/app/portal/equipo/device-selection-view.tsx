"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  selectDevice,
  confirmOrder,
  resetDeviceSelection,
} from "@/app/actions/device-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Package,
  Truck,
  X,
  MapPin,
  Loader2,
  Monitor,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const BONO = 1000;

type Device = {
  id: string;
  name: string;
  brand: string | null;
  category?: string | null;
  specs: Record<string, string> | null;
  sale_price: number;
  bono_coverage: number;
  images: string[];
  description: string | null;
};

type DeviceOrder = {
  id: string;
  status: string;
  device_id: string | null;
  surcharge: number | null;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_zip?: string;
  shipping_phone?: string;
  tracking_number?: string;
  tracking_url?: string;
};

function youPay(device: Device) {
  return Math.max(0, device.sale_price - device.bono_coverage);
}

function formatEur(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 0 }) + " €";
}

// ── MODAL ──────────────────────────────────────────────────────────────────
function DeviceModal({
  device,
  onClose,
  onSelect,
  isPending,
}: {
  device: Device;
  onClose: () => void;
  onSelect: (id: string) => void;
  isPending: boolean;
}) {
  const you = youPay(device);
  const free = you === 0;
  const bono = Math.min(device.sale_price, device.bono_coverage);
  const specs = device.specs ? Object.entries(device.specs) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen */}
        <div className="relative h-56 bg-slate-50 border-b border-slate-100 flex items-center justify-center rounded-t-2xl">
          {device.images?.[0] ? (
            <Image
              src={device.images[0]}
              alt={device.name}
              fill
              className="object-contain p-10"
            />
          ) : (
            <Monitor className="w-20 h-20 text-slate-200" />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[11px] font-700 uppercase tracking-widest text-slate-400 mb-1">
              {device.brand}
            </p>
            <h2 className="text-xl font-bold text-slate-900">{device.name}</h2>
            {device.description && (
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {device.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Specs */}
            {specs.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Especificaciones
                </p>
                <div className="space-y-1.5">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-500 capitalize">{k}</span>
                      <span className="font-600 text-slate-800">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Precio */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">
                Desglose de precio
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Precio equipo</span>
                  <span className="font-600 text-blue-800">
                    {formatEur(device.sale_price)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Cobertura bono</span>
                  <span className="font-600 text-emerald-700">
                    −{formatEur(bono)}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-blue-700">Tu aportación</span>
                  <span
                    className={cn(
                      "text-lg font-bold",
                      free ? "text-emerald-600" : "text-slate-900"
                    )}
                  >
                    {free ? "Gratis" : formatEur(you)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!free && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Al elegir este equipo deberás abonar{" "}
              <strong>{formatEur(you)}</strong> de diferencia. Te informaremos
              del proceso de pago.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-500"
            >
              ← Volver
            </button>
            <button
              disabled={isPending}
              onClick={() => onSelect(device.id)}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {free
                ? "Elegir este equipo — Gratis"
                : `Elegir este equipo — ${formatEur(you)} tu parte`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CATALOG ────────────────────────────────────────────────────────────────
function CatalogView({
  catalog,
  order,
}: {
  catalog: Device[];
  order: DeviceOrder;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Device | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [filterCost, setFilterCost] = useState<"all" | "free" | "paid">("all");
  const [minRam, setMinRam] = useState(0);

  const filtered = useMemo(() => {
    let list = [...catalog];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.brand?.toLowerCase().includes(q)
      );
    }

    if (filterCost === "free") list = list.filter((d) => youPay(d) === 0);
    if (filterCost === "paid") list = list.filter((d) => youPay(d) > 0);

    if (minRam > 0) {
      list = list.filter((d) => {
        const ram = parseInt(String(d.specs?.ram || d.specs?.RAM || "0"));
        return ram >= minRam;
      });
    }

    if (sortBy === "price-asc") list.sort((a, b) => youPay(a) - youPay(b));
    if (sortBy === "price-desc") list.sort((a, b) => youPay(b) - youPay(a));
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [catalog, search, sortBy, filterCost, minRam]);

  function handleSelect(deviceId: string) {
    startTransition(async () => {
      const res = await selectDevice(order.id, deviceId);
      if (res.ok) {
        setSelected(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div>
      {/* Bono banner */}
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 text-sm text-emerald-800">
          Tu bono Kit Digital cubre hasta{" "}
          <strong className="font-bold">{formatEur(BONO)}</strong> del precio
          del equipo. Si eliges un modelo superior, solo pagas la diferencia.
        </div>
        <div className="flex-shrink-0 bg-emerald-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
          Bono: {formatEur(BONO)}
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar filtros */}
        <aside className="w-52 flex-shrink-0 bg-white border border-slate-200 rounded-xl p-4 sticky top-4 space-y-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
          </p>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm h-8 border-slate-200"
            />
          </div>

          {/* Coste */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Coste para ti
            </p>
            <div className="space-y-1.5">
              {(
                [
                  { value: "all", label: "Todos" },
                  { value: "free", label: "Sin coste" },
                  { value: "paid", label: "Con aportación" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cost"
                    value={opt.value}
                    checked={filterCost === opt.value}
                    onChange={() => setFilterCost(opt.value)}
                    className="accent-blue-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* RAM */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              RAM mínima
            </p>
            <div className="space-y-1.5">
              {[0, 8, 16, 32].map((ram) => (
                <label
                  key={ram}
                  className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="ram"
                    value={ram}
                    checked={minRam === ram}
                    onChange={() => setMinRam(ram)}
                    className="accent-blue-500"
                  />
                  {ram === 0 ? "Cualquiera" : `${ram} GB o más`}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setFilterCost("all");
              setMinRam(0);
              setSortBy("default");
            }}
            className="w-full text-xs text-slate-400 border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Sort row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-800">{filtered.length}</span>{" "}
              equipos disponibles
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="default">Ordenar por relevancia</option>
              <option value="price-asc">Menor aportación primero</option>
              <option value="price-desc">Mayor aportación primero</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No hay equipos que coincidan con los filtros.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilterCost("all");
                  setMinRam(0);
                }}
                className="mt-3 text-blue-500 text-sm underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((device) => {
                const you = youPay(device);
                const free = you === 0;
                const specs = device.specs
                  ? Object.entries(device.specs).slice(0, 3)
                  : [];

                return (
                  <div
                    key={device.id}
                    onClick={() => setSelected(device)}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150"
                  >
                    {/* Imagen */}
                    <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                      {device.images?.[0] ? (
                        <Image
                          src={device.images[0]}
                          alt={device.name}
                          fill
                          className="object-contain p-6"
                        />
                      ) : (
                        <Monitor className="w-12 h-12 text-slate-200" />
                      )}
                      <div
                        className={cn(
                          "absolute top-2 right-2 text-[11px] font-bold px-2.5 py-1 rounded-full",
                          free
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        )}
                      >
                        {free ? "Sin coste" : `+${formatEur(you)}`}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        {device.brand}
                      </p>
                      <p className="text-sm font-bold text-slate-900 leading-snug mb-2">
                        {device.name}
                      </p>

                      {specs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {specs.map(([, v]) => (
                            <span
                              key={String(v)}
                              className="text-[11px] bg-slate-100 text-slate-500 rounded-md px-1.5 py-0.5 font-500"
                            >
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400">
                            Tu aportación
                          </p>
                          <p
                            className={cn(
                              "text-base font-bold",
                              free ? "text-emerald-600" : "text-slate-900"
                            )}
                          >
                            {free ? "Gratis" : formatEur(you)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">PVP</p>
                          <p className="text-sm text-slate-400 line-through">
                            {formatEur(device.sale_price)}
                          </p>
                        </div>
                      </div>

                      <button className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                        Ver detalles
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <DeviceModal
          device={selected}
          onClose={() => setSelected(null)}
          onSelect={handleSelect}
          isPending={isPending}
        />
      )}
    </div>
  );
}

// ── CONFIRM SHIPPING ───────────────────────────────────────────────────────
function ConfirmView({
  order,
  selectedDevice,
}: {
  order: DeviceOrder;
  selectedDevice: Device;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const aportacion = order.surcharge ?? 0;

  function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await confirmOrder(order.id, data);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function handleReset() {
    startTransition(async () => {
      const res = await resetDeviceSelection(order.id);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  return (
    <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-5">
      {/* Formulario envío */}
      <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <MapPin className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-slate-700">
            Dirección de envío
          </h2>
        </div>
        <form id="shipping-form" onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Nombre completo receptor *
            </Label>
            <Input id="name" name="name" required placeholder="Ej: Juan Pérez García" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Dirección de entrega *
            </Label>
            <Input id="address" name="address" required placeholder="Calle, número, piso..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ciudad *</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Código postal *</Label>
              <Input id="zip" name="zip" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="province" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Provincia *</Label>
              <Input id="province" name="province" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono *</Label>
              <Input id="phone" name="phone" required type="tel" />
            </div>
          </div>
        </form>
      </div>

      {/* Resumen pedido */}
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-700">Resumen del pedido</h2>
          </div>
          <div className="p-5 space-y-5">
            {/* Device preview */}
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {selectedDevice.images?.[0] ? (
                  <Image src={selectedDevice.images[0]} alt="" fill className="object-contain p-1" />
                ) : (
                  <Monitor className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedDevice.name}</p>
                <p className="text-xs text-slate-400">{selectedDevice.brand}</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
              <div className="flex justify-between text-slate-500">
                <span>Precio del equipo</span>
                <span>{formatEur(selectedDevice.sale_price)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Cobertura bono</span>
                <span>−{formatEur(selectedDevice.bono_coverage)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200 text-slate-900">
                <span>Total a pagar</span>
                <span>{aportacion > 0 ? formatEur(aportacion) : "Gratis"}</span>
              </div>
            </div>

            {aportacion > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                Al confirmar pasarás a la pasarela de pago para abonar los{" "}
                <strong>{formatEur(aportacion)}</strong> de sobrecoste.
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                form="shipping-form"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {aportacion > 0 ? "Pagar y confirmar pedido" : "Confirmar pedido"}
              </Button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cambiar dispositivo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TRACKING ───────────────────────────────────────────────────────────────
function TrackingView({
  order,
  selectedDevice,
}: {
  order: DeviceOrder;
  selectedDevice: Device | null;
}) {
  const steps = [
    { id: "pago_completado", label: "Pedido confirmado", icon: CheckCircle2 },
    { id: "en_preparacion", label: "En preparación", icon: Package },
    { id: "enviado", label: "En camino", icon: Truck },
    { id: "entregado", label: "Entregado", icon: CheckCircle2 },
  ];
  const currentIdx = steps.findIndex((s) => s.id === order.status);
  const activeStep = steps[currentIdx] || steps[0];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status hero */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-8 text-center">
          <div
            className={cn(
              "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
              order.status === "entregado"
                ? "bg-emerald-100"
                : "bg-blue-50"
            )}
          >
            <ActiveIcon
              className={cn(
                "w-8 h-8",
                order.status === "entregado"
                  ? "text-emerald-600"
                  : "text-blue-500"
              )}
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {activeStep.label}
          </h2>
          {selectedDevice && (
            <p className="text-sm text-slate-500">
              {selectedDevice.name}
            </p>
          )}
        </div>

        {/* Stepper */}
        <div className="px-8 pb-8">
          <div className="flex items-center relative">
            {/* Track */}
            <div className="absolute left-0 right-0 top-2.5 h-0.5 bg-slate-200" />
            <div
              className="absolute left-0 top-2.5 h-0.5 bg-emerald-500 transition-all duration-700"
              style={{
                width: `${(currentIdx / (steps.length - 1)) * 100}%`,
              }}
            />
            {steps.map((step, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className="flex-1 flex flex-col items-center gap-2 relative z-10"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-colors",
                      done || current
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    )}
                  >
                    {(done || current) && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold text-center leading-tight",
                      current
                        ? "text-emerald-700"
                        : done
                          ? "text-slate-500"
                          : "text-slate-300"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        {selectedDevice && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Dispositivo
            </p>
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0">
                {selectedDevice.images?.[0] ? (
                  <Image src={selectedDevice.images[0]} alt="" fill className="object-contain p-1" />
                ) : (
                  <Monitor className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  {selectedDevice.name}
                </p>
                <p className="text-xs text-slate-400">{selectedDevice.brand}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Envío
          </p>
          <p className="text-sm font-bold text-slate-800">{order.shipping_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {order.shipping_address}, {order.shipping_zip} {order.shipping_city}
          </p>
        </div>
      </div>

      {/* Tracking */}
      {(order.status === "enviado" || order.status === "entregado") &&
        order.tracking_number && (
          <div className="bg-white border border-blue-200 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Sigue tu paquete
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Localizador:{" "}
                  <span className="font-mono font-bold uppercase">
                    {order.tracking_number}
                  </span>
                </p>
              </div>
            </div>
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  Ver seguimiento
                </Button>
              </a>
            )}
          </div>
        )}

      <div className="text-center">
        <Link
          href="/portal/soporte/tickets/nuevo"
          className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
        >
          ¿Necesitas ayuda con tu pedido?
        </Link>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export function DeviceSelectionView({
  catalog,
  order,
  selectedDevice,
}: {
  catalog: Device[];
  order: DeviceOrder;
  selectedDevice: Device | null;
}) {
  const isSelecting = order.status === "pendiente_seleccion";
  const isConfirming =
    order.status === "seleccionado" || order.status === "pago_pendiente";
  const isFinalized = [
    "pago_completado",
    "en_preparacion",
    "enviado",
    "entregado",
  ].includes(order.status);

  if (isSelecting) {
    return <CatalogView catalog={catalog} order={order} />;
  }

  if (isConfirming && selectedDevice) {
    return <ConfirmView order={order} selectedDevice={selectedDevice} />;
  }

  if (isFinalized) {
    return <TrackingView order={order} selectedDevice={selectedDevice} />;
  }

  return null;
}