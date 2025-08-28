/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Point = { date: string; value: number };
export default function LineReceipts({ data }: { data: Point[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin datos</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} hide={data.length > 9} />
        <YAxis width={28} tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip formatter={(v: any) => [v, "Recepciones"]} labelFormatter={(l) => `Día ${l}`} />
        <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#fill)" strokeWidth={2} />
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
}