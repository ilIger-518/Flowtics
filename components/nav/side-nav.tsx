"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navigations, siteConfig } from "@/config/site";

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "Dashboard":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M3 3h6v6H3V3zm8 0h6v10h-6V3zM3 11h6v6H3v-6zm8 4h6v2h-6v-2z"
            fill="currentColor"
          />
        </svg>
      );
    case "Reports":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M4 15h2V9H4v6zm5 0h2V5H9v10zm5 0h2V11h-2v4z"
            fill="currentColor"
          />
        </svg>
      );
    case "Trade Republic":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M3 7l7-3 7 3v2H3V7zm0 4h14v5H3v-5zm2 1v3h2v-3H5zm4 0v3h2v-3H9zm4 0v3h2v-3h-2z"
            fill="currentColor"
          />
        </svg>
      );
    case "Drop files":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M10 3l4 4h-3v4H9V7H6l4-4zm-5 10h10v3H5v-3z"
            fill="currentColor"
          />
        </svg>
      );
    case "Uploads":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M3 5h6l2 2h6v8H3V5zm2 3v5h10V8H5z"
            fill="currentColor"
          />
        </svg>
      );
    case "Receipt library":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M5 3h10l-1 14-2-1-2 1-2-1-2 1-1-14zm2 4h6v2H7V7zm0 4h6v2H7v-2z"
            fill="currentColor"
          />
        </svg>
      );
    case "Receipt outputs":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M6 3h6l4 4v10H6V3zm6 1.5V8h3.5L12 4.5zM8 11h6v2H8v-2z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <circle cx="10" cy="10" r="6" fill="currentColor" />
        </svg>
      );
  }
}

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
          <span className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500">
              <NavIcon name={navigation.name} />
            </span>
            {navigation.name}
          </span>
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
