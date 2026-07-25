"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export type CartItemPayload = {
product_id: number;
variation_id: number | null;
qty: number;
unit_price: number;
description: string;
payment_method: string;
};
export type PaymentPayload = { method: string; amount: number };
export async function finalizeSale(
items: CartItemPayload[],
payment: PaymentPayload[],
clientId: number | null,
clientName: string | null,
discount: number
) {
const supabase = createClient();
const { error } = await supabase.rpc("checkout_sale", {
items,
payment,
p_client_id: clientId,
p_client_name: clientName,
p_discount: discount || 0,
});
revalidatePath("/pos");
revalidatePath("/ventas");
revalidatePath("/resumen");
revalidatePath("/inventario");
if (error) {
return { ok: false, message: error.message };
}
return { ok: true };
}
export async function quickAddClient(name: string, lastname: string, phone: string, city: string) {
const supabase = createClient();
const { data, error } = await supabase
.from("clients")
.insert({ name, lastname: lastname || null, phone, city: city || null })
.select()
.single();
revalidatePath("/clientes");
if (error) return { ok: false, message: error.message };
return { ok: true, client: data };
}
export async function updateExchangeRate(rate: number) {
const supabase = createClient();
await supabase.from("settings").update({ exchange_rate: rate }).eq("id", 1);
revalidatePath("/pos");
revalidatePath("/caja");
}