import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
const NAV_OWNER = [
{ href: "/resumen", label: "Resumen", icon: "📊" },
{ href: "/pos", label: "Vender", icon: "🛒" },
{ href: "/ventas", label: "Ventas y Finanzas", icon: "💳" },
{ href: "/inventario", label: "Inventario", icon: "📦" },
{ href: "/clientes", label: "Clientas", icon: "💕" },
{ href: "/caja", label: "Caja", icon: "🧾" },
{ href: "/comisiones", label: "Comisiones", icon: "💰" },
];
const NAV_EMPLOYEE = [
{ href: "/resumen", label: "Resumen", icon: "📊" },
{ href: "/pos", label: "Vender", icon: "🛒" },
{ href: "/ventas", label: "Ventas", icon: "💳" },
{ href: "/inventario", label: "Inventario", icon: "📦" },
{ href: "/clientes", label: "Clientas", icon: "💕" },
{ href: "/caja", label: "Caja", icon: "🧾" },
{ href: "/comisiones", label: "Mis Comisiones", icon: "💰" },
];
export default async function AppLayout({
children,
}: {
children: React.ReactNode;
}) {
const supabase = createClient();
const {
data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/login");
const { data: profile } = await supabase
.from("profiles")
.select("display_name, role")
.eq("id", user.id)
.single();
const isOwner = profile?.role === "owner";
const nav = isOwner ? NAV_OWNER : NAV_EMPLOYEE;
return (
<div className="min-h-screen">
<div className="max-w-6xl mx-auto px-5">
<header className="py-8 flex justify-between items-start gap-5 flex-wrap">
<div className="flex items-center gap-3">
<Image
src="/logo.png"
alt="Rizzy - Curly Hair Care"
width={280}
height={163}
className="h-12 w-auto"
priority
/>
<div>
<h1 className="font-baloo font-extrabold text-2xl text-pink-700">
Rizzy Finanzas
</h1>
<p className="text-muted-700 text-sm mt-1">
Gestión de ventas e inventario — Rizzy.VE
</p>
</div>
</div>
<div className="text-right">
<div className="font-baloo font-bold text-ink">
{profile?.display_name ?? "Usuario"}
</div>
<div className="font-mono text-[11px] uppercase tracking-wide text-amber-700 mb-2">
{isOwner ? "Dueña" : "Trabajadora"}
</div>
<form action="/auth/signout" method="post">
<button className="text-xs font-semibold px-3 py-1.5 rounded-full border border-pink-200 bg-pink-100/50 text-pink-700">
Cerrar sesión
</button>
</form>
</div>
</header>
<nav className="flex gap-2 flex-wrap mb-6">
{nav.map((item) => (
<Link
key={item.href}
href={item.href}
className="px-5 py-2.5 rounded-full border border-pink-200 bg-white font-baloo font-semibold text-sm text-muted-700 hover:bg-pink-100"
>
{item.icon} {item.label}
</Link>
))}
</nav>
<main className="pb-16">{children}</main>
</div>
</div>
);
}