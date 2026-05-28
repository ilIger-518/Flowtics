"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navigations, siteConfig } from "@/config/site";

function ToggleIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M9.5 3L4.5 8l5 5M6 8h6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6.5 3l5 5-5 5M10 8H4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="flex grow flex-col gap-y-1 p-3">
      {navigations.map((navigation) => (
        <Link
          key={navigation.name}
          href={navigation.href}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
            pathname === navigation.href
              ? "bg-white/90 text-slate-900 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-800"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-slate-100"
          )}
        >
          <span>{navigation.name}</span>
          {pathname === navigation.href ? (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

function BrandBadge() {
  return (
    <div className="relative my-3 flex flex-col items-center justify-center gap-y-2 px-4 py-4">
      <div className="dot-matrix absolute left-0 top-0 -z-10 h-full w-full" />
      <span className="text-xs text-muted-foreground">Workspace</span>
      <div className="flex items-center space-x-2">
        <span className="text-md font-semibold text-accent-foreground">{siteConfig.title}</span>
      </div>
    </div>
  );
}

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={cn(
          "fixed left-0 top-12 z-50 rounded-r-lg bg-white/90 px-2.5 py-2 text-slate-700 shadow-lg ring-1 ring-slate-200/70 backdrop-blur hover:bg-white tablet:hidden dark:bg-slate-900/80 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-44" : "translate-x-0"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ToggleIcon open={isOpen} />
      </button>
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex h-dvh w-52 shrink-0 flex-col border-r border-border bg-white/80 shadow-xl backdrop-blur dark:bg-slate-950/80 tablet:sticky tablet:translate-x-0",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Navigation />
        <BrandBadge />
      </aside>
    </>
  );
}
