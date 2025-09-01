"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/menu/side-bar/sidebar"; // ajusta la ruta si cambia

// Rutas donde NO quieres mostrar el sidebar
const HIDE_SIDEBAR_ROUTES = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = HIDE_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r));

  if (hideSidebar) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r bg-background">
        <Sidebar />
      </aside>
      <main className="p-4">{children}</main>
    </div>
  );
}
