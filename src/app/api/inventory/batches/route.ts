import { NextResponse } from "next/server";

// ====== MOCK SHARED (puedes mover a un módulo común) ======
const warehouses = [
  { id: "w1", name: "Central" },
  { id: "w2", name: "Norte" },
];

const locations = [
  { id: "l1", code: "A1-R1-B1", warehouseId: "w1", capacity: 100 },
  { id: "l2", code: "A1-R1-B2", warehouseId: "w1", capacity: 120 },
  { id: "l3", code: "B2-Z3-B5", warehouseId: "w2", capacity: 200 },
  { id: "l4", code: "STAGING",  warehouseId: "w1", capacity: 999999 },
];

const products = [
  { id: "p1", sku: "SKU-001", name: "Camisa Oversize Negra", uom: "pz" },
  { id: "p2", sku: "SKU-014", name: "Pants Gym Esymbel", uom: "pz" },
  { id: "p3", sku: "SKU-120", name: "Sudadera Zip", uom: "pz" },
  { id: "p4", sku: "SKU-200", name: "Gorra Logo", uom: "pz" },
  { id: "p5", sku: "SKU-301", name: "Calcetas", uom: "pz" },
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
  // ejemplo con series
  { productId: "p1", locationId: "l1", qty: 1,  lot: null, serial: "S-0001", expiry: null },
  { productId: "p1", locationId: "l1", qty: 1,  lot: null, serial: "S-0002", expiry: null },
];
// ==========================================================

function fold(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const wParam = searchParams.get("warehouse");
  const warehouse = !wParam || wParam === "all" ? "" : wParam;
  const kind = searchParams.get("kind") || "all"; // all|lot|serial
  const expiryDays = parseInt(searchParams.get("expiryDays") || "", 10); // <= días
  const sort = searchParams.get("sort") || "expiryAsc"; // expiryAsc|qtyDesc|qtyAsc|nameAsc
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  const prodBy = new Map(products.map(p => [p.id, p] as const));
  const locBy  = new Map(locations.map(l => [l.id, l] as const));
  const whBy   = new Map(warehouses.map(w => [w.id, w] as const));

  let rows = stock
    .filter(s => !warehouse || locBy.get(s.locationId)?.warehouseId === warehouse)
    .map(s => {
      const p = prodBy.get(s.productId)!;
      const l = locBy.get(s.locationId)!;
      const w = whBy.get(l.warehouseId)!;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        uom: p.uom,
        location: l.code,
        warehouseId: w.id,
        warehouse: w.name,
        lot: s.lot,
        serial: s.serial,
        qty: s.qty,
        expiry: s.expiry,
      };
    });

  // filtro por tipo (lote/serie)
  if (kind === "lot") rows = rows.filter(r => r.lot);
  if (kind === "serial") rows = rows.filter(r => r.serial);

  // filtro de búsqueda (sku/nombre/lote/serie/location)
  if (q) {
    const fq = fold(q);
    rows = rows.filter(r =>
      fold(r.sku).includes(fq) ||
      fold(r.name).includes(fq) ||
      (r.lot && fold(r.lot).includes(fq)) ||
      (r.serial && fold(r.serial).includes(fq)) ||
      fold(r.location).includes(fq)
    );
  }

  // filtro por caducidad próxima
  if (!Number.isNaN(expiryDays)) {
    const now = Date.now();
    const ms = expiryDays * 24 * 60 * 60 * 1000;
    rows = rows.filter(r => r.expiry && (+new Date(r.expiry) - now) <= ms);
  }

  // orden
  rows.sort((a, b) => {
    switch (sort) {
      case "qtyDesc": return b.qty - a.qty;
      case "qtyAsc": return a.qty - b.qty;
      case "nameAsc": return a.name.localeCompare(b.name);
      case "expiryAsc":
      default: {
        const da = a.expiry ? +new Date(a.expiry) : Infinity;
        const db = b.expiry ? +new Date(b.expiry) : Infinity;
        return da - db;
      }
    }
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, warehouses });
}