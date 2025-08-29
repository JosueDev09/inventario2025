/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";

export default function AnalyticsInventoryPage() {
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => { (async ()=>{
    const res = await fetch("/api/analytics/inventory"); setData(await res.json());
  })(); }, []);
  if (!data) return <div className="p-4">Cargando…</div>;

  const { agingBuckets, turnsByCategory, expiryRisk } = data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[340px]">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle>Aging (unidades por antigüedad)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportCSV(agingBuckets, "aging", ["bucket","units"])}>Exportar CSV</Button>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="units" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[340px]">
          <CardHeader className="pb-2"><CardTitle>Rotación por categoría (turns / DoS)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="turns" />
                <Line type="monotone" dataKey="dos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="h-[340px]">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle>Riesgo de caducidad (qty)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => exportCSV(expiryRisk, "expiry_risk", ["label","qty"])}>Exportar CSV</Button>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expiryRisk}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
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
