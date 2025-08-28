/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select/select";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

function daysTo(dateIso?: string | null) {
  if (!dateIso) return null;
  const ms = +new Date(dateIso) - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
  const [q, setQ] = React.useState("");
  const [warehouse, setWarehouse] = React.useState<string>("");
  const [sort, setSort] = React.useState("onHandDesc");
  const [low, setLow] = React.useState<string>("");
  const dq = useDebouncedValue(q, 300);

  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [warehouses, setWarehouses] = React.useState<{ id: string; name: string }[]>([]);

  async function load(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: dq,
        warehouse,
        sort,
        page: String(p),
        pageSize: String(pageSize),
      });
      if (low) params.set("low", low);
      const res = await fetch(`/api/inventory?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
      setWarehouses(json.warehouses ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { setPage(1); }, [dq, warehouse, sort, low]);
  React.useEffect(() => { load(1); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, warehouse, sort, low]);

  function exportCSV() {
    const header = ["SKU","Producto","UoM","On Hand","Ubicaciones","Lotes","Prox. Caducidad","Desglose (almacén:qty)"];
    const rows = items.map((r) => [
      r.sku,
      r.name,
      r.uom,
      r.onHand,
      r.locationsCount,
      r.lotsCount,
      r.earliestExpiry ?? "",
      (r.breakdown || []).map((b: any) => `${b.warehouse}:${b.qty}`).join(" | "),
    ]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `inventario_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages:any = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o SKU" />
          </div>
          <Select value={warehouse} onValueChange={(v) => setWarehouse(v)}>
            <SelectTrigger><SelectValue placeholder="Almacén (todos)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger><SelectValue placeholder="Orden" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="onHandDesc">Stock ↓</SelectItem>
              <SelectItem value="onHandAsc">Stock ↑</SelectItem>
              <SelectItem value="nameAsc">Nombre A→Z</SelectItem>
              <SelectItem value="expiryAsc">Próx. caducidad</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-4 flex items-center gap-2">
            <Input type="number" min={0} placeholder="Stock <= (umbral)" value={low} onChange={(e) => setLow(e.target.value)} className="max-w-[200px]" />
            <Button variant="secondary" onClick={() => { setQ(""); setWarehouse(""); setSort("onHandDesc"); setLow(""); }}>Limpiar</Button>
            <Button onClick={exportCSV} className="ml-auto">Exportar CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">UoM</th>
                <th className="p-2 text-center">On Hand</th>
                <th className="p-2 text-center">Ubicaciones</th>
                <th className="p-2 text-center">Lotes</th>
                <th className="p-2 text-left">Próx. caducidad</th>
                <th className="p-2 text-left">Desglose</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={8}>Cargando…</td></tr>}
              {!loading && items.length === 0 && (
                <tr><td className="p-3 text-muted-foreground" colSpan={8}>Sin resultados.</td></tr>
              )}
              {!loading && items.map((r) => {
                const d = daysTo(r.earliestExpiry);
                return (
                  <tr key={r.productId} className="border-t hover:bg-muted/30">
                    <td className="p-2">{r.sku}</td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-center">{r.uom}</td>
                    <td className="p-2 text-center font-medium">{r.onHand}</td>
                    <td className="p-2 text-center">{r.locationsCount}</td>
                    <td className="p-2 text-center">{r.lotsCount}</td>
                    <td className="p-2">
                      {r.earliestExpiry ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(r.earliestExpiry).toLocaleDateString()}</span>
                          {d !== null && d <= 30 && <Badge variant="destructive">{d} días</Badge>}
                          {d !== null && d > 30 && <Badge variant="secondary">{d} días</Badge>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {(r.breakdown || []).map((b: any) => (
                          <Badge key={b.warehouse} variant="outline">{b.warehouse}: {b.qty}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Paginación simple */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}>Anterior</Button>
          <span className="text-sm">{page}</span>
          <Button variant="outline" disabled={page * pageSize >= total} onClick={() => { const p = page + 1; setPage(p); load(p); }}>Siguiente</Button>
        </div>
      </div>
    </div>
  );
}