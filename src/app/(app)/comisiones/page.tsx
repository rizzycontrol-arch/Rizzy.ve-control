import { createClient } from "@/lib/supabase/server";
import { updateCommissionPct } from "./actions";
import { todayCaracas, firstOfMonthCaracas } from "@/lib/date";
function fmt(n: number) {
return "$" + (n ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default async function ComisionesPage({
searchParams,
}: {
searchParams: { from?: string; to?: string };
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
const { data: settings } = await supabase.from("settings").select("*").single();
const pct = Number(settings?.commission_pct ?? 5);
const firstOfMonth = firstOfMonthCaracas();
const todayStr = todayCaracas();
const from = searchParams?.from || firstOfMonth;
const to = searchParams?.to || todayStr;
if (profile?.role !== "owner") {
const { data: myReport } = (await supabase
.rpc("my_commissions_report", { p_from: from, p_to: to, p_pct: pct })
.single()) as { data: any };
return (
<div className="space-y-6">
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Mis Comisiones</h2>
<form method="get" className="grid grid-cols-3 gap-3 mb-6">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Desde</label>
<input type="date" name="from" defaultValue={from} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Hasta</label>
<input type="date" name="to" defaultValue={to} className="input-rz" />
</div>
<div className="flex items-end">
<button type="submit" className="btn-primary w-full py-2.5">
Consultar
</button>
</div>
</form>
<div className="grid grid-cols-3 gap-4">
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Total Vendido</div>
<div className="font-baloo font-bold text-xl text-pink-700 mt-1">{fmt(Number(myReport?.total_sold ?? 0))}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Mi Comisión ({pct}%)</div>
<div className="font-baloo font-bold text-xl text-teal-500 mt-1">{fmt(Number(myReport?.commission ?? 0))}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">N° Ventas</div>
<div className="font-baloo font-bold text-xl text-pink-700 mt-1">{myReport?.sale_count ?? 0}</div>
</div>
</div>
</section>
</div>
);
}
const { data: report } = (await supabase
.rpc("commissions_report", { p_from: from, p_to: to, p_pct: pct })
.single()) as { data: any };
return (
<div className="space-y-6">
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Comisiones</h2>
<form method="get" className="grid grid-cols-3 gap-3 mb-6">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Desde</label>
<input type="date" name="from" defaultValue={from} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Hasta</label>
<input type="date" name="to" defaultValue={to} className="input-rz" />
</div>
<div className="flex items-end">
<button type="submit" className="btn-primary w-full py-2.5">
Consultar
</button>
</div>
</form>
<form action={updateCommissionPct} className="flex gap-2 items-end mb-6">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
% de Comisión
</label>
<input type="number" step="0.1" name="pct" defaultValue={pct} className="input-rz w-32" />
</div>
<button type="submit" className="text-xs font-bold px-4 py-2.5 rounded-full border border-pink-200 bg-white text-pink-700">
Guardar %
</button>
</form>
<div className="grid grid-cols-3 gap-4">
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Total Vendido</div>
<div className="font-baloo font-bold text-xl text-pink-700 mt-1">{fmt(Number(report?.total_sold ?? 0))}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">Comisión ({pct}%)</div>
<div className="font-baloo font-bold text-xl text-teal-500 mt-1">{fmt(Number(report?.commission ?? 0))}</div>
</div>
<div className="card p-5">
<div className="font-mono text-[11px] uppercase tracking-wide text-muted-700">N° Ventas</div>
<div className="font-baloo font-bold text-xl text-pink-700 mt-1">{report?.sale_count ?? 0}</div>
</div>
</div>
{Number(report?.missing_soldby_count ?? 0) > 0 && (
<p className="text-xs text-amber-700 mt-4 font-semibold">
⚠️ Hay {report?.missing_soldby_count} venta(s) en este rango sin vendedora asignada — no se incluyen en el cálculo.
</p>
)}
</section>
</div>
);
}