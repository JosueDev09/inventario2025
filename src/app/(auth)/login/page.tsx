/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Label } from "@/components/ui/label/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select/select";
import { Checkbox } from "@/components/ui/checkbox/checkbox";

type Warehouse = { id: string | number; code?: string; name: string };

export default function LoginPage() {
  const router = useRouter();

  // Form
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // 'all' = vista empresa (todos los almacenes) | id de almacén
  const [scope, setScope] = React.useState<string>("all");
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);

  // Data
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [whLoading, setWhLoading] = React.useState(false);

  // UI
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setWhLoading(true);
      try {
        const res = await fetch("/api/tenancy/warehouses", { cache: "no-store" });
        const j = await res.json();
        const items: Warehouse[] = Array.isArray(j.items) ? j.items : [];
        setWarehouses(items);
        if (items.length > 1) setScope("all");
        else if (items.length === 1) setScope(String(items[0].id));
        else setScope("all"); // dev: permite vista empresa aunque no haya datos reales aún
      } catch {
        // dev: sin backend, deja "all"
        setScope("all");
      } finally {
        setWhLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Completa correo y contraseña.");
      return;
    }
    if (!scope) {
      setErrorMsg("Selecciona un alcance (todos o un almacén).");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Autentica (si tienes backend). Si no existe, seguirá al fallback.
      const auth = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const selectedAll = scope === "all";
      const roleScope = selectedAll ? "COMPANY" : "WAREHOUSE";
      // Si elegiste "all" y hay n almacenes, pásalos; si no hay, backend interpretará COMPANY sin restricción.
      const warehouseIds = selectedAll ? warehouses.map((w) => String(w.id)) : [scope];

      // 2) Activa el contexto de sesión (cookies): role + almacenes permitidos
      if (auth.ok) {
        await fetch("/api/tenancy/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleScope, warehouseIds, remember }),
        });
      } else {
        // Fallback demo si aún no tienes /api/auth/login
        await fetch("/api/tenancy/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleScope, warehouseIds, remember }),
        });
      }

      router.push("/dashboard");
    } catch {
      setErrorMsg("No fue posible iniciar sesión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-0px)] grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Iniciar sesión</CardTitle>
          <p className="text-sm text-muted-foreground text-center">Esymbel WMS</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-1">
              <Label>Correo</Label>
              <Input
                type="email"
                value={email}
                onChange={(e:any) => setEmail(e.target.value)}
                placeholder="tucorreo@empresa.com"
                autoComplete="username"
              />
            </div>

            <div className="grid gap-1">
              <Label>Contraseña</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e:any) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <Button type="button" variant="outline" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? "Ocultar" : "Ver"}
                </Button>
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Alcance</Label>
              <Select value={scope} onValueChange={setScope} disabled={whLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={whLoading ? "Cargando..." : "Selecciona..."} />
                </SelectTrigger>
                <SelectContent>
                  {/* Opción empresa (agregado) siempre visible; el backend aplicará enforcement real */}
                  <SelectItem value="all">Todos los almacenes (vista empresa)</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={String(w.id)} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Elige <strong>Todos los almacenes</strong> para ver métricas agregadas en el dashboard.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v:any) => setRemember(Boolean(v))} />
              <Label htmlFor="remember">Recordarme en este dispositivo</Label>
            </div>

            {errorMsg && <div className="text-sm text-destructive">{errorMsg}</div>}

            <Button type="submit" disabled={submitting || !email || !password || !scope}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Al continuar aceptas los términos y políticas de la plataforma.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
