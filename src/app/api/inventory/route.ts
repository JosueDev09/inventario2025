/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// src/app/api/inventory/route.ts
import { NextResponse } from "next/server";

// ----------- MOCK DATA -----------
const warehouses = [
  { id: "w1", name: "Central" },
  { id: "w2", name: "Norte" },
];

const products = [
  { id: "p1", sku: "SKU-001", name: "Camisa Oversize Negra", uom: "pz" },
  { id: "p2", sku: "SKU-014", name: "Pants Gym Esymbel", uom: "pz" },
  { id: "p3", sku: "SKU-120", name: "Sudadera Zip", uom: "pz" },
  { id: "p4", sku: "SKU-200", name: "Gorra Logo", uom: "pz" },
  { id: "p5", sku: "SKU-301", name: "Calcetas", uom: "pz" },
];

const locations = [
  { id: "l1", code: "A1-R1-B1", warehouseId: "w1" },
  { id: "l2", code: "A1-R1-B2", warehouseId: "w1" },
  { id: "l3", code: "B2-Z3-B5", warehouseId: "w2" },
  { id: "l4", code: "STAGING",    warehouseId: "w1" },
];

// stock por (producto, ubicación, lote/serie)
const stock = [
  { productId: "p1", locationId: "l1", qty: 3,  lot: "L-001", serial: null, expiry: "2025-09-10" },
  { productId: "p1", locationId: "l2", qty: 5,  lot: "L-002", serial: null, expiry: "2025-10-05" },
  { productId: "p2", locationId: "l1", qty: 8,  lot: null,   serial: null, expiry: null },
  { productId: "p2", locationId: "l3", qty: 2,  lot: null,   serial: null, expiry: null },
  { productId: "p3", locationId: "l3", qty: 7,  lot: "L-010", serial: null, expiry: "2025-09-01" },
  { productId: "p4", locationId: "l4", qty: 12, lot: null,   serial: null, expiry: null },
  { productId: "p5", locationId: "l2", qty: 9,  lot: null,   serial: null, expiry: null },
];
// ---------------------------------

function fold(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const warehouse = searchParams.get("warehouse") || ""; // id o ""
  const sort = searchParams.get("sort") || "onHandDesc"; // onHandDesc|onHandAsc|nameAsc|expiryAsc
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));
  const low = parseInt(searchParams.get("low") || "", 10); // filtra onHand <= low si viene

  // Filtrado base por almacén
  const locByWh = new Map(locations.map(l => [l.id, l.warehouseId] as const));
  let rows = stock.filter((s) => !warehouse || locByWh.get(s.locationId) === warehouse);

  // Agregar joins
  const prodById = new Map(products.map(p => [p.id, p] as const));
  const locById = new Map(locations.map(l => [l.id, l] as const));
  const whById  = new Map(warehouses.map(w => [w.id, w] as const));

  // Agrupar por producto
  type Agg = {
    productId: string;
    sku: string; name: string; uom: string;
    onHand: number;
    locationsCount: number;
    lotsCount: number;
    earliestExpiry: string | null; // ISO date
    breakdown: Array<{ warehouseId: string; warehouse: string; qty: number }>;
  };
  const byProd = new Map<string, Agg>();

  for (const s of rows) {
    const p = prodById.get(s.productId)!;
    const l = locById.get(s.locationId)!;
    const w = whById.get(l.warehouseId)!;
    const key = p.id;
    const entry = byProd.get(key) || {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      uom: p.uom,
      onHand: 0,
      locationsCount: 0,
      lotsCount: 0,
      earliestExpiry: null,
      breakdown: [],
    };
    entry.onHand += s.qty;
    // locations
    const seenLocs:any = new Set(entry.breakdown.map(b => b.warehouseId + "::" + b.warehouse));
    // breakdown por warehouse
    const idx = entry.breakdown.findIndex(b => b.warehouseId === w.id);
    if (idx >= 0) entry.breakdown[idx].qty += s.qty; else entry.breakdown.push({ warehouseId: w.id, warehouse: w.name, qty: s.qty });
    // lots
    if (s.lot) entry.lotsCount += 1;
    // earliest expiry
    if (s.expiry) {
      if (!entry.earliestExpiry || new Date(s.expiry) < new Date(entry.earliestExpiry)) {
        entry.earliestExpiry = s.expiry;
      }
    }
    // Recalcular locationsCount al final (distinct locations)
    byProd.set(key, entry);
  }

  // locationsCount = ubicaciones distintas por producto
  for (const [pid, entry] of byProd) {
    const locsDistinct = new Set(rows.filter(r => r.productId === pid).map(r => r.locationId));
    entry.locationsCount = locsDistinct.size;
  }

  let items = Array.from(byProd.values());

  // Búsqueda por nombre o SKU
  if (q) {
    const fq = fold(q);
    items = items.filter((it) => fold(it.name).includes(fq) || fold(it.sku).includes(fq));
  }

  // Filtro low stock
  if (!Number.isNaN(low)) {
    items = items.filter((it) => it.onHand <= low);
  }

  // Orden
  items.sort((a, b) => {
    switch (sort) {
      case "onHandAsc": return a.onHand - b.onHand;
      case "nameAsc": return a.name.localeCompare(b.name);
      case "expiryAsc": {
        const da = a.earliestExpiry ? +new Date(a.earliestExpiry) : Infinity;
        const db = b.earliestExpiry ? +new Date(b.earliestExpiry) : Infinity;
        return da - db;
      }
      case "onHandDesc":
      default: return b.onHand - a.onHand;
    }
  });

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, warehouses });
}