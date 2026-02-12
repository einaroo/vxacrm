import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VXA Labs CRM",
  description: "Sales pipeline and recruitment management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <Nav />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
