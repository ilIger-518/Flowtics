export type Navigation = {
  name: string;
  href: string;
};

export const siteConfig = {
  title: "Flowtics",
  description: "Receipt ingestion and OCR pipeline",
};

export const navigations: Navigation[] = [
  { name: "Drop files", href: "/" },
  { name: "Uploads", href: "/uploads" },
  { name: "Receipts", href: "/uploads/receipts" },
];
