
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/login/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image'
import HeroWms from '../../../../public/assets/login/hero.svg'
import WmsLoading from '../../../../public/assets/login/wms-loading.gif'



export default function LoginPage() {
  const router = useRouter();
  const [strUsuario, setStrUsuario] = React.useState("");
  const [strContra, setStrContra] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [show, setShow] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!strUsuario.trim() || !strContra) {
      setError("Escribe tu usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strUsuario: strUsuario.trim(), strContra }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(json.error || "Credenciales inválidas");
        return;
      }

      const { roleScope, warehouseIds } = json as {
        roleScope: "COMPANY" | "WAREHOUSE";
        warehouseIds: string[];
      };

      if (roleScope === "COMPANY") {
        router.push("/dashboard");
      } else if (warehouseIds?.length) {
        router.push(`/dashboard?warehouse=${encodeURIComponent(String(warehouseIds[0]))}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("No fue posible iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-xl overflow-hidden border bg-background shadow-sm">
        {/* Columna imagen/GIF decorativo */}
        <div className="relative hidden md:block bg-muted">
         <Image
            src={WmsLoading}
            width={640}
            height={360}
            loading="lazy"
            priority={false} 
            alt="Imagen decorativa de almacén"
            className="w-full h-full object-cover select-none pointer-events-none"
          />
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/80">
            Esymbel WMS
          </div>
        </div>

        {/* Columna formulario (con overlay de loading) */}
        <div className="relative p-6 md:p-10">
          {/* 🔸 Overlay de LOADING */}
          {loading && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-background/70 backdrop-blur-sm">
              <div className="grid place-items-center">
                <Image
                  src={WmsLoading}
                  width={320}
                  height={180}
                  alt="Cargando…"
                  loading="lazy"
                  priority={false} 
                  className="mx-auto select-none pointer-events-none drop-shadow"
                />
                <p className="mt-2 text-sm text-muted-foreground tracking-widest">CARGANDO…</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-semibold mb-1">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground mb-6">Accede a tu almacén</p>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Usuario o correo</label>
              <input
                className="border rounded-md px-3 h-10 bg-background"
                value={strUsuario}
                onChange={(e) => setStrUsuario(e.target.value)}
                placeholder="usuario@empresa.com"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Contraseña</label>
              <div className="flex gap-2">
                <input
                  className="border rounded-md px-3 h-10 flex-1 bg-background"
                  type={show ? "text" : "password"}
                  value={strContra}
                  onChange={(e) => setStrContra(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="border rounded-md px-3 h-10 text-sm"
                  onClick={() => setShow((s) => !s)}
                  disabled={loading}
                >
                  {show ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || !strUsuario || !strContra}
              className="h-10 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
