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

export default function MovementsPage() {
  const [q, setQ] = React.useState("");
  const [warehouse, setWarehouse] = React.useState("all");
  const [reason, setReason] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
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
      const params = new URLSearchParams({ q: dq, warehouse, reason, page: String(p), pageSize: String(pageSize) });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/inventory/movements?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []); setTotal(json.total ?? 0); setWarehouses(json.warehouses ?? []);
    } finally { setLoading(false); }
  }

  React.useEffect(() => { setPage(1); }, [dq, warehouse, reason, fromDate, toDate]);
  React.useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [dq, warehouse, reason, fromDate, toDate]);

  function exportCSV() {
    const header = ["Fecha","Razón","SKU","Producto","Qty","Desde","Hacia","Almacén (desde)","Almacén (hacia)"];
    const rows = items.map((r) => [new Date(r.ts).toLocaleString(), r.reason, r.sku, r.name, r.qty, r.from, r.to, r.fromWh ?? "", r.toWh ?? ""]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `movements_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Movimientos (Kardex)</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por SKU, producto o ubicación" /></div>
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger><SelectValue placeholder="Almacén" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Razón" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="RECEIVE">RECEIVE</SelectItem>
              <SelectItem value="PUTAWAY">PUTAWAY</SelectItem>
              <SelectItem value="PICK">PICK</SelectItem>
              <SelectItem value="ADJUST">ADJUST</SelectItem>
              <SelectItem value="TRANSFER">TRANSFER</SelectItem>
              <SelectItem value="RETURN">RETURN</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="md:col-span-5 flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setQ(""); setWarehouse("all"); setReason("all"); setFromDate(""); setToDate(""); }}>Limpiar</Button>
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
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Razón</th>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-left">Desde</th>
                <th className="p-2 text-left">Hacia</th>
                <th className="p-2 text-left">Almacén (desde)</th>
                <th className="p-2 text-left">Almacén (hacia)</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={9}>Cargando…</td></tr>}
              {!loading && items.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={9}>Sin resultados.</td></tr>}
              {!loading && items.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{new Date(r.ts).toLocaleString()}</td>
                  <td className="p-2"><Badge variant="outline">{r.reason}</Badge></td>
                  <td className="p-2">{r.sku}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2 text-center">{r.qty}</td>
                  <td className="p-2">{r.from}</td>
                  <td className="p-2">{r.to}</td>
                  <td className="p-2">{r.fromWh ?? "—"}</td>
                  <td className="p-2">{r.toWh ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
