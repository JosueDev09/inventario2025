/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function AnalyticsPurchasingPage() {
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => { (async ()=>{
    const res = await fetch("/api/analytics/purchasing"); setData(await res.json());
  })(); }, []);
  if (!data) return <div className="p-4">Cargando…</div>;

  const { monthlySpend, topItems, leadTimeDays } = data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Kpi title="Lead time promedio (días)" value={leadTimeDays.avg} />
        <Kpi title="Lead time P90 (días)" value={leadTimeDays.p90} />
      </div>

      <Card className="h-[340px]">
        <CardHeader className="pb-2"><CardTitle>Gasto mensual (MXN)</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="spend" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-[340px]">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle>Top items por gasto</CardTitle>
          <Button variant="outline" size="sm" onClick={() => exportCSV(topItems, "purchasing_top_items", ["sku","name","qty","spend"])}>Exportar CSV</Button>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sku" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="spend" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
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
