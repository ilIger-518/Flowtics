export type Navigation = {
  name: string;
  href: string;
};

export const siteConfig = {
  title: "Flowtics",
  description: "Receipt ingestion and OCR pipeline",
};

export const navigations: Navigation[] = [
  { name: "Dashboard", href: "/" },
  { name: "Reports", href: "/reports" },
  { name: "Trade Republic", href: "/trade-republic" },
  { name: "Drop files", href: "/drop" },
  { name: "Uploads", href: "/uploads" },
  { name: "Receipt library", href: "/receipts" },
  { name: "Receipt outputs", href: "/uploads/receipts" },
];
