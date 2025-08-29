import { NextResponse } from "next/server";
import { getAuthz, computeWarehouseScope } from "@/lib/authz";

// MOCK
const lines = [
  { id: "e1", sku: "SKU-001", name: "Camisa Oversize", lot: "L-001", expiry: "2025-09-15", qty: 12, warehouseId: "A1", location: "A1-R1-B1" },
  { id: "e2", sku: "SKU-014", name: "Pants Gym",       lot: "L-045", expiry: "2025-10-20", qty: 8,  warehouseId: "A2", location: "A2-Z3-B5" },
  { id: "e3", sku: "SKU-200", name: "Gorra Logo",       lot: "L-078", expiry: "2025-09-02", qty: 4,  warehouseId: "A1", location: "STAGING" },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedWh = searchParams.get("warehouse"); // 'all' | A1 | A2...
  const horizon = Math.max(1, parseInt(searchParams.get("days") || "30", 10)); // ≤ días
  const mode = (searchParams.get("mode") || "upcoming") as "upcoming" | "expired";

  const { roleScope, allowedWarehouses } = await getAuthz();
  const { filterMany } = computeWarehouseScope(requestedWh, roleScope, allowedWarehouses);

  const today = new Date();

  let rows = lines.map((r) => {
    const d = new Date(r.expiry);
    const days = Math.ceil((+d - +today) / 86400000);
    return { ...r, daysToExpire: days };
  });

  // Filtro de warehouse permitido
  if (filterMany && filterMany.length) {
    const allow = new Set(filterMany);
    rows = rows.filter((r) => allow.has(r.warehouseId));
  }

  // Modo caduca pronto / vencido
  rows = rows.filter((r) => (mode === "upcoming" ? r.daysToExpire >= 0 && r.daysToExpire <= horizon : r.daysToExpire < 0));

  rows.sort((a, b) => a.daysToExpire - b.daysToExpire);
  return NextResponse.json({ items: rows, total: rows.length, horizon, mode });
}
