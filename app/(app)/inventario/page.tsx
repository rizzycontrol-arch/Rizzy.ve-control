import { createClient } from "@/lib/supabase/server";
import InventarioClient from "./InventarioClient";
import AddProductForm from "./AddProductForm";
const PROD_TYPES = [
"Shampoo", "Acondicionador", "Gel", "Crema", "Mascarilla", "Aceite", "Serum",
"Espuma", "Gelatina", "Kit", "Activador", "Tónico", "Splash", "Accesorio", "Otro",
];
export default async function InventarioPage({
searchParams,
}: {
searchParams: { padded?: string; perror?: string };
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
const isOwner = profile?.role === "owner";
const { data: products } = await supabase
.from("products")
.select("*, product_variations(*)")
.order("name", { ascending: true });
const plist = (products ?? []).map((p) => {
const hasVar = p.product_variations && p.product_variations.length > 0;
const effStock = hasVar
? p.product_variations.reduce((s: number, v: any) => s + Number(v.stock), 0)
: Number(p.stock);
return { ...p, effStock };
});
return (
<div className="space-y-6">
{searchParams?.padded && (
<div className="bg-teal-100 text-[#0B6B65] text-sm px-4 py-3 rounded-xl font-semibold">
✅ Guardado correctamente.
</div>
)}
{searchParams?.perror && (
<div className="bg-pink-100 text-coral-500 text-sm px-4 py-3 rounded-xl font-semibold">
⚠️ {searchParams.perror}
</div>
)}
{isOwner && (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-1">Reportes de Inventario</h2>
<p className="text-sm text-muted-700 mb-4">Solo tú puedes ver y descargar estos archivos.</p>
<div className="flex gap-3 flex-wrap">
<a href="/api/inventario/conteo" className="btn-primary px-4 py-2.5 text-sm inline-block">📋 Descargar para Conteo Físico</a>
<a href="/api/inventario/completo" className="text-sm font-bold px-4 py-2.5 rounded-full border border-pink-200 bg-white text-pink-700 inline-block">💲 Descargar Inventario Completo (con precios)</a>
</div>
</section>
)}
{isOwner && (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Agregar Producto</h2>
<AddProductForm prodTypes={PROD_TYPES} />
</section>
)}
<InventarioClient products={plist as any} isOwner={isOwner} />
</div>
);
}