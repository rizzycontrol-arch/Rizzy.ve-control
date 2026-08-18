"use client";
import { useMemo, useState } from "react";
import { updateProduct, updateVariationStock, deleteProduct, addVariations, deleteVariation } from "./actions";
type Variation = { id: number; name: string; stock: number };
type Product = {
id: number;
name: string;
type: string;
brand: string | null;
price: number;
cost: number | null;
stock: number;
min_stock: number;
product_variations: Variation[];
effStock: number;
};
function fmt(n: number) {
return "$" + n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const TYPE_ICON: Record<string, string> = {
Shampoo: "🧴", Acondicionador: "🧴", Gel: "💧", Crema: "🧴", Mascarilla: "🎭",
Aceite: "🫙", Serum: "💧", Espuma: "🫧", Gelatina: "🍮", Kit: "🎁",
Activador: "✨", Tónico: "🧪", Splash: "💦", Accesorio: "🎀", Otro: "📦",
};
export default function InventarioClient({
products,
isOwner,
}: {
products: Product[];
isOwner: boolean;
}) {
const [search, setSearch] = useState("");
const [copied, setCopied] = useState(false);
const [addingVarFor, setAddingVarFor] = useState<number | null>(null);
const [varRows, setVarRows] = useState<{ key: number; name: string; stock: string }[]>([
{ key: 0, name: "", stock: "" },
]);
const [varKeyCounter, setVarKeyCounter] = useState(1);
const [editingProductId, setEditingProductId] = useState<number | null>(null);
const [editingVarId, setEditingVarId] = useState<number | null>(null);
function openAddVar(productId: number, defaultStock: number) {
setAddingVarFor(productId);
setVarRows([{ key: 0, name: "", stock: String(defaultStock) }]);
setVarKeyCounter(1);
}
function addVarRow() {
setVarRows((r) => [...r, { key: varKeyCounter, name: "", stock: "" }]);
setVarKeyCounter((k) => k + 1);
}
function removeVarRow(key: number) {
setVarRows((r) => r.filter((row) => row.key !== key));
}
function updateVarRow(key: number, field: "name" | "stock", value: string) {
setVarRows((r) => r.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
}
const filtered = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return products;
return products.filter((p) =>
[p.name, p.type, p.brand ?? ""].some((f) => f.toLowerCase().includes(q))
);
}, [search, products]);
const grouped = useMemo(() => {
const map = new Map<string, Product[]>();
for (const p of filtered) {
const key = p.type || "Otro";
if (!map.has(key)) map.set(key, []);
map.get(key)!.push(p);
}
return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}, [filtered]);
const lowStock = useMemo(
() => products.filter((p) => p.effStock <= p.min_stock).sort((a, b) => a.effStock - b.effStock),
[products]
);
const supplierText = useMemo(() => {
if (lowStock.length === 0) return "";
const lines = lowStock.map((p) => {
const brand = p.brand ? ` (${p.brand})` : "";
return p.effStock <= 0
? `- ${p.name}${brand}: AGOTADO`
: `- ${p.name}${brand}: quedan ${p.effStock} (mínimo ${p.min_stock})`;
});
return `Pedido de mercancía — Rizzy.VE\n${new Date().toLocaleDateString("es-VE")}\n\n${lines.join("\n")}`;
}, [lowStock]);
async function copySupplierList() {
try {
await navigator.clipboard.writeText(supplierText);
setCopied(true);
setTimeout(() => setCopied(false), 2000);
} catch {
// clipboard API unavailable — user can still select the text manually
}
}
return (
<div className="space-y-6">
{lowStock.length > 0 && (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-1">⚠️ Alertas de Stock</h2>
<p className="text-sm text-muted-700 mb-4">
{lowStock.length} producto(s) con stock bajo o agotado
</p>
<div className="space-y-2 mb-4">
{lowStock.slice(0, 8).map((p) => (
<div key={p.id} className="flex justify-between text-sm border-b border-pink-100 pb-2">
<span className="font-semibold">{p.name}</span>
<span className={p.effStock <= 0 ? "text-coral-500 font-bold" : "text-amber-700 font-bold"}>
{p.effStock <= 0 ? "Agotado" : `Bajo (${p.effStock})`}
</span>
</div>
))}
{lowStock.length > 8 && (
<p className="text-xs text-muted-700 pt-1">y {lowStock.length - 8} más…</p>
)}
</div>
<details className="rounded-xl border border-pink-100 bg-pink-50/50">
<summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-pink-700">
📋 Lista para proveedores (copiar y enviar)
</summary>
<div className="px-4 pb-4">
<textarea
readOnly
value={supplierText}
rows={Math.min(lowStock.length + 3, 12)}
className="input-rz w-full text-xs font-mono resize-none"
/>
<button
type="button"
onClick={copySupplierList}
className="btn-primary mt-2 px-4 py-2 text-sm"
>
{copied ? "✓ Copiado" : "Copiar Lista"}
</button>
</div>
</details>
</section>
)}
<section className="panel card p-6">
<div className="flex items-center justify-between gap-3 flex-wrap mb-4">
<h2 className="font-baloo font-bold text-lg text-pink-700">
Productos ({filtered.length}{filtered.length !== products.length ? ` de ${products.length}` : ""})
</h2>
<div className="relative w-full sm:w-64">
<input
type="text"
value={search}
onChange={(e) => setSearch(e.target.value)}
placeholder="🔍 Buscar por nombre, marca o tipo…"
className="input-rz w-full !py-2 text-sm"
/>
</div>
</div>
{isOwner && (
<p className="text-xs text-muted-700 mb-4">
💡 Toca el precio o el stock de un producto para editarlo directamente. Usa el ✎ para corregir el nombre, tipo o marca.
</p>
)}
{filtered.length === 0 && (
<p className="text-center text-muted-700 py-8 text-sm">
No se encontró ningún producto que coincida con "{search}".
</p>
)}
<div className="space-y-6">
{grouped.map(([type, items]) => (
<div key={type}>
<div className="flex items-center gap-2 mb-2 sticky top-0 bg-white/90 backdrop-blur py-1 z-10">
<span className="text-lg">{TYPE_ICON[type] ?? "📦"}</span>
<h3 className="font-baloo font-bold text-sm text-pink-600 uppercase tracking-wide">
{type}
</h3>
<span className="text-xs text-muted-700 font-mono">({items.length})</span>
</div>
<div className="rounded-xl border border-pink-100 divide-y divide-pink-100 overflow-hidden">
{items.map((p) => {
const hasVar = p.product_variations && p.product_variations.length > 0;
const statusColor =
p.effStock <= 0
? "bg-coral-500"
: p.effStock <= p.min_stock
? "bg-amber-500"
: "bg-teal-500";
const formId = `pform-${p.id}`;
const isEditing = editingProductId === p.id;
return (
<div key={p.id} className="py-3 px-3 bg-white hover:bg-pink-50/40 transition-colors">
<div className="flex items-center gap-3 flex-wrap">
<span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} title="Estado de stock" />
<div className="flex-1 min-w-0">
{isEditing ? (
<div className="flex flex-col gap-1 mb-1">
<input
type="text"
form={formId}
name="name"
defaultValue={p.name}
placeholder="Nombre del producto"
className="input-rz !py-1 !px-2 text-xs font-bold"
/>
<div className="flex gap-1 flex-wrap">
<input
type="text"
form={formId}
name="type"
defaultValue={p.type}
placeholder="Tipo (ej: Mascarilla)"
className="input-rz !py-1 !px-2 text-[11px] w-32"
/>
<input
type="text"
form={formId}
name="brand"
defaultValue={p.brand ?? ""}
placeholder="Marca"
className="input-rz !py-1 !px-2 text-[11px] flex-1"
/>
</div>
</div>
) : (
<>
<div className="text-sm font-bold">{p.name}</div>
<div className="text-xs text-muted-700 mt-0.5">
{p.brand ? p.brand : "—"} · {fmt(Number(p.price))}
</div>
</>
)}
</div>
{isOwner ? (
<>
<form
id={formId}
action={updateProduct}
className="flex items-center gap-1.5"
onSubmit={() => setEditingProductId(null)}
>
<input type="hidden" name="id" value={p.id} />
<div className="flex flex-col items-end">
<label className="text-[9px] uppercase text-muted-700 font-mono">Precio $</label>
<input
type="number"
step="0.01"
name="price"
defaultValue={Number(p.price)}
className="input-rz !py-1 !px-2 w-20 text-xs"
/>
</div>
<div className="flex flex-col items-end">
<label className="text-[9px] uppercase text-muted-700 font-mono">Costo $</label>
<input
type="number"
step="0.01"
name="cost"
defaultValue={p.cost != null ? Number(p.cost) : ""}
className="input-rz !py-1 !px-2 w-20 text-xs"
/>
</div>
{!hasVar && (
<div className="flex flex-col items-end">
<label className="text-[9px] uppercase text-muted-700 font-mono">Stock</label>
<input
type="number"
step="1"
name="stock"
defaultValue={Number(p.stock)}
className="input-rz !py-1 !px-2 w-16 text-xs"
/>
</div>
)}
{hasVar && <input type="hidden" name="stock" value={Number(p.stock)} />}
<div className="flex flex-col items-end">
<label className="text-[9px] uppercase text-muted-700 font-mono">Mín.</label>
<input
type="number"
step="1"
name="minStock"
defaultValue={Number(p.min_stock)}
className="input-rz !py-1 !px-2 w-14 text-xs"
/>
</div>
<button
type="submit"
className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-pink-600 text-white whitespace-nowrap"
>
Guardar
</button>
</form>
<button
type="button"
onClick={() => setEditingProductId(isEditing ? null : p.id)}
className="text-pink-300 hover:text-pink-600 px-1"
title="Editar nombre, tipo o marca"
>
✎
</button>
</>
) : (
<span
className={`font-mono text-xs w-16 text-right font-bold ${
p.effStock <= 0
? "text-coral-500"
: p.effStock <= p.min_stock
? "text-amber-700"
: "text-pink-700"
}`}
>
{p.effStock}
</span>
)}
{isOwner && (
<form action={deleteProduct}>
<input type="hidden" name="id" value={p.id} />
<button className="text-pink-200 hover:text-coral-500 px-2">✕</button>
</form>
)}
</div>
{hasVar && (
<div className="mt-2 pl-5 space-y-1.5">
{p.product_variations.map((v) => (
<div key={v.id} className="flex items-center gap-2 text-xs text-muted-700">
{isOwner ? (
<>
<form
action={updateVariationStock}
className="flex items-center gap-1 flex-1 min-w-0"
onSubmit={() => setEditingVarId(null)}
style={{ display: "flex", alignItems: "center", gap: 4, flex: "1 1 auto", minWidth: 0 }}
>
<input type="hidden" name="id" value={v.id} />
{editingVarId === v.id ? (
<input
type="text"
name="name"
defaultValue={v.name}
placeholder="Nombre de la variación"
className="input-rz !py-0.5 !px-1.5 flex-1 min-w-0 text-[11px]"
style={{ flex: "1 1 auto", minWidth: 0 }}
/>
) : (
<span
className="flex-1 min-w-0 truncate"
style={{
flex: "1 1 auto",
minWidth: 0,
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap",
color: "#57534e",
display: "inline-block",
}}
>
↳ {v.name && v.name.trim() ? v.name : "(sin nombre)"}
</span>
)}
<input
type="number"
step="1"
name="stock"
defaultValue={Number(v.stock)}
className="input-rz !py-0.5 !px-1.5 w-14 text-[11px]"
style={{ width: 56, flex: "0 0 56px" }}
/>
<button
type="submit"
className="text-[10px] font-bold px-2 py-1 rounded-full bg-pink-100 text-pink-700"
>
OK
</button>
</form>
<button
type="button"
onClick={() => setEditingVarId(editingVarId === v.id ? null : v.id)}
className="text-pink-300 hover:text-pink-600 px-0.5"
title="Editar nombre de la variación"
>
✎
</button>
<form action={deleteVariation}>
<input type="hidden" name="id" value={v.id} />
<input type="hidden" name="productId" value={p.id} />
<button className="text-pink-200 hover:text-coral-500 px-1" title="Borrar variación">
✕
</button>
</form>
</>
) : (
<>
<span className="flex-1 min-w-0" style={{ flex: "1 1 auto", minWidth: 0 }}>↳ {v.name && v.name.trim() ? v.name : "(sin nombre)"}</span>
<span className={Number(v.stock) <= 0 ? "text-coral-500 font-bold" : ""}>
{v.stock}
</span>
</>
)}
</div>
))}
</div>
)}
{isOwner && (
<div className="mt-2 pl-5">
{addingVarFor === p.id ? (
<form
action={addVariations}
className="flex flex-col gap-2 items-start bg-pink-50/50 rounded-lg p-2"
onSubmit={() => setAddingVarFor(null)}
>
<input type="hidden" name="productId" value={p.id} />
{varRows.map((row) => (
<div key={row.key} className="flex items-end gap-1.5 flex-wrap">
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono mb-0.5">Nombre variación</label>
<input
type="text"
name="variationName"
placeholder="Ej: Talla M, Rojo"
value={row.name}
onChange={(e) => updateVarRow(row.key, "name", e.target.value)}
className="input-rz !py-1 !px-2 w-36 text-xs"
/>
</div>
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono mb-0.5">Cantidad</label>
<input
type="number"
step="1"
name="variationStock"
placeholder="0"
value={row.stock}
onChange={(e) => updateVarRow(row.key, "stock", e.target.value)}
className="input-rz !py-1 !px-2 w-16 text-xs"
/>
</div>
{varRows.length > 1 && (
<button
type="button"
onClick={() => removeVarRow(row.key)}
className="text-pink-200 hover:text-coral-500 px-1 pb-1.5"
title="Quitar"
>
✕
</button>
)}
</div>
))}
<div className="flex items-center gap-2">
<button
type="button"
onClick={addVarRow}
className="text-[10px] font-bold text-pink-600"
>
+ Agregar otra variación
</button>
<button
type="submit"
className="text-[10px] font-bold px-2 py-1 rounded-full bg-teal-500 text-white"
>
Guardar todo
</button>
<button
type="button"
onClick={() => setAddingVarFor(null)}
className="text-[10px] text-muted-700 px-1"
>
Cancelar
</button>
</div>
</form>
) : (
<button
type="button"
onClick={() => openAddVar(p.id, hasVar ? 0 : Number(p.stock))}
className="text-[10px] font-bold text-pink-600"
>
+ Agregar variación
</button>
)}
</div>
)}
</div>
);
})}
</div>
</div>
))}
</div>
</section>
</div>
);
}
