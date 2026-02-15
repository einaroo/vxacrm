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
        <div className="flex h-screen">
          <Nav />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
