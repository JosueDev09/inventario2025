import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

// ⚙️ Config
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret";
const DEV_COMPANY_ID = process.env.DEV_COMPANY_ID || "1";

// Rutas públicas (no requieren sesión)
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/dev",              // tus seeds/dev-tools (borra en prod)
  "/api/_health",          // endpoint de health opcional
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  // estáticos de Next
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/robots.txt") || pathname.startsWith("/sitemap.xml")) return true;
  return false;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret); // HS256 por defecto en tu firma
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1) Deja pasar rutas públicas
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2) Resuelve empresa (localhost => .env)
  const host = req.headers.get("host") || "";
  const companyId =
    host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? DEV_COMPANY_ID
      : req.headers.get("x-company-id") || DEV_COMPANY_ID; // si en prod resuelves por dominio, cámbialo aquí

  // 3) Lee cookies de sesión
  const c = req.cookies;
  const token = c.get("token")?.value || "";
  const cookieRoleScope = c.get("roleScope")?.value ?? "";       // COMPANY | WAREHOUSE
  const cookieAllowed = (c.get("warehouseIds")?.value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 4) Requiere sesión
  if (!token) {
    return redirectToLogin(req);
  }

  // 5) Verifica JWT y deriva contexto
  const payload = await verifyToken(token);
  if (!payload) {
    // token inválido/expirado -> limpia y a login
    const res = redirectToLogin(req);
    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    res.cookies.set("roleScope", "", { path: "/", maxAge: 0 });
    res.cookies.set("warehouseIds", "", { path: "/", maxAge: 0 });
    return res;
  }

  // Claims esperados (según tu firma en /api/auth/login)
  const roleScopeFromToken = (payload.roleScope as string) || "";
  const warehousesFromToken =
    (Array.isArray(payload.warehouses) ? payload.warehouses : []) as string[];

  const roleScope = (roleScopeFromToken || cookieRoleScope || "COMPANY") as
    | "COMPANY"
    | "WAREHOUSE";

  const allowedWarehouses =
    warehousesFromToken.length > 0 ? warehousesFromToken : cookieAllowed;

  // 6) Enforcement: si es WAREHOUSE, no permitir ?warehouse= distinto
  if (roleScope === "WAREHOUSE" && searchParams.has("warehouse")) {
    const w = searchParams.get("warehouse");
    if (w && w !== "all" && !allowedWarehouses.includes(String(w))) {
      // Si es API, responde JSON 403. Si es página, redirige o muestra 403.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Almacén no autorizado" }, { status: 403 });
      }
      const res = NextResponse.redirect(new URL("/dashboard", req.url));
      return res;
    }
  }

  // 7) Inyecta headers para tus APIs/SSR (company/role/warehouses)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-company-id", String(companyId));
  requestHeaders.set("x-role-scope", roleScope);
  requestHeaders.set("x-allowed-warehouses", allowedWarehouses.join(","));

  // (Opcional) si quieres forzar un warehouse por defecto en páginas cuando WAREHOUSE y no hay query:
  // if (!pathname.startsWith("/api/") && roleScope === "WAREHOUSE" && !searchParams.get("warehouse") && allowedWarehouses[0]) {
  //   const url = req.nextUrl.clone();
  //   url.searchParams.set("warehouse", String(allowedWarehouses[0]));
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = ""; // limpia queries
  return NextResponse.redirect(url);
}

// Aplica a todo excepto assets estáticos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
