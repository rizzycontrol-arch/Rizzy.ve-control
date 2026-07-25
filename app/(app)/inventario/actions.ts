"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function addProduct(formData: FormData) {
const supabase = createClient();
const name = formData.get("name") as string;
const type = (formData.get("type") as string) || "Otro";
const brand = formData.get("brand") as string;
const costRaw = formData.get("cost") as string;
const price = parseFloat(formData.get("price") as string);
const stock = parseFloat((formData.get("stock") as string) || "0");
const minStock = parseFloat((formData.get("minStock") as string) || "5");
if (!name || isNaN(price) || isNaN(minStock)) return;
await supabase.from("products").insert({
name,
type,
brand: brand || null,
cost: costRaw ? parseFloat(costRaw) : null,
price,
stock,
min_stock: minStock,
});
revalidatePath("/inventario");
}
export async function updateStock(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
const stock = parseFloat(formData.get("stock") as string);
if (isNaN(stock)) return;
await supabase.from("products").update({ stock }).eq("id", id);
revalidatePath("/inventario");
}
export async function updateProduct(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
const price = parseFloat(formData.get("price") as string);
const costRaw = formData.get("cost") as string;
const stock = parseFloat(formData.get("stock") as string);
const minStock = parseFloat(formData.get("minStock") as string);
if (!id || isNaN(price) || isNaN(stock) || isNaN(minStock)) return;
await supabase
.from("products")
.update({
price,
cost: costRaw ? parseFloat(costRaw) : null,
stock,
min_stock: minStock,
})
.eq("id", id);
revalidatePath("/inventario");
revalidatePath("/pos");
revalidatePath("/resumen");
}
export async function updateVariationStock(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
const stock = parseFloat(formData.get("stock") as string);
if (!id || isNaN(stock)) return;
await supabase.from("product_variations").update({ stock }).eq("id", id);
revalidatePath("/inventario");
revalidatePath("/pos");
}
export async function deleteProduct(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
await supabase.from("products").delete().eq("id", id);
revalidatePath("/inventario");
}