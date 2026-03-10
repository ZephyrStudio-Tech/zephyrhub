"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LOGO_URL = "https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data: authData, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const role = profile?.role;
    setLoading(false);
    router.refresh();
    if (role === "admin") router.push("/backoffice");
    else if (role === "consultor" || role === "tecnico") router.push("/backoffice");
    else router.push("/portal");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left Panel - Brand */}
      <div
        className={`flex flex-col items-center justify-center p-8 bg-white border-r border-gray-200 transition-all duration-[900ms] ease-in-out ${
          isSplit ? "w-0 md:w-[40%] opacity-0 md:opacity-100" : "w-full"
        }`}
      >
        {!isSplit && (
          <div className="max-w-md text-center">
            <img
              src={LOGO_URL}
              alt="ZephyrHub"
              className="h-12 w-auto mb-8 mx-auto"
            />
            <h1 className="text-5xl font-bold mb-6 leading-tight text-gray-900">
              ZephyrOS
            </h1>
            <p className="text-lg mb-12 text-gray-500">
              Centro de operaciones integral para consultores y empresas
            </p>
            <Button
              onClick={() => setIsSplit(true)}
              size="lg"
              className="w-full"
            >
              Iniciar sesión
            </Button>
          </div>
        )}
      </div>

      {/* Right Panel - Form */}
      <div
        className={`flex flex-col items-center justify-center flex-1 p-8 bg-gray-50 transition-all duration-[900ms] ease-in-out ${
          isSplit ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
      >
        {isSplit && (
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">ZephyrOS</CardTitle>
                <CardDescription>Iniciar sesión</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="text-sm text-gray-600 mb-2 block">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="text-sm text-gray-600 mb-2 block">
                      Contraseña
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setIsSplit(false)}
            >
              ← Volver al inicio
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

