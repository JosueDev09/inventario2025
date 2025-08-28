/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Badge } from "@/components/ui/badge/badge";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`, "ig");
  return text.split(re).map((chunk, i) =>
    re.test(chunk) ? (
      <mark key={i} className="rounded bg-yellow-200/50 px-0.5 py-0">{chunk}</mark>
    ) : (
      <React.Fragment key={i}>{chunk}</React.Fragment>
    )
  );
}

export default function SearchPOByProductPage() {
  const [q, setQ] = React.useState("");
  const dq = useDebouncedValue(q, 300);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!dq) { setItems([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/purchasing/search?q=${encodeURIComponent(dq)}`);
        const json = await res.json();
        if (active) setItems(json.items ?? []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [dq]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buscar OC por producto/insumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Escribe nombre de producto o SKU (ej. 'Camisa' o 'SKU-001')"
          />
          <div className="text-xs text-muted-foreground">Búsqueda por nombre o SKU. Resultados muestran las órdenes que incluyen ese producto.</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">OC</th>
                <th className="p-2 text-left">Proveedor</th>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">Cant. pedida</th>
                <th className="p-2 text-center">Recibido</th>
                <th className="p-2 text-center">UoM</th>
                <th className="p-2 text-center">Costo</th>
                <th className="p-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="p-3" colSpan={8}>Cargando…</td></tr>
              )}
              {!loading && items.length === 0 && dq && (
                <tr><td className="p-3 text-muted-foreground" colSpan={8}>Sin resultados para “{dq}”.</td></tr>
              )}
              {!loading && !dq && (
                <tr><td className="p-3 text-muted-foreground" colSpan={8}>Escribe un término para buscar.</td></tr>
              )}
              {!loading && items.map((r, i) => (
                <tr key={r.poId + r.productSku + i} className="border-t hover:bg-muted/30">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.poCode}</span>
                      <Badge variant="secondary">{r.poStatus}</Badge>
                    </div>
                  </td>
                  <td className="p-2">{r.supplier}</td>
                  <td className="p-2">
                    <div className="font-medium">{highlight(r.productName, q)}</div>
                    <div className="text-xs text-muted-foreground">{highlight(r.productSku, q)}</div>
                  </td>
                  <td className="p-2 text-center">{r.qtyOrdered}</td>
                  <td className="p-2 text-center">{r.qtyReceived}</td>
                  <td className="p-2 text-center">{r.uom}</td>
                  <td className="p-2 text-center">{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(r.unitCost)}</td>
                  <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}