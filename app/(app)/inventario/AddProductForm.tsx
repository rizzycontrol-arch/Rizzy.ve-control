"use client";
import { useState } from "react";
import { addProduct } from "./actions";
export default function AddProductForm({ prodTypes }: { prodTypes: string[] }) {
const [variations, setVariations] = useState<{ key: number; name: string; stock: string }[]>([]);
const [nextKey, setNextKey] = useState(0);
function addRow() {
setVariations((v) => [...v, { key: nextKey, name: "", stock: "" }]);
setNextKey((k) => k + 1);
}
function removeRow(key: number) {
setVariations((v) => v.filter((r) => r.key !== key));
}
function updateRow(key: number, field: "name" | "stock", value: string) {
setVariations((v) => v.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
}
const hasVariations = variations.length > 0;
return (
<form action={addProduct} className="grid grid-cols-2 gap-3">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Nombre</label>
<input type="text" name="name" required className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Categoría</label>
<select name="type" className="input-rz">
{prodTypes.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Marca</label>
<input type="text" name="brand" className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Costo</label>
<input type="number" step="0.01" name="cost" className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Precio de Venta</label>
<input type="number" step="0.01" name="price" required className="input-rz" />
</div>
{!hasVariations && (
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Stock Inicial</label>
<input type="number" step="1" name="stock" defaultValue={0} className="input-rz" />
</div>
)}
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Stock Mínimo</label>
<input type="number" step="1" name="minStock" defaultValue={5} className="input-rz" />
</div>
<div className="col-span-2">
<div className="flex items-center justify-between mb-2">
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono">
Variaciones (opcional — tallas, colores, presentaciones)
</label>
<button
type="button"
onClick={addRow}
className="text-[11px] font-bold text-pink-600"
>
+ Agregar variación
</button>
</div>
{variations.length === 0 && (
<p className="text-xs text-muted-700">
Este producto no tendrá variaciones — se usará el Stock Inicial de arriba.
</p>
)}
{variations.map((v) => (
<div key={v.key} className="flex items-center gap-2 mb-2">
<input
type="text"
name="variationName"
placeholder="Nombre (ej: Talla M, Rojo)"
value={v.name}
onChange={(e) => updateRow(v.key, "name", e.target.value)}
className="input-rz flex-1 !py-1.5 !px-2 text-xs"
/>
<input
type="number"
step="1"
name="variationStock"
placeholder="Stock"
value={v.stock}
onChange={(e) => updateRow(v.key, "stock", e.target.value)}
className="input-rz w-20 !py-1.5 !px-2 text-xs"
/>
<button
type="button"
onClick={() => removeRow(v.key)}
className="text-pink-200 hover:text-coral-500 px-1"
title="Quitar"
>
✕
</button>
</div>
))}
</div>
<button type="submit" className="btn-primary col-span-2 py-3 mt-1">
Guardar Producto
</button>
</form>
);
}
