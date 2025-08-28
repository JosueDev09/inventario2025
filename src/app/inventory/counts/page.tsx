/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select/select";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";

export default function CountsPage() {
  const [q, setQ] = React.useState("");
  const [warehouse, setWarehouse] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [sort, setSort] = React.useState("scheduledAsc");

  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [warehouses, setWarehouses] = React.useState<{ id: string; name: string }[]>([]);

  async function load(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, warehouse, status, sort, page: String(p), pageSize: String(pageSize) });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/inventory/counts?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []); setTotal(json.total ?? 0); setWarehouses(json.warehouses ?? []);
    } finally { setLoading(false); }
  }

  React.useEffect(() => { setPage(1); }, [q, warehouse, status, fromDate, toDate, sort]);
  React.useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, warehouse, status, fromDate, toDate, sort]);

  function exportCSV() {
    const header = ["Código","Estado","Almacén","Área","Alcance","Programado","Creado","Planeados","Contados","Progreso %"];
    const rows = items.map((r) => [r.code, r.status, r.warehouse, r.area, r.scope, r.scheduledDate, new Date(r.createdAt).toLocaleString(), r.itemsPlanned, r.itemsCounted, r.progress]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `counts_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Conteos cíclicos</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2"><Input value={q} onChange={(e:any) => setQ(e.target.value)} placeholder="Buscar por código, área o alcance" /></div>
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger><SelectValue placeholder="Almacén" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PLANNED">PLANNED</SelectItem>
              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
              <SelectItem value="CLOSED">CLOSED</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={fromDate} onChange={(e:any) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e:any) => setToDate(e.target.value)} />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue placeholder="Orden" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduledAsc">Programado ↑</SelectItem>
              <SelectItem value="createdDesc">Creado ↓</SelectItem>
              <SelectItem value="status">Estado A→Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-6 flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setQ(""); setWarehouse("all"); setStatus("all"); setFromDate(""); setToDate(""); setSort("scheduledAsc"); }}>Limpiar</Button>
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
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-left">Almacén</th>
                <th className="p-2 text-left">Área</th>
                <th className="p-2 text-left">Alcance</th>
                <th className="p-2 text-left">Programado</th>
                <th className="p-2 text-left">Creado</th>
                <th className="p-2 text-center">Planeados</th>
                <th className="p-2 text-center">Contados</th>
                <th className="p-2 text-center">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={10}>Cargando…</td></tr>}
              {!loading && items.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={10}>Sin resultados.</td></tr>}
              {!loading && items.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{r.code}</td>
                  <td className="p-2"><Badge variant={r.status === "CLOSED" ? "secondary" : r.status === "IN_PROGRESS" ? "outline" : "default"}>{r.status}</Badge></td>
                  <td className="p-2">{r.warehouse}</td>
                  <td className="p-2">{r.area}</td>
                  <td className="p-2">{r.scope}</td>
                  <td className="p-2">{r.scheduledDate}</td>
                  <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-center">{r.itemsPlanned}</td>
                  <td className="p-2 text-center">{r.itemsCounted}</td>
                  <td className="p-2 text-center">{r.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
