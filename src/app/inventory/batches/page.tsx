/* eslint-disable @typescript-eslint/no-unused-vars */
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

export default function BatchesPage() {
  const [q, setQ] = React.useState("");
  const [warehouse, setWarehouse] = React.useState("all");
  const [kind, setKind] = React.useState("all");
  const [expiryDays, setExpiryDays] = React.useState("");
  const [sort, setSort] = React.useState("expiryAsc");
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
      const params = new URLSearchParams({ q: dq, warehouse, kind, sort, page: String(p), pageSize: String(pageSize) });
      if (expiryDays) params.set("expiryDays", expiryDays);
      const res = await fetch(`/api/inventory/batches?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
      setWarehouses(json.warehouses ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { setPage(1); }, [dq, warehouse, kind, expiryDays, sort]);
  React.useEffect(() => { load(1); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, warehouse, kind, expiryDays, sort]);

  function exportCSV() {
    const header = ["SKU","Producto","UoM","Lote","Serie","Qty","Caducidad","Almacén","Ubicación"];
    const rows = items.map((r) => [r.sku, r.name, r.uom, r.lot ?? "", r.serial ?? "", r.qty, r.expiry ?? "", r.warehouse, r.location]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `batches_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const totalPages:any = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Lotes / Series</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por SKU, nombre, lote/serie, ubicación" /></div>
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger><SelectValue placeholder="Almacén" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lot">Solo lotes</SelectItem>
              <SelectItem value="serial">Solo series</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue placeholder="Orden" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expiryAsc">Próx. caducidad</SelectItem>
              <SelectItem value="qtyDesc">Cantidad ↓</SelectItem>
              <SelectItem value="qtyAsc">Cantidad ↑</SelectItem>
              <SelectItem value="nameAsc">Nombre A→Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-5 flex items-center gap-2">
            <Input type="number" min={0} placeholder="Caduca en ≤ días" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="max-w-[200px]" />
            <Button variant="secondary" onClick={() => { setQ(""); setWarehouse("all"); setKind("all"); setExpiryDays(""); setSort("expiryAsc"); }}>Limpiar</Button>
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
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">UoM</th>
                <th className="p-2 text-left">Lote</th>
                <th className="p-2 text-left">Serie</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-left">Caducidad</th>
                <th className="p-2 text-left">Almacén</th>
                <th className="p-2 text-left">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={9}>Cargando…</td></tr>}
              {!loading && items.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={9}>Sin resultados.</td></tr>}
              {!loading && items.map((r: any, i: number) => (
                <tr key={r.sku + r.location + (r.lot ?? r.serial ?? i)} className="border-t hover:bg-muted/30">
                  <td className="p-2">{r.sku}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2 text-center">{r.uom}</td>
                  <td className="p-2">{r.lot ?? "—"}</td>
                  <td className="p-2">{r.serial ?? "—"}</td>
                  <td className="p-2 text-center">{r.qty}</td>
                  <td className="p-2">{r.expiry ? new Date(r.expiry).toLocaleDateString() : "—"}</td>
                  <td className="p-2">{r.warehouse}</td>
                  <td className="p-2">{r.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Paginación */}
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