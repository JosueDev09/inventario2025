/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select/select";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";

export default function ExpiriesPage() {
  const [warehouse, setWarehouse] = React.useState("all");
  const [days, setDays] = React.useState("30");
  const [showExpired, setShowExpired] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [warehouses, setWarehouses] = React.useState<{ id: string; name: string }[]>([]);

  async function load(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ warehouse, days, expired: String(showExpired), page: String(p), pageSize: String(pageSize) });
      const res = await fetch(`/api/inventory/expiries?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []); setTotal(json.total ?? 0); setWarehouses(json.warehouses ?? []);
    } finally { setLoading(false); }
  }

  React.useEffect(() => { setPage(1); }, [warehouse, days, showExpired]);
  React.useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [warehouse, days, showExpired]);

  function exportCSV() {
    const header = ["SKU","Producto","UoM","Qty","Lote","Caducidad","Días","Almacén","Ubicación"];
    const rows = items.map((r) => [r.sku, r.name, r.uom, r.qty, r.lot ?? "", r.expiry ?? "", r.daysTo ?? "", r.warehouse, r.location]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `expiries_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Caducidades</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger><SelectValue placeholder="Almacén" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min={0} value={days} onChange={(e) => setDays(e.target.value)} placeholder="≤ días" />
          <Select value={String(showExpired)} onValueChange={(v) => setShowExpired(v === "true") }>
            <SelectTrigger><SelectValue placeholder="Modo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Próximas a vencer</SelectItem>
              <SelectItem value="true">Vencidas</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setWarehouse("all"); setDays("30"); setShowExpired(false); }}>Limpiar</Button>
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
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-left">Lote</th>
                <th className="p-2 text-left">Caducidad</th>
                <th className="p-2 text-center">Días</th>
                <th className="p-2 text-left">Almacén</th>
                <th className="p-2 text-left">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={9}>Cargando…</td></tr>}
              {!loading && items.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={9}>Sin resultados.</td></tr>}
              {!loading && items.map((r: any, i: number) => (
                <tr key={r.sku + r.location + (r.lot ?? i)} className="border-t hover:bg-muted/30">
                  <td className="p-2">{r.sku}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2 text-center">{r.uom}</td>
                  <td className="p-2 text-center">{r.qty}</td>
                  <td className="p-2">{r.lot ?? "—"}</td>
                  <td className="p-2">{r.expiry ? new Date(r.expiry).toLocaleDateString() : "—"}</td>
                  <td className="p-2 text-center">
                    {r.daysTo !== null && r.daysTo !== undefined ? (
                      <Badge variant={r.daysTo <= 0 ? "destructive" : r.daysTo <= 30 ? "secondary" : "outline"}>{r.daysTo}</Badge>
                    ) : "—"}
                  </td>
                  <td className="p-2">{r.warehouse}</td>
                  <td className="p-2">{r.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
