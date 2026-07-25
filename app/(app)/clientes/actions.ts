"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function addClient(formData: FormData) {
const supabase = createClient();
const name = formData.get("name") as string;
const lastname = formData.get("lastname") as string;
const phone = formData.get("phone") as string;
const city = formData.get("city") as string;
const notes = formData.get("notes") as string;
if (!name || !phone) return;
await supabase.from("clients").insert({
name,
lastname: lastname || null,
phone,
city: city || null,
notes: notes || null,
});
revalidatePath("/clientes");
}
export async function deleteClient(formData: FormData) {
const supabase = createClient();
const id = formData.get("id") as string;
await supabase.from("clients").delete().eq("id", id);
revalidatePath("/clientes");
}