import { createClient } from "@/lib/supabase/server";
import { addClient, deleteClient } from "./actions";
function waLink(phone: string) {
return "https://wa.me/" + phone.replace(/[^0-9]/g, "");
}
export default async function ClientesPage() {
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
const { data: clients } = await supabase
.from("clients")
.select("*")
.order("name", { ascending: true });
return (
<div className="space-y-6">
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">Agregar Clienta</h2>
<form action={addClient} className="grid grid-cols-2 gap-3">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Nombre</label>
<input type="text" name="name" required className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Apellido</label>
<input type="text" name="lastname" className="input-rz" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Teléfono</label>
<input type="text" name="phone" required className="input-rz" placeholder="0412-1234567" />
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Ciudad</label>
<input type="text" name="city" className="input-rz" />
</div>
<div className="col-span-2">
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">Notas</label>
<input type="text" name="notes" className="input-rz" />
</div>
<button type="submit" className="btn-primary col-span-2 py-3 mt-1">
Guardar Clienta
</button>
</form>
</section>
<section className="panel card p-6">
<h2 className="font-baloo font-bold text-lg text-pink-700 mb-4">
Clientas ({clients?.length ?? 0})
</h2>
<div>
{(clients ?? []).map((c) => (
<div key={c.id} className="flex items-center gap-3 py-3 border-b border-pink-100 last:border-none">
<div className="flex-1 min-w-0">
<div className="text-sm font-bold">
{c.name} {c.lastname ?? ""}
</div>
<div className="text-xs text-muted-700 mt-0.5">
{c.phone} {c.city ? "· " + c.city : ""}
</div>
</div>
<a
href={waLink(c.phone)}
target="_blank"
rel="noopener"
className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-full text-xs font-bold"
>
WhatsApp
</a>
{isOwner && (
<form action={deleteClient}>
<input type="hidden" name="id" value={c.id} />
<button className="text-pink-200 hover:text-coral-500 px-2">✕</button>
</form>
)}
</div>
))}
</div>
</section>
</div>
);
}