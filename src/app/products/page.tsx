/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select/select";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog/dialog";
import { Label } from "@/components/ui/label/label";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

//#region LISTA-PRODUCTO
export default function ProductsPage() {
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [uom, setUom] = React.useState("all");
  const [brand, setBrand] = React.useState("all");
  const [sort, setSort] = React.useState("nameAsc");
  const dq = useDebouncedValue(q, 300);

  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [uoms, setUoms] = React.useState<string[]>([]);
  const [brands, setBrands] = React.useState<string[]>([]);

  async function load(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: dq, category, status, uom, brand, sort, page: String(p), pageSize: String(pageSize) });
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []); setTotal(json.total ?? 0);
      setCategories(json.categories ?? []); setUoms(json.uoms ?? []); setBrands(json.brands ?? []);
    } finally { setLoading(false); }
  }

  React.useEffect(() => { setPage(1); }, [dq, category, status, uom, brand, sort]);
  React.useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [dq, category, status, uom, brand, sort]);

  function exportCSV() {
    const header = ["SKU","Producto","Categoría","Marca","UoM","Mín.","Costo","Precio","Estatus","Creado"];
    const rows = items.map((r: any) => [r.sku, r.name, r.category, r.brand, r.uom, r.minStock ?? "", r.cost ?? "", r.price ?? "", r.status, new Date(r.createdAt).toLocaleString()]);
    const csv = [header, ...rows].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `products_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function toggleStatus(p: any) {
    const next = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`¿Deseas ${next === "INACTIVE" ? "INACTIVAR" : "ACTIVAR"} el producto ${p.sku}?`)) return;
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load(page);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Productos</CardTitle>
          <NewProductButton categories={categories} uoms={uoms} brands={brands} onCreated={() => load(1)} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Input value={q} onChange={(e:any) => setQ(e.target.value)} placeholder="Buscar por nombre, SKU o código de barras" />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Estatus" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
            </SelectContent>
          </Select>

          <Select value={uom} onValueChange={setUom}>
            <SelectTrigger><SelectValue placeholder="UoM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uoms.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue placeholder="Orden" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nameAsc">Nombre A→Z</SelectItem>
              <SelectItem value="skuAsc">SKU A→Z</SelectItem>
              <SelectItem value="priceDesc">Precio ↓</SelectItem>
              <SelectItem value="priceAsc">Precio ↑</SelectItem>
              <SelectItem value="createdDesc">Creado ↓</SelectItem>
            </SelectContent>
          </Select>

          <div className="md:col-span-6 flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setQ(""); setCategory("all"); setStatus("all"); setUom("all"); setBrand("all"); setSort("nameAsc"); }}>
              Limpiar
            </Button>
            <Button onClick={exportCSV} className="ml-auto">Exportar CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-left">Marca</th>
                <th className="p-2 text-center">UoM</th>
                <th className="p-2 text-center">Mín.</th>
                <th className="p-2 text-center">Costo</th>
                <th className="p-2 text-center">Precio</th>
                <th className="p-2 text-left">Estatus</th>
                <th className="p-2 text-left">Creado</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={11}>Cargando…</td></tr>}
              {!loading && items.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={11}>Sin resultados.</td></tr>}
              {!loading && items.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{r.sku}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.category}</td>
                  <td className="p-2">{r.brand}</td>
                  <td className="p-2 text-center">{r.uom}</td>
                  <td className="p-2 text-center">{r.minStock ?? "—"}</td>
                  <td className="p-2 text-center">{r.cost != null ? new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(r.cost) : "—"}</td>
                  <td className="p-2 text-center">{r.price != null ? new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(r.price) : "—"}</td>
                  <td className="p-2">
                    <Badge variant={r.status === "ACTIVE" ? "outline" : "secondary"}>{r.status}</Badge>
                  </td>
                  <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <EditProductButton product={r} categories={categories} uoms={uoms} brands={brands} onUpdated={() => load(page)} />
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(r)}>
                        {r.status === "ACTIVE" ? "Inactivar" : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
//#endregion

//#region NUEVO-PRODUCTO
function NewProductButton({
  categories, uoms, brands, onCreated,
}: { categories: { id: string; name: string }[]; uoms: string[]; brands: string[]; onCreated: () => void; }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sku, setSku] = React.useState("");
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("all");
  const [uom, setUom] = React.useState("all");
  const [brand, setBrand] = React.useState("Genérico");
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  async function submit() {
    if (!sku || !name || categoryId === "all" || uom === "all") return;
    setLoading(true);
    try {
      const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku, name, categoryId, uom, brand, status }) });
      if (res.ok) {
        setOpen(false);
        setSku(""); setName(""); setCategoryId("all"); setUom("all"); setBrand("Genérico"); setStatus("ACTIVE");
        onCreated();
      }
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Nuevo producto</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="SKU"><Input value={sku} onChange={(e:any)=>setSku(e.target.value)} placeholder="SKU-000" /></Field>
          <Field label="Nombre"><Input value={name} onChange={(e:any )=>setName(e.target.value)} placeholder="Nombre del producto" /></Field>
          <Field label="Categoría">
            <Select  value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[550px]"><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent className="w-[550px]">
                <SelectItem value="all" disabled>Selecciona…</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="UoM">
            <Select value={uom} onValueChange={setUom}>
              <SelectTrigger className="w-[550px]"><SelectValue placeholder="Selecciona UoM" /></SelectTrigger>
              <SelectContent className="w-[550px]">
                <SelectItem value="all" disabled>Selecciona…</SelectItem>
                {uoms.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Marca">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[550px]"><SelectValue /></SelectTrigger>
              <SelectContent className="w-[550px]">
                {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estatus">
            <Select value={status} onValueChange={(v:any)=>setStatus(v as any)}>
              <SelectTrigger className="w-[550px]"><SelectValue /></SelectTrigger>
              <SelectContent className="w-[550px]">
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={loading || !sku || !name || categoryId==="all" || uom==="all"}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
//#endregion


//#region EDITAR-PRODUCTOS

function EditProductButton({
  product, categories, uoms, brands, onUpdated,
}: { product: any; categories: { id: string; name: string }[]; uoms: string[]; brands: string[]; onUpdated: () => void; }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState(product.name);
  const [categoryId, setCategoryId] = React.useState(product.categoryId);
  const [uom, setUom] = React.useState(product.uom);
  const [brand, setBrand] = React.useState(product.brand);
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE">(product.status);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId, uom, brand, status }),
      });
      if (res.ok) {
        setOpen(false);
        onUpdated();
      }
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Editar</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader><DialogTitle>Editar {product.sku}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="SKU (no editable)"><Input value={product.sku} disabled /></Field>
          <Field label="Nombre"><Input value={name} onChange={(e:any)=>setName(e.target.value)} /></Field>
          <Field label="Categoría">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[550px]"><SelectValue /></SelectTrigger>
              <SelectContent className="w-[550px]">
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="UoM">
            <Select value={uom} onValueChange={setUom}>
              <SelectTrigger className="w-[550px]"><SelectValue /></SelectTrigger>
              <SelectContent className="w-[550px]">
                {uoms.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Marca">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[550px]"><SelectValue /></SelectTrigger>
              <SelectContent className="w-[550px]">
                {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estatus">
            <Select value={status} onValueChange={(v:any)=>setStatus(v as any)}>
              <SelectTrigger className="w-[550px]"><SelectValue /></SelectTrigger>
              <SelectContent className="w-[550px]">
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={loading || !name}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
//#endregion

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
