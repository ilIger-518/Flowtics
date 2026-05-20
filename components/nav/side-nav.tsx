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

function UserCard() {
  return (
    <div className="flex h-16 items-center border-b border-border px-3">
      <div className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800">
        <div className="flex items-center">
          <div className="mr-2 h-9 w-9 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Flowtics</span>
            <span className="text-xs text-muted-foreground">Receipt Lab</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">▼</span>
      </div>
    </div>
  );
}

function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-grow flex-col gap-y-1 p-2">
      {navigations.map((navigation) => (
        <Link
          key={navigation.name}
          href={navigation.href}
          className={cn(
            "flex items-center rounded-md px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800",
            pathname === navigation.href
              ? "bg-slate-200 dark:bg-slate-800"
              : "bg-transparent"
          )}
        >
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {navigation.name}
          </span>
        </Link>
      ))}
    </nav>
  );
}

function BrandBadge() {
  return (
    <div className="relative my-2 flex flex-col items-center justify-center gap-y-2 px-4 py-4">
      <div className="dot-matrix absolute left-0 top-0 -z-10 h-full w-full" />
      <span className="text-xs text-muted-foreground">Powered by</span>
      <div className="flex items-center space-x-2">
        <span className="text-md text-accent-foreground">{siteConfig.title}</span>
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
          "fixed left-0 top-12 z-50 rounded-r-md bg-slate-200 px-2 py-1.5 text-primary-foreground shadow-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 tablet:hidden",
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
          "fixed bottom-0 left-0 top-0 z-40 flex h-[100dvh] w-44 shrink-0 flex-col border-r border-border bg-slate-100 dark:bg-slate-900 tablet:sticky tablet:translate-x-0",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <UserCard />
        <Navigation />
        <BrandBadge />
      </aside>
    </>
  );
}
