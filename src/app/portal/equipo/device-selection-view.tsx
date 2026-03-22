"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  selectDevice,
  confirmOrder,
  resetDeviceSelection
} from "@/app/actions/device-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Package,
  Truck,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  MapPin,
  Smartphone,
  Loader2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type Device = {
  id: string;
  name: string;
  brand: string | null;
  specs: any;
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

export function DeviceSelectionView({
  catalog,
  order,
  selectedDevice
}: {
  catalog: Device[];
  order: DeviceOrder;
  selectedDevice: Device | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null);

  // States
  const isSelecting = order.status === "pendiente_seleccion";
  const isConfirming = order.status === "seleccionado" || order.status === "pago_pendiente";
  const isFinalized = ["pago_completado", "en_preparacion", "enviado", "entregado"].includes(order.status);

  async function handleSelect(deviceId: string) {
    startTransition(async () => {
      const res = await selectDevice(order.id, deviceId);
      if (res.ok) {
        setViewingDevice(null);
        router.refresh();
      } else alert(res.error);
    });
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const res = await confirmOrder(order.id, data);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  async function handleReset() {
    startTransition(async () => {
      const res = await resetDeviceSelection(order.id);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  // --- RENDERING ---

  if (isSelecting) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((device) => {
            const clientAportacion = Math.max(0, device.sale_price - device.bono_coverage);
            return (
              <Card key={device.id} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => setViewingDevice(device)}>
                <div className="relative h-48 bg-slate-100">
                  {device.images?.[0] ? (
                    <Image src={device.images[0]} alt={device.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Smartphone className="w-12 h-12" /></div>
                  )}
                  <div className="absolute top-2 right-2">
                    {clientAportacion === 0 ? (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Sin coste</span>
                    ) : (
                      <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Aportación: €{clientAportacion}</span>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-900 truncate">{device.name}</h3>
                  <p className="text-xs text-slate-500">{device.brand}</p>
                  <div className="flex gap-2 text-[10px] font-medium text-slate-600">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">{device.specs?.ram || '8GB'} RAM</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">{device.specs?.storage || '256GB'} SSD</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {viewingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="relative h-64 bg-slate-50 border-b">
                {viewingDevice.images?.[0] && <Image src={viewingDevice.images[0]} alt={viewingDevice.name} fill className="object-contain p-8" />}
                <button onClick={() => setViewingDevice(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">{viewingDevice.name}</h2>
                  <p className="text-brand-600 font-semibold">{viewingDevice.brand}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Especificaciones</p>
                      <ul className="space-y-1 text-slate-700">
                        {Object.entries(viewingDevice.specs || {}).map(([k, v]) => (
                          <li key={k} className="capitalize">· {k}: {String(v)}</li>
                        ))}
                      </ul>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Desglose de inversión</p>
                      <div className="flex justify-between"><span>Cobertura Bono:</span><span className="font-bold">€1.000</span></div>
                      <div className="flex justify-between"><span>Precio Equipo:</span><span className="font-bold text-slate-900">€{viewingDevice.sale_price}</span></div>
                      <div className="pt-2 border-t flex justify-between text-brand-600 font-bold"><span>Tu aportación:</span><span>€{Math.max(0, viewingDevice.sale_price - 1000)}</span></div>
                   </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Descripción</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{viewingDevice.description || 'Sin descripción disponible.'}</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setViewingDevice(null)}>Volver</Button>
                  <Button className="flex-1 bg-brand-600 hover:bg-brand-700 h-12" disabled={isPending} onClick={() => handleSelect(viewingDevice.id)}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    Elegir este equipo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (isConfirming && selectedDevice) {
    const aportacion = order.surcharge || 0;
    return (
      <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
           <Card className="border-slate-200 shadow-sm overflow-hidden">
             <CardHeader className="bg-slate-50/50 border-b">
               <CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-600" /> Dirección de envío</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <form id="shipping-form" onSubmit={handleConfirm} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo receptor *</Label>
                    <Input id="name" name="name" required placeholder="Ej: Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección de entrega *</Label>
                    <Input id="address" name="address" required placeholder="Calle, número, piso..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input id="city" name="city" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">Código Postal *</Label>
                      <Input id="zip" name="zip" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia *</Label>
                      <Input id="province" name="province" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono de contacto *</Label>
                      <Input id="phone" name="phone" required type="tel" />
                    </div>
                  </div>
               </form>
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-brand-100 shadow-md ring-1 ring-brand-50">
             <CardHeader className="border-b border-brand-50 bg-brand-50/20">
               <CardTitle className="text-base font-bold">Resumen del pedido</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="flex gap-4">
                   <div className="relative w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0">
                      {selectedDevice.images?.[0] && <Image src={selectedDevice.images[0]} alt="" fill className="object-cover rounded-lg" />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">{selectedDevice.name}</p>
                      <p className="text-xs text-slate-500">{selectedDevice.brand}</p>
                   </div>
                </div>

                <div className="space-y-2 pt-4 border-t text-sm">
                   <div className="flex justify-between text-slate-500"><span>Precio venta:</span><span>€{selectedDevice.sale_price}</span></div>
                   <div className="flex justify-between text-slate-500"><span>Cobertura Bono:</span><span className="text-emerald-600 font-medium">-€{selectedDevice.bono_coverage}</span></div>
                   <div className="flex justify-between font-bold text-lg pt-2 border-t text-slate-900">
                      <span>Total a pagar:</span>
                      <span>€{aportacion}</span>
                   </div>
                </div>

                {aportacion > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-3">
                     <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0" />
                     <p className="text-xs text-amber-800">Al confirmar, pasarás a la pasarela de pago para abonar los <strong>€{aportacion}</strong> de sobrecoste.</p>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <Button type="submit" form="shipping-form" className="w-full bg-brand-600 hover:bg-brand-700 h-12 text-lg shadow-lg shadow-brand-100" disabled={isPending}>
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (aportacion > 0 ? 'Pagar y confirmar' : 'Confirmar pedido')}
                  </Button>
                  <Button variant="ghost" className="w-full text-slate-400 text-xs" onClick={handleReset} disabled={isPending}>
                    Cambiar dispositivo
                  </Button>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isFinalized) {
    const steps = [
      { id: 'pago_completado', label: 'Pedido confirmado', icon: CheckCircle2 },
      { id: 'en_preparacion', label: 'En preparación', icon: Package },
      { id: 'enviado', label: 'Enviado', icon: Truck },
      { id: 'entregado', label: 'Entregado', icon: CheckCircle2 }
    ];

    const currentStepIdx = steps.findIndex(s => s.id === order.status);
    const activeStep = steps[currentStepIdx] || steps[0];

    return (
      <div className="max-w-3xl mx-auto space-y-8">
         <Card className="border-emerald-100 bg-emerald-50/30 overflow-hidden">
           <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                 <activeStep.icon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-slate-900">{activeStep.label}</h2>
                 <p className="text-slate-600">Tu equipo {selectedDevice?.name} está siguiendo su curso. {order.status === 'pago_completado' ? 'En breve comenzaremos la preparación.' : ''}</p>
              </div>
           </div>

           {/* Stepper */}
           <div className="px-8 pb-10">
              <div className="flex items-center justify-between relative">
                 <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2" />
                 <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 transition-all duration-700"
                    style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                 />

                 {steps.map((step, i) => {
                    const isPast = i < currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                         <div className={cn(
                            "w-5 h-5 rounded-full border-4 border-white transition-colors duration-500",
                            (isPast || isCurrent) ? "bg-emerald-500 shadow-sm" : "bg-slate-300"
                         )} />
                         <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            isCurrent ? "text-emerald-700" : "text-slate-400"
                         )}>{step.label}</span>
                      </div>
                    );
                 })}
              </div>
           </div>
         </Card>

         <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200 shadow-sm">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dispositivo</CardTitle>
               </CardHeader>
               <CardContent className="flex gap-4">
                  <div className="relative w-12 h-12 bg-slate-100 rounded flex-shrink-0">
                     {selectedDevice?.images?.[0] && <Image src={selectedDevice.images[0]} alt="" fill className="object-cover rounded" />}
                  </div>
                  <div>
                     <p className="font-bold text-slate-900 text-sm">{selectedDevice?.name}</p>
                     <p className="text-xs text-slate-500">{selectedDevice?.brand}</p>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Envío</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">{order.shipping_name}</p>
                  <p className="text-xs text-slate-500">{order.shipping_address}, {order.shipping_zip} {order.shipping_city}</p>
               </CardContent>
            </Card>
         </div>

         {(order.status === 'enviado' || order.status === 'entregado') && order.tracking_number && (
           <Card className="border-brand-200 bg-brand-50/50">
             <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm border border-brand-100 text-brand-600"><Truck className="w-6 h-6" /></div>
                   <div>
                      <p className="text-sm font-bold text-slate-900 tracking-tight">Sigue tu paquete</p>
                      <p className="text-xs text-slate-600">Localizador: <span className="font-mono font-bold uppercase">{order.tracking_number}</span></p>
                   </div>
                </div>
                {order.tracking_url && (
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="bg-white border-brand-200 text-brand-700 hover:bg-brand-100">Ver seguimiento</Button>
                  </a>
                )}
             </CardContent>
           </Card>
         )}

         <div className="flex justify-center gap-4">
            <Link href="/portal/soporte/tickets/nuevo?category=Incidencia técnica&message=Tengo una duda con mi pedido de dispositivo">
               <Button variant="ghost" className="text-slate-400 text-xs">¿Necesitas ayuda con tu pedido?</Button>
            </Link>
         </div>
      </div>
    );
  }

  return null;
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
