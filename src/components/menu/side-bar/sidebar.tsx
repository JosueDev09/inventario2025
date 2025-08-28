/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  Receipt,
  Boxes,
  Package,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  Layers3,
  ListTree,
  Ruler,
  Tag,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip/tooltip";
import { Separator } from "@/components/ui/separator/separator";
import { Badge } from "@/components/ui/badge/badge";
import { useEffect, useState } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string | number;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  {
    label: "Compras",
    href: "/purchasing",
    icon: ShoppingCart,
    children: [
      { label: "Buscar OC por producto", href: "/purchasing/search", icon: Receipt },
    ],
  },
  {
    label: "Inventario",
    href: "/inventory",
    icon: Boxes,
    children: [
      { label: "Existencias", href: "/inventory", icon: Boxes },
      { label: "Lotes / Series", href: "/inventory/batches", icon: Package },
      { label: "Ubicaciones", href: "/inventory/locations", icon: Layers3 },
      { label: "Movimientos", href: "/inventory/movements", icon: Receipt },
      { label: "Caducidades", href: "/inventory/expiries", icon: Receipt },
      { label: "Conteos", href: "/inventory/counts", icon: Receipt },
    ],
  },
  {
    label: "Productos",
    href: "/products",
    icon: Package,
    children: [
      { label: "Listado", href: "/products", icon: Package },
      { label: "Categorías", href: "/products/categories", icon: ListTree },
      { label: "Unidades (UoM)", href: "/products/uom", icon: Ruler },
      { label: "Marcas", href: "/products/brands", icon: Tag },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Ajustes", href: "/settings", icon: Settings },
];

export function Sidebar({
        items = NAV_ITEMS,
        className,
        initialOpen = true,
        }: {
        items?: NavItem[];
        className?: string;
        initialOpen?: boolean;
        }) {
        const pathname = usePathname();
        const [open, setOpen] = React.useState(initialOpen);
        const [hovered, setHovered] = React.useState<string | null>(null);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "group/sidebar sticky top-0 z-40 h-screen select-none border-r bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          open ? "w-64" : "w-[72px]",
          "transition-[width] duration-300",
          className
        )}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Header */}
        <div className="relative flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow" />
            <AnimatePresence initial={false}>
              {open && (
                <motion.span
                  key="brand"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="truncate text-sm font-semibold"
                >
                  Esymbel WMS
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-card/70 text-muted-foreground hover:text-foreground",
              "shadow-sm transition-colors"
            )}
            aria-label={open ? "Contraer" : "Expandir"}
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
        <Separator />

        {/* Nav */}
        <nav className="relative mt-2 flex flex-1 flex-col gap-1 px-2 pb-4">
          {items.map((item) => (
            <SidebarNode
              key={item.href}
              item={item}
              open={open}
              pathname={pathname}
              hovered={hovered}
              setHovered={setHovered}
            />)
          )}
        </nav>

        {/* Footer / version */}
        <div className={cn("mt-auto p-3 text-[11px] text-muted-foreground")}>v1.0.0</div>
      </aside>
    </TooltipProvider>
  );
}
function SidebarNode({
  item,
  open,
  pathname,
  hovered,
  setHovered,
}: {
  item: NavItem;
  open: boolean;
  pathname: string;
  hovered: string | null;
  setHovered: (k: string | null) => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;

  // === CASO 1: HOJA (sin children) -> usar Link para navegar ===
  if (!hasChildren) {
    const linkEl = (
      <Link
        href={item.href}
        onMouseEnter={() => setHovered(item.href)}
        className={cn(
          "relative group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {/* Glow activo */}
        <AnimatePresence>
          {isActive && (
            <motion.span
              layoutId="aceternity-active"
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r
                         from-indigo-500/15 via-purple-500/10 to-fuchsia-500/15"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </AnimatePresence>

        {/* Icono */}
        <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-card/70 shadow-sm ring-1 ring-border">
          <Icon className={cn("h-4 w-4", isActive ? "text-indigo-500" : "text-muted-foreground")} />
        </span>

        {/* Label + badge */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="relative flex-1 truncate text-left"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {open && item.badge != null && (
          <Badge variant="secondary" className="relative">
            {item.badge}
          </Badge>
        )}
      </Link>
    );

    // Tooltip cuando está colapsado
    return open ? (
      linkEl
    ) : (
      <Tooltip open={hovered === item.href}>
        <TooltipTrigger asChild>
          <div>{linkEl}</div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="px-2 py-1 text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  // === CASO 2: NODO CON HIJOS -> botón que expande/colapsa ===
  const [expanded, setExpanded] = useState(isActive);
  useEffect(() => { if (isActive) setExpanded(true); }, [isActive]);

  const toggleBtn = (
    <button
      onClick={() => (open ? setExpanded((e) => !e) : null)}
      onMouseEnter={() => setHovered(item.href)}
      className={cn(
        "relative group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="aceternity-active"
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r
                       from-indigo-500/15 via-purple-500/10 to-fuchsia-500/15"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </AnimatePresence>

      <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-card/70 shadow-sm ring-1 ring-border">
        <Icon className={cn("h-4 w-4", isActive ? "text-indigo-500" : "text-muted-foreground")} />
      </span>

      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="relative flex-1 truncate text-left"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  return (
    <div>
      {open ? (
        toggleBtn
      ) : (
        <Tooltip open={hovered === item.href}>
          <TooltipTrigger asChild>
            <div>{toggleBtn}</div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="px-2 py-1 text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Hijos */}
      <AnimatePresence initial={false}>
        {open && item.children?.length ? (
          <motion.div
            initial="collapsed"
            animate={expanded ? "open" : "collapsed"}
            exit="collapsed"
            variants={{ open: { height: "auto", opacity: 1 }, collapsed: { height: 0, opacity: 0 } }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="ml-4 overflow-hidden"
          >
            {item.children!.map((child) => (
              <ChildLink key={child.href} item={child} pathname={pathname} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}


function ChildLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative my-1 flex items-center gap-2 rounded-lg px-2 py-2 text-[13px]",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-md bg-card/70 ring-1 ring-border">
        <Icon className={cn("h-3.5 w-3.5", active ? "text-indigo-500" : "text-muted-foreground")} />
      </span>
      <span className="truncate">{item.label}</span>
      {active && (
        <motion.span
          layoutId="aceternity-dot"
          className="absolute right-2 h-1.5 w-1.5 rounded-full bg-indigo-500"
        />
      )}
    </Link>
  );
}