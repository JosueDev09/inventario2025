import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Solo API
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const companyId = req.cookies.get("companyId")?.value;
  if (!companyId) {
    return NextResponse.json({ error: "Falta companyId" }, { status: 401 });
  }

  const roleScope = req.cookies.get("roleScope")?.value ?? "COMPANY"; // COMPANY | WAREHOUSE
  const allowedWarehouses = (req.cookies.get("warehouseIds")?.value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // --- Validación de query ?warehouse= para usuarios de almacén ---
  if (roleScope === "WAREHOUSE") {
    const w = req.nextUrl.searchParams.get("warehouse");
    if (w && w !== "all" && !allowedWarehouses.includes(w)) {
      return NextResponse.json({ error: "Almacén no autorizado" }, { status: 403 });
    }
  }

  // Inyecta headers hacia los route handlers (para no depender de cookies ahí)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-company-id", companyId);
  requestHeaders.set("x-role-scope", roleScope);
  requestHeaders.set("x-allowed-warehouses", allowedWarehouses.join(","));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/api/:path*"] };
