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
  let totalCosto = 0;
  let totalVenta = 0;
  for (const p of products ?? []) {
    const hasVar = p.product_variations && p.product_variations.length > 0;
    const effStock = hasVar
      ? p.product_variations.reduce((s: number, v: any) => s + Number(v.stock), 0)
      : Number(p.stock);
    const cost = p.cost != null ? Number(p.cost) : 0;
    const price = Number(p.price);
    const valorCosto = cost * effStock;
    const valorVenta = price * effStock;
    totalCosto += valorCosto;
    totalVenta += valorVenta;
    rows.push({
      "Categoría": p.type || "Otro",
      "Producto": p.name,
      "Marca": p.brand || "",
      "Costo Unitario": cost,
      "Precio Venta": price,
      "Stock": effStock,
      "Stock Mínimo": Number(p.min_stock),
      "Valor Costo Total": Number(valorCosto.toFixed(2)),
      "Valor Venta Total": Number(valorVenta.toFixed(2)),
    });
  }
  rows.push({
    "Categoría": "",
    "Producto": "TOTAL",
    "Marca": "",
    "Costo Unitario": "",
    "Precio Venta": "",
    "Stock": "",
    "Stock Mínimo": "",
    "Valor Costo Total": Number(totalCosto.toFixed(2)),
    "Valor Venta Total": Number(totalVenta.toFixed(2)),
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario Completo");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inventario-completo-${today}.xlsx"`,
    },
  });
}
