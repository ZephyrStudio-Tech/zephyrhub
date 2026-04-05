"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";

export default function CuentaPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValid = newPassword.length >= 8 && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      toastError(error.message || "Error al cambiar la contraseña");
    } else {
      toastSuccess("Contraseña actualizada correctamente");
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tu configuración de cuenta y seguridad
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Cambiar contraseña</CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">
                  Actualiza tu contraseña de acceso
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Nueva contraseña
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="border-slate-200 focus:border-brand-500 focus:ring-brand-500"
                />
                {passwordTooShort && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    La contraseña debe tener al menos 8 caracteres
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="border-slate-200 focus:border-brand-500 focus:ring-brand-500"
                />
                {passwordMismatch && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
                {isValid && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Contraseña actualizada
                  </>
                ) : (
                  "Guardar nueva contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-400">
          Si olvidaste tu contraseña actual, contacta con soporte para restablecerla.
        </p>
      </div>
    </div>
  );
}
