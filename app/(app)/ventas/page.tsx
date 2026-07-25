import { createClient } from "@/lib/supabase/server";
import { addTransaction, deleteTransaction } from "./actions";
const CATS_INGRESO = ["Venta de Productos", "Envío Cobrado a Clienta", "Otro Ingreso"];
const CATS_GASTO = [
"Compra de Inventario",
"Envíos",
"Publicidad",
"Empaques",
"Comisiones",
"Servicios",
"Alquiler",
"Transporte",
"Otros",
];
const PAYMENT_METHODS = [
"Efectivo $",
"Bolívares",
"Pago Móvil",
"Transferencia",
"Zelle",
"Binance",
];
function fmt(n: number) {
return "$" + n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default async function VentasPage({
searchParams,
}: {
searchParams: { type?: string };
}) {
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
const currentType = searchParams?.type === "gasto" ? "gasto" : "ingreso";
const today = new Date().toISOString().slice(0, 10);
let history: any[] = [];
if (isOwner) {
const { data } = await supabase
.from("transactions")
.select("*")
.order("date", { ascending: false })
.limit(40);
history = data ?? [];
} else {
const { data } = await supabase.rpc("transactions_for_employee");
history = (data ?? []).slice(0, 40);
}
return (
<div className="space-y-6">
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">
{isOwner ? "Registrar Ingreso o Gasto" : "Registrar Venta"}
</h2>
{isOwner && (
<div className="flex gap-2 mb-4">
<a
href="/ventas?type=ingreso"
className={`flex-1 text-center py-2.5 rounded-full font-bold text-sm border-1.5 ${
currentType === "ingreso"
? "bg-teal-500 border-teal-500 text-white"
: "border border-pink-200 text-muted-700 bg-white"
}`}
>
💰 Ingreso
</a>
<a
href="/ventas?type=gasto"
className={`flex-1 text-center py-2.5 rounded-full font-bold text-sm ${
currentType === "gasto"
? "bg-coral-500 border-coral-500 text-white"
: "border border-pink-200 text-muted-700 bg-white"
}`}
>
📤 Gasto
</a>
</div>
)}
<form action={addTransaction} className="grid grid-cols-2 gap-3">
<input type="hidden" name="type" value={isOwner ? currentType : "ingreso"} />
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Fecha
</label>
<input type="date" name="date" defaultValue={today} required className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Monto (USD)
</label>
<input
type="number"
step="0.01"
name="amount"
required
className="input-rz"
placeholder="0.00"
/>
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Categoría
</label>
<select name="category" required className="input-rz">
{(isOwner && currentType === "gasto" ? CATS_GASTO : CATS_INGRESO).map((c) => (
<option key={c} value={c}>
{c}
</option>
))}
</select>
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Método de Pago
</label>
<select name="paymentMethod" className="input-rz">
{PAYMENT_METHODS.map((m) => (
<option key={m} value={m}>
{m}
</option>
))}
</select>
</div>
<div className="col-span-2">
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Descripción
</label>
<input type="text" name="description" className="input-rz" placeholder="Ej: 2 x Gelatina Salon Line" />
</div>
<button type="submit" className="btn-primary col-span-2 py-3 mt-1">
Guardar
</button>
</form>
</section>
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Historial</h2>
{history.length === 0 && (
<p className="text-center text-muted-700 py-6 text-sm">Aún no hay transacciones.</p>
)}
<div>
{history.map((t) => (
<div key={t.id} className="flex items-center gap-3 py-3 border-b border-pink-100 last:border-none">
<span className={`w-2 h-2 rounded-full ${t.type === "ingreso" ? "bg-teal-500" : "bg-coral-500"}`} />
<div className="flex-1 min-w-0">
<div className="text-sm font-bold">{t.description || t.category}</div>
<div className="text-xs text-muted-700 mt-0.5">{t.date} · {t.category}</div>
</div>
{isOwner ? (
<>
<div className={`font-mono font-bold text-sm ${t.type === "ingreso" ? "text-teal-500" : "text-coral-500"}`}>
{t.type === "ingreso" ? "+" : "-"}{fmt(Number(t.amount))}
</div>
<form action={deleteTransaction}>
<input type="hidden" name="id" value={t.id} />
<button className="text-pink-200 hover:text-coral-500 px-2">✕</button>
</form>
</>
) : (
<span className="text-xs font-mono text-muted-700">🔒</span>
)}
</div>
))}
</div>
</section>
</div>
);
}