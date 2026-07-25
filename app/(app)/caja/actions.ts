"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function openCaja(formData: FormData) {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) return;
const usd = parseFloat((formData.get("usd") as string) || "0") || 0;
const bs = parseFloat((formData.get("bs") as string) || "0") || 0;
const binance = parseFloat((formData.get("binance") as string) || "0") || 0;
const rate = parseFloat((formData.get("rate") as string) || "1") || 1;
await supabase.from("caja_sessions").insert({
opened_at: new Date().toISOString(),
opened_by: user.id,
open_usd: usd,
open_bs: bs / rate,
open_binance: binance,
exchange_rate_at_open: rate,
status: "abierta",
});
revalidatePath("/caja");
}
export async function closeCaja(formData: FormData) {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) return;
const id = formData.get("id") as string;
const countedUsd = parseFloat((formData.get("countedUsd") as string) || "0") || 0;
const countedBs = parseFloat((formData.get("countedBs") as string) || "0") || 0;
const countedBinance = parseFloat((formData.get("countedBinance") as string) || "0") || 0;
const rate = parseFloat((formData.get("rate") as string) || "1") || 1;
const { data: totals } = await supabase.rpc("caja_period_totals", { p_caja_id: parseInt(id) });
const { data: caja } = await supabase.from("caja_sessions").select("*").eq("id", id).single();
const byAccount: Record<string, { ingresos: number; gastos: number }> = {};
(totals ?? []).forEach((t: any) => {
byAccount[t.account] = { ingresos: Number(t.ingresos), gastos: Number(t.gastos) };
});
const expectedUsd = Number(caja?.open_usd ?? 0) + (byAccount.usd?.ingresos ?? 0) - (byAccount.usd?.gastos ?? 0);
const expectedBs = Number(caja?.open_bs ?? 0) + (byAccount.bs?.ingresos ?? 0) - (byAccount.bs?.gastos ?? 0);
const expectedBinance = Number(caja?.open_binance ?? 0) + (byAccount.binance?.ingresos ?? 0) - (byAccount.binance?.gastos ?? 0);
const countedBsUsd = countedBs / rate;
await supabase
.from("caja_sessions")
.update({
closed_at: new Date().toISOString(),
closed_by: user.id,
status: "cerrada",
exchange_rate_at_close: rate,
counted_usd: countedUsd,
counted_bs: countedBsUsd,
counted_binance: countedBinance,
expected_usd: expectedUsd,
expected_bs: expectedBs,
expected_binance: expectedBinance,
diff_usd: countedUsd - expectedUsd,
diff_bs: countedBsUsd - expectedBs,
diff_binance: countedBinance - expectedBinance,
})
.eq("id", id);
revalidatePath("/caja");
}