import { NextResponse } from "next/server";
import { brands } from "@/lib/mock/products";

export async function GET() {
  return NextResponse.json({ items: brands, total: brands.length });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const n = String(name ?? "").trim();
  if (!n) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (brands.some(b => b.toLowerCase() === n.toLowerCase())) {
    return NextResponse.json({ error: "La marca ya existe" }, { status: 409 });
  }
  brands.push(n);
  return NextResponse.json({ ok: true, item: n });
}

export async function PATCH(req: Request) {
  const { oldName, newName } = await req.json();
  const from = String(oldName ?? "").trim();
  const to = String(newName ?? "").trim();
  const i = brands.findIndex(b => b === from);
  if (i < 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!to) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (brands.some(b => b.toLowerCase() === to.toLowerCase())) {
    return NextResponse.json({ error: "La marca ya existe" }, { status: 409 });
  }
  brands[i] = to;
  return NextResponse.json({ ok: true, item: to });
}
