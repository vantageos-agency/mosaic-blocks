import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mosaic-blocks sandbox",
  description: "Development sandbox for @vantageos/mosaic-blocks (T1 infra only)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
