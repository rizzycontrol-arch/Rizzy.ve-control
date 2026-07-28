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
const minStock = parseFloat((formData.get("minStock") as string) || "5");
const varNames = formData.getAll("variationName") as string[];
const varStocksRaw = formData.getAll("variationStock") as string[];
const variations = varNames
.map((n, i) => ({
name: (n || "").trim(),
stock: (() => {
const s = parseFloat(varStocksRaw[i] || "0");
return isNaN(s) ? 0 : s;
})(),
}))
.filter((v) => v.name);
const flatStock = parseFloat((formData.get("stock") as string) || "0");
const initialStock =
variations.length > 0
? variations.reduce((s, v) => s + v.stock, 0)
: isNaN(flatStock)
? 0
: flatStock;
if (!name) redirect("/inventario?perror=" + encodeURIComponent("Falta el nombre del producto."));
if (isNaN(price)) redirect("/inventario?perror=" + encodeURIComponent("El precio de venta no es válido."));
if (isNaN(minStock)) redirect("/inventario?perror=" + encodeURIComponent("El stock mínimo no es válido."));
const { data: inserted, error } = await supabase
.from("products")
.insert({
name,
type,
brand: brand || null,
cost: costRaw ? parseFloat(costRaw) : null,
price,
stock: initialStock,
min_stock: minStock,
})
.select()
.single();
revalidatePath("/inventario");
if (error || !inserted) {
redirect(
"/inventario?perror=" + encodeURIComponent("No se pudo guardar: " + (error?.message || "error desconocido"))
);
}
if (variations.length > 0) {
const rows = variations.map((v) => ({ product_id: inserted!.id, name: v.name, stock: v.stock }));
const { error: varError } = await supabase.from("product_variations").insert(rows);
revalidatePath("/inventario");
revalidatePath("/pos");
if (varError) {
redirect(
"/inventario?perror=" +
encodeURIComponent("El producto se guardó, pero hubo un error con las variaciones: " + varError.message)
);
}
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
export async function addVariations(formData: FormData) {
  const supabase = createClient();
  const productId = formData.get("productId") as string;
  const varNames = formData.getAll("variationName") as string[];
  const varStocksRaw = formData.getAll("variationStock") as string[];
  const variations = varNames
    .map((n, i) => ({
      name: (n || "").trim(),
      stock: (() => {
        const s = parseFloat(varStocksRaw[i] || "0");
        return isNaN(s) ? 0 : s;
      })(),
    }))
    .filter((v) => v.name);
  if (!productId) redirect("/inventario?perror=" + encodeURIComponent("Falta el producto."));
  if (variations.length === 0) {
    redirect("/inventario?perror=" + encodeURIComponent("Agrega al menos una variación con nombre."));
  }
  const rows = variations.map((v) => ({ product_id: Number(productId), name: v.name, stock: v.stock }));
  const { error } = await supabase.from("product_variations").insert(rows);
  if (error) {
    redirect("/inventario?perror=" + encodeURIComponent("No se pudieron agregar las variaciones: " + error.message));
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
