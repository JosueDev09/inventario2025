import { NextResponse } from "next/server";

const warehouses = [ { id: "w1", name: "Central" }, { id: "w2", name: "Norte" } ];

type CountStatus = "PLANNED" | "IN_PROGRESS" | "CLOSED";
type CountRow = {
  id: string;
  code: string;
  status: CountStatus;
  warehouseId: string;
  area: string;
  scope: string; // By Location / By Product
  scheduledDate: string; // YYYY-MM-DD
  createdAt: string; // ISO
  itemsPlanned: number;
  itemsCounted: number;
};

const counts: CountRow[] = [
  { id: "c1", code: "CNT-2025-0001", status: "PLANNED",      warehouseId: "w1", area: "A1-R1", scope: "By Location", scheduledDate: "2025-09-05", createdAt: "2025-08-25T10:00:00Z", itemsPlanned: 25, itemsCounted: 0 },
  { id: "c2", code: "CNT-2025-0002", status: "IN_PROGRESS",  warehouseId: "w1", area: "A1-R2", scope: "By Location", scheduledDate: "2025-09-01", createdAt: "2025-08-26T09:00:00Z", itemsPlanned: 30, itemsCounted: 12 },
  { id: "c3", code: "CNT-2025-0003", status: "CLOSED",       warehouseId: "w2", area: "B2-Z3", scope: "By Product",  scheduledDate: "2025-08-20", createdAt: "2025-08-18T12:10:00Z", itemsPlanned: 18, itemsCounted: 18 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const wParam = searchParams.get("warehouse");
  const warehouse = !wParam || wParam === "all" ? "" : wParam;
  const status = (searchParams.get("status") || "all").toUpperCase(); // all|PLANNED|IN_PROGRESS|CLOSED
  const dateFrom = searchParams.get("from"); // YYYY-MM-DD
  const dateTo = searchParams.get("to");     // YYYY-MM-DD
  const sort = searchParams.get("sort") || "scheduledAsc"; // scheduledAsc|createdDesc|status
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  const whBy = new Map(warehouses.map(w => [w.id, w] as const));

  let rows = counts
    .filter(c => !warehouse || c.warehouseId === warehouse)
    .filter(c => status === "ALL" ? true : c.status === status)
    .map(c => ({
      ...c,
      warehouse: whBy.get(c.warehouseId)!.name,
      progress: c.itemsPlanned > 0 ? Math.round((c.itemsCounted / c.itemsPlanned) * 100) : 0,
    }));

  if (q) {
    const fq = q.toLowerCase();
    rows = rows.filter(r => r.code.toLowerCase().includes(fq) || r.area.toLowerCase().includes(fq) || r.scope.toLowerCase().includes(fq));
  }
  if (dateFrom) rows = rows.filter(r => r.scheduledDate >= dateFrom);
  if (dateTo)   rows = rows.filter(r => r.scheduledDate <= dateTo);

  rows.sort((a, b) => {
    switch (sort) {
      case "createdDesc": return +new Date(b.createdAt) - +new Date(a.createdAt);
      case "status": return a.status.localeCompare(b.status);
      case "scheduledAsc":
      default: return a.scheduledDate.localeCompare(b.scheduledDate);
    }
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, warehouses });
}
