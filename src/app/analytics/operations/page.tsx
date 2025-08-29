/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function AnalyticsOperationsPage() {
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => { (async ()=>{
    const res = await fetch("/api/analytics/operations"); setData(await res.json());
  })(); }, []);
  if (!data) return <div className="p-4">Cargando…</div>;

  const { weekly, kpis } = data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi title="Putaway Lead Time (prom.)" value={`${kpis.putawayLeadTimeAvgMin} min`} />
        <Kpi title="Pick Accuracy" value={`${kpis.pickAccuracyPct}%`} />
        <Kpi title="Líneas/hora" value={kpis.linesPerHour} />
      </div>

      <Card className="h-[380px]">
        <CardHeader className="pb-2"><CardTitle>Movimientos por semana (stacked)</CardTitle></CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="RECEIVE" stackId="a" />
              <Bar dataKey="PUTAWAY" stackId="a" />
              <Bar dataKey="PICK" stackId="a" />
              <Bar dataKey="TRANSFER" stackId="a" />
              <Bar dataKey="ADJUST" stackId="a" />
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
