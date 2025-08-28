/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getProduct, updateProduct, categories } from "@/lib/mock/products";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = getProduct(params.id);
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ item });
}

// PATCH permite editar campos permitidos y cambiar status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();

  // Si intenta cambiar SKU, lo ignoramos (inmutable en este mock)
  if (typeof body.categoryId === "string") {
    const cat = categories.find(c => c.id === body.categoryId);
    if (!cat) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }

  try {
    const updated = updateProduct(params.id, body);
    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error al actualizar" }, { status: 400 });
  }
}
