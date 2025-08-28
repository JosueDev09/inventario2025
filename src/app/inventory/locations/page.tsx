/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
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

export default function LocationsPage() {
  const [q, setQ] = React.useState("");
  const [warehouse, setWarehouse] = React.useState("all");
  const [sort, setSort] = React.useState("occupancyDesc");
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
      const params = new URLSearchParams({ q: dq, warehouse, sort, page: String(p), pageSize: String(pageSize) });
      const res = await fetch(`/api/inventory/locations?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []); setTotal(json.total ?? 0); setWarehouses(json.warehouses ?? []);
    } finally { setLoading(false); }
  }

  React.useEffect(() => { setPage(1); }, [dq, warehouse, sort]);
  React.useEffect(() => { load(1); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, warehouse, sort]);

  function exportCSV() {
    const header = ["Ubicación","Almacén","On Hand","Productos","Capacidad","Ocupación %"];
    const rows = items.map((r) => [r.code, r.warehouse, r.onHand, r.productsCount, r.capacity, r.occupancy]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `locations_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Ubicaciones</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ubicación o almacén" /></div>
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger><SelectValue placeholder="Almacén" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue placeholder="Orden" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="occupancyDesc">Ocupación ↓</SelectItem>
              <SelectItem value="occupancyAsc">Ocupación ↑</SelectItem>
              <SelectItem value="codeAsc">Código A→Z</SelectItem>
              <SelectItem value="productsDesc">#Productos ↓</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-4 flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setQ(""); setWarehouse("all"); setSort("occupancyDesc"); }}>Limpiar</Button>
            <Button onClick={exportCSV} className="ml-auto">Exportar CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Ubicación</th>
                <th className="p-2 text-left">Almacén</th>
                <th className="p-2 text-center">On Hand</th>
                <th className="p-2 text-center">Productos</th>
                <th className="p-2 text-center">Capacidad</th>
                <th className="p-2 text-center">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={6}>Cargando…</td></tr>}
              {!loading && items.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={6}>Sin resultados.</td></tr>}
              {!loading && items.map((r: any) => (
                <tr key={r.locationId} className="border-t hover:bg-muted/30">
                  <td className="p-2">{r.code}</td>
                  <td className="p-2">{r.warehouse}</td>
                  <td className="p-2 text-center">{r.onHand}</td>
                  <td className="p-2 text-center">{r.productsCount}</td>
                  <td className="p-2 text-center">{r.capacity}</td>
                  <td className="p-2 text-center"><Badge variant={r.occupancy >= 90 ? "destructive" : r.occupancy >= 70 ? "secondary" : "outline"}>{r.occupancy}%</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Paginación simple */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Anterior</Button>
          <span className="text-sm">1</span>
          <Button variant="outline">Siguiente</Button>
        </div>
      </div>
    </div>
  );
}