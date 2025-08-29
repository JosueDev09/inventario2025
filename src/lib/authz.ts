/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";

export type RoleScope = "COMPANY" | "WAREHOUSE";
export async function getAuthz() {
  const h = await headers();
  const companyId = h.get("x-company-id");
  const roleScope:any = (h.get("x-role-scope") ?? "COMPANY") as RoleScope;
  const allowedWarehouses:any = (h.get("x-allowed-warehouses") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!companyId) throw new Error("Falta companyId");
  return { companyId, roleScope, allowedWarehouses };
}

/** Calcula el scope efectivo por almacén según rol + selección */
export function computeWarehouseScope(
  requested: string | null | undefined,
  roleScope: RoleScope,
  allowedWarehouses: string[]
) {
  if (roleScope === "COMPANY") {
    if (!requested || requested === "all") return { filterMany: null as string[] | null }; // todos los de la empresa
    return { filterMany: [requested] };
  }
  // WAREHOUSE
  const set = new Set(allowedWarehouses);
  if (!set.size) throw new Error("Sin almacenes asignados");
  if (!requested || requested === "all") return { filterMany: [...set] };
  if (!set.has(requested)) throw new Error("Almacén no autorizado");
  return { filterMany: [requested] };
}

/** Para POST/PATCH que reciban body.warehouseId: valida que esté permitido */
export function assertWarehouseAllowed(
  warehouseId: string | null | undefined,
  roleScope: RoleScope,
  allowedWarehouses: string[]
) {
  if (!warehouseId) return; // si el recurso no es por almacén específico
  if (roleScope === "COMPANY") return;
  if (!allowedWarehouses.includes(warehouseId)) {
    throw new Error("Almacén no autorizado para este usuario");
  }
}
