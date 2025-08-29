import { NextResponse } from "next/server";

// Mock de KPIs y series (últimos 30 días)
const kpis = {
  onHandUnits: 1260,
  activeSkus: 148,
  stockouts: 6,
  nearExpiry30d: 12,
};

const timeseries = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  const inQty = Math.floor(40 + Math.random() * 30);
  const outQty = Math.floor(35 + Math.random() * 28);
  return { date: d.toISOString().slice(5, 10), in: inQty, out: outQty, net: inQty - outQty };
});

const topProducts = [
  { sku: "SKU-001", name: "Camisa Oversize", moved: 420 },
  { sku: "SKU-014", name: "Pants Gym", moved: 390 },
  { sku: "SKU-200", name: "Gorra Logo", moved: 265 },
  { sku: "SKU-120", name: "Sudadera Zip", moved: 210 },
  { sku: "SKU-301", name: "Calcetas", moved: 180 },
];

const abc = [
  { segment: "A", value: 70 }, // % de valor
  { segment: "B", value: 20 },
  { segment: "C", value: 10 },
];

export async function GET() {
  return NextResponse.json({ kpis, timeseries, topProducts, abc });
}
