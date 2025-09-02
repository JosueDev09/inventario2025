/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const companyId = Number((await headers()).get("x-company-id"));
  if (!companyId) return NextResponse.json({ error: "Sin empresa" }, { status: 400 });

  let items = await prisma.warehouse.findMany({
    where: { companyId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  const roleScope = (await cookies()).get("roleScope")?.value ?? "COMPANY";
  if (roleScope === "WAREHOUSE") {
    const allowed = new Set(((await cookies()).get("warehouseIds")?.value ?? "").split(",").filter(Boolean));
    items = items.filter((w:any) => allowed.has(String(w.id)));
  }

  return NextResponse.json({ items });
}