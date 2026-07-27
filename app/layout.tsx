import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import GlobalSidebarLayout from "@/components/global-sidebar-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BONGO TRIP",
  description: "Book curated tours across Bangladesh with BONGO TRIP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f4fbf8] text-slate-900">
        <Providers>
          <GlobalSidebarLayout>{children}</GlobalSidebarLayout>
        </Providers>
      </body>
    </html>
  );
}
