import { cookies, headers } from "next/headers";

export type TenantCtx = { companyId: string; warehouseId?: string | null };

export function requireTenant(): TenantCtx {
  const h = headers();
  const c = cookies();
  const companyId = h.get("x-company-id") || c.get("companyId")?.value;
  if (!companyId) throw new Error("Missing companyId");
  const warehouseId = h.get("x-warehouse-id") || c.get("warehouseId")?.value || null;
  return { companyId, warehouseId };
}
