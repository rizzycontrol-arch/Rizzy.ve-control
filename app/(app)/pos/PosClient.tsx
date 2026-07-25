"use client";
import { useMemo, useState } from "react";
import { finalizeSale, quickAddClient, updateExchangeRate, type CartItemPayload } from "./actions";
const PAYMENT_METHODS = ["Efectivo $", "Bolívares", "Pago Móvil", "Transferencia", "Zelle", "Binance"];
type Variation = { id: number; name: string; sku: string | null; stock: number };
type Product = {
id: number;
name: string;
type: string;
price: number;
stock: number;
product_variations: Variation[];
};
type Client = { id: number; name: string; lastname: string | null; phone: string; city: string | null };
type CartLine = {
cartId: string;
productId: number;
variationId: number | null;
name: string;
price: number;
qty: number;
maxStock: number;
};
export default function PosClient({
products,
clients,
exchangeRate: initialRate,
}: {
products: Product[];
clients: Client[];
exchangeRate: number;
}) {
const [search, setSearch] = useState("");
const [category, setCategory] = useState("Todo");
const [cart, setCart] = useState<CartLine[]>([]);
const [step, setStep] = useState<"catalog" | "pago">("catalog");
const [modalProduct, setModalProduct] = useState<Product | null>(null);
const [clientSearch, setClientSearch] = useState("");
const [showClientDropdown, setShowClientDropdown] = useState(false);
const [selectedClient, setSelectedClient] = useState<Client | null>(null);
const [newClientMode, setNewClientMode] = useState(false);
const [localClients, setLocalClients] = useState<Client[]>(clients);
const [discount, setDiscount] = useState(0);
const [paymentMethod, setPaymentMethod] = useState("Efectivo $");
const [rate, setRate] = useState(initialRate);
const [split, setSplit] = useState({ usd: 0, bs: 0, binance: 0 });
const [error, setError] = useState("");
const [saving, setSaving] = useState(false);
const [done, setDone] = useState(false);
const categories = useMemo(() => {
const set = new Set(products.map((p) => p.type));
return ["Todo", ...Array.from(set)];
}, [products]);
const filtered = products.filter((p) => {
const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
const matchesCat = category === "Todo" || p.type === category;
return matchesSearch && matchesCat;
});
const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
const discountRatio = subtotal > 0 ? Math.min(discount, subtotal) / subtotal : 0;
const total = subtotal - Math.min(discount, subtotal);
function addToCart(product: Product, variation: Variation | null) {
const stock = variation ? variation.stock : product.stock;
if (stock <= 0) return;
const cartId = `${product.id}-${variation ? variation.id : "base"}`;
setCart((prev) => {
const existing = prev.find((c) => c.cartId === cartId);
if (existing) {
if (existing.qty >= existing.maxStock) return prev;
return prev.map((c) => (c.cartId === cartId ? { ...c, qty: c.qty + 1 } : c));
}
return [
...prev,
{
cartId,
productId: product.id,
variationId: variation ? variation.id : null,
name: variation ? `${product.name} - ${variation.name}` : product.name,
price: Number(product.price),
qty: 1,
maxStock: stock,
},
];
});
setModalProduct(null);
}
function changeQty(cartId: string, delta: number) {
setCart((prev) =>
prev
.map((c) => {
if (c.cartId !== cartId) return c;
const newQty = c.qty + delta;
if (newQty <= 0) return null;
if (newQty > c.maxStock) return c;
return { ...c, qty: newQty };
})
.filter((c): c is CartLine => c !== null)
);
}
function handleProductClick(p: Product) {
if (p.product_variations && p.product_variations.length > 0) {
setModalProduct(p);
} else {
addToCart(p, null);
}
}
const filteredClients = localClients.filter((c) =>
`${c.name} ${c.lastname ?? ""}`.toLowerCase().includes(clientSearch.toLowerCase())
);
async function handleQuickAddClient(name: string, lastname: string, phone: string, city: string) {
if (!name || !phone) return;
const res = await quickAddClient(name, lastname, phone, city);
if (res.ok && res.client) {
setLocalClients((prev) => [...prev, res.client]);
setSelectedClient(res.client);
setNewClientMode(false);
setShowClientDropdown(false);
}
}
function splitTotal() {
return Number(split.usd || 0) + Number(split.bs || 0) / (rate || 1) + Number(split.binance || 0);
}
async function handleFinalize() {
setError("");
if (cart.length === 0) return;
let payment: { method: string; amount: number }[] = [];
if (paymentMethod === "Pago Combinado") {
const st = splitTotal();
if (Math.abs(st - total) > 0.02) {
setError("La suma del pago combinado no cuadra con el total.");
return;
}
if (Number(split.usd) > 0) payment.push({ method: "Efectivo $", amount: Number(split.usd) });
if (Number(split.bs) > 0) payment.push({ method: "Bolívares", amount: Number(split.bs) / (rate || 1) });
if (Number(split.binance) > 0) payment.push({ method: "Binance", amount: Number(split.binance) });
} else {
payment = [{ method: paymentMethod, amount: total }];
}
const items: CartItemPayload[] = cart.map((c) => ({
product_id: c.productId,
variation_id: c.variationId,
qty: c.qty,
unit_price: c.price,
description: `${c.qty} x ${c.name}`,
payment_method: paymentMethod,
}));
setSaving(true);
const res = await finalizeSale(items, payment, selectedClient?.id ?? null, selectedClient?.name ?? null, discount);
setSaving(false);
if (!res.ok) {
setError(res.message || "Error al procesar la venta.");
return;
}
setCart([]);
setSelectedClient(null);
setDiscount(0);
setSplit({ usd: 0, bs: 0, binance: 0 });
setStep("catalog");
setDone(true);
setTimeout(() => setDone(false), 3000);
}
if (step === "pago") {
return (
<div className="max-w-lg mx-auto space-y-6">
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Pago</h2>
<div className="mb-4">
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Tasa de Cambio (Bs/$)
</label>
<div className="flex gap-2">
<input
type="number"
step="0.01"
value={rate}
onChange={(e) => setRate(parseFloat(e.target.value) || 1)}
className="input-rz"
/>
<button
onClick={() => updateExchangeRate(rate)}
className="text-xs font-bold px-3 rounded-full border border-pink-200 bg-white text-pink-700 whitespace-nowrap"
>
Guardar
</button>
</div>
</div>
<div className="relative mb-4">
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Clienta</label>
{selectedClient ? (
<div className="flex items-center justify-between input-rz">
<span>{selectedClient.name} {selectedClient.lastname ?? ""}</span>
<button onClick={() => setSelectedClient(null)} className="text-coral-500 text-xs font-bold">
Quitar
</button>
</div>
) : (
<>
<input
type="text"
className="input-rz"
placeholder="Buscar clienta..."
value={clientSearch}
onFocus={() => setShowClientDropdown(true)}
onChange={(e) => {
setClientSearch(e.target.value);
setShowClientDropdown(true);
}}
/>
{showClientDropdown && (
<div className="absolute z-20 bg-white border border-pink-200 rounded-xl mt-1 w-full max-h-56 overflow-y-auto shadow-lg">
{filteredClients.slice(0, 8).map((c) => (
<button
key={c.id}
className="block w-full text-left px-3 py-2 text-sm hover:bg-pink-100"
onClick={() => {
setSelectedClient(c);
setShowClientDropdown(false);
}}
>
{c.name} {c.lastname ?? ""}
</button>
))}
<button
className="block w-full text-left px-3 py-2 text-sm text-pink-700 font-bold hover:bg-pink-100"
onClick={() => {
setNewClientMode(true);
setShowClientDropdown(false);
}}
>
➕ Agregar clienta nueva
</button>
</div>
)}
</>
)}
</div>
{newClientMode && (
<QuickAddClientForm onSave={handleQuickAddClient} onCancel={() => setNewClientMode(false)} />
)}
<div className="mb-4">
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Descuento (USD)
</label>
<input
type="number"
step="0.01"
value={discount}
onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
className="input-rz"
/>
</div>
<div className="grid grid-cols-2 gap-2 mb-4">
{[...PAYMENT_METHODS, "Pago Combinado"].map((m) => (
<button
key={m}
onClick={() => setPaymentMethod(m)}
className={`py-2.5 rounded-xl border text-sm font-semibold ${
paymentMethod === m ? "bg-teal-500 border-teal-500 text-white" : "border-pink-200 text-muted-700 bg-white"
}`}
>
{m}
</button>
))}
</div>
{paymentMethod === "Pago Combinado" && (
<div className="grid grid-cols-3 gap-2 mb-4">
<div>
<label className="text-xs text-muted-700 font-mono">Efectivo $</label>
<input
type="number"
step="0.01"
value={split.usd}
onChange={(e) => setSplit((s) => ({ ...s, usd: parseFloat(e.target.value) || 0 }))}
className="input-rz"
/>
</div>
<div>
<label className="text-xs text-muted-700 font-mono">Bolívares</label>
<input
type="number"
step="0.01"
value={split.bs}
onChange={(e) => setSplit((s) => ({ ...s, bs: parseFloat(e.target.value) || 0 }))}
className="input-rz"
/>
</div>
<div>
<label className="text-xs text-muted-700 font-mono">Binance</label>
<input
type="number"
step="0.01"
value={split.binance}
onChange={(e) => setSplit((s) => ({ ...s, binance: parseFloat(e.target.value) || 0 }))}
className="input-rz"
/>
</div>
<div className="col-span-3 text-xs text-muted-700">
Asignado: ${splitTotal().toFixed(2)} / Total: ${total.toFixed(2)}
</div>
</div>
)}
<div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-pink-100">
<span className="font-baloo font-bold text-lg">Total</span>
<span className="font-baloo font-bold text-xl text-pink-700">${total.toFixed(2)}</span>
</div>
{error && <p className="text-coral-500 text-sm font-semibold mt-2">{error}</p>}
<div className="flex gap-2 mt-4">
<button onClick={() => setStep("catalog")} className="flex-1 py-3 rounded-full border border-pink-200 text-muted-700 font-bold">
Volver
</button>
<button onClick={handleFinalize} disabled={saving} className="btn-primary flex-1 py-3">
{saving ? "Guardando..." : "Confirmar Venta"}
</button>
</div>
</section>
</div>
);
}
return (
<div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">
<div>
{done && (
<div className="bg-teal-100 text-[#0B6B65] text-sm px-4 py-3 rounded-xl font-semibold mb-4">
✅ Venta registrada con éxito
</div>
)}
<input
type="text"
placeholder="Buscar producto..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="input-rz mb-3"
/>
<div className="flex gap-2 flex-wrap mb-4">
{categories.map((c) => (
<button
key={c}
onClick={() => setCategory(c)}
className={`px-4 py-2 rounded-full border text-sm font-semibold ${
category === c ? "bg-pink-600 border-pink-600 text-white" : "border-pink-200 text-muted-700 bg-white"
}`}
>
{c}
</button>
))}
</div>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
{filtered.map((p) => {
const hasVar = p.product_variations && p.product_variations.length > 0;
const stock = hasVar
? p.product_variations.reduce((s, v) => s + Number(v.stock), 0)
: Number(p.stock);
return (
<button
key={p.id}
disabled={stock <= 0}
onClick={() => handleProductClick(p)}
className="card p-3.5 text-left hover:shadow-lg transition disabled:opacity-40"
>
<div className="font-baloo font-bold text-sm mb-1">{p.name}</div>
<div className="text-[11px] text-muted-700 mb-2">{p.type}</div>
<div className="font-mono font-bold text-pink-700 text-sm">${Number(p.price).toFixed(2)}</div>
</button>
);
})}
</div>
</div>
<div className="card p-4 sticky top-5">
<h3 className="font-baloo font-bold text-base text-ink mb-3">Carrito</h3>
{cart.length === 0 ? (
<p className="text-sm text-muted-700 text-center py-6">Vacío — agrega productos</p>
) : (
<div>
{cart.map((c) => (
<div key={c.cartId} className="flex items-center gap-2 py-2.5 border-b border-pink-100 last:border-none">
<div className="flex-1 min-w-0">
<div className="text-xs font-semibold truncate">{c.name}</div>
<div className="text-[11px] text-muted-700">${c.price.toFixed(2)} c/u</div>
</div>
<button onClick={() => changeQty(c.cartId, -1)} className="w-6 h-6 rounded-full border border-pink-200 text-pink-700 font-bold text-xs">
−
</button>
<span className="text-xs w-4 text-center">{c.qty}</span>
<button onClick={() => changeQty(c.cartId, 1)} className="w-6 h-6 rounded-full border border-pink-200 text-pink-700 font-bold text-xs">
+
</button>
</div>
))}
<div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-pink-100 font-baloo font-bold">
<span>Total</span>
<span className="text-pink-700">${subtotal.toFixed(2)}</span>
</div>
<button onClick={() => setStep("pago")} className="btn-primary w-full py-3 mt-3">
Ir a Pagar
</button>
</div>
)}
</div>
{modalProduct && (
<div className="fixed inset-0 bg-[rgba(59,17,64,0.5)] flex items-center justify-center z-50 p-5" onClick={() => setModalProduct(null)}>
<div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
<h3 className="font-baloo font-bold text-ink mb-1">{modalProduct.name}</h3>
<p className="text-pink-700 font-bold mb-3">${Number(modalProduct.price).toFixed(2)}</p>
{modalProduct.product_variations.map((v) => (
<button
key={v.id}
disabled={v.stock <= 0}
onClick={() => addToCart(modalProduct, v)}
className="block w-full text-left px-3.5 py-2.5 mb-2 rounded-xl border border-pink-200 text-sm font-semibold disabled:opacity-40 disabled:line-through"
>
{v.name} {v.stock <= 0 ? "(Agotado)" : `· stock ${v.stock}`}
</button>
))}
<button onClick={() => setModalProduct(null)} className="text-muted-700 text-sm font-semibold mt-2">
Cerrar
</button>
</div>
</div>
)}
</div>
);
}
function QuickAddClientForm({
onSave,
onCancel,
}: {
onSave: (name: string, lastname: string, phone: string, city: string) => void;
onCancel: () => void;
}) {
const [name, setName] = useState("");
const [lastname, setLastname] = useState("");
const [phone, setPhone] = useState("");
const [city, setCity] = useState("");
const [warn, setWarn] = useState("");
return (
<div className="card p-3 mb-4 space-y-2">
<input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="input-rz" />
<input placeholder="Apellido" value={lastname} onChange={(e) => setLastname(e.target.value)} className="input-rz" />
<input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-rz" />
<input placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="input-rz" />
{warn && <p className="text-coral-500 text-xs font-semibold">{warn}</p>}
<div className="flex gap-2">
<button onClick={onCancel} className="flex-1 py-2 rounded-full border border-pink-200 text-xs font-bold">
Cancelar
</button>
<button
onClick={() => {
if (!name || !phone) {
setWarn("⚠️ Nombre y teléfono son obligatorios.");
return;
}
onSave(name, lastname, phone, city);
}}
className="btn-primary flex-1 py-2 text-xs"
>
Guardar
</button>
</div>
</div>
);
}