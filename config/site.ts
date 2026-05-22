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
  { name: "Drop files", href: "/drop" },
  { name: "Uploads", href: "/uploads" },
  { name: "Receipts", href: "/uploads/receipts" },
];
