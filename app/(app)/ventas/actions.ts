"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function addTransaction(formData: FormData) {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) return;
const type = formData.get("type") as string;
const date = formData.get("date") as string;
const amount = parseFloat(formData.get("amount") as string);
const category = formData.get("category") as string;
const description = formData.get("description") as string;
const paymentMethod = formData.get("paymentMethod") as string;
if (!date || isNaN(amount)) return;
await supabase.from("transactions").insert({
type,
date,
amount,
category,
description,
payment_method: paymentMethod,
sold_by: user.id,
});
revalidatePath("/ventas");
revalidatePath("/resumen");
}
export async function deleteTransaction(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
const { data: tx } = await supabase.from("transactions").select("*").eq("id", id).single();
if (tx?.product_id) {
if (tx.variation_id) {
const { data: v } = await supabase
.from("product_variations")
.select("stock")
.eq("id", tx.variation_id)
.single();
if (v) {
await supabase
.from("product_variations")
.update({ stock: Number(v.stock) + Number(tx.quantity ?? 1) })
.eq("id", tx.variation_id);
}
} else {
const { data: p } = await supabase
.from("products")
.select("stock")
.eq("id", tx.product_id)
.single();
if (p) {
await supabase
.from("products")
.update({ stock: Number(p.stock) + Number(tx.quantity ?? 1) })
.eq("id", tx.product_id);
}
}
}
await supabase.from("transactions").delete().eq("id", id);
revalidatePath("/ventas");
revalidatePath("/resumen");
}