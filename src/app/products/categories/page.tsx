"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog/dialog";
import { Label } from "@/components/ui/label/label";

export default function CategoriesPage() {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<{id:string;name:string}[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/products/categories");
      const json = await res.json();
      setItems(json.items ?? []);
    } finally { setLoading(false); }
  }
  React.useEffect(() => { load(); }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Categorías</CardTitle>
          <NewCategoryButton onCreated={load} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar categoría" />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3" colSpan={3}>Cargando…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={3}>Sin resultados.</td></tr>}
              {!loading && filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">
                    <EditCategoryButton id={c.id} name={c.name} onUpdated={load} />
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

function NewCategoryButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/products/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) { setOpen(false); setName(""); onCreated(); }
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Nueva categoría</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ej. Ropa" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={loading || !name.trim()}>{loading ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryButton({ id, name: initial, onUpdated }: { id: string; name: string; onUpdated: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(()=>{ if (open) setName(initial); }, [open, initial]);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/products/categories", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) { setOpen(false); onUpdated(); }
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Editar</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e)=>setName(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={loading || !name.trim()}>{loading ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
