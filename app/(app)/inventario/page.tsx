import { createClient } from "@/lib/supabase/server";
import { addProduct } from "./actions";
import InventarioClient from "./InventarioClient";
const PROD_TYPES = [
"Shampoo", "Acondicionador", "Gel", "Crema", "Mascarilla", "Aceite", "Serum",
"Espuma", "Gelatina", "Kit", "Activador", "Tónico", "Splash", "Accesorio", "Otro",
];
export default async function InventarioPage() {
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
{isOwner && (
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Agregar Producto</h2>
<form action={addProduct} className="grid grid-cols-2 gap-3">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Nombre</label>
<input type="text" name="name" required className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Categoría</label>
<select name="type" className="input-rz">
{PROD_TYPES.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Marca</label>
<input type="text" name="brand" className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Costo</label>
<input type="number" step="0.01" name="cost" className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Precio de Venta</label>
<input type="number" step="0.01" name="price" required className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Stock Inicial</label>
<input type="number" step="1" name="stock" defaultValue={0} className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Stock Mínimo</label>
<input type="number" step="1" name="minStock" defaultValue={5} className="input-rz" />
</div>
<button type="submit" className="btn-primary col-span-2 py-3 mt-1">
Guardar Producto
</button>
</form>
</section>
)}
<InventarioClient products={plist as any} isOwner={isOwner} />
</div>
);
}