import { NextResponse } from "next/server";
import { categories } from "@/lib/mock/products";

export async function GET() {
  return NextResponse.json({ items: categories, total: categories.length });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const n = String(name ?? "").trim();
  if (!n) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (categories.some(c => c.name.toLowerCase() === n.toLowerCase())) {
    return NextResponse.json({ error: "La categoría ya existe" }, { status: 409 });
  }
  const id = `c${categories.length + 1}`;
  categories.push({ id, name: n });
  return NextResponse.json({ ok: true, item: { id, name: n } });
}

export async function PATCH(req: Request) {
  const { id, name } = await req.json();
  const n = String(name ?? "").trim();
  const i = categories.findIndex(c => c.id === id);
  if (i < 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!n) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (categories.some(c => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) {
    return NextResponse.json({ error: "La categoría ya existe" }, { status: 409 });
  }
  categories[i].name = n;
  return NextResponse.json({ ok: true, item: categories[i] });
}
