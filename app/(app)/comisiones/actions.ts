"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function updateCommissionPct(formData: FormData) {
const supabase = createClient();
const pct = parseFloat(formData.get("pct") as string);
if (isNaN(pct)) return;
await supabase.from("settings").update({ commission_pct: pct }).eq("id", 1);
revalidatePath("/comisiones");
}