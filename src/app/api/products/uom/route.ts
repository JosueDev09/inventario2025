import { NextResponse } from "next/server";
import { uoms } from "@/lib/mock/products";

export async function GET() {
  return NextResponse.json({ items: uoms, total: uoms.length });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const n = String(name ?? "").trim();
  if (!n) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (uoms.some(u => u.toLowerCase() === n.toLowerCase())) {
    return NextResponse.json({ error: "La UoM ya existe" }, { status: 409 });
  }
  uoms.push(n);
  return NextResponse.json({ ok: true, item: n });
}

export async function PATCH(req: Request) {
  const { oldName, newName } = await req.json();
  const from = String(oldName ?? "").trim();
  const to = String(newName ?? "").trim();
  const i = uoms.findIndex(u => u === from);
  if (i < 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!to) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (uoms.some(u => u.toLowerCase() === to.toLowerCase())) {
    return NextResponse.json({ error: "La UoM ya existe" }, { status: 409 });
  }
  uoms[i] = to;
  return NextResponse.json({ ok: true, item: to });
}
