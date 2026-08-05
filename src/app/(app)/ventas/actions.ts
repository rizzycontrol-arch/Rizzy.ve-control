"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function addTransaction(formData: FormData) {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/ventas?verror=" + encodeURIComponent("Tu sesión expiró, vuelve a iniciar sesión."));
const type = formData.get("type") as string;
const date = formData.get("date") as string;
const amount = parseFloat(formData.get("amount") as string);
const category = formData.get("category") as string;
const description = formData.get("description") as string;
const paymentMethod = formData.get("paymentMethod") as string;
if (!date || isNaN(amount)) redirect("/ventas?verror=" + encodeURIComponent("Falta la fecha o el monto no es válido."));
// Si la dueña registra un ingreso desde su propio usuario, se acredita
// automáticamente a la empleada (para que no se pierdan comisiones por olvido).
let soldBy = user!.id;
if (type === "ingreso") {
const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
if (myProfile?.role === "owner") {
const { data: employee } = await supabase
.from("profiles")
.select("id")
.eq("role", "employee")
.order("id", { ascending: true })
.limit(1)
.maybeSingle();
if (employee?.id) soldBy = employee.id;
}
}
const { error } = await supabase.from("transactions").insert({
type,
date,
amount,
category,
description,
payment_method: paymentMethod,
sold_by: soldBy,
});
revalidatePath("/ventas");
revalidatePath("/resumen");
if (error) {
redirect("/ventas?verror=" + encodeURIComponent("No se pudo guardar: " + error.message));
}
redirect("/ventas?vok=1");
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
const { data: vars } = await supabase
.from("product_variations")
.select("stock")
.eq("product_id", tx.product_id);
const total = (vars ?? []).reduce((s, v) => s + Number(v.stock), 0);
await supabase.from("products").update({ stock: total }).eq("id", tx.product_id);
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
revalidatePath("/inventario");
revalidatePath("/pos");
}
async function recomputeProductStock(supabase: any, productId: number) {
const { data: vars } = await supabase
.from("product_variations")
.select("stock")
.eq("product_id", productId);
if (vars && vars.length > 0) {
const total = vars.reduce((s: number, v: any) => s + Number(v.stock), 0);
await supabase.from("products").update({ stock: total }).eq("id", productId);
}
}
async function adjustStock(
supabase: any,
productId: number | null,
variationId: number | null,
delta: number
) {
// delta > 0 gives stock back, delta < 0 deducts stock
if (!productId || delta === 0) return;
if (variationId) {
const { data: v } = await supabase.from("product_variations").select("stock").eq("id", variationId).single();
if (v) {
await supabase
.from("product_variations")
.update({ stock: Math.max(0, Number(v.stock) + delta) })
.eq("id", variationId);
}
await recomputeProductStock(supabase, productId);
} else {
const { data: p } = await supabase.from("products").select("stock").eq("id", productId).single();
if (p) {
await supabase
.from("products")
.update({ stock: Math.max(0, Number(p.stock) + delta) })
.eq("id", productId);
}
}
}
export async function updateTransaction(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
const amount = parseFloat(formData.get("amount") as string);
const description = formData.get("description") as string;
const clientName = formData.get("clientName") as string;
const quantityRaw = formData.get("quantity") as string;
const productIdRaw = formData.get("productId") as string;
const variationIdRaw = formData.get("variationId") as string;
if (!id) redirect("/ventas?verror=" + encodeURIComponent("Falta el identificador de la venta."));
if (isNaN(amount)) redirect("/ventas?verror=" + encodeURIComponent("El monto no es válido."));
const { data: tx } = await supabase.from("transactions").select("*").eq("id", id).single();
if (!tx) redirect("/ventas?verror=" + encodeURIComponent("No se encontró esa venta."));
const oldProductId: number | null = tx.product_id;
const oldVariationId: number | null = tx.variation_id;
const oldQty = Number(tx.quantity ?? 1);
const newQty = quantityRaw !== null && quantityRaw !== "" && !isNaN(parseFloat(quantityRaw))
? parseFloat(quantityRaw)
: oldQty;
// productId/variationId inputs only exist in the form when a product picker was shown;
// if absent, keep whatever the transaction already had.
const productFieldPresent = formData.has("productId");
const newProductId = productFieldPresent ? (productIdRaw ? Number(productIdRaw) : null) : oldProductId;
const newVariationId = productFieldPresent ? (variationIdRaw ? Number(variationIdRaw) : null) : oldVariationId;
const linkChanged = newProductId !== oldProductId || newVariationId !== oldVariationId;
if (linkChanged) {
// give back stock on whatever it was linked to before
await adjustStock(supabase, oldProductId, oldVariationId, oldQty);
// deduct stock on the new link (if any)
await adjustStock(supabase, newProductId, newVariationId, -newQty);
} else if (newProductId && newQty !== oldQty) {
await adjustStock(supabase, newProductId, newVariationId, oldQty - newQty);
}
const update: Record<string, any> = {
amount,
description: description ?? tx.description,
quantity: newQty,
product_id: newProductId,
variation_id: newVariationId,
};
if (clientName !== null) update.client_name = clientName.trim() ? clientName.trim() : null;
const { error } = await supabase.from("transactions").update(update).eq("id", id);
revalidatePath("/ventas");
revalidatePath("/resumen");
revalidatePath("/inventario");
revalidatePath("/pos");
if (error) {
redirect("/ventas?verror=" + encodeURIComponent("No se pudo editar: " + error.message));
}
redirect("/ventas?vok=1");
}
