"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// --- Efecto de descifrado para los logs ---
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    timeout = setTimeout(() => {
      let iterations = 0;
      const max = 15; // Velocidad del descifrado
      const interval = setInterval(() => {
        let scrambled = "";
        for (let i = 0; i < text.length; i++) {
          if (i < (iterations / max) * text.length) {
            scrambled += text[i];
          } else {
            scrambled += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplay(scrambled);
        iterations++;
        if (iterations >= max) {
          clearInterval(interval);
          setDisplay(text);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <span>{display}</span>;
}

// --- Componente Principal ---
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estados de la UI y del Formulario
  const [screen, setScreen] = useState<"intro" | "login" | "loading">("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Estados para la animación final
  const [logs, setLogs] = useState<{ id: number; text: string; type?: string }[]>([]);
  const [flash, setFlash] = useState(false);

  // Función que mezcla la animación con la lógica de Supabase
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setScreen("loading");
    setLogs([]);

    // 1. Mostrar logs iniciales falsos para crear ambiente
    setTimeout(() => {
      setLogs((p) => [...p, { id: 1, text: "Estableciendo conexión segura..." }]);
    }, 0);
    setTimeout(() => {
      setLogs((p) => [...p, { id: 2, text: "Verificando credenciales de usuario..." }]);
    }, 800);

    // 2. Ejecutar la llamada real a Supabase mientras el usuario ve la animación
    setTimeout(async () => {
      const { data: authData, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Si hay error, mostrarlo en la terminal y volver al login
      if (err) {
        setLogs((p) => [...p, { id: 3, text: `ERROR: ${err.message}`, type: "error" }]);
        setTimeout(() => {
          setScreen("login");
          setError("Credenciales incorrectas o error de acceso.");
        }, 2500);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) return;

      // Si hay éxito, continuar la secuencia visual
      setLogs((p) => [...p, { id: 4, text: "Token JWT validado.", type: "highlight" }]);

      setTimeout(async () => {
        setLogs((p) => [...p, { id: 5, text: "Cargando políticas de entorno de trabajo..." }]);

        // 3. Comprobar el rol del usuario
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        const role = profile?.role;

        setTimeout(() => {
          setLogs((p) => [
            ...p,
            { id: 6, text: `Acceso concedido [Rol: ${role?.toUpperCase() || 'USER'}]. Redirigiendo...`, type: "success" }
          ]);

          // 4. Activar Flashbang y redirigir a la ruta correcta
          setTimeout(() => {
            setFlash(true);
            setTimeout(() => {
              router.refresh();
              if (role === "admin" || role === "consultor" || role === "tecnico") {
                router.push("/backoffice");
              } else {
                router.push("/portal");
              }
            }, 600); // Tiempo del flash blanco/negro
          }, 1200);
        }, 800);
      }, 800);
    }, 1600);
  }

  return (
    <div className="login-wrapper">
      {/* Fondos Decorativos */}
      <div className="dot-pattern" />
      <div className="ambient-glow" />
      <div id="flashbang" className={cn(flash && "explode")} />

      {/* PANTALLA 1: INTRO */}
      <div className={cn("login-screen", screen === "intro" && "active")}>
        <img
          src="https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png"
          alt="ZephyrHUB"
          className="logo-mark"
        />
        <h1 className="intro-title">ZephyrHUB</h1>
        <p className="intro-desc">
          Centro de operaciones unificado. Acceso exclusivo para consultores y gestión
          de expedientes.
        </p>
        <button className="btn-clean" onClick={() => setScreen("login")}>
          INICIALIZAR SISTEMA
        </button>
      </div>

      {/* PANTALLA 2: LOGIN FORM */}
      <div className={cn("login-screen", screen === "login" && "active")}>
        <div className="glass-card">
          <div className="login-header">
            <h2>Identidad Requerida</h2>
          </div>
          <form onSubmit={handleAuth}>
            <div className="input-wrapper">
              <label>Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@zephyrstudio.es"
                autoComplete="off"
              />
            </div>
            <div className="input-wrapper">
              <label>Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs font-medium text-center mt-2 bg-red-900/20 py-2 rounded-lg border border-red-900/50">
                {error}
              </p>
            )}
            <button type="submit" className="btn-auth">
              Autorizar Acceso
            </button>
          </form>
        </div>
      </div>

      {/* PANTALLA 3: CARGA / HUD */}
      <div className={cn("login-screen", screen === "loading" && "active")}>
        <div className="loader-layout">
          {/* HUD Circular Limpio */}
          <div className="minimal-rings">
            <div className="ring ring-outer" />
            <div className="ring ring-inner" />
            <div className="ring ring-core" />
            <div className="status-text">AUTH</div>
          </div>

          {/* Terminal Elegante */}
          <div className="clean-terminal">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "log-line",
                  log.type === "success" && "log-success",
                  log.type === "error" && "text-red-500",
                  log.type === "highlight" && "log-highlight"
                )}
              >
                <ScrambleText text={log.text} delay={0} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}