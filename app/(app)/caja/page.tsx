import { createClient } from "@/lib/supabase/server";
import { openCaja, closeCaja } from "./actions";
function fmt(n: number) {
return "$" + (n ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default async function CajaPage() {
const supabase = createClient();
const { data: settings } = await supabase.from("settings").select("*").single();
const rate = Number(settings?.exchange_rate ?? 1);
const { data: open } = await supabase
.from("caja_sessions")
.select("*")
.eq("status", "abierta")
.order("opened_at", { ascending: false })
.limit(1)
.maybeSingle();
const { data: history } = await supabase
.from("caja_sessions")
.select("*")
.eq("status", "cerrada")
.order("closed_at", { ascending: false })
.limit(15);
return (
<div className="space-y-6">
{!open ? (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Abrir Caja</h2>
<form action={openCaja} className="grid grid-cols-2 gap-3">
<input type="hidden" name="rate" value={rate} />
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Efectivo $</label>
<input type="number" step="0.01" name="usd" defaultValue={0} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Bolívares</label>
<input type="number" step="0.01" name="bs" defaultValue={0} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Binance</label>
<input type="number" step="0.01" name="binance" defaultValue={0} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Tasa Bs/$</label>
<input type="number" step="0.01" defaultValue={rate} className="input-rz" disabled />
</div>
<button type="submit" className="btn-primary col-span-2 py-3 mt-1">
Abrir Caja
</button>
</form>
</section>
) : (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-1">Caja Abierta</h2>
<p className="text-sm text-muted-700 mb-4">
Abierta el {new Date(open.opened_at).toLocaleString("es-VE")}
</p>
<div className="grid grid-cols-3 gap-3 mb-6">
<div className="card p-4">
<div className="font-mono text-[11px] text-muted-700">Apertura $</div>
<div className="font-baloo font-bold text-lg text-pink-700">{fmt(Number(open.open_usd))}</div>
</div>
<div className="card p-4">
<div className="font-mono text-[11px] text-muted-700">Apertura Bs (en $)</div>
<div className="font-baloo font-bold text-lg text-pink-700">{fmt(Number(open.open_bs))}</div>
</div>
<div className="card p-4">
<div className="font-mono text-[11px] text-muted-700">Apertura Binance</div>
<div className="font-baloo font-bold text-lg text-pink-700">{fmt(Number(open.open_binance))}</div>
</div>
</div>
<h3 className="font-baloo font-bold text-base text-pink-700 mb-3">Cerrar Caja</h3>
<form action={closeCaja} className="grid grid-cols-2 gap-3">
<input type="hidden" name="id" value={open.id} />
<input type="hidden" name="rate" value={rate} />
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Contado $</label>
<input type="number" step="0.01" name="countedUsd" defaultValue={0} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Contado Bs</label>
<input type="number" step="0.01" name="countedBs" defaultValue={0} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Contado Binance</label>
<input type="number" step="0.01" name="countedBinance" defaultValue={0} className="input-rz" />
</div>
<button type="submit" className="btn-primary col-span-2 py-3 mt-1">
Cerrar Caja
</button>
</form>
</section>
)}
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Historial de Cierres</h2>
{(history ?? []).length === 0 && (
<p className="text-center text-muted-700 py-6 text-sm">Aún no hay cierres.</p>
)}
{(history ?? []).map((h) => (
<div key={h.id} className="py-3 border-b border-pink-100 last:border-none text-sm">
<div className="font-mono text-xs text-muted-700 mb-1">
{new Date(h.closed_at).toLocaleString("es-VE")}
</div>
<div className="flex gap-4 flex-wrap">
<span>$ dif: <b className={Number(h.diff_usd) < -0.01 ? "text-coral-500" : Number(h.diff_usd) > 0.01 ? "text-amber-700" : "text-teal-500"}>{fmt(Number(h.diff_usd))}</b></span>
<span>Bs dif: <b className={Number(h.diff_bs) < -0.01 ? "text-coral-500" : Number(h.diff_bs) > 0.01 ? "text-amber-700" : "text-teal-500"}>{fmt(Number(h.diff_bs))}</b></span>
<span>Binance dif: <b className={Number(h.diff_binance) < -0.01 ? "text-coral-500" : Number(h.diff_binance) > 0.01 ? "text-amber-700" : "text-teal-500"}>{fmt(Number(h.diff_binance))}</b></span>
</div>
</div>
))}
</section>
</div>
);
}