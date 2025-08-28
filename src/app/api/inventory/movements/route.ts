import { NextResponse } from "next/server";

const warehouses = [ { id: "w1", name: "Central" }, { id: "w2", name: "Norte" } ];
const locations = [
  { id: "l1", code: "A1-R1-B1", warehouseId: "w1" },
  { id: "l2", code: "A1-R1-B2", warehouseId: "w1" },
  { id: "l3", code: "B2-Z3-B5", warehouseId: "w2" },
  { id: "l4", code: "STAGING",  warehouseId: "w1" },
];
const products = [
  { id: "p1", sku: "SKU-001", name: "Camisa Oversize Negra", uom: "pz" },
  { id: "p2", sku: "SKU-014", name: "Pants Gym Esymbel", uom: "pz" },
  { id: "p3", sku: "SKU-120", name: "Sudadera Zip", uom: "pz" },
  { id: "p4", sku: "SKU-200", name: "Gorra Logo", uom: "pz" },
];

// movimientos de ejemplo
const movements = [
  { id: "m1", productId: "p1", qty: 5,  fromLocationId: null, toLocationId: "l4", reason: "RECEIVE", ts: "2025-08-25T10:00:00Z" },
  { id: "m2", productId: "p1", qty: 3,  fromLocationId: "l4", toLocationId: "l1", reason: "PUTAWAY", ts: "2025-08-25T11:00:00Z" },
  { id: "m3", productId: "p2", qty: 2,  fromLocationId: "l1", toLocationId: "l3", reason: "TRANSFER", ts: "2025-08-26T09:30:00Z" },
  { id: "m4", productId: "p3", qty: 1,  fromLocationId: "l3", toLocationId: null, reason: "ADJUST", ts: "2025-08-26T12:15:00Z" },
  { id: "m5", productId: "p4", qty: 12, fromLocationId: null, toLocationId: "l4", reason: "RECEIVE", ts: "2025-08-27T08:05:00Z" },
];

function fold(s: string) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim(); // sku|nombre|ubicación
  const wParam = searchParams.get("warehouse");
  const warehouse = !wParam || wParam === "all" ? "" : wParam;
  const reason = (searchParams.get("reason") || "all").toUpperCase(); // RECEIVE|PUTAWAY|PICK|ADJUST|TRANSFER|RETURN|all
  const dateFrom = searchParams.get("from"); // ISO
  const dateTo = searchParams.get("to");     // ISO
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  const prodBy = new Map(products.map(p => [p.id, p] as const));
  const locBy  = new Map(locations.map(l => [l.id, l] as const));
  const whBy   = new Map(warehouses.map(w => [w.id, w] as const));

  let rows = movements.map(m => {
    const p = prodBy.get(m.productId)!;
    const from = m.fromLocationId ? locBy.get(m.fromLocationId)! : null;
    const to   = m.toLocationId ? locBy.get(m.toLocationId)! : null;
    return {
      id: m.id,
      ts: m.ts,
      reason: m.reason,
      sku: p.sku,
      name: p.name,
      qty: m.qty,
      from: from?.code ?? "—",
      to: to?.code ?? "—",
      fromWh: from ? whBy.get(from.warehouseId)!.name : null,
      toWh: to ? whBy.get(to.warehouseId)!.name : null,
      fromWhId: from?.warehouseId ?? null,
      toWhId: to?.warehouseId ?? null,
    };
  });

  // filtros
  if (warehouse) {
    rows = rows.filter(r => r.fromWhId === warehouse || r.toWhId === warehouse);
  }
  if (reason !== "ALL") {
    rows = rows.filter(r => r.reason === reason);
  }
  if (q) {
    const fq = fold(q);
    rows = rows.filter(r => fold(r.sku).includes(fq) || fold(r.name).includes(fq) || fold(r.from).includes(fq) || fold(r.to).includes(fq));
  }
  if (dateFrom) rows = rows.filter(r => +new Date(r.ts) >= +new Date(dateFrom));
  if (dateTo)   rows = rows.filter(r => +new Date(r.ts) <= +new Date(dateTo));

  rows.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, warehouses });
}