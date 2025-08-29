import { NextResponse } from "next/server";

const agingBuckets = [
  { bucket: "0–30", units: 480 },
  { bucket: "31–60", units: 360 },
  { bucket: "61–90", units: 260 },
  { bucket: "90+", units: 160 },
];

const turnsByCategory = [
  { category: "Ropa", turns: 7.2, dos: 50 },        // days of supply
  { category: "Accesorios", turns: 5.1, dos: 72 },
  { category: "Materia Prima", turns: 3.0, dos: 122 },
];

const expiryRisk = [
  { label: "≤ 30d", qty: 38 },
  { label: "31–60d", qty: 24 },
  { label: "61–90d", qty: 17 },
  { label: "> 90d", qty: 9 },
];

export async function GET() {
  return NextResponse.json({ agingBuckets, turnsByCategory, expiryRisk });
}
