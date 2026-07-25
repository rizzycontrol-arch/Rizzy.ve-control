import { createClient } from "@/lib/supabase/server";
function fmt(n: number) {
return "$" + n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default async function ResumenPage() {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();
const { data: profile } = await supabase
.from("profiles")
.select("role")
.eq("id", user!.id)
.single();
const isOwner = profile?.role === "owner";
if (!isOwner) {
const { data: txs } = await supabase.rpc("transactions_for_employee");
const { data: allProducts } = await supabase.from("products").select("id, name");
const productMap = new Map((allProducts ?? []).map((p: any) => [p.id, p.name]));
const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
const list = txs ?? [];
const salesToday = list.filter((t: any) => t.date === today).length;
const salesWeek = list.filter((t: any) => t.date >= weekAgo).length;

const qtyByProduct = new Map<number, number>();
for (const t of list as any[]) {
if (t.date !== today || !t.product_id) continue;
const q = Number(t.quantity ?? 1);
qtyByProduct.set(t.product_id, (qtyByProduct.get(t.product_id) ?? 0) + q);
}
let topProductName: string | null = null;
let topProductQty = 0;
for (const [pid, qty] of qtyByProduct.entries()) {
if (qty > topProductQty) {
topProductQty = qty;
topProductName = productMap.get(pid) ?? null;
}
}

return (
<div className="space-y-6">
<div className="lock-note bg-teal-100 text-[#0B6B65] text-sm px-4 py-3 rounded-xl font-semibold">
🔒 Los montos y ganancias solo los puede ver la dueña. Aquí ves tu actividad de ventas.
</div>
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">
Ventas de Hoy
</div>
<div className="font-baloo font-bold text-3xl text-pink-700 mt-1">
{salesToday}
</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">
Ventas esta Semana
</div>
<div className="font-baloo font-bold text-3xl text-pink-700 mt-1">
{salesWeek}
</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">
Producto Más Vendido Hoy
</div>
{topProductName ? (
<>
<div className="font-baloo font-bold text-lg text-pink-700 mt-1 truncate">
{topProductName}
</div>
<div className="text-xs text-muted-700 mt-0.5">
{topProductQty} unidad{topProductQty === 1 ? "" : "es"} hoy
</div>
</>
) : (
<div className="font-baloo font-bold text-lg text-muted-700 mt-1">
Aún no hay ventas hoy
</div>
)}
</div>
</div>
</div>
);
}
const { data: transactions } = await supabase
.from("transactions")
.select("*")
.order("date", { ascending: false });
const list = transactions ?? [];
const income = list.filter((t) => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
const expense = list.filter((t) => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
const net = income - expense;
const margin = income > 0 ? (net / income) * 100 : 0;
const ingresos = list.filter((t) => t.type === "ingreso");
const ticketIds = new Set(ingresos.map((t: any) => t.sale_id ?? `tx-${t.id}`));
const ticketPromedio = ticketIds.size > 0 ? income / ticketIds.size : 0;
const { data: products } = await supabase
.from("products")
.select("*, product_variations(*)");
const plist = products ?? [];
const effStock = (p: any) =>
p.product_variations && p.product_variations.length > 0
? p.product_variations.reduce((s: number, v: any) => s + Number(v.stock), 0)
: Number(p.stock);
const valorCosto = plist.reduce((s, p) => s + Number(p.cost ?? p.price) * effStock(p), 0);
const valorVenta = plist.reduce((s, p) => s + Number(p.price) * effStock(p), 0);
const stockAlerts = plist.filter((p) => effStock(p) <= Number(p.min_stock));
const recent = list.slice(0, 10);
return (
<div className="space-y-6">
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Ingresos</div>
<div className="font-baloo font-bold text-2xl text-teal-500 mt-1">{fmt(income)}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Gastos</div>
<div className="font-baloo font-bold text-2xl text-coral-500 mt-1">{fmt(expense)}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Ganancia Neta</div>
<div className="font-baloo font-bold text-2xl text-pink-700 mt-1">{fmt(net)}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Margen</div>
<div className="font-baloo font-bold text-2xl text-amber-700 mt-1">{margin.toFixed(1)}%</div>
</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">
Valor Inventario (Costo)
</div>
<div className="font-baloo font-bold text-xl text-pink-700 mt-1">{fmt(valorCosto)}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">
Valor Inventario (Venta)
</div>
<div className="font-baloo font-bold text-xl text-pink-700 mt-1">{fmt(valorVenta)}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">
Ticket Promedio
</div>
<div className="font-baloo font-bold text-xl text-teal-500 mt-1">{fmt(ticketPromedio)}</div>
</div>
</div>
{stockAlerts.length > 0 && (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-1">⚠️ Alertas de Stock</h2>
<p className="text-sm text-muted-700 mb-4">
{stockAlerts.length} producto(s) con stock bajo o agotado
</p>
<div className="space-y-2">
{stockAlerts.slice(0, 8).map((p) => (
<div key={p.id} className="flex justify-between text-sm border-b border-pink-100 pb-2">
<span className="font-semibold">{p.name}</span>
<span className={effStock(p) <= 0 ? "text-coral-500 font-bold" : "text-amber-700 font-bold"}>
{effStock(p) <= 0 ? "Agotado" : `Bajo (${effStock(p)})`}
</span>
</div>
))}
</div>
</section>
)}
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Transacciones Recientes</h2>
{recent.length === 0 && (
<p className="text-center text-muted-700 py-6 text-sm">Aún no hay transacciones.</p>
)}
<div>
{recent.map((t) => (
<div key={t.id} className="flex items-center gap-3 py-3 border-b border-pink-100 last:border-none">
<span
className={`w-2 h-2 rounded-full ${t.type === "ingreso" ? "bg-teal-500" : "bg-coral-500"}`}
/>
<div className="flex-1 min-w-0">
<div className="text-sm font-bold">{t.description || t.category}</div>
<div className="text-xs text-muted-700 mt-0.5">{t.date} · {t.category}</div>
</div>
<div className={`font-mono font-bold text-sm ${t.type === "ingreso" ? "text-teal-500" : "text-coral-500"}`}>
{t.type === "ingreso" ? "+" : "-"}{fmt(Number(t.amount))}
</div>
</div>
))}
</div>
</section>
</div>
);
}