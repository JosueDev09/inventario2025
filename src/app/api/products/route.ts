/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { productsDb, categories, uoms, brands, Product } from "@/lib/mock/products";

function fold(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || "all";
  const status = (searchParams.get("status") || "all").toUpperCase() as "ALL" | "ACTIVE" | "INACTIVE";
  const uom = searchParams.get("uom") || "all";
  const brand = searchParams.get("brand") || "all";
  const sort = searchParams.get("sort") || "nameAsc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  let rows = [...productsDb];

  if (q) {
    const fq = fold(q);
    rows = rows.filter(p => fold(p.name).includes(fq) || fold(p.sku).includes(fq) || (p.barcode && fold(p.barcode).includes(fq)));
  }
  if (category !== "all") rows = rows.filter(p => p.categoryId === category);
  if (status !== "ALL")  rows = rows.filter(p => p.status === status);
  if (uom !== "all")     rows = rows.filter(p => p.uom === uom);
  if (brand !== "all")   rows = rows.filter(p => p.brand === brand);

  rows.sort((a, b) => {
    switch (sort) {
      case "skuAsc":      return a.sku.localeCompare(b.sku);
      case "priceDesc":   return (b.price ?? 0) - (a.price ?? 0);
      case "priceAsc":    return (a.price ?? 0) - (b.price ?? 0);
      case "createdDesc": return +new Date(b.createdAt) - +new Date(a.createdAt);
      case "nameAsc":
      default:            return a.name.localeCompare(b.name);
    }
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, categories, uoms, brands });
}

export async function POST(req: Request) {
  const body = await req.json();
  const cat = categories.find((c: { id: any; }) => c.id === body.categoryId);
  if (!cat) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  if (!body.sku || !body.name || !body.uom || !body.status) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }
  const exists = productsDb.some((p: { sku: any; }) => p.sku === body.sku);
  if (exists) return NextResponse.json({ error: "SKU ya existe" }, { status: 409 });

  const p: Product = {
    id: `p${productsDb.length + 1}`,
    sku: String(body.sku),
    name: String(body.name),
    categoryId: cat.id,
    category: cat.name,
    brand: body.brand || "Genérico",
    uom: String(body.uom),
    barcode: body.barcode ?? null,
    minStock: body.minStock != null ? Number(body.minStock) : null,
    cost: body.cost != null ? Number(body.cost) : null,
    price: body.price != null ? Number(body.price) : null,
    status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    createdAt: new Date().toISOString(),
  };
  productsDb.unshift(p);
  return NextResponse.json({ ok: true, item: p });
}
