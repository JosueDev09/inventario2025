/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    const companyId = Number((await headers()).get("x-company-id"));
    if (!companyId) return NextResponse.json({ error: "Empresa no resuelta" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      include: {
        companyRoles: { where: { companyId } },
        warehouseAccess: { include: { warehouse: { select: { id: true, companyId: true } } } },
      },
    });
    if (!user || !user.isActive) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const hasCompanyRole = user.companyRoles.length > 0;
    const roleScope = hasCompanyRole ? "COMPANY" : "WAREHOUSE";
    const warehouseIds = hasCompanyRole
      ? [] // la UI podrá elegir "Todos"; el backend permite ver todos
      : user.warehouseAccess.filter((a:any) => a.warehouse.companyId === companyId).map((a:any) => String(a.warehouse.id));

    if (roleScope === "WAREHOUSE" && warehouseIds.length === 0) {
      return NextResponse.json({ error: "Sin almacenes asignados" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      companyId,
      roleScope,
      warehouseIds,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error en login" }, { status: 500 });
  }
}
