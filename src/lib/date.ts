// Todas las fechas del negocio se calculan según la hora de Venezuela
// (America/Caracas, UTC-4), no la hora del servidor (UTC). Esto evita que
// ventas hechas en la noche (hora Caracas) se cuenten como del día siguiente.
const CARACAS_TZ = "America/Caracas";

export function todayCaracas(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CARACAS_TZ }).format(new Date());
}

export function daysAgoCaracas(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: CARACAS_TZ }).format(d);
}

export function firstOfMonthCaracas(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CARACAS_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}-01`;
}
