import { createClient } from "@/lib/supabase/server";
import PosClient from "./PosClient";
export default async function PosPage() {
const supabase = createClient();
const { data: products } = await supabase
.from("products")
.select("*, product_variations(*)")
.order("name", { ascending: true });
const { data: clients } = await supabase
.from("clients")
.select("*")
.order("name", { ascending: true });
const { data: settings } = await supabase.from("settings").select("*").single();
return (
<PosClient
products={products ?? []}
clients={clients ?? []}
exchangeRate={Number(settings?.exchange_rate ?? 1)}
/>
);
}