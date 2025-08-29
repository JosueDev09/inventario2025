/* eslint-disable prefer-const */
import { NextResponse } from "next/server";
import { getAuthz, computeWarehouseScope, assertWarehouseAllowed } from "@/lib/authz";

// MOCK
type Count = {
  id: string;
  code: string;
  status: "PLANNED" | "IN_PROGRESS" | "CLOSED";
  warehouseId: string;
  area?: string | null;
  scope: "BY_LOCATION" | "BY_PRODUCT";
  scheduledAt: string;
  createdAt: string;
  planned: number;
  counted: number;
};
let counts: Count[] = [
  { id: "c1", code: "CC-001", status: "PLANNED",     warehouseId: "A1", area: "A1-R1", scope: "BY_LOCATION", scheduledAt: "2025-09-05T09:00:00Z", createdAt: "2025-08-20T10:00:00Z", planned: 120, counted: 0 },
  { id: "c2", code: "CC-002", status: "IN_PROGRESS", warehouseId: "A2", area: "Z3",    scope: "BY_LOCATION", scheduledAt: "2025-09-03T09:00:00Z", createdAt: "2025-08-22T10:00:00Z", planned: 80,  counted: 26 },
  { id: "c3", code: "CC-003", status: "CLOSED",      warehouseId: "A1", area: null,    scope: "BY_PRODUCT",  scheduledAt: "2025-08-25T09:00:00Z", createdAt: "2025-08-15T10:00:00Z", planned: 60,  counted: 60 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedWh = searchParams.get("warehouse");
  const status = (searchParams.get("status") || "ALL").toUpperCase();

  const { roleScope, allowedWarehouses } = await getAuthz();
  const { filterMany } = computeWarehouseScope(requestedWh, roleScope, allowedWarehouses);

  let rows = [...counts];

  if (filterMany && filterMany.length) {
    const allow = new Set(filterMany);
    rows = rows.filter((r) => allow.has(r.warehouseId));
  }
  if (status !== "ALL") rows = rows.filter((r) => r.status === status);

  rows.sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));
  return NextResponse.json({ items: rows, total: rows.length });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { roleScope, allowedWarehouses } = await getAuthz();
  // Validación de almacén permitido en alta
  assertWarehouseAllowed(body.warehouseId, roleScope, allowedWarehouses);
  if (!body.code || !body.warehouseId || !body.scope || !body.scheduledAt) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }
  const id = `c${counts.length + 1}`;
  const item: Count = {
    id,
    code: String(body.code),
    status: "PLANNED",
    warehouseId: String(body.warehouseId),
    area: body.area ?? null,
    scope: body.scope === "BY_PRODUCT" ? "BY_PRODUCT" : "BY_LOCATION",
    scheduledAt: String(body.scheduledAt),
    createdAt: new Date().toISOString(),
    planned: Number(body.planned ?? 0),
    counted: 0,
  };
  counts.unshift(item);
  return NextResponse.json({ ok: true, item });
}
