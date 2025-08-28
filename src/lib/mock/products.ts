/* eslint-disable prefer-const */
export type Status = "ACTIVE" | "INACTIVE";

export type Product = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category: string;
  brand: string;
  uom: string;
  barcode?: string | null;
  minStock?: number | null;
  cost?: number | null;
  price?: number | null;
  status: Status;
  createdAt: string; // ISO
};

export const categories = [
  { id: "c1", name: "Ropa" },
  { id: "c2", name: "Accesorios" },
  { id: "c3", name: "Materia Prima" },
];

export const uoms = ["pz", "kg", "m", "lt"];
export const brands = ["Esymbel", "Genérico", "Otro"];

// Simula tu base por ahora (memoria compartida entre endpoints)
export let productsDb: Product[] = [
  { id: "p1", sku: "SKU-001", name: "Camisa Oversize Negra", categoryId: "c1", category: "Ropa", brand: "Esymbel", uom: "pz", barcode: "750000000001", minStock: 5, cost: 180, price: 349, status: "ACTIVE", createdAt: "2025-08-20T10:00:00Z" },
  { id: "p2", sku: "SKU-014", name: "Pants Gym Esymbel",      categoryId: "c1", category: "Ropa", brand: "Esymbel", uom: "pz", barcode: "750000000014", minStock: 10, cost: 260, price: 499, status: "ACTIVE", createdAt: "2025-08-18T09:40:00Z" },
  { id: "p3", sku: "SKU-120", name: "Sudadera Zip",            categoryId: "c1", category: "Ropa", brand: "Esymbel", uom: "pz", barcode: null,             minStock: 4,  cost: 320, price: 699, status: "INACTIVE", createdAt: "2025-08-12T14:10:00Z" },
  { id: "p4", sku: "SKU-200", name: "Gorra Logo",              categoryId: "c2", category: "Accesorios", brand: "Esymbel", uom: "pz", barcode: null,     minStock: 8,  cost: 90,  price: 199, status: "ACTIVE", createdAt: "2025-08-22T08:00:00Z" },
  { id: "p5", sku: "SKU-301", name: "Calcetas",                categoryId: "c2", category: "Accesorios", brand: "Genérico", uom: "pz", barcode: null,    minStock: 12, cost: 40,  price: 99,  status: "ACTIVE", createdAt: "2025-08-10T08:00:00Z" },
];

export function getProduct(id: string) {
  return productsDb.find(p => p.id === id) || null;
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const i = productsDb.findIndex(p => p.id === id);
  if (i < 0) return null;
  const current = productsDb[i];

  // SKU NO se cambia (trazabilidad). Si viene, se ignora.
  const { sku: _ignoreSku, id: _ignoreId, createdAt: _ignoreCreatedAt, ...allowed } = patch;

  // Si actualiza categoría, también el nombre legible
  let categoryName = current.category;
  if (allowed.categoryId) {
    const cat = categories.find(c => c.id === allowed.categoryId);
    if (!cat) throw new Error("Categoría inválida");
    categoryName = cat.name;
  }

  const updated: Product = {
    ...current,
    ...allowed,
    category: allowed.categoryId ? categoryName : current.category,
  };
  productsDb[i] = updated;
  return updated;
}
