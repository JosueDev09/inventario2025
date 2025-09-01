import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware multi-tenant:
 * - En localhost: fija companyId desde .env (DEV_COMPANY_ID / DEV_TENANT_SLUG).
 * - En prod: (opcional) resuelve por /api/tenancy/resolve?host=... si lo tienes.
 * - Inyecta headers: x-company-id, x-company-slug, x-role-scope, x-allowed-warehouses.
 * - Valida que usuarios de almacén no puedan consultar otros via ?warehouse=.
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";

  // Evita bucle si llamas a tu propio resolver
  if (url.pathname.startsWith("/api/tenancy/resolve")) {
    return NextResponse.next();
  }

  // 1) Resolver empresa (tenant)
  let company: { id: string; slug?: string } | null = null;

  // a) DEV/localhost: usa .env local
  if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
    const id = process.env.DEV_COMPANY_ID || "1";
    const slug = process.env.DEV_TENANT_SLUG || "dev";
    company = { id, slug };
  } else {
    // b) PROD: intenta resolver por API (si implementaste /api/tenancy/resolve)
    try {
      const res = await fetch(`${url.origin}/api/tenancy/resolve?host=${encodeURIComponent(host)}`, {
        headers: { "x-mw": "1" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        company = json.company ?? null;
      }
    } catch {
      // si no existe el resolver, company quedará null
    }
  }

  // Si no tenemos empresa, redirige a /login (o muestra 404 si prefieres)
  if (!company) {
    // En localhost no deberías entrar aquí si configuraste DEV_COMPANY_ID
    return NextResponse.redirect(new URL("/login", url));
  }

  // 2) Rol/Scope desde cookies (seteadas en login con /api/tenancy/activate)
  const roleScope = req.cookies.get("roleScope")?.value ?? "COMPANY"; // COMPANY | WAREHOUSE
  const allowedWarehouses = (req.cookies.get("warehouseIds")?.value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 3) Validación: usuario WAREHOUSE no puede pedir otros almacenes por query
  if (roleScope === "WAREHOUSE" && url.searchParams.has("warehouse")) {
    const w = url.searchParams.get("warehouse");
    if (w && w !== "all" && !allowedWarehouses.includes(w)) {
      return NextResponse.json({ error: "Almacén no autorizado" }, { status: 403 });
    }
  }

  // 4) Inyecta contexto a headers (para APIs y Server Components)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-company-id", String(company.id));
  requestHeaders.set("x-company-slug", String(company.slug || ""));
  requestHeaders.set("x-role-scope", roleScope);
  requestHeaders.set("x-allowed-warehouses", allowedWarehouses.join(","));

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // 5) (Cómodo) fija cookie companyId si no existe
  if (!req.cookies.get("companyId")?.value) {
    res.cookies.set("companyId", String(company.id), { path: "/" });
  }

  return res;
}

// Aplica a todo menos assets estáticos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
