"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
if (!name) redirect("/inventario?perror=" + encodeURIComponent("Falta el nombre del producto."));
if (isNaN(price)) redirect("/inventario?perror=" + encodeURIComponent("El precio de venta no es válido."));
if (isNaN(minStock)) redirect("/inventario?perror=" + encodeURIComponent("El stock mínimo no es válido."));
const { error } = await supabase.from("products").insert({
name,
type,
brand: brand || null,
cost: costRaw ? parseFloat(costRaw) : null,
price,
stock,
min_stock: minStock,
});
revalidatePath("/inventario");
if (error) {
redirect("/inventario?perror=" + encodeURIComponent("No se pudo guardar: " + error.message));
}
redirect("/inventario?padded=1");
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
export async function addVariation(formData: FormData) {
const supabase = createClient();
const productId = formData.get("productId") as string;
const name = formData.get("name") as string;
const stockRaw = formData.get("stock") as string;
const stock = parseFloat(stockRaw || "0");
if (!productId) redirect("/inventario?perror=" + encodeURIComponent("Falta el producto."));
if (!name || !name.trim()) redirect("/inventario?perror=" + encodeURIComponent("Falta el nombre de la variación (ej: Talla M, Rojo)."));
const { error } = await supabase.from("product_variations").insert({
product_id: Number(productId),
name: name.trim(),
stock: isNaN(stock) ? 0 : stock,
});
if (error) {
redirect("/inventario?perror=" + encodeURIComponent("No se pudo agregar la variación: " + error.message));
}
const { data: vars } = await supabase
.from("product_variations")
.select("stock")
.eq("product_id", productId);
const total = (vars ?? []).reduce((s, v) => s + Number(v.stock), 0);
await supabase.from("products").update({ stock: total }).eq("id", productId);
revalidatePath("/inventario");
revalidatePath("/pos");
revalidatePath("/resumen");
redirect("/inventario?padded=1");
}
export async function deleteVariation(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
const productId = formData.get("productId") as string;
if (!id) return;
await supabase.from("product_variations").delete().eq("id", id);
const { data: vars } = await supabase
.from("product_variations")
.select("stock")
.eq("product_id", productId);
const total = (vars ?? []).reduce((s, v) => s + Number(v.stock), 0);
await supabase.from("products").update({ stock: total }).eq("id", productId);
revalidatePath("/inventario");
revalidatePath("/pos");
revalidatePath("/resumen");
}
export async function deleteProduct(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
await supabase.from("products").delete().eq("id", id);
revalidatePath("/inventario");
}
