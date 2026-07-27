import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "owner") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, product_variations(*)")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  const rows: any[] = [];
  for (const p of products ?? []) {
    const hasVar = p.product_variations && p.product_variations.length > 0;
    if (hasVar) {
      for (const v of p.product_variations) {
        rows.push({
          "Categoría": p.type || "Otro",
          "Producto": p.name,
          "Marca": p.brand || "",
          "Variante": v.name,
          "Stock Sistema": Number(v.stock),
          "Conteo Físico": "",
          "Diferencia": "",
        });
      }
    } else {
      rows.push({
        "Categoría": p.type || "Otro",
        "Producto": p.name,
        "Marca": p.brand || "",
        "Variante": "",
        "Stock Sistema": Number(p.stock),
        "Conteo Físico": "",
        "Diferencia": "",
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Conteo Inventario");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inventario-conteo-${today}.xlsx"`,
    },
  });
}
