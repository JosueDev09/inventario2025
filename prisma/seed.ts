import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { slug: "dev" },
    update: {},
    create: { slug: "dev", name: "Empresa Dev" },
  });

  const [a1, a2] = await Promise.all([
    prisma.warehouse.upsert({
      where: { companyId_code: { companyId: company.id, code: "A1" } },
      update: {},
      create: { companyId: company.id, code: "A1", name: "Almacén A1" },
    }),
    prisma.warehouse.upsert({
      where: { companyId_code: { companyId: company.id, code: "A2" } },
      update: {},
      create: { companyId: company.id, code: "A2", name: "Almacén A2" },
    }),
  ]);

  const adminPwd = await bcrypt.hash("Password.123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: { email: "admin@empresa.com", passwordHash: adminPwd, name: "Admin" },
  });
  await prisma.userCompanyRole.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: company.id } },
    update: { role: "ADMIN" },
    create: { userId: admin.id, companyId: company.id, role: "ADMIN" },
  });

  const a1Pwd = await bcrypt.hash("Password.123", 10);
  const userA1 = await prisma.user.upsert({
    where: { email: "a1@empresa.com" },
    update: {},
    create: { email: "a1@empresa.com", passwordHash: a1Pwd, name: "Operador A1" },
  });
  await prisma.userWarehouseAccess.upsert({
    where: { userId_warehouseId: { userId: userA1.id, warehouseId: a1.id } },
    update: {},
    create: { userId: userA1.id, warehouseId: a1.id },
  });

  console.log("Seed listo:", { company: company.id, a1: a1.id, a2: a2.id });
}

main().finally(() => prisma.$disconnect());
