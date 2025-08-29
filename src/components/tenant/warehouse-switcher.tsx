/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select/select";

type Warehouse = { id: string; code: string; name: string };

export function WarehouseSwitcher({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [items, setItems] = React.useState<Warehouse[]>([]);
  const [value, setValue] = React.useState<string>("");

  React.useEffect(() => {
    fetch("/api/tenancy/warehouses")
      .then((r) => r.json())
      .then((j) => {
        const list = j.items ?? [];
        setItems(list);
        setValue(list[0]?.id ?? "");
      });
  }, []);

  // Si el usuario solo tiene acceso a 1 almacén, mostramos etiqueta y no el selector
  if (items.length <= 1) {
    return (
      <div className={`text-xs px-2 py-1 rounded border bg-muted/40 ${className}`}>
        {items[0]?.name ?? "Sin almacén"}
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={async (v:any) => {
        setValue(v);
        await fetch("/api/tenancy/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ warehouseIds: [v] }),
        });
        router.refresh(); // re-render de Server Components con el nuevo almacén
      }}
    >
      <SelectTrigger className={`h-8 text-xs ${className}`}>
        <SelectValue placeholder="Almacén" />
      </SelectTrigger>
      <SelectContent>
        {items.map((w) => (
          <SelectItem key={w.id} value={w.id} className="text-xs">
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
