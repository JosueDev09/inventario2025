/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
const stock = [
  { productId: "p1", locationId: "l1", qty: 3, lot: "L-001", expiry: "2025-09-10" },
  { productId: "p3", locationId: "l3", qty: 7, lot: "L-010", expiry: "2025-09-01" },
  { productId: "p2", locationId: "l1", qty: 8, lot: null, expiry: null },
  { productId: "p4", locationId: "l4", qty: 12, lot: null, expiry: null },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wParam = searchParams.get("warehouse");
  const warehouse = !wParam || wParam === "all" ? "" : wParam;
  const days = parseInt(searchParams.get("days") || "30", 10);
  const showExpired = (searchParams.get("expired") || "false").toLowerCase() === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  const prodBy = new Map(products.map(p => [p.id, p] as const));
  const locBy  = new Map(locations.map(l => [l.id, l] as const));
  const whBy   = new Map(warehouses.map(w => [w.id, w] as const));

  const now = Date.now();
  const maxMs = days * 24 * 60 * 60 * 1000;

  let rows = stock
    .filter(s => s.expiry)
    .map(s => {
      const p = prodBy.get(s.productId)!;
      const l = locBy.get(s.locationId)!;
      const w = whBy.get(l.warehouseId)!;
      const d = s.expiry ? Math.ceil((+new Date(s.expiry) - now) / (1000 * 60 * 60 * 24)) : null;
      return {
        sku: p.sku,
        name: p.name,
        uom: p.uom,
        qty: s.qty,
        lot: s.lot,
        expiry: s.expiry,
        daysTo: d,
        warehouse: w.name,
        location: l.code,
        warehouseId: w.id,
      };
    })
    .filter(r => !warehouse || r.warehouseId === warehouse)
    .filter(r => showExpired ? (r.daysTo !== null && r.daysTo <= 0)
                             : (r.daysTo !== null && r.daysTo >= 0 && r.daysTo <= days))
    .sort((a, b) => (a.daysTo ?? Infinity) - (b.daysTo ?? Infinity));

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, warehouses });
}
