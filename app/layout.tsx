import type { Metadata } from "next";
import { Baloo_2, Quicksand, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
const baloo = Baloo_2({
subsets: ["latin"],
weight: ["500", "600", "700", "800"],
variable: "--font-baloo",
});
const quicksand = Quicksand({
subsets: ["latin"],
weight: ["400", "500", "600", "700"],
variable: "--font-quicksand",
});
const plexMono = IBM_Plex_Mono({
subsets: ["latin"],
weight: ["400", "500", "600"],
variable: "--font-plex-mono",
});
export const metadata: Metadata = {
title: "Rizzy Finanzas",
description: "Finanzas y ventas de Rizzy.VE",
};
export default function RootLayout({
children,
}: Readonly<{ children: React.ReactNode }>) {
return (
<html lang="es">
<body
className={`${baloo.variable} ${quicksand.variable} ${plexMono.variable} font-quicksand`}
>
{children}
</body>
</html>
);
}