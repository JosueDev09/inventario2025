/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

// Reutilizamos los mismos mocks del archivo de batches (o muévelos a un módulo común)
const warehouses = [ { id: "w1", name: "Central" }, { id: "w2", name: "Norte" } ];
const locations = [
  { id: "l1", code: "A1-R1-B1", warehouseId: "w1", capacity: 100 },
  { id: "l2", code: "A1-R1-B2", warehouseId: "w1", capacity: 120 },
  { id: "l3", code: "B2-Z3-B5", warehouseId: "w2", capacity: 200 },
  { id: "l4", code: "STAGING",  warehouseId: "w1", capacity: 999999 },
];
const products:any = [
  { id: "p1", sku: "SKU-001", name: "Camisa Oversize Negra", uom: "pz" },
  { id: "p2", sku: "SKU-014", name: "Pants Gym Esymbel", uom: "pz" },
  { id: "p3", sku: "SKU-120", name: "Sudadera Zip", uom: "pz" },
  { id: "p4", sku: "SKU-200", name: "Gorra Logo", uom: "pz" },
  { id: "p5", sku: "SKU-301", name: "Calcetas", uom: "pz" },
];
const stock = [
  { productId: "p1", locationId: "l1", qty: 3 },
  { productId: "p1", locationId: "l2", qty: 5 },
  { productId: "p2", locationId: "l1", qty: 8 },
  { productId: "p2", locationId: "l3", qty: 2 },
  { productId: "p3", locationId: "l3", qty: 7 },
  { productId: "p4", locationId: "l4", qty: 12 },
  { productId: "p5", locationId: "l2", qty: 9 },
];

function fold(s: string) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const wParam = searchParams.get("warehouse");
  const warehouse = !wParam || wParam === "all" ? "" : wParam;
  const sort = searchParams.get("sort") || "occupancyDesc"; // occupancyDesc|occupancyAsc|codeAsc|productsDesc
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  const whBy = new Map(warehouses.map(w => [w.id, w] as const));

  // agregación por ubicación
  const rows = locations
    .filter(l => !warehouse || l.warehouseId === warehouse)
    .map(l => {
      const items = stock.filter(s => s.locationId === l.id);
      const onHand = items.reduce((a, x) => a + x.qty, 0);
      const productsCount = new Set(items.map(s => s.productId)).size;
      const occupancy = l.capacity > 0 ? Math.min(100, Math.round((onHand / l.capacity) * 100)) : 0;
      const w = whBy.get(l.warehouseId)!;
      return {
        locationId: l.id,
        code: l.code,
        warehouseId: w.id,
        warehouse: w.name,
        capacity: l.capacity,
        onHand,
        productsCount,
        occupancy,
      };
    })
    .filter(r => !q || fold(r.code).includes(fold(q)) || fold(r.warehouse).includes(fold(q)));

  // orden
  rows.sort((a, b) => {
    switch (sort) {
      case "occupancyAsc": return a.occupancy - b.occupancy;
      case "codeAsc": return a.code.localeCompare(b.code);
      case "productsDesc": return b.productsCount - a.productsCount;
      case "occupancyDesc":
      default: return b.occupancy - a.occupancy;
    }
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, warehouses });
}