"use client";
import { useState } from "react";
import { deleteTransaction, updateTransaction } from "./actions";
type Tx = {
id: number;
type: string;
date: string;
amount?: number;
category: string;
description: string | null;
product_id: number | null;
variation_id: number | null;
quantity: number | null;
client_id: number | null;
client_name: string | null;
sale_id: string | null;
created_at: string;
payment_method: string | null;
};
const BS_METHODS = ["Bolívares", "Pago Móvil", "Transferencia"];
function fmtBs(n: number) {
return "Bs " + n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
type ProductOption = {
id: number;
name: string;
product_variations: { id: number; name: string }[];
};
function fmt(n: number) {
return "$" + n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtTime(iso: string) {
try {
return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
} catch {
return "";
}
}
export default function VentasHistorial({
history,
isOwner,
products = [],
rate = 1,
}: {
history: Tx[];
isOwner: boolean;
products?: ProductOption[];
rate?: number;
}) {
const [editing, setEditing] = useState<number | null>(null);
const [editProductId, setEditProductId] = useState<string>("");
const map = new Map<string, Tx[]>();
const order: string[] = [];
for (const t of history) {
const key = t.sale_id || `single-${t.id}`;
if (!map.has(key)) {
map.set(key, []);
order.push(key);
}
map.get(key)!.push(t);
}
const blocks = order.map((key) => ({ key, items: map.get(key)! }));
if (blocks.length === 0) {
return <p className="text-center text-muted-700 py-6 text-sm">Aún no hay transacciones.</p>;
}
return (
<div className="space-y-3">
{blocks.map((b) => {
const first = b.items[0];
const total = b.items.reduce((s, t) => s + Number(t.amount ?? 0), 0);
const bsTotal = b.items
.filter((t) => t.payment_method && BS_METHODS.includes(t.payment_method))
.reduce((s, t) => s + Number(t.amount ?? 0), 0) * (rate || 1);
const isSale = b.items.length > 1 || first.product_id != null;
const clientLabel = first.client_name
? first.client_name
: first.client_id
? "Clienta registrada"
: "Sin clienta registrada";
return (
<div key={b.key} className="rounded-xl border border-pink-100 overflow-hidden">
<div className="flex items-center justify-between gap-2 px-3 py-2 bg-pink-50/60 flex-wrap">
<div className="text-xs font-bold text-pink-700">
🕒 {fmtTime(first.created_at)} · {first.date}
{isSale && <span className="text-muted-700 font-normal"> · 👤 {clientLabel}</span>}
</div>
{isOwner && (
<div className="text-right flex items-center gap-1.5">
{first.payment_method && (
<span className="text-[9px] uppercase tracking-wide font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded whitespace-nowrap">
{first.payment_method}
</span>
)}
<div>
<div className="text-xs font-mono font-bold text-teal-500">{fmt(total)}</div>
{bsTotal > 0 && (
<div className="text-[10px] font-mono text-muted-700">{fmtBs(bsTotal)}</div>
)}
</div>
</div>
)}
</div>
<div className="divide-y divide-pink-50">
{b.items.map((t) => (
<div key={t.id} className="px-3 py-2">
{editing === t.id ? (
<form
action={updateTransaction}
className="flex flex-wrap items-end gap-2"
onSubmit={() => setEditing(null)}
>
<input type="hidden" name="id" value={t.id} />
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono">Descripción</label>
<input
name="description"
defaultValue={t.description ?? ""}
className="input-rz !py-1 !px-2 w-44 text-xs"
/>
</div>
{products.length > 0 && (
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono">Producto</label>
<select
name="productId"
defaultValue={t.product_id != null ? String(t.product_id) : ""}
onChange={(e) => setEditProductId(e.target.value)}
className="input-rz !py-1 !px-2 w-36 text-xs"
>
<option value="">Sin producto (no descuenta)</option>
{products.map((p) => (
<option key={p.id} value={p.id}>
{p.name}
</option>
))}
</select>
</div>
)}
{(() => {
const selected = products.find((p) => String(p.id) === editProductId);
if (!selected || !selected.product_variations || selected.product_variations.length === 0) return null;
return (
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono">Variación</label>
<select
key={selected.id}
name="variationId"
defaultValue={t.variation_id != null ? String(t.variation_id) : ""}
className="input-rz !py-1 !px-2 w-32 text-xs"
>
<option value="">— elige —</option>
{selected.product_variations.map((v) => (
<option key={v.id} value={v.id}>
{v.name}
</option>
))}
</select>
</div>
);
})()}
{(t.product_id != null || editProductId !== "") && (
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono">Cant.</label>
<input
type="number"
step="1"
name="quantity"
defaultValue={Number(t.quantity ?? 1)}
className="input-rz !py-1 !px-2 w-14 text-xs"
/>
</div>
)}
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono">Monto $</label>
<input
type="number"
step="0.01"
name="amount"
defaultValue={Number(t.amount ?? 0)}
className="input-rz !py-1 !px-2 w-20 text-xs"
/>
</div>
<div className="flex flex-col">
<label className="text-[9px] uppercase text-muted-700 font-mono">Clienta</label>
<input
name="clientName"
defaultValue={t.client_name ?? ""}
placeholder="—"
className="input-rz !py-1 !px-2 w-28 text-xs"
/>
</div>
<button
type="submit"
className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-teal-500 text-white"
>
Guardar
</button>
<button
type="button"
onClick={() => setEditing(null)}
className="text-[10px] text-muted-700 px-1"
>
Cancelar
</button>
</form>
) : (
<div className="flex items-center gap-3">
<span
className={`w-1.5 h-1.5 rounded-full shrink-0 ${
t.type === "ingreso" ? "bg-teal-500" : "bg-coral-500"
}`}
/>
<div className="flex-1 min-w-0">
<div className="text-sm">{t.description || t.category}</div>
{!isSale && <div className="text-xs text-muted-700 mt-0.5">{t.category}</div>}
{t.product_id != null && Number(t.quantity ?? 1) !== 1 && (
<div className="text-xs text-muted-700 mt-0.5">Cantidad: {t.quantity}</div>
)}
{t.product_id == null && t.category === "Venta de Productos" && (
<div className="text-xs text-amber-700 mt-0.5">⚠️ Sin producto vinculado — no descuenta inventario</div>
)}
</div>
{isOwner ? (
<>
<div className="text-right whitespace-nowrap">
<div
className={`font-mono text-xs ${
t.type === "ingreso" ? "text-teal-500" : "text-coral-500"
}`}
>
{t.type === "ingreso" ? "+" : "-"}
{fmt(Number(t.amount ?? 0))}
</div>
{t.payment_method && BS_METHODS.includes(t.payment_method) && (
<div className="text-[10px] font-mono text-muted-700">
{fmtBs(Number(t.amount ?? 0) * (rate || 1))}
</div>
)}
</div>
<button
type="button"
onClick={() => {
setEditProductId(t.product_id != null ? String(t.product_id) : "");
setEditing(t.id);
}}
className="text-pink-300 hover:text-pink-600 px-1"
title="Editar"
>
✎
</button>
<form action={deleteTransaction}>
<input type="hidden" name="id" value={t.id} />
<button className="text-pink-200 hover:text-coral-500 px-2" title="Borrar">
✕
</button>
</form>
</>
) : (
<span className="text-xs font-mono text-muted-700">🔒</span>
)}
</div>
)}
</div>
))}
</div>
</div>
);
})}
</div>
);
}
