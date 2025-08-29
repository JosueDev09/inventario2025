import { NextResponse } from "next/server";

const monthlySpend = [
  { month: "Mar", spend: 185000 },
  { month: "Abr", spend: 210000 },
  { month: "May", spend: 198000 },
  { month: "Jun", spend: 224000 },
  { month: "Jul", spend: 235000 },
  { month: "Ago", spend: 218000 },
];

const topItems = [
  { sku: "SKU-001", name: "Camisa Oversize", qty: 1200, spend: 216000 },
  { sku: "SKU-014", name: "Pants Gym", qty: 950, spend: 247000 },
  { sku: "SKU-200", name: "Gorra Logo", qty: 800, spend: 120000 },
];

const leadTimeDays = { avg: 9.4, p90: 14 };

export async function GET() {
  return NextResponse.json({ monthlySpend, topItems, leadTimeDays });
}
