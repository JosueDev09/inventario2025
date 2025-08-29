/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { Label } from "@/components/ui/label/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs/tabs";
import { Separator } from "@/components/ui/separator/separator";

type Settings = {
  general: {
    companyName: string;
    defaultWarehouse: string; // id o nombre
    locale: string; // es-MX, en-US
    currency: string; // MXN, USD...
    timezone: string; // America/Mexico_City...
    notes: string;
  };
  inventory: {
    valuationMethod: "FIFO" | "LIFO" | "AVERAGE";
    allocationPolicy: "FEFO" | "FIFO";
    lowStockThreshold: number; // alerta ≤
    allowNegativeStock: boolean;
  };
  operations: {
    putawayStrategy: "SIMPLIFIED" | "BY_FAMILY" | "BY_VOLUME";
    pickingStrategy: "SINGLE" | "BATCH" | "ZONE";
    enableCycleCounts: boolean;
    cycleCountWeekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
  };
  notifications: {
    emailLowStock: boolean;
    emailNearExpiry: boolean;
    recipients: string; // coma separada
  };
};

const DEFAULTS: Settings = {
  general: {
    companyName: "Mi Empresa",
    defaultWarehouse: "Central",
    locale: "es-MX",
    currency: "MXN",
    timezone: "America/Mexico_City",
    notes: "",
  },
  inventory: {
    valuationMethod: "FIFO",
    allocationPolicy: "FEFO",
    lowStockThreshold: 5,
    allowNegativeStock: false,
  },
  operations: {
    putawayStrategy: "SIMPLIFIED",
    pickingStrategy: "SINGLE",
    enableCycleCounts: true,
    cycleCountWeekday: "WED",
  },
  notifications: {
    emailLowStock: true,
    emailNearExpiry: true,
    recipients: "ops@empresa.com, compras@empresa.com",
  },
};

// Opciones rápidas de ejemplo (ajústalas a tus catálogos reales)
const WAREHOUSES = ["Central", "Norte", "CDMX"] as const;
const TIMEZONES = [
  "America/Monterrey",
  "America/Mexico_City",
  "America/Tijuana",
] as const;
const LOCALES = ["es-MX", "en-US"] as const;
const CURRENCIES = ["MXN", "USD"] as const;

const STORAGE_KEY = "esymbel.settings.v1";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Settings>(DEFAULTS);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("general");

  React.useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleSave() {
    // Validación mínima
    if (!settings.general.companyName.trim()) {
      alert("El nombre de la empresa es requerido.");
      setTab("general");
      return;
    }
    saveSettings(settings);
    setSavedAt(new Date().toLocaleString());
  }

  function handleReset() {
    if (confirm("¿Restaurar valores por defecto?")) {
      setSettings(DEFAULTS);
      saveSettings(DEFAULTS);
      setSavedAt(new Date().toLocaleString());
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ajustes</h1>
          <p className="text-sm text-muted-foreground">Configura parámetros generales del WMS.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleReset}>Restaurar</Button>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </div>
      </div>

      {savedAt && (
        <p className="text-xs text-muted-foreground">Guardado: {savedAt}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
              <TabsTrigger value="operations">Operación</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-6">
              <Section title="Compañía & Región">
                <Field label="Nombre de la empresa">
                  <Input
                    value={settings.general.companyName}
                    onChange={(e:any) =>
                      setSettings({ ...settings, general: { ...settings.general, companyName: e.target.value } })
                    }
                    placeholder="Ej. Esymbel"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Almacén por defecto">
                    <Select
                      value={settings.general.defaultWarehouse}
                      onValueChange={(v:any) =>
                        setSettings({ ...settings, general: { ...settings.general, defaultWarehouse: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona almacén" /></SelectTrigger>
                      <SelectContent>
                        {WAREHOUSES.map((w) => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Idioma / Locale">
                    <Select
                      value={settings.general.locale}
                      onValueChange={(v:any) =>
                        setSettings({ ...settings, general: { ...settings.general, locale: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona locale" /></SelectTrigger>
                      <SelectContent>
                        {LOCALES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Moneda">
                    <Select
                      value={settings.general.currency}
                      onValueChange={(v:any) =>
                        setSettings({ ...settings, general: { ...settings.general, currency: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona moneda" /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Zona horaria">
                    <Select
                      value={settings.general.timezone}
                      onValueChange={(v:any) =>
                        setSettings({ ...settings, general: { ...settings.general, timezone: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona timezone" /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Notas">
                  <Textarea
                    value={settings.general.notes}
                    onChange={(e:any) =>
                      setSettings({ ...settings, general: { ...settings.general, notes: e.target.value } })
                    }
                    placeholder="Notas internas…"
                  />
                </Field>
              </Section>

              <Hint>Estos valores se usan como defaults al crear operaciones, documentos y formatos.</Hint>
            </TabsContent>

            {/* Inventory */}
            <TabsContent value="inventory" className="space-y-6">
              <Section title="Políticas de inventario">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Método de valuación">
                    <Select
                      value={settings.inventory.valuationMethod}
                      onValueChange={(v: Settings["inventory"]["valuationMethod"]) =>
                        setSettings({ ...settings, inventory: { ...settings.inventory, valuationMethod: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona método" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIFO">FIFO</SelectItem>
                        <SelectItem value="LIFO">LIFO</SelectItem>
                        <SelectItem value="AVERAGE">Prom. ponderado</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Asignación / Despacho">
                    <Select
                      value={settings.inventory.allocationPolicy}
                      onValueChange={(v: Settings["inventory"]["allocationPolicy"]) =>
                        setSettings({ ...settings, inventory: { ...settings.inventory, allocationPolicy: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona política" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FEFO">FEFO (caduca primero)</SelectItem>
                        <SelectItem value="FIFO">FIFO (entra primero)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Umbral de bajo stock (unidad)">
                    <Input
                      type="number"
                      min={0}
                      value={String(settings.inventory.lowStockThreshold)}
                      onChange={(e:any) =>
                        setSettings({
                          ...settings,
                          inventory: { ...settings.inventory, lowStockThreshold: Number(e.target.value || 0) },
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="neg"
                    checked={settings.inventory.allowNegativeStock}
                    onCheckedChange={(ch:any) =>
                      setSettings({ ...settings, inventory: { ...settings.inventory, allowNegativeStock: ch } })
                    }
                  />
                  <Label htmlFor="neg">Permitir inventario negativo (solo usuarios autorizados)</Label>
                </div>
              </Section>

              <Hint>Usa FEFO si manejas caducidades. Evita inventario negativo salvo para ajustes controlados.</Hint>
            </TabsContent>

            {/* Operations */}
            <TabsContent value="operations" className="space-y-6">
              <Section title="Estrategias operativas">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Putaway (ubicación)">
                    <Select
                      value={settings.operations.putawayStrategy}
                      onValueChange={(v: Settings["operations"]["putawayStrategy"]) =>
                        setSettings({ ...settings, operations: { ...settings.operations, putawayStrategy: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona estrategia" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIMPLIFIED">Simplificado (primer hueco)</SelectItem>
                        <SelectItem value="BY_FAMILY">Por familia/categoría</SelectItem>
                        <SelectItem value="BY_VOLUME">Por volumen/peso</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Picking">
                    <Select
                      value={settings.operations.pickingStrategy}
                      onValueChange={(v: Settings["operations"]["pickingStrategy"]) =>
                        setSettings({ ...settings, operations: { ...settings.operations, pickingStrategy: v } })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona estrategia" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Pedido a pedido</SelectItem>
                        <SelectItem value="BATCH">Por lotes</SelectItem>
                        <SelectItem value="ZONE">Por zonas</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Switch
                    id="cycle"
                    checked={settings.operations.enableCycleCounts}
                    onCheckedChange={(ch:any) =>
                      setSettings({ ...settings, operations: { ...settings.operations, enableCycleCounts: ch } })
                    }
                  />
                  <Label htmlFor="cycle">Habilitar conteos cíclicos automáticos</Label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Día sugerido de conteo">
                    <Select
                      value={settings.operations.cycleCountWeekday}
                      onValueChange={(v: Settings["operations"]["cycleCountWeekday"]) =>
                        setSettings({ ...settings, operations: { ...settings.operations, cycleCountWeekday: v } })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MON">Lunes</SelectItem>
                        <SelectItem value="TUE">Martes</SelectItem>
                        <SelectItem value="WED">Miércoles</SelectItem>
                        <SelectItem value="THU">Jueves</SelectItem>
                        <SelectItem value="FRI">Viernes</SelectItem>
                        <SelectItem value="SAT">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </Section>

              <Hint>Ajusta estrategias según tu layout y demanda. Los conteos cíclicos mejoran exactitud sin frenar operación.</Hint>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Section title="Alertas por correo">
                <div className="flex items-center gap-3">
                  <Switch
                    id="lowstock"
                    checked={settings.notifications.emailLowStock}
                    onCheckedChange={(ch:any) =>
                      setSettings({ ...settings, notifications: { ...settings.notifications, emailLowStock: ch } })
                    }
                  />
                  <Label htmlFor="lowstock">Enviar alerta por bajo stock</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="expiry"
                    checked={settings.notifications.emailNearExpiry}
                    onCheckedChange={(ch:any) =>
                      setSettings({ ...settings, notifications: { ...settings.notifications, emailNearExpiry: ch } })
                    }
                  />
                  <Label htmlFor="expiry">Enviar alerta por caducidades próximas</Label>
                </div>

                <Field label="Destinatarios (separar por coma)">
                  <Input
                    value={settings.notifications.recipients}
                    onChange={(e:any) =>
                      setSettings({ ...settings, notifications: { ...settings.notifications, recipients: e.target.value } })
                    }
                    placeholder="ops@empresa.com, compras@empresa.com"
                  />
                </Field>
              </Section>

              <Hint>Más adelante puedes cambiar a notificaciones por Slack/WhatsApp desde integraciones.</Hint>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
