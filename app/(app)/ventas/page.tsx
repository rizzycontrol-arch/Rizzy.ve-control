import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
import VentasHistorial from "./VentasHistorial";
import { todayCaracas } from "@/lib/date";
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
export default async function VentasPage({
searchParams,
}: {
searchParams: { type?: string; vok?: string; verror?: string };
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
const today = todayCaracas();
const { data: settings } = await supabase.from("settings").select("exchange_rate").eq("id", 1).single();
const rate = Number(settings?.exchange_rate ?? 1);
let history: any[] = [];
let products: any[] = [];
if (isOwner) {
const [{ data }, { data: prods }] = await Promise.all([
supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(40),
supabase.from("products").select("id, name, product_variations(id, name)").order("name", { ascending: true }),
]);
history = data ?? [];
products = prods ?? [];
} else {
const { data } = await supabase.rpc("transactions_for_employee");
history = (data ?? []).slice(0, 40);
}
return (
<div className="space-y-6">
{searchParams?.vok && (
<div className="bg-teal-100 text-[#0B6B65] text-sm px-4 py-3 rounded-xl font-semibold">
✅ Guardado correctamente.
</div>
)}
{searchParams?.verror && (
<div className="bg-pink-100 text-coral-500 text-sm px-4 py-3 rounded-xl font-semibold">
⚠️ {searchParams.verror}
</div>
)}
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
<VentasHistorial history={history as any} isOwner={isOwner} products={products as any} rate={rate} />
</section>
</div>
);
}