import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import LineReceipts from "@/components/ui/charts/line-receipts";

// ---- MOCK DATA (sin Prisma) ----
const MOCK = {
  totalProducts: 12,
  openPOs: 3,
  chartData: [
    { date: "2025-08-15", value: 1 },
    { date: "2025-08-16", value: 2 },
    { date: "2025-08-17", value: 0 },
    { date: "2025-08-18", value: 3 },
    { date: "2025-08-19", value: 4 },
    { date: "2025-08-20", value: 2 },
    { date: "2025-08-21", value: 5 },
    { date: "2025-08-22", value: 1 },
    { date: "2025-08-23", value: 2 },
    { date: "2025-08-24", value: 4 },
    { date: "2025-08-25", value: 6 },
    { date: "2025-08-26", value: 3 },
    { date: "2025-08-27", value: 2 },
    { date: "2025-08-28", value: 4 },
  ],
  receipts: [
    { id: "r1", code: "GRN-2025-0001", purchaseOrderCode: "PO-2025-AB12", lines: 3, receivedAt: "2025-08-25T10:34:00Z" },
    { id: "r2", code: "GRN-2025-0002", purchaseOrderCode: "PO-2025-CD34", lines: 5, receivedAt: "2025-08-26T09:12:00Z" },
    { id: "r3", code: "GRN-2025-0003", purchaseOrderCode: "PO-2025-EF56", lines: 2, receivedAt: "2025-08-27T15:28:00Z" },
  ],
  lowStock: [
    { sku: "SKU-001", name: "Camisa Oversize Negra", uom: "pz", qty: 3 },
    { sku: "SKU-014", name: "Pants Gym Esymbel", uom: "pz", qty: 5 },
    { sku: "SKU-120", name: "Sudadera Zip", uom: "pz", qty: 7 },
    { sku: "SKU-200", name: "Gorra Logo", uom: "pz", qty: 8 },
    { sku: "SKU-301", name: "Calcetas", uom: "pz", qty: 9 },
  ],
};

export default function DashboardPage() {
  const { totalProducts, openPOs, chartData, receipts, lowStock } = MOCK;
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>OC abiertas</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{openPOs}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recepciones (14 días)</CardTitle></CardHeader>
          <CardContent className="h-36">
            <LineReceipts data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimas recepciones */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Últimas recepciones</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">Folio</th>
                  <th className="p-2 text-left">OC</th>
                  <th className="p-2 text-center">Líneas</th>
                  <th className="p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="p-2">{r.code}</td>
                    <td className="p-2">{r.purchaseOrderCode}</td>
                    <td className="p-2 text-center">{r.lines}</td>
                    <td className="p-2">{new Date(r.receivedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr><td className="p-3 text-muted-foreground" colSpan={4}>Sin recepciones.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Stock bajo */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Stock bajo (Top 5)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-center">Cant.</th>
                  <th className="p-2 text-center">UoM</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((row, i) => (
                  <tr key={row.sku + i} className="border-t hover:bg-muted/30">
                    <td className="p-2">{row.sku}</td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2 text-center">{row.qty}</td>
                    <td className="p-2 text-center">{row.uom}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td className="p-3 text-muted-foreground" colSpan={4}>No hay datos.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
       
        <QuickLink href="/purchasing/search" label="Ver Órdenes" />
        <QuickLink href="/receiving" label="Recibir mercancía" />
        <QuickLink href="/inventory" label="Inventario" />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group rounded-xl border bg-card/70 p-4 transition-colors hover:bg-accent">
      <div className="text-sm font-medium">{label} →</div>
      <div className="text-xs text-muted-foreground">Ir a {label.toLowerCase()}</div>
    </Link>
  );
}