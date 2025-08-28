// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider/theme-provider";
import { Sidebar } from "@/components/menu/side-bar/sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });


export const metadata: Metadata = {
  title: "Esymbel-Inventario",
  description: "WMS + Analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen">
            <Sidebar initialOpen />                   {/* ⬅️ Aquí se pinta el sidebar */}
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}