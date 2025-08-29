/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

export default function AnalyticsOverviewPage() {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/analytics/overview");
      setData(await res.json());
    })();
  }, []);

  if (!data) return <div className="p-4">Cargando…</div>;

  const { kpis, timeseries, topProducts, abc } = data;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title="On Hand (unidades)" value={kpis.onHandUnits} />
        <Kpi title="SKUs activos" value={kpis.activeSkus} />
        <Kpi title="Stockouts" value={kpis.stockouts} badge="alert" />
        <Kpi title="Próx. a caducar (≤30d)" value={kpis.nearExpiry30d} badge="warn" />
      </div>

      {/* Entradas vs Salidas */}
      <Card className="h-[340px]">
        <CardHeader className="pb-2"><CardTitle>Flujo de inventario (30 días)</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="in" />
              <Line type="monotone" dataKey="out" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top productos por rotación */}
        <Card className="h-[340px]">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle>Top productos por movimiento</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportCSV(topProducts, "top_products", ["sku","name","moved"])}>Exportar CSV</Button>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sku" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="moved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ABC */}
        <Card className="h-[340px]">
          <CardHeader className="pb-2"><CardTitle>ABC por valor (%)</CardTitle></CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={abc} dataKey="value" nameKey="segment" cx="50%" cy="50%" outerRadius={100} label>
                  {abc.map((_:any, i:any) => <Cell key={i} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value, badge }: { title: string; value: number | string; badge?: "alert" | "warn" }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold flex items-center gap-2">
        {value}
        {badge === "alert" && <Badge variant="destructive">Revisar</Badge>}
        {badge === "warn"  && <Badge variant="secondary">Atención</Badge>}
      </CardContent>
    </Card>
  );
}

function exportCSV(rows: any[], name: string, cols: string[]) {
  const header = cols;
  const data = rows.map(r => cols.map(c => r[c]));
  const csv = [header, ...data].map(x => x.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = `${name}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
}
